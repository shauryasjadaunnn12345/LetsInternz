from django.conf import settings
from django.db import models

from internships.models import Internship


class SavedInternship(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_internships"
    )
    internship = models.ForeignKey(
        Internship, on_delete=models.CASCADE, related_name="saved_by"
    )
    folder = models.CharField(max_length=100, default="All")
    saved_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("user", "internship"),)
        ordering = ["-saved_at"]

    def __str__(self):
        return f"{self.user} saved {self.internship}"


class SavedFolder(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_folders"
    )
    name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = (("user", "name"),)
        ordering = ["name"]

    def __str__(self):
        return f"{self.name} ({self.user})"
