from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import override_settings
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from .models import Internship, InternshipSource

User = get_user_model()

# InternshipViewSet.list is decorated with cache_page, which uses whatever
# CACHES["default"] is configured — Redis in dev/prod. Tests don't have a
# live Redis server, so swap in an in-memory cache purely for these tests;
# this exercises the exact same caching code path without depending on an
# external service.
TEST_CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
}


def make_internship(source, **overrides):
    defaults = dict(
        title="Backend Developer Intern",
        company="Acme Corp",
        location="Bangalore, India",
        city="Bangalore",
        work_type=Internship.WorkType.REMOTE,
        domain=Internship.Domain.TECH,
        duration="3 Months",
        duration_months=3,
        stipend_min=10000,
        stipend_max=20000,
        stipend_display="₹10,000 - ₹20,000",
        is_unpaid=False,
        skills_required=["Python", "Django"],
        description="Great internship",
        requirements="Final year students",
        perks=["Certificate", "LOR"],
        apply_link="https://example.com/apply",
        source=source,
        source_job_id="job-1",
        deadline=date.today() + timedelta(days=10),
        posted_at=timezone.now(),
        is_active=True,
    )
    defaults.update(overrides)
    return Internship.objects.create(**defaults)


class InternshipModelTests(APITestCase):
    def test_unique_together_source_and_source_job_id(self):
        source = InternshipSource.objects.create(name="Internshala")
        make_internship(source, source_job_id="abc123")

        with self.assertRaises(Exception):
            make_internship(source, source_job_id="abc123", title="Duplicate")

    def test_blank_source_job_id_is_auto_generated(self):
        source = InternshipSource.objects.create(name="Manual Entries")
        internship = Internship.objects.create(
            title="Marketing Intern",
            company="Acme Corp",
            location="Remote",
            city="Remote",
            work_type=Internship.WorkType.REMOTE,
            domain=Internship.Domain.MARKETING,
            apply_link="https://example.com/apply",
            source=source,
            # source_job_id intentionally omitted
        )
        self.assertTrue(internship.source_job_id.startswith("manual-"))
        self.assertTrue(len(internship.source_job_id) > len("manual-"))

    def test_two_manual_entries_for_same_source_dont_collide(self):
        source = InternshipSource.objects.create(name="Manual Entries")
        first = Internship.objects.create(
            title="Intern A", company="A", location="Remote", city="Remote",
            work_type=Internship.WorkType.REMOTE, domain=Internship.Domain.TECH,
            apply_link="https://example.com/a", source=source,
        )
        second = Internship.objects.create(
            title="Intern B", company="B", location="Remote", city="Remote",
            work_type=Internship.WorkType.REMOTE, domain=Internship.Domain.TECH,
            apply_link="https://example.com/b", source=source,
        )
        self.assertNotEqual(first.source_job_id, second.source_job_id)

    def test_blank_stipend_display_auto_generated_from_min_max(self):
        source = InternshipSource.objects.create(name="Manual Entries")
        internship = Internship.objects.create(
            title="Design Intern", company="Acme", location="Remote", city="Remote",
            work_type=Internship.WorkType.REMOTE, domain=Internship.Domain.DESIGN,
            apply_link="https://example.com/apply", source=source,
            stipend_min=8000, stipend_max=15000,
        )
        self.assertEqual(internship.stipend_display, "₹8,000 - ₹15,000")

    def test_blank_stipend_display_defaults_to_unpaid(self):
        source = InternshipSource.objects.create(name="Manual Entries")
        internship = Internship.objects.create(
            title="NGO Intern", company="Acme", location="Remote", city="Remote",
            work_type=Internship.WorkType.REMOTE, domain=Internship.Domain.OPERATIONS,
            apply_link="https://example.com/apply", source=source,
            is_unpaid=True,
        )
        self.assertEqual(internship.stipend_display, "Unpaid")

    def test_posted_at_defaults_to_now(self):
        source = InternshipSource.objects.create(name="Manual Entries")
        internship = Internship.objects.create(
            title="Ops Intern", company="Acme", location="Remote", city="Remote",
            work_type=Internship.WorkType.REMOTE, domain=Internship.Domain.OPERATIONS,
            apply_link="https://example.com/apply", source=source,
        )
        self.assertIsNotNone(internship.posted_at)
        self.assertLessEqual(
            (timezone.now() - internship.posted_at).total_seconds(), 5
        )


