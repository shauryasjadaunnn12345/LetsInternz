import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from internships.models import Internship


class Application(models.Model):
    class Status(models.TextChoices):
        APPLIED = "applied", "Applied"
        UNDER_REVIEW = "under_review", "Under Review"
        INTERVIEW = "interview", "Interview"
        OFFER_RECEIVED = "offer_received", "Offer Received"
        SELECTED = "selected", "Selected"
        REJECTED = "rejected", "Rejected"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="applications"
    )
    internship = models.ForeignKey(
        Internship,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="applications",
    )

    # Manual entry fields — used when the internship isn't in our DB
    # (e.g. the student applied somewhere we haven't scraped/indexed).
    manual_company = models.CharField(max_length=255, blank=True)
    manual_role = models.CharField(max_length=255, blank=True)
    manual_apply_link = models.URLField(blank=True)
    manual_stipend = models.CharField(max_length=100, blank=True)

    status = models.CharField(max_length=20, choices=Status.choices, default=Status.APPLIED)
    notes = models.TextField(blank=True)
    next_step = models.CharField(max_length=255, blank=True)
    reminder_date = models.DateField(null=True, blank=True)

    applied_at = models.DateTimeField(default=timezone.now)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-applied_at"]
        indexes = [
            models.Index(fields=["user"]),
            models.Index(fields=["status"]),
            models.Index(fields=["applied_at"]),
        ]

    def __str__(self):
        label = self.internship.title if self.internship else self.manual_role
        return f"{label or 'Application'} — {self.user}"

    @property
    def company_display(self):
        return self.internship.company if self.internship else self.manual_company

    @property
    def role_display(self):
        return self.internship.title if self.internship else self.manual_role

    @property
    def stipend_display(self):
        return self.internship.stipend_display if self.internship else self.manual_stipend
