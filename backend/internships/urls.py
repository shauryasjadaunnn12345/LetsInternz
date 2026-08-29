from django.urls import path

from .views import (
    DomainListView,
    FeaturedInternshipsView,
    InternshipSourceListView,
    InternshipViewSet,
    PopularSkillsView,
    RecommendedInternshipsView,
)

app_name = "internships"

internship_list = InternshipViewSet.as_view({"get": "list"})
internship_detail = InternshipViewSet.as_view({"get": "retrieve"})

urlpatterns = [
    # Specific routes must come before the `<uuid:id>/` detail route so they
    # aren't swallowed by it.
    path("recommended/", RecommendedInternshipsView.as_view(), name="recommended"),
    path("featured/", FeaturedInternshipsView.as_view(), name="featured"),
    path("sources/", InternshipSourceListView.as_view(), name="sources"),
    path("domains/", DomainListView.as_view(), name="domains"),
    path("skills/", PopularSkillsView.as_view(), name="skills"),
    path("<uuid:id>/", internship_detail, name="detail"),
    path("", internship_list, name="list"),
]
