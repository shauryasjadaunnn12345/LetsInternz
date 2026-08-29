from django.urls import path
from rest_framework.routers import DefaultRouter

app_name = "notifications"

router = DefaultRouter()
# Register viewsets here, e.g. router.register("items", ItemViewSet)

urlpatterns = router.urls
