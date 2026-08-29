from django.urls import path
from .views import (
    AvatarUploadView,
    ChangePasswordView,
    DeleteAccountView,
    EmailVerificationView,
    GoogleLoginView,
    LoginView,
    LogoutView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    PasswordResetVerifyView,
    ProfileView,
    RegisterView,
    RefreshTokenView,
    ResumeUploadView,
)

app_name = "users"

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("login/", LoginView.as_view(), name="login"),
    path("google-login/", GoogleLoginView.as_view(), name="google_login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token_refresh"),
    path("password/forgot/", PasswordResetRequestView.as_view(), name="password_forgot"),
    path("password/verify-otp/", PasswordResetVerifyView.as_view(), name="password_verify_otp"),
    path("password/reset/", PasswordResetConfirmView.as_view(), name="password_reset"),
    path("verify-email/", EmailVerificationView.as_view(), name="verify_email"),
    path("profile/", ProfileView.as_view(), name="profile"),
    path("profile/resume/", ResumeUploadView.as_view(), name="profile_resume"),
    path("profile/avatar/", AvatarUploadView.as_view(), name="profile_avatar"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),
    path("delete-account/", DeleteAccountView.as_view(), name="delete_account"),
]