@override_settings(CACHES=TEST_CACHES)
class InternshipListFilterTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.source_a = InternshipSource.objects.create(name="Internshala")
        self.source_b = InternshipSource.objects.create(name="Unstop")

        self.remote_tech = make_internship(
            self.source_a,
            title="Backend Dev Intern",
            company="Acme",
            city="Bangalore",
            work_type=Internship.WorkType.REMOTE,
            domain=Internship.Domain.TECH,
            skills_required=["Python", "Django", "PostgreSQL"],
            stipend_min=15000,
            stipend_max=25000,
            source_job_id="1",
        )
        self.onsite_marketing = make_internship(
            self.source_b,
            title="Marketing Intern",
            company="Brandify",
            city="Mumbai",
            work_type=Internship.WorkType.ONSITE,
            domain=Internship.Domain.MARKETING,
            skills_required=["SEO", "Content Writing"],
            stipend_min=5000,
            stipend_max=10000,
            is_unpaid=False,
            source_job_id="2",
        )
        self.unpaid_design = make_internship(
            self.source_a,
            title="UI/UX Design Intern",
            company="Designify",
            city="Bangalore",
            work_type=Internship.WorkType.HYBRID,
            domain=Internship.Domain.DESIGN,
            skills_required=["Figma", "Python"],
            stipend_min=0,
            stipend_max=0,
            is_unpaid=True,
            source_job_id="3",
        )
        self.inactive = make_internship(
            self.source_a,
            title="Inactive Intern",
            is_active=False,
            source_job_id="4",
        )

        self.user = User.objects.create_user(
            username="lister", email="lister@example.com", password="StrongPass123!"
        )
        self.client.force_authenticate(self.user)
        self.list_url = reverse("internships:list")

    def test_list_excludes_inactive(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data["results"]]
        self.assertNotIn("Inactive Intern", titles)
        self.assertEqual(len(titles), 3)
        self.assertIn("apply_link", response.data["results"][0])

    def test_list_is_public(self):
        self.client.force_authenticate(None)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 3)

    def test_filter_by_domain(self):
        response = self.client.get(self.list_url, {"domain": "tech"})
        titles = [item["title"] for item in response.data["results"]]
        self.assertEqual(titles, ["Backend Dev Intern"])

    def test_filter_by_multiple_work_types(self):
        response = self.client.get(self.list_url, {"work_type": ["remote", "hybrid"]})
        titles = {item["title"] for item in response.data["results"]}
        self.assertEqual(titles, {"Backend Dev Intern", "UI/UX Design Intern"})

    def test_filter_by_city_csv(self):
        response = self.client.get(self.list_url, {"city": "Bangalore,Mumbai"})
        self.assertEqual(len(response.data["results"]), 3)

    def test_filter_by_stipend_min_gte(self):
        response = self.client.get(self.list_url, {"stipend_min": 10000})
        titles = [item["title"] for item in response.data["results"]]
        self.assertEqual(titles, ["Backend Dev Intern"])

    def test_filter_by_is_unpaid(self):
        response = self.client.get(self.list_url, {"is_unpaid": True})
        titles = [item["title"] for item in response.data["results"]]
        self.assertEqual(titles, ["UI/UX Design Intern"])

    def test_filter_by_skills_overlap(self):
        response = self.client.get(self.list_url, {"skills": "Python"})
        titles = {item["title"] for item in response.data["results"]}
        self.assertEqual(titles, {"Backend Dev Intern", "UI/UX Design Intern"})

    def test_filter_by_source_name(self):
        response = self.client.get(self.list_url, {"source__name": "Unstop"})
        titles = [item["title"] for item in response.data["results"]]
        self.assertEqual(titles, ["Marketing Intern"])

    def test_search_by_title(self):
        response = self.client.get(self.list_url, {"search": "Marketing"})
        titles = [item["title"] for item in response.data["results"]]
        self.assertEqual(titles, ["Marketing Intern"])

    def test_ordering_by_stipend_max_descending(self):
        response = self.client.get(self.list_url, {"ordering": "-stipend_max"})
        titles = [item["title"] for item in response.data["results"]]
        # remote_tech=25000, onsite_marketing=10000, unpaid_design=0
        self.assertEqual(
            titles, ["Backend Dev Intern", "Marketing Intern", "UI/UX Design Intern"]
        )

    def test_ordering_by_deadline_ascending(self):
        response = self.client.get(self.list_url, {"ordering": "deadline"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_list_response_is_cached(self):
        response1 = self.client.get(self.list_url)
        self.assertEqual(response1.status_code, status.HTTP_200_OK)

        # Deactivate an internship that was in the first response; a cached
        # response should still include it since the cache hasn't expired.
        self.remote_tech.is_active = False
        self.remote_tech.save()

        response2 = self.client.get(self.list_url)
        titles = [item["title"] for item in response2.data["results"]]
        self.assertIn("Backend Dev Intern", titles)


@override_settings(CACHES=TEST_CACHES)
class InternshipDetailTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.source = InternshipSource.objects.create(name="Internshala")
        self.internship = make_internship(self.source, source_job_id="detail-1")
        self.user = User.objects.create_user(
            username="viewer", email="viewer@example.com", password="StrongPass123!"
        )
        self.client.force_authenticate(self.user)
        self.detail_url = reverse("internships:detail", args=[self.internship.id])

    def test_retrieve_increments_views_count(self):
        self.assertEqual(self.internship.views_count, 0)

        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["views_count"], 1)

        response2 = self.client.get(self.detail_url)
        self.assertEqual(response2.data["views_count"], 2)

    def test_retrieve_includes_full_detail_fields(self):
        response = self.client.get(self.detail_url)
        self.assertIn("description", response.data)
        self.assertIn("requirements", response.data)
        self.assertIn("source", response.data)
        self.assertEqual(response.data["source"]["name"], "Internshala")

    def test_retrieve_is_public(self):
        self.client.force_authenticate(None)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class FeaturedInternshipsTests(APITestCase):
    def setUp(self):
        self.source = InternshipSource.objects.create(name="Internshala")
        for i in range(8):
            make_internship(
                self.source,
                title=f"Intern {i}",
                source_job_id=f"featured-{i}",
                posted_at=timezone.now() - timedelta(minutes=i),
            )

    def test_featured_returns_6_latest_without_auth(self):
        response = self.client.get(reverse("internships:featured"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 6)
        self.assertEqual(response.data[0]["title"], "Intern 0")


class RecommendedInternshipsTests(APITestCase):
    def setUp(self):
        self.source = InternshipSource.objects.create(name="Internshala")
        self.matching = make_internship(
            self.source,
            title="Python Django Intern",
            domain=Internship.Domain.TECH,
            skills_required=["Python", "Django", "REST"],
            source_job_id="match-1",
        )
        self.non_matching = make_internship(
            self.source,
            title="Sales Intern",
            domain=Internship.Domain.SALES,
            skills_required=["Cold Calling"],
            source_job_id="match-2",
        )

        self.user = User.objects.create_user(
            username="recuser", email="rec@example.com", password="StrongPass123!"
        )
        self.user.profile.skills = ["python", "django"]
        self.user.profile.preferred_domains = ["tech"]
        self.user.profile.save()

    def test_recommended_requires_authentication(self):
        response = self.client.get(reverse("internships:recommended"))
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_recommended_prioritizes_skill_and_domain_match(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("internships:recommended"))

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["title"] for item in response.data]
        self.assertEqual(titles[0], "Python Django Intern")

    def test_recommended_pads_with_fallback_up_to_8(self):
        self.client.force_authenticate(self.user)
        response = self.client.get(reverse("internships:recommended"))
        # Only 2 internships exist total, so we get at most 2 back.
        self.assertLessEqual(len(response.data), 2)


class InternshipSourceListTests(APITestCase):
    def setUp(self):
        self.source_a = InternshipSource.objects.create(name="Internshala")
        self.source_b = InternshipSource.objects.create(name="Unstop")
        make_internship(self.source_a, source_job_id="s1")
        make_internship(self.source_a, source_job_id="s2")

    def test_sources_list_includes_counts_no_auth_required(self):
        response = self.client.get(reverse("internships:sources"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        by_name = {item["name"]: item for item in response.data}
        self.assertEqual(by_name["Internshala"]["active_internships_count"], 2)
        self.assertEqual(by_name["Unstop"]["active_internships_count"], 0)


class DomainAndSkillsListTests(APITestCase):
    def setUp(self):
        self.source = InternshipSource.objects.create(name="Internshala")
        make_internship(
            self.source,
            domain=Internship.Domain.TECH,
            skills_required=["Python", "Django"],
            source_job_id="d1",
        )
        make_internship(
            self.source,
            domain=Internship.Domain.TECH,
            skills_required=["Python", "SQL"],
            source_job_id="d2",
        )
        make_internship(
            self.source,
            domain=Internship.Domain.DESIGN,
            skills_required=["Figma"],
            source_job_id="d3",
        )

    def test_domains_list_returns_counts_no_auth_required(self):
        response = self.client.get(reverse("internships:domains"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        by_value = {item["value"]: item for item in response.data}
        self.assertEqual(by_value["tech"]["count"], 2)
        self.assertEqual(by_value["design"]["count"], 1)
        self.assertEqual(by_value["sales"]["count"], 0)

    def test_skills_list_ranks_by_frequency_no_auth_required(self):
        response = self.client.get(reverse("internships:skills"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        by_skill = {item["skill"]: item["count"] for item in response.data}
        self.assertEqual(by_skill["Python"], 2)
        self.assertEqual(by_skill["Figma"], 1)
