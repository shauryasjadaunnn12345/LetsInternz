from django.contrib import admin

from .models import SavedFolder, SavedInternship


@admin.register(SavedInternship)
class SavedInternshipAdmin(admin.ModelAdmin):
    list_display = ("user", "internship", "folder", "saved_at")
    list_filter = ("folder",)
    search_fields = ("user__email", "internship__title", "internship__company")
    date_hierarchy = "saved_at"
    ordering = ("-saved_at",)
    list_select_related = ("user", "internship")


@admin.register(SavedFolder)
class SavedFolderAdmin(admin.ModelAdmin):
    list_display = ("name", "user", "created_at")
    search_fields = ("name", "user__email")
    ordering = ("user", "name")
