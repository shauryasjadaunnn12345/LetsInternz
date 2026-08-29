from rest_framework.routers import DefaultRouter

from .views import ApplicationStatsView, ApplicationViewSet
from django.urls import path

app_name = "applications"

router = DefaultRouter()
router.register("", ApplicationViewSet, basename="application")

urlpatterns = [
    path("stats/", ApplicationStatsView.as_view(), name="stats"),
] + router.urls
