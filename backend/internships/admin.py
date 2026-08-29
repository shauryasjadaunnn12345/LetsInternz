from django.contrib import admin

from .models import Internship, InternshipSource


@admin.register(InternshipSource)
class InternshipSourceAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "is_active",
        "total_internships_scraped",
        "last_scraped_at",
    )
    list_filter = ("is_active",)
    search_fields = ("name",)


@admin.action(description="Mark selected internships as active")
def make_active(modeladmin, request, queryset):
    queryset.update(is_active=True)


@admin.action(description="Mark selected internships as inactive")
def make_inactive(modeladmin, request, queryset):
    queryset.update(is_active=False)


@admin.register(Internship)
class InternshipAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "company",
        "domain",
        "work_type",
        "city",
        "stipend_display",
        "is_unpaid",
        "source",
        "deadline",
        "posted_at",
        "is_active",
        "views_count",
    )
    list_filter = (
        "domain",
        "work_type",
        "is_unpaid",
        "is_active",
        "source",
    )
    search_fields = ("title", "company", "city", "description")
    date_hierarchy = "posted_at"
    ordering = ("-posted_at",)
    readonly_fields = ("id", "views_count", "created_at", "updated_at")
    actions = [make_active, make_inactive]
    autocomplete_fields = ("source",)
    list_select_related = ("source",)

    fieldsets = (
        (
            "Role",
            {
                "fields": (
                    "title",
                    "company",
                    "company_logo_url",
                    "domain",
                    "description",
                    "requirements",
                )
            },
        ),
        (
            "Location & work type",
            {"fields": ("location", "city", "work_type")},
        ),
        (
            "Duration & stipend",
            {
                "fields": (
                    "duration",
                    "duration_months",
                    "is_unpaid",
                    "stipend_min",
                    "stipend_max",
                    "stipend_display",
                ),
                "description": (
                    "Stipend display text is generated automatically from "
                    "min/max (or set to \"Unpaid\") if left blank."
                ),
            },
        ),
        (
            "Skills & perks",
            {
                "fields": ("skills_required", "perks"),
                "description": (
                    "JSON lists of strings, e.g. [\"Python\", \"Django\", \"SQL\"]."
                ),
            },
        ),
        (
            "Source & application",
            {
                "fields": ("source", "source_job_id", "apply_link"),
                "description": (
                    "Leave Source job ID blank for a manually-curated listing — "
                    "one is generated automatically on save."
                ),
            },
        ),
        (
            "Timing & status",
            {"fields": ("posted_at", "deadline", "is_active")},
        ),
        (
            "System",
            {"fields": ("id", "views_count", "created_at", "updated_at"), "classes": ("collapse",)},
        ),
    )
