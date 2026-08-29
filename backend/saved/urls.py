from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    DeadlineAlertView,
    SavedFolderViewSet,
    SavedInternshipViewSet,
    ToggleSaveView,
)

app_name = "saved"

router = DefaultRouter()
router.register("folders", SavedFolderViewSet, basename="saved-folder")
router.register("", SavedInternshipViewSet, basename="saved-internship")

urlpatterns = [
    # Specific routes must come before the routers' generic `<pk>/` detail
    # routes so they aren't swallowed by them.
    path("toggle/<uuid:internship_id>/", ToggleSaveView.as_view(), name="toggle"),
    path("deadline-alerts/", DeadlineAlertView.as_view(), name="deadline_alerts"),
] + router.urls
