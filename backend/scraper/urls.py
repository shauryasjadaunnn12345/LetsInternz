from django.urls import path
from rest_framework.routers import DefaultRouter

app_name = "scraper"

router = DefaultRouter()
# Register viewsets here, e.g. router.register("jobs", ScrapeJobViewSet)

urlpatterns = router.urls
