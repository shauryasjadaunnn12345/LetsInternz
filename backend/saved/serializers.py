from rest_framework import serializers

from internships.models import Internship
from internships.serializers import InternshipListSerializer

from .models import SavedFolder, SavedInternship


class SavedInternshipSerializer(serializers.ModelSerializer):
    """Read serializer — includes nested internship summary data."""

    internship = InternshipListSerializer(read_only=True)

    class Meta:
        model = SavedInternship
        fields = ("id", "internship", "folder", "saved_at")
        read_only_fields = ("id", "saved_at")


class SavedInternshipCreateSerializer(serializers.ModelSerializer):
    internship_id = serializers.PrimaryKeyRelatedField(
        source="internship", queryset=Internship.objects.all()
    )

    class Meta:
        model = SavedInternship
        fields = ("id", "internship_id", "folder")
        read_only_fields = ("id",)

    def validate(self, attrs):
        user = self.context["request"].user
        internship = attrs.get("internship")
        if SavedInternship.objects.filter(user=user, internship=internship).exists():
            raise serializers.ValidationError("This internship is already saved.")
        return attrs

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)


class SavedFolderSerializer(serializers.ModelSerializer):
    class Meta:
        model = SavedFolder
        fields = ("id", "name", "created_at")
        read_only_fields = ("id", "created_at")

    def create(self, validated_data):
        validated_data["user"] = self.context["request"].user
        return super().create(validated_data)
