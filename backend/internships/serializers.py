from rest_framework import serializers

from .models import Internship, InternshipSource


class InternshipSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = InternshipSource
        fields = (
            "id",
            "name",
            "base_url",
            "logo_url",
            "is_active",
            "last_scraped_at",
            "total_internships_scraped",
        )


class InternshipListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list/grid views — omits heavy text fields
    (description, requirements) and nested source detail."""

    source_name = serializers.CharField(source="source.name", read_only=True)

    class Meta:
        model = Internship
        fields = (
            "id",
            "title",
            "company",
            "company_logo_url",
            "location",
            "city",
            "work_type",
            "domain",
            "duration",
            "duration_months",
            "stipend_display",
            "is_unpaid",
            "skills_required",
            "source_name",
            "apply_link",
            "deadline",
            "posted_at",
            "views_count",
        )


class InternshipDetailSerializer(serializers.ModelSerializer):
    """Full serializer for the detail view."""

    source = InternshipSourceSerializer(read_only=True)

    class Meta:
        model = Internship
        fields = (
            "id",
            "title",
            "company",
            "company_logo_url",
            "location",
            "city",
            "work_type",
            "domain",
            "duration",
            "duration_months",
            "stipend_min",
            "stipend_max",
            "stipend_display",
            "is_unpaid",
            "skills_required",
            "description",
            "requirements",
            "perks",
            "apply_link",
            "source",
            "deadline",
            "posted_at",
            "is_active",
            "views_count",
            "created_at",
            "updated_at",
        )
