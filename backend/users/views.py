import hashlib
import hmac
import secrets
from datetime import timedelta

from django.conf import settings
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import parsers, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.views import TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import EmailVerificationOTP, PasswordResetOTP, Profile, User
from .serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    ProfileSerializer,
    ProfileUpdateSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    PasswordResetVerifySerializer,
    EmailVerificationSerializer,
    RegisterSerializer,
)


def _tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {"access": str(refresh.access_token), "refresh": str(refresh)}


def _hash_reset_value(value):
    return hashlib.sha256(value.encode()).hexdigest()


def _send_otp_email(subject, body, to_email):
    from_email = settings.DEFAULT_FROM_EMAIL or settings.EMAIL_HOST_USER
    send_mail(subject, body, from_email, [to_email], fail_silently=False)


class RegisterView(APIView):
    """POST /api/auth/register/ — creates an inactive user and sends an OTP."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        otp = f"{secrets.randbelow(1_000_000):06d}"
        EmailVerificationOTP.objects.update_or_create(
            user=user,
            defaults={
                "otp_hash": _hash_reset_value(otp),
                "expires_at": timezone.now() + timedelta(minutes=10),
                "attempts": 0,
                "verified_at": None,
            },
        )
        try:
            _send_otp_email(
                "Verify your LetsInternz email",
                f"Your LetsInternz verification OTP is {otp}. It expires in 10 minutes.",
                user.email,
            )
        except Exception:
            return Response(
                {"detail": "Unable to send the verification email right now. Please try again later."},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
        return Response(
            {"detail": "Verification code sent.", "email": user.email},
            status=status.HTTP_201_CREATED,
        )


class GoogleLoginView(APIView):
    """POST /api/auth/google-login/ — minimal Supabase-backed login sync for Google sign-ins."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get("email")
        if not email:
            return Response({"detail": "Supabase user email is required."}, status=400)

        username = (request.data.get("username") or email.split("@")[0] or "user").strip()
        user, created = User.objects.get_or_create(
            email__iexact=email,
            defaults={
                "username": username,
                "email": email,
                "is_active": True,
            },
        )

        if not created:
            if not user.username:
                user.username = username
            user.is_active = True
            user.save(update_fields=["username", "is_active", "updated_at"])

        tokens = _tokens_for_user(user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                },
                **tokens,
            },
            status=status.HTTP_200_OK,
        )


class LoginView(APIView):
    """POST /api/auth/login/ — returns access + refresh tokens."""

    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data["user"]

        tokens = _tokens_for_user(user)
        return Response(
            {
                "user": {
                    "id": user.id,
                    "email": user.email,
                    "username": user.username,
                },
                **tokens,
            },
            status=status.HTTP_200_OK,
        )


class RefreshTokenView(TokenRefreshView):
    """Return 401 when a refresh token belongs to a deleted user."""

    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except User.DoesNotExist:
            return Response(
                {"detail": "User account no longer exists."},
                status=status.HTTP_401_UNAUTHORIZED,
            )


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        user = User.objects.filter(email__iexact=email, is_active=True).first()

        if user:
            otp = f"{secrets.randbelow(1_000_000):06d}"
            PasswordResetOTP.objects.filter(email=email, used_at__isnull=True).delete()
            PasswordResetOTP.objects.create(
                email=email,
                otp_hash=_hash_reset_value(otp),
                expires_at=timezone.now() + timedelta(minutes=10),
            )
            try:
                _send_otp_email(
                    "Your LetsInternz password reset code",
                    f"Your password reset OTP is {otp}. It expires in 10 minutes.",
                    user.email,
                )
            except Exception:
                return Response(
                    {"detail": "Unable to send the reset code right now. Please try again later."},
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {"detail": "If an account exists for that email, a reset code has been sent."}
        )


class EmailVerificationView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = EmailVerificationSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        otp = serializer.validated_data["otp"]
        verification = EmailVerificationOTP.objects.filter(
            user__email__iexact=email, verified_at__isnull=True
        ).select_related("user").first()
        if (
            not verification
            or verification.expires_at <= timezone.now()
            or verification.attempts >= 5
        ):
            return Response({"detail": "Invalid or expired verification code."}, status=400)

        verification.attempts += 1
        if not hmac.compare_digest(verification.otp_hash, _hash_reset_value(otp)):
            verification.save(update_fields=["attempts"])
            return Response({"detail": "Invalid or expired verification code."}, status=400)

        user = verification.user
        user.is_active = True
        user.save(update_fields=["is_active", "updated_at"])
        verification.verified_at = timezone.now()
        verification.save(update_fields=["attempts", "verified_at"])
        return Response({
            "user": {"id": user.id, "email": user.email, "username": user.username},
            **_tokens_for_user(user),
        })


