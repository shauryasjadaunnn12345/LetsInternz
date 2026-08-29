from django.contrib import admin

from .models import Application


@admin.register(Application)
class ApplicationAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "role_display",
        "company_display",
        "status",
        "applied_at",
        "reminder_date",
    )
    list_filter = ("status",)
    search_fields = (
        "user__email",
        "manual_company",
        "manual_role",
        "internship__title",
        "internship__company",
    )
    date_hierarchy = "applied_at"
    ordering = ("-applied_at",)
    readonly_fields = ("id", "applied_at", "updated_at")
    list_select_related = ("user", "internship")

    @admin.display(description="Role")
    def role_display(self, obj):
        return obj.role_display

    @admin.display(description="Company")
    def company_display(self, obj):
        return obj.company_display
