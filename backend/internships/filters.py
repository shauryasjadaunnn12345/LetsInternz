"""
django-filter FilterSet for Internship.

Note: full-text `search` across title/company/description is intentionally
NOT defined here — it's handled by DRF's `rest_framework.filters.SearchFilter`
at the view level (`search_fields = ["title", "company", "description"]`),
which is already wired in as a global DEFAULT_FILTER_BACKEND alongside
DjangoFilterBackend. That gives clients `?search=...` for free without
duplicating the logic here.
"""

from django.db.models import Q
import django_filters as filters

from .models import Internship


class CharInFilter(filters.BaseInFilter, filters.CharFilter):
    """Comma-separated multi-value filter for plain CharFields,
    e.g. ?city=Bangalore,Mumbai,Remote"""


class InternshipFilter(filters.FilterSet):
    domain = filters.MultipleChoiceFilter(
        field_name="domain", choices=Internship.Domain.choices
    )
    work_type = filters.MultipleChoiceFilter(
        field_name="work_type", choices=Internship.WorkType.choices
    )
    city = CharInFilter(field_name="city", lookup_expr="in")
    source__name = CharInFilter(field_name="source__name", lookup_expr="in")

    stipend_min = filters.NumberFilter(field_name="stipend_min", lookup_expr="gte")
    stipend_max = filters.NumberFilter(field_name="stipend_max", lookup_expr="lte")

    duration_months = filters.NumberFilter(field_name="duration_months", lookup_expr="lte")

    skills = filters.CharFilter(method="filter_skills")

    deadline__gte = filters.DateFilter(field_name="deadline", lookup_expr="gte")

    is_unpaid = filters.BooleanFilter(field_name="is_unpaid")

    class Meta:
        model = Internship
        fields = [
            "domain",
            "work_type",
            "city",
            "source__name",
            "stipend_min",
            "stipend_max",
            "duration_months",
            "skills",
            "deadline__gte",
            "is_unpaid",
        ]

    def filter_skills(self, queryset, name, value):
        """`skills` accepts a comma-separated list, e.g. ?skills=Python,React
        Matches internships whose skills_required JSONField contains ANY of
        the given skills (case-insensitive). Implemented with icontains
        against the serialized JSON so it works identically on SQLite
        (development) and PostgreSQL (production) — `contains`/`overlap`
        JSONField lookups are Postgres-only."""
        skills = [s.strip() for s in value.split(",") if s.strip()]
        if not skills:
            return queryset

        query = Q()
        for skill in skills:
            query |= Q(skills_required__icontains=skill)
        return queryset.filter(query)
