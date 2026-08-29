from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers

from .models import Profile, User


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField()
    full_name = serializers.CharField(write_only=True, required=False, allow_blank=True)
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True, label="Confirm password")

    class Meta:
        model = User
        fields = ("email", "username", "full_name", "password", "password2")

    def validate_email(self, value):
        existing_user = User.objects.filter(email__iexact=value).first()
        if existing_user and existing_user.is_active:
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        validated_data.pop("password2")
        email = validated_data.get("email")
        password = validated_data.pop("password")
        full_name = validated_data.pop("full_name", "")

        existing_user = User.objects.filter(email__iexact=email).first()
        if existing_user and not existing_user.is_active:
            existing_user.username = validated_data.get("username")
            existing_user.set_password(password)
            existing_user.is_active = False
            existing_user.save(update_fields=["username", "password", "is_active", "updated_at"])
            if full_name:
                existing_user.profile.full_name = full_name
                existing_user.profile.save(update_fields=["full_name", "updated_at"])
            return existing_user

        user = User(**validated_data)
        user.set_password(password)
        user.is_active = False
        user.save()
        if full_name:
            user.profile.full_name = full_name
            user.profile.save()
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, trim_whitespace=False)

    def validate(self, attrs):
        email = attrs.get("email")
        password = attrs.get("password")

        user = authenticate(
            request=self.context.get("request"), username=email, password=password
        )
        if user is None:
            raise serializers.ValidationError(
                "Unable to log in with the provided credentials.", code="authorization"
            )
        if not user.is_active:
            raise serializers.ValidationError("This account is inactive.", code="authorization")

        attrs["user"] = user
        return attrs


class ProfileSerializer(serializers.ModelSerializer):
    """Read-oriented serializer: all profile fields plus the user's email."""

    email = serializers.EmailField(source="user.email", read_only=True)
    username = serializers.CharField(source="user.username", read_only=True)

    class Meta:
        model = Profile
        fields = (
            "id",
            "email",
            "username",
            "full_name",
            "phone",
            "college",
            "branch",
            "graduation_year",
            "cgpa",
            "skills",
            "preferred_domains",
            "preferred_work_types",
            "preferred_locations",
            "expected_stipend_min",
            "expected_stipend_max",
            "resume",
            "avatar",
            "linkedin_url",
            "github_url",
            "portfolio_url",
            "profile_completion",
            "email_digest",
            "deadline_reminders_enabled",
            "new_matches_alert_enabled",
            "application_status_alerts_enabled",
            "is_profile_public",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "profile_completion", "created_at", "updated_at")


class ProfileUpdateSerializer(serializers.ModelSerializer):
    """Write-oriented serializer covering every editable profile field."""

    class Meta:
        model = Profile
        fields = (
            "full_name",
            "phone",
            "college",
            "branch",
            "graduation_year",
            "cgpa",
            "skills",
            "preferred_domains",
            "preferred_work_types",
            "preferred_locations",
            "expected_stipend_min",
            "expected_stipend_max",
            "linkedin_url",
            "github_url",
            "portfolio_url",
            "email_digest",
            "deadline_reminders_enabled",
            "new_matches_alert_enabled",
            "application_status_alerts_enabled",
            "is_profile_public",
        )

    def validate_skills(self, value):
        return self._validate_string_list(value, "skills")

    def validate_preferred_domains(self, value):
        return self._validate_string_list(value, "preferred_domains")

    def validate_preferred_work_types(self, value):
        return self._validate_string_list(value, "preferred_work_types")

    def validate_preferred_locations(self, value):
        return self._validate_string_list(value, "preferred_locations")

    @staticmethod
    def _validate_string_list(value, field_name):
        if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
            raise serializers.ValidationError(f"{field_name} must be a list of strings.")
        return value

    def validate(self, attrs):
        stipend_min = attrs.get(
            "expected_stipend_min",
            getattr(self.instance, "expected_stipend_min", None),
        )
        stipend_max = attrs.get(
            "expected_stipend_max",
            getattr(self.instance, "expected_stipend_max", None),
        )
        if stipend_min is not None and stipend_max is not None and stipend_min > stipend_max:
            raise serializers.ValidationError(
                {"expected_stipend_max": "Must be greater than or equal to expected_stipend_min."}
            )
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password2 = serializers.CharField(write_only=True, label="Confirm new password")

    def validate_old_password(self, value):
        user = self.context["request"].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value

    def validate(self, attrs):
        if attrs["new_password"] != attrs["new_password2"]:
            raise serializers.ValidationError({"new_password2": "Passwords do not match."})
        return attrs

    def save(self, **kwargs):
        user = self.context["request"].user
        user.set_password(self.validated_data["new_password"])
        user.save()
        return user


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetVerifySerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)


class PasswordResetConfirmSerializer(serializers.Serializer):
    email = serializers.EmailField()
    reset_token = serializers.CharField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password2 = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs["password"] != attrs["password2"]:
            raise serializers.ValidationError({"password2": "Passwords do not match."})
        return attrs


class EmailVerificationSerializer(serializers.Serializer):
    email = serializers.EmailField()
    otp = serializers.CharField(min_length=6, max_length=6)
