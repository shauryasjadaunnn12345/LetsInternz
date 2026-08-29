import uuid

from django.db import models
from django.utils import timezone


class InternshipSource(models.Model):
    """A platform internships are scraped from (Internshala, Unstop, LinkedIn, ...)."""

    name = models.CharField(max_length=100, unique=True)
    base_url = models.URLField(blank=True)
    logo_url = models.URLField(blank=True)
    is_active = models.BooleanField(default=True)
    last_scraped_at = models.DateTimeField(null=True, blank=True)
    total_internships_scraped = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ["name"]

    def __str__(self):
        return self.name


class Internship(models.Model):
    class WorkType(models.TextChoices):
        REMOTE = "remote", "Remote"
        HYBRID = "hybrid", "Hybrid"
        ONSITE = "onsite", "Onsite"

    class Domain(models.TextChoices):
        TECH = "tech", "Tech"
        MARKETING = "marketing", "Marketing"
        DESIGN = "design", "Design"
        FINANCE = "finance", "Finance"
        DATA_SCIENCE = "data_science", "Data Science"
        HR = "hr", "HR"
        OPERATIONS = "operations", "Operations"
        CONTENT = "content", "Content"
        SALES = "sales", "Sales"

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    title = models.CharField(max_length=255)
    company = models.CharField(max_length=255)
    company_logo_url = models.URLField(blank=True)

    location = models.CharField(max_length=255)
    city = models.CharField(max_length=100, blank=True)
    work_type = models.CharField(max_length=20, choices=WorkType.choices)
    domain = models.CharField(max_length=20, choices=Domain.choices)

    duration = models.CharField(max_length=50, blank=True)
    duration_months = models.PositiveIntegerField(null=True, blank=True)

    stipend_min = models.PositiveIntegerField(null=True, blank=True)
    stipend_max = models.PositiveIntegerField(null=True, blank=True)
    stipend_display = models.CharField(max_length=100, blank=True)
    is_unpaid = models.BooleanField(default=False)

    skills_required = models.JSONField(default=list, blank=True)

    description = models.TextField(blank=True)
    requirements = models.TextField(blank=True)
    perks = models.JSONField(default=list, blank=True)

    apply_link = models.URLField(max_length=1000)

    source = models.ForeignKey(
        InternshipSource, on_delete=models.CASCADE, related_name="internships"
    )
    source_job_id = models.CharField(
        max_length=255,
        blank=True,
        help_text=(
            "The listing's ID on the source platform. Leave blank for a "
            "manually-curated internship — one will be generated automatically."
        ),
    )

    deadline = models.DateField(null=True, blank=True)
    posted_at = models.DateTimeField(default=timezone.now)

    is_active = models.BooleanField(default=True)
    views_count = models.PositiveIntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = (("source", "source_job_id"),)
        indexes = [
            models.Index(fields=["domain"]),
            models.Index(fields=["work_type"]),
            models.Index(fields=["city"]),
            models.Index(fields=["stipend_min"]),
            models.Index(fields=["deadline"]),
            models.Index(fields=["posted_at"]),
            models.Index(fields=["is_active"]),
        ]
        ordering = ["-posted_at"]

    def __str__(self):
        return f"{self.title} @ {self.company}"

    def save(self, *args, **kwargs):
        if not self.source_job_id:
            # Manually-curated internship (not from a scraper, which always
            # supplies the platform's own listing ID) — generate one so the
            # (source, source_job_id) unique constraint is still satisfied.
            self.source_job_id = f"manual-{uuid.uuid4().hex[:12]}"

        if not self.stipend_display:
            if self.is_unpaid:
                self.stipend_display = "Unpaid"
            elif self.stipend_min is not None and self.stipend_max is not None:
                self.stipend_display = f"₹{self.stipend_min:,} - ₹{self.stipend_max:,}"

        super().save(*args, **kwargs)
