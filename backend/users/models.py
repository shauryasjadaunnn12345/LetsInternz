from django.contrib.auth.models import AbstractUser
from django.db import models
from django.db.models.signals import post_save
from django.dispatch import receiver


class User(AbstractUser):
    """Custom user model for LetsInternz.

    Authentication is email-based: `email` is unique and is the field used
    to log in, while `username` is kept (required by Django's auth system
    and useful as a display handle) but is no longer used for login.
    """

    email = models.EmailField(unique=True)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["username"]

    class Role(models.TextChoices):
        STUDENT = "student", "Student"
        ADMIN = "admin", "Admin"

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.STUDENT)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.email


class PasswordResetOTP(models.Model):
    email = models.EmailField(db_index=True)
    otp_hash = models.CharField(max_length=128)
    reset_token_hash = models.CharField(max_length=128, blank=True)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    verified_at = models.DateTimeField(null=True, blank=True)
    used_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"PasswordResetOTP<{self.email}>"


class EmailVerificationOTP(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="email_verification")
    otp_hash = models.CharField(max_length=128)
    expires_at = models.DateTimeField()
    attempts = models.PositiveSmallIntegerField(default=0)
    verified_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)


def resume_upload_path(instance, filename):
    from config.aws import resume_key

    return resume_key(instance.user_id, filename)


def avatar_upload_path(instance, filename):
    from config.aws import avatar_key

    return avatar_key(instance.user_id, filename)


class Profile(models.Model):
    """Extended profile information for a student user."""

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="profile")

    full_name = models.CharField(max_length=255, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    college = models.CharField(max_length=255, blank=True)
    branch = models.CharField(max_length=255, blank=True)
    graduation_year = models.IntegerField(null=True, blank=True)
    cgpa = models.DecimalField(max_digits=4, decimal_places=2, null=True, blank=True)

    # List/dict-shaped fields — stored as JSON, always default to a list.
    skills = models.JSONField(default=list, blank=True)
    preferred_domains = models.JSONField(default=list, blank=True)
    preferred_work_types = models.JSONField(default=list, blank=True)
    preferred_locations = models.JSONField(default=list, blank=True)

    expected_stipend_min = models.PositiveIntegerField(null=True, blank=True)
    expected_stipend_max = models.PositiveIntegerField(null=True, blank=True)

    resume = models.FileField(upload_to=resume_upload_path, null=True, blank=True)
    avatar = models.ImageField(upload_to=avatar_upload_path, null=True, blank=True)

    linkedin_url = models.URLField(blank=True)
    github_url = models.URLField(blank=True)
    portfolio_url = models.URLField(blank=True)

    profile_completion = models.IntegerField(default=0)

    class EmailDigest(models.TextChoices):
        DAILY = "daily", "Daily"
        WEEKLY = "weekly", "Weekly"
        NEVER = "never", "Never"

    email_digest = models.CharField(
        max_length=10, choices=EmailDigest.choices, default=EmailDigest.WEEKLY
    )
    deadline_reminders_enabled = models.BooleanField(default=True)
    new_matches_alert_enabled = models.BooleanField(default=True)
    application_status_alerts_enabled = models.BooleanField(default=True)
    is_profile_public = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    # Fields that count toward the profile completion percentage.
    _COMPLETION_FIELDS = (
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
    )

    def __str__(self):
        return f"Profile<{self.user.email}>"

    def calculate_completion(self):
        """Return the percentage (0-100) of profile fields that are filled in.

        JSON list fields count as filled when non-empty; everything else
        counts as filled when it has a truthy value. Does not save — call
        `.save()` yourself (or use `save(update_completion=True)`) to persist.
        """
        total = len(self._COMPLETION_FIELDS)
        filled = 0

        for field_name in self._COMPLETION_FIELDS:
            value = getattr(self, field_name)
            if isinstance(value, (list, dict)):
                if len(value) > 0:
                    filled += 1
            elif value not in (None, "", 0):
                filled += 1

        return int(round((filled / total) * 100)) if total else 0

    def save(self, *args, update_completion=True, **kwargs):
        if update_completion:
            self.profile_completion = self.calculate_completion()
        super().save(*args, **kwargs)


@receiver(post_save, sender=User)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    """Automatically create an (empty) Profile whenever a User is created."""
    if created:
        Profile.objects.create(user=instance)
