from rest_framework import serializers

from internships.models import Internship
from internships.serializers import InternshipListSerializer

from .models import Application


class ApplicationSerializer(serializers.ModelSerializer):
    """Full read serializer — includes nested internship summary data."""

    internship = InternshipListSerializer(read_only=True)
    company = serializers.CharField(source="company_display", read_only=True)
    role = serializers.CharField(source="role_display", read_only=True)

    class Meta:
        model = Application
        fields = (
            "id",
            "internship",
            "company",
            "role",
            "manual_company",
            "manual_role",
            "manual_apply_link",
            "manual_stipend",
            "stipend_display",
            "status",
            "notes",
            "next_step",
            "reminder_date",
            "applied_at",
            "updated_at",
        )
        read_only_fields = ("id", "applied_at", "updated_at")


class ApplicationCreateSerializer(serializers.ModelSerializer):
    """Create serializer — either link an existing internship (`internship_id`)
    or fill in the manual_* fields for one that isn't in our DB."""

    internship_id = serializers.PrimaryKeyRelatedField(
        source="internship",
        queryset=Internship.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Application
        fields = (
            "id",
            "internship_id",
            "manual_company",
            "manual_role",
            "manual_apply_link",
            "manual_stipend",
            "status",
            "notes",
            "next_step",
            "reminder_date",
        )
        read_only_fields = ("id",)

    def validate(self, attrs):
        internship = attrs.get("internship")
        manual_company = attrs.get("manual_company", "")
        manual_role = attrs.get("manual_role", "")

        if not internship and not (manual_company and manual_role):
            raise serializers.ValidationError(
                "Provide either internship_id, or manual_company and manual_role."
            )
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class ApplicationUpdateSerializer(serializers.ModelSerializer):
    """Update serializer — status, notes, next_step, reminder_date, and the
    manual_* fields (editable for manually-entered applications; harmless
    no-ops for internship-linked ones, which display internship data
    instead). Kanban drag-and-drop only ever sends `status`; the Notes
    slide-over sends notes/next_step/reminder_date; the Edit modal sends
    the manual_* fields plus status."""

    class Meta:
        model = Application
        fields = (
            "status",
            "notes",
            "next_step",
            "reminder_date",
            "manual_company",
            "manual_role",
            "manual_apply_link",
            "manual_stipend",
        )
