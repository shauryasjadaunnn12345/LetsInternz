from django.db.models import Count
from rest_framework import filters, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import Application
from .serializers import (
    ApplicationCreateSerializer,
    ApplicationSerializer,
    ApplicationUpdateSerializer,
)


class ApplicationViewSet(viewsets.ModelViewSet):
    """Full CRUD for the current user's tracked applications.

    - list:    ?status=applied filter, ?search= across role/company
    - create:  link an existing internship or a manual entry
    - update:  status, notes, next_step, reminder_date (PUT/PATCH)
    - destroy: delete the application
    """

    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = (
        "manual_company",
        "manual_role",
        "internship__title",
        "internship__company",
    )
    lookup_field = "id"

    def get_queryset(self):
        queryset = (
            Application.objects.filter(user=self.request.user)
            .select_related("internship", "internship__source")
        )
        status_param = self.request.query_params.get("status")
        if status_param:
            queryset = queryset.filter(status=status_param)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return ApplicationCreateSerializer
        if self.action in ("update", "partial_update"):
            return ApplicationUpdateSerializer
        return ApplicationSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        # Respond with the full read representation, not the create shape.
        return Response(
            ApplicationSerializer(application).data,
            status=201,
        )

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop("partial", False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        application = serializer.save()
        return Response(ApplicationSerializer(application).data)


class ApplicationStatsView(APIView):
    """GET /api/applications/stats/ — counts by status for the current
    user's dashboard chart. Always includes every status key, defaulting
    to 0 so the frontend doesn't need to handle missing keys."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        counts = dict(
            Application.objects.filter(user=request.user)
            .values_list("status")
            .annotate(count=Count("id"))
        )

        data = {value: counts.get(value, 0) for value, _ in Application.Status.choices}
        data["total"] = sum(data.values())
        return Response(data)
