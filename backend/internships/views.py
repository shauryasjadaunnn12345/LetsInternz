from collections import Counter

from django.db.models import Count, F, Q
from django.utils.decorators import method_decorator
from django.views.decorators.cache import cache_page
from rest_framework import viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .filters import InternshipFilter
from .models import Internship, InternshipSource
from .serializers import (
    InternshipDetailSerializer,
    InternshipListSerializer,
    InternshipSourceSerializer,
)

LIST_CACHE_SECONDS = 60 * 5  # 5 minutes, backed by the configured Django cache backend.

# Number of scored candidates fetched for the recommendation algorithm.
RECOMMENDATION_CANDIDATE_POOL_SIZE = 300


@method_decorator(cache_page(LIST_CACHE_SECONDS), name="list")
class InternshipViewSet(viewsets.ReadOnlyModelViewSet):
    """
    list:   paginated + filterable (see InternshipFilter), cached 5 min.
    retrieve: full detail, increments views_count.

    Public — browsing internships is the core value prop of an aggregator
    and shouldn't require an account. Personalization (RecommendedInternshipsView)
    and anything that writes data (applications, saved) still requires auth.
    """

    queryset = Internship.objects.filter(is_active=True).select_related("source")
    filterset_class = InternshipFilter
    permission_classes = [AllowAny]
    search_fields = ["title", "company", "description"]
    ordering_fields = ["posted_at", "stipend_max", "deadline"]
    ordering = ["-posted_at"]
    lookup_field = "id"

    def get_serializer_class(self):
        if self.action == "retrieve":
            return InternshipDetailSerializer
        return InternshipListSerializer

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()

        # Atomic increment — avoids a read-modify-write race under concurrent hits.
        Internship.objects.filter(pk=instance.pk).update(views_count=F("views_count") + 1)
        instance.refresh_from_db(fields=["views_count"])

        serializer = self.get_serializer(instance)
        return Response(serializer.data)


class RecommendedInternshipsView(APIView):
    """GET /api/internships/recommended/ — 8 internships personalized to the
    current user's profile skills and preferred domains.

    Scores a recent pool of active internships by skill overlap (weighted
    highest) and preferred-domain match, then falls back to the latest
    active internships to always return a full page of 8."""

    permission_classes = [IsAuthenticated]

    def get(self, request):
        profile = getattr(request.user, "profile", None)
        user_skills = {s.lower() for s in (getattr(profile, "skills", None) or [])}
        preferred_domains = {
            d.lower() for d in (getattr(profile, "preferred_domains", None) or [])
        }

        candidates = (
            Internship.objects.filter(is_active=True)
            .select_related("source")
            .order_by("-posted_at")[:RECOMMENDATION_CANDIDATE_POOL_SIZE]
        )

        scored = []
        for internship in candidates:
            internship_skills = {s.lower() for s in (internship.skills_required or [])}
            skill_overlap = len(user_skills & internship_skills)

            domain_match = (
                internship.domain.lower() in preferred_domains
                or internship.get_domain_display().lower() in preferred_domains
            )

            score = (skill_overlap * 2) + (1 if domain_match else 0)
            if score > 0:
                scored.append((score, internship))

        scored.sort(key=lambda pair: pair[0], reverse=True)
        recommended = [internship for _, internship in scored[:8]]

        if len(recommended) < 8:
            existing_ids = {internship.id for internship in recommended}
            fallback = (
                Internship.objects.filter(is_active=True)
                .exclude(id__in=existing_ids)
                .select_related("source")
                .order_by("-posted_at")[: 8 - len(recommended)]
            )
            recommended.extend(fallback)

        serializer = InternshipListSerializer(recommended, many=True)
        return Response(serializer.data)


class FeaturedInternshipsView(APIView):
    """GET /api/internships/featured/ — 6 latest active internships.
    Public — no auth required, used on the landing page."""

    permission_classes = [AllowAny]

    def get(self, request):
        internships = (
            Internship.objects.filter(is_active=True)
            .select_related("source")
            .order_by("-posted_at")[:6]
        )
        serializer = InternshipListSerializer(internships, many=True)
        return Response(serializer.data)


class InternshipSourceListView(APIView):
    """GET /api/internships/sources/ — all sources with active-internship
    counts, for populating the filter UI."""

    permission_classes = [AllowAny]

    def get(self, request):
        sources = InternshipSource.objects.annotate(
            active_internships_count=Count(
                "internships", filter=Q(internships__is_active=True)
            )
        ).order_by("name")

        data = InternshipSourceSerializer(sources, many=True).data
        for source, source_obj in zip(data, sources):
            source["active_internships_count"] = source_obj.active_internships_count

        return Response(data)


class DomainListView(APIView):
    """GET /api/internships/domains/ — every domain choice with a count of
    active internships in it, for populating the filter UI."""

    permission_classes = [AllowAny]

    def get(self, request):
        counts = dict(
            Internship.objects.filter(is_active=True)
            .values_list("domain")
            .annotate(count=Count("id"))
        )

        data = [
            {"value": value, "label": label, "count": counts.get(value, 0)}
            for value, label in Internship.Domain.choices
        ]
        return Response(data)


class PopularSkillsView(APIView):
    """GET /api/internships/skills/ — most frequently requested skills across
    active internships, for populating skill filter/search suggestions."""

    permission_classes = [AllowAny]

    def get(self, request):
        limit = int(request.query_params.get("limit", 20))

        skill_lists = Internship.objects.filter(is_active=True).values_list(
            "skills_required", flat=True
        )

        counter = Counter()
        for skills in skill_lists:
            for skill in skills or []:
                counter[skill.strip()] += 1

        popular = [
            {"skill": skill, "count": count}
            for skill, count in counter.most_common(limit)
        ]
        return Response(popular)