class PasswordResetVerifyView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        email = serializer.validated_data["email"].lower()
        otp = serializer.validated_data["otp"]
        reset = PasswordResetOTP.objects.filter(
            email=email, used_at__isnull=True, verified_at__isnull=True
        ).first()

        if not reset or reset.expires_at <= timezone.now():
            return Response({"detail": "Invalid or expired reset code."}, status=400)
        if reset.attempts >= 5:
            return Response({"detail": "Too many attempts. Request a new code."}, status=400)

        reset.attempts += 1
        if not hmac.compare_digest(reset.otp_hash, _hash_reset_value(otp)):
            reset.save(update_fields=["attempts"])
            return Response({"detail": "Invalid or expired reset code."}, status=400)

        reset_token = secrets.token_urlsafe(32)
        reset.verified_at = timezone.now()
        reset.reset_token_hash = _hash_reset_value(reset_token)
        reset.save(update_fields=["attempts", "verified_at", "reset_token_hash"])
        return Response({"reset_token": reset_token})


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        reset = PasswordResetOTP.objects.filter(
            email=data["email"].lower(), used_at__isnull=True, verified_at__isnull=False
        ).first()

        if (
            not reset
            or reset.expires_at <= timezone.now()
            or not hmac.compare_digest(reset.reset_token_hash, _hash_reset_value(data["reset_token"]))
        ):
            return Response({"detail": "Invalid or expired reset request."}, status=400)

        user = User.objects.filter(email__iexact=reset.email, is_active=True).first()
        if not user:
            return Response({"detail": "Invalid or expired reset request."}, status=400)

        user.set_password(data["password"])
        user.save(update_fields=["password", "updated_at"])
        reset.used_at = timezone.now()
        reset.save(update_fields=["used_at"])
        return Response({"detail": "Password reset successfully."})


class LogoutView(APIView):
    """POST /api/auth/logout/ — blacklists the given refresh token."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"detail": "refresh token is required."}, status=status.HTTP_400_BAD_REQUEST
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except TokenError:
            return Response(
                {"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST
            )

        return Response(status=status.HTTP_205_RESET_CONTENT)


class ProfileView(APIView):
    """GET /api/auth/profile/ — return the current user's profile.
    PUT /api/auth/profile/ — update the current user's profile."""

    permission_classes = [permissions.IsAuthenticated]

    def get_object(self, request):
        profile, _ = Profile.objects.get_or_create(user=request.user)
        return profile

    def get(self, request):
        profile = self.get_object(request)
        return Response(ProfileSerializer(profile).data)

    def put(self, request):
        profile = self.get_object(request)
        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        # Refresh from database to ensure profile_completion is calculated and persisted
        profile.refresh_from_db()
        return Response(ProfileSerializer(profile).data)


class ResumeUploadView(APIView):
    """POST /api/auth/profile/resume/ — upload a resume file to storage
    (S3 in production, local disk in development) and return its URL."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        resume_file = request.FILES.get("resume")
        if not resume_file:
            return Response(
                {"detail": "No resume file provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.resume = resume_file
        profile.save()

        url = profile.resume.url if profile.resume else None
        return Response({"resume": url, "profile_completion": profile.profile_completion})


class AvatarUploadView(APIView):
    """POST /api/auth/profile/avatar/ — upload an avatar image to storage
    (S3 in production, local disk in development) and return its URL."""

    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [parsers.MultiPartParser, parsers.FormParser]

    def post(self, request):
        avatar_file = request.FILES.get("avatar")
        if not avatar_file:
            return Response(
                {"detail": "No avatar file provided."}, status=status.HTTP_400_BAD_REQUEST
            )

        profile, _ = Profile.objects.get_or_create(user=request.user)
        profile.avatar = avatar_file
        profile.save()

        url = profile.avatar.url if profile.avatar else None
        return Response({"avatar": url, "profile_completion": profile.profile_completion})


class ChangePasswordView(APIView):
    """POST /api/auth/change-password/"""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Password updated successfully."})


class DeleteAccountView(APIView):
    """DELETE /api/auth/delete-account/ — permanently deletes the current
    user's account. Requires the current password as confirmation.
    Cascades to Profile, Applications, SavedInternships/Folders (all
    on_delete=CASCADE) — nothing is soft-deleted."""

    permission_classes = [permissions.IsAuthenticated]

    def delete(self, request):
        password = request.data.get("password")
        if not password:
            return Response(
                {"detail": "Password is required to delete your account."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if not request.user.check_password(password):
            return Response(
                {"detail": "Incorrect password."}, status=status.HTTP_400_BAD_REQUEST
            )

        request.user.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
