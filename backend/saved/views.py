from datetime import timedelta

from django.utils import timezone
from rest_framework import permissions, status, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView

from internships.models import Internship
from internships.serializers import InternshipListSerializer

from .models import SavedFolder, SavedInternship
from .serializers import (
    SavedFolderSerializer,
    SavedInternshipCreateSerializer,
    SavedInternshipSerializer,
)


class SavedInternshipViewSet(viewsets.ModelViewSet):
    """
    list:    the current user's saved internships, optionally ?folder=Name
    create:  save an internship (rejects duplicates — see serializer)
    destroy: unsave
    """

    permission_classes = [permissions.IsAuthenticated]
    http_method_names = ["get", "post", "delete", "head", "options"]

    def get_queryset(self):
        queryset = (
            SavedInternship.objects.filter(user=self.request.user)
            .select_related("internship", "internship__source")
        )
        folder = self.request.query_params.get("folder")
        if folder:
            queryset = queryset.filter(folder=folder)
        return queryset

    def get_serializer_class(self):
        if self.action == "create":
            return SavedInternshipCreateSerializer
        return SavedInternshipSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        saved = serializer.save()
        return Response(SavedInternshipSerializer(saved).data, status=status.HTTP_201_CREATED)


class ToggleSaveView(APIView):
    """POST /api/saved/toggle/{internship_id}/ — saves the internship if not
    already saved, unsaves it if it is. Returns {"saved": true/false}."""

    permission_classes = [permissions.IsAuthenticated]

    def post(self, request, internship_id):
        internship = Internship.objects.filter(pk=internship_id).first()
        if internship is None:
            return Response(
                {"detail": "Internship not found."}, status=status.HTTP_404_NOT_FOUND
            )

        existing = SavedInternship.objects.filter(
            user=request.user, internship=internship
        ).first()

        if existing:
            existing.delete()
            return Response({"saved": False})

        folder = request.data.get("folder") or "All"
        SavedInternship.objects.create(user=request.user, internship=internship, folder=folder)
        return Response({"saved": True})


class DeadlineAlertView(APIView):
    """GET /api/saved/deadline-alerts/ — saved internships whose deadline
    falls within the next 7 days, ordered by deadline ascending (soonest
    first). Internships with no deadline are excluded."""

    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        today = timezone.localdate()
        cutoff = today + timedelta(days=7)

        saved = (
            SavedInternship.objects.filter(
                user=request.user,
                internship__deadline__isnull=False,
                internship__deadline__gte=today,
                internship__deadline__lte=cutoff,
            )
            .select_related("internship", "internship__source")
            .order_by("internship__deadline")
        )

        data = [
            {
                "saved_id": saved_internship.id,
                "internship": InternshipListSerializer(saved_internship.internship).data,
                "deadline": saved_internship.internship.deadline,
                "folder": saved_internship.folder,
            }
            for saved_internship in saved
        ]
        return Response(data)


class SavedFolderViewSet(viewsets.ModelViewSet):
    """Full CRUD for the current user's saved-internship folders."""

    permission_classes = [permissions.IsAuthenticated]
    serializer_class = SavedFolderSerializer

    def get_queryset(self):
        return SavedFolder.objects.filter(user=self.request.user)
