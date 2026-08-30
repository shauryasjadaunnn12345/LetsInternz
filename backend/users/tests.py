import io
import re

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import override_settings
from django.urls import reverse
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Profile

User = get_user_model()


def make_image_file(name="avatar.png"):
    """Build an in-memory PNG for upload tests."""
    from django.core.files.uploadedfile import SimpleUploadedFile

    buffer = io.BytesIO()
    Image.new("RGB", (10, 10), color="red").save(buffer, format="PNG")
    buffer.seek(0)
    return SimpleUploadedFile(name, buffer.read(), content_type="image/png")


class RegistrationTests(APITestCase):
    def setUp(self):
        self.url = reverse("users:register")
        self.valid_payload = {
            "email": "student@example.com",
            "username": "student1",
            "password": "StrongPass123!",
            "password2": "StrongPass123!",
        }

    @override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
    def test_register_requires_email_verification(self):
        response = self.client.post(self.url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertNotIn("access", response.data)
        self.assertEqual(len(mail.outbox), 1)

        user = User.objects.get(email="student@example.com")
        self.assertTrue(user.check_password("StrongPass123!"))
        self.assertFalse(user.is_active)
        self.assertTrue(Profile.objects.filter(user=user).exists())

        otp = re.search(r"\b(\d{6})\b", mail.outbox[0].body).group(1)
        verify = self.client.post(
            reverse("users:verify_email"),
            {"email": "student@example.com", "otp": otp},
        )
        self.assertEqual(verify.status_code, status.HTTP_200_OK)
        self.assertIn("access", verify.data)
        user.refresh_from_db()
        self.assertTrue(user.is_active)

    def test_register_allows_retry_for_inactive_user(self):
        User.objects.create_user(
            username="existing",
            email="student@example.com",
            password="OldPass123!",
            is_active=False,
        )

        payload = {
            **self.valid_payload,
            "username": "student2",
            "password": "NewStrongPass123!",
            "password2": "NewStrongPass123!",
        }

        response = self.client.post(self.url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)

        user = User.objects.get(email="student@example.com")
        self.assertFalse(user.is_active)
        self.assertEqual(user.username, "student2")
        self.assertTrue(user.check_password("NewStrongPass123!"))

    def test_register_rejects_duplicate_email(self):
        User.objects.create_user(
            username="existing", email="student@example.com", password="whatever123"
        )
        response = self.client.post(self.url, self.valid_payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", response.data)

    def test_register_rejects_password_mismatch(self):
        payload = {**self.valid_payload, "password2": "SomethingElse123!"}
        response = self.client.post(self.url, payload)

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password2", response.data)


class LoginTests(APITestCase):
    def setUp(self):
        self.url = reverse("users:login")
        self.user = User.objects.create_user(
            username="loginuser", email="login@example.com", password="StrongPass123!"
        )

    def test_login_with_valid_credentials(self):
        response = self.client.post(
            self.url, {"email": "login@example.com", "password": "StrongPass123!"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_login_with_invalid_password(self):
        response = self.client.post(
            self.url, {"email": "login@example.com", "password": "WrongPassword"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_with_unknown_email(self):
        response = self.client.post(
            self.url, {"email": "nobody@example.com", "password": "whatever123"}
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


@override_settings(EMAIL_BACKEND="django.core.mail.backends.locmem.EmailBackend")
class PasswordResetTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="resetuser", email="reset@example.com", password="OldPass123!"
        )

    def test_reset_password_with_email_otp(self):
        request = self.client.post(
            reverse("users:password_forgot"), {"email": "reset@example.com"}
        )
        self.assertEqual(request.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)

        otp = re.search(r"\b(\d{6})\b", mail.outbox[0].body).group(1)
        verify = self.client.post(
            reverse("users:password_verify_otp"),
            {"email": "reset@example.com", "otp": otp},
        )
        self.assertEqual(verify.status_code, status.HTTP_200_OK)

        reset = self.client.post(
            reverse("users:password_reset"),
            {
                "email": "reset@example.com",
                "reset_token": verify.data["reset_token"],
                "password": "NewPass456!",
                "password2": "NewPass456!",
            },
        )
        self.assertEqual(reset.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass456!"))

        reuse = self.client.post(
            reverse("users:password_reset"),
            {
                "email": "reset@example.com",
                "reset_token": verify.data["reset_token"],
                "password": "AnotherPass789!",
                "password2": "AnotherPass789!",
            },
        )
        self.assertEqual(reuse.status_code, status.HTTP_400_BAD_REQUEST)

    def test_reset_request_does_not_reveal_unknown_email(self):
        response = self.client.post(
            reverse("users:password_forgot"), {"email": "unknown@example.com"}
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)


class TokenRefreshTests(APITestCase):
    def test_refresh_for_deleted_user_returns_unauthorized(self):
        user = User.objects.create_user(
            username="refreshuser", email="refresh@example.com", password="StrongPass123!"
        )
        login_response = self.client.post(
            reverse("users:login"),
            {"email": "refresh@example.com", "password": "StrongPass123!"},
        )
        refresh = login_response.data["refresh"]
        user.delete()

        response = self.client.post(reverse("users:token_refresh"), {"refresh": refresh})

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="logoutuser", email="logout@example.com", password="StrongPass123!"
        )
        login_response = self.client.post(
            reverse("users:login"),
            {"email": "logout@example.com", "password": "StrongPass123!"},
        )
        self.access = login_response.data["access"]
        self.refresh = login_response.data["refresh"]

    def test_logout_blacklists_refresh_token(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.access}")
        response = self.client.post(reverse("users:logout"), {"refresh": self.refresh})

        self.assertEqual(response.status_code, status.HTTP_205_RESET_CONTENT)

        # Using the blacklisted refresh token again should now fail.
        refresh_response = self.client.post(
            reverse("users:token_refresh"), {"refresh": self.refresh}
        )
        self.assertEqual(refresh_response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_requires_authentication(self):
        response = self.client.post(reverse("users:logout"), {"refresh": self.refresh})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="profileuser", email="profile@example.com", password="StrongPass123!"
        )
        self.url = reverse("users:profile")
        login_response = self.client.post(
            reverse("users:login"),
            {"email": "profile@example.com", "password": "StrongPass123!"},
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )

    def test_get_profile_requires_authentication(self):
        self.client.credentials()  # clear auth
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_get_profile_returns_auto_created_profile(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email"], "profile@example.com")
        self.assertEqual(response.data["profile_completion"], 0)

    def test_update_profile_fields(self):
        payload = {
            "full_name": "Jane Doe",
            "phone": "9876543210",
            "college": "IIT Delhi",
            "branch": "Computer Science",
            "graduation_year": 2026,
            "cgpa": "8.75",
            "skills": ["Python", "Django", "React"],
            "preferred_domains": ["Backend", "Full Stack"],
            "preferred_work_types": ["Remote", "Hybrid"],
            "preferred_locations": ["Bangalore", "Remote"],
            "expected_stipend_min": 10000,
            "expected_stipend_max": 25000,
            "linkedin_url": "https://linkedin.com/in/janedoe",
            "github_url": "https://github.com/janedoe",
            "portfolio_url": "https://janedoe.dev",
        }
        response = self.client.put(self.url, payload, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["full_name"], "Jane Doe")
        self.assertEqual(response.data["skills"], ["Python", "Django", "React"])
        # 15 of 17 completion fields filled (no resume/avatar in this payload).
        self.assertEqual(response.data["profile_completion"], 88)

    def test_update_profile_rejects_invalid_stipend_range(self):
        response = self.client.put(
            self.url,
            {"expected_stipend_min": 30000, "expected_stipend_max": 10000},
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_partial_update_increases_completion_percentage(self):
        response = self.client.put(self.url, {"full_name": "Partial User"}, format="json")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreater(response.data["profile_completion"], 0)
        self.assertLess(response.data["profile_completion"], 100)

    def test_completion_reaches_100_with_all_fields_including_files(self):
        profile = Profile.objects.get(user=self.user)
        profile.full_name = "Jane Doe"
        profile.phone = "9876543210"
        profile.college = "IIT Delhi"
        profile.branch = "CS"
        profile.graduation_year = 2026
        profile.cgpa = 8.75
        profile.skills = ["Python"]
        profile.preferred_domains = ["Backend"]
        profile.preferred_work_types = ["Remote"]
        profile.preferred_locations = ["Bangalore"]
        profile.expected_stipend_min = 10000
        profile.expected_stipend_max = 25000
        profile.linkedin_url = "https://linkedin.com/in/janedoe"
        profile.github_url = "https://github.com/janedoe"
        profile.portfolio_url = "https://janedoe.dev"
        profile.resume = make_image_file("resume.pdf")
        profile.avatar = make_image_file("avatar.png")
        profile.save()

        self.assertEqual(profile.profile_completion, 100)


class ResumeAvatarUploadTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="uploaduser", email="upload@example.com", password="StrongPass123!"
        )
        login_response = self.client.post(
            reverse("users:login"),
            {"email": "upload@example.com", "password": "StrongPass123!"},
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )

    def test_avatar_upload(self):
        response = self.client.post(
            reverse("users:profile_avatar"),
            {"avatar": make_image_file()},
            format="multipart",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNotNone(response.data["avatar"])

        profile = Profile.objects.get(user=self.user)
        self.assertTrue(bool(profile.avatar))

    def test_resume_upload_requires_file(self):
        response = self.client.post(reverse("users:profile_resume"), {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ChangePasswordTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="pwuser", email="pw@example.com", password="OldPass123!"
        )
        login_response = self.client.post(
            reverse("users:login"), {"email": "pw@example.com", "password": "OldPass123!"}
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )
        self.url = reverse("users:change_password")

    def test_change_password_success(self):
        response = self.client.post(
            self.url,
            {
                "old_password": "OldPass123!",
                "new_password": "NewPass456!",
                "new_password2": "NewPass456!",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.user.refresh_from_db()
        self.assertTrue(self.user.check_password("NewPass456!"))

    def test_change_password_rejects_wrong_old_password(self):
        response = self.client.post(
            self.url,
            {
                "old_password": "WrongOldPass",
                "new_password": "NewPass456!",
                "new_password2": "NewPass456!",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_change_password_rejects_mismatched_new_passwords(self):
        response = self.client.post(
            self.url,
            {
                "old_password": "OldPass123!",
                "new_password": "NewPass456!",
                "new_password2": "Different789!",
            },
        )

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class ProfileModelTests(APITestCase):
    def test_calculate_completion_empty_profile(self):
        user = User.objects.create_user(
            username="calcuser", email="calc@example.com", password="StrongPass123!"
        )
        profile = Profile.objects.get(user=user)
        self.assertEqual(profile.calculate_completion(), 0)

    def test_calculate_completion_partial_profile(self):
        user = User.objects.create_user(
            username="calcuser2", email="calc2@example.com", password="StrongPass123!"
        )
        profile = Profile.objects.get(user=user)
        profile.full_name = "Test User"
        profile.college = "Test College"
        profile.skills = ["Python"]
        profile.save()

        self.assertGreater(profile.profile_completion, 0)
        self.assertLess(profile.profile_completion, 100)

    def test_post_save_signal_auto_creates_profile(self):
        user = User.objects.create_user(
            username="signaluser", email="signal@example.com", password="StrongPass123!"
        )
        self.assertTrue(Profile.objects.filter(user=user).exists())


class DeleteAccountTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="deleteuser", email="delete@example.com", password="StrongPass123!"
        )
        login_response = self.client.post(
            reverse("users:login"), {"email": "delete@example.com", "password": "StrongPass123!"}
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )
        self.url = reverse("users:delete_account")

    def test_delete_account_requires_correct_password(self):
        response = self.client.delete(self.url, {"password": "WrongPassword"})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertTrue(User.objects.filter(id=self.user.id).exists())

    def test_delete_account_requires_password_field(self):
        response = self.client.delete(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_account_success_cascades_profile(self):
        profile_id = self.user.profile.id

        response = self.client.delete(self.url, {"password": "StrongPass123!"})

        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(User.objects.filter(id=self.user.id).exists())
        self.assertFalse(Profile.objects.filter(id=profile_id).exists())

    def test_delete_account_requires_authentication(self):
        self.client.credentials()
        response = self.client.delete(self.url, {"password": "StrongPass123!"})
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ProfileSettingsFieldsTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="settingsuser", email="settings@example.com", password="StrongPass123!"
        )
        login_response = self.client.post(
            reverse("users:login"),
            {"email": "settings@example.com", "password": "StrongPass123!"},
        )
        self.client.credentials(
            HTTP_AUTHORIZATION=f"Bearer {login_response.data['access']}"
        )
        self.url = reverse("users:profile")

    def test_default_settings_values(self):
        response = self.client.get(self.url)
        self.assertEqual(response.data["email_digest"], "weekly")
        self.assertTrue(response.data["deadline_reminders_enabled"])
        self.assertTrue(response.data["new_matches_alert_enabled"])
        self.assertTrue(response.data["application_status_alerts_enabled"])
        self.assertFalse(response.data["is_profile_public"])

    def test_update_notification_and_privacy_settings(self):
        response = self.client.put(
            self.url,
            {
                "email_digest": "daily",
                "deadline_reminders_enabled": False,
                "new_matches_alert_enabled": False,
                "application_status_alerts_enabled": True,
                "is_profile_public": True,
            },
            format="json",
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["email_digest"], "daily")
        self.assertFalse(response.data["deadline_reminders_enabled"])
        self.assertFalse(response.data["new_matches_alert_enabled"])
        self.assertTrue(response.data["is_profile_public"])
