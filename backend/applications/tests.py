from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from internships.models import Internship, InternshipSource

from .models import Application

User = get_user_model()


def make_internship(source, **overrides):
    defaults = dict(
        title="Backend Developer Intern",
        company="Acme Corp",
        location="Bangalore, India",
        city="Bangalore",
        work_type=Internship.WorkType.REMOTE,
        domain=Internship.Domain.TECH,
        stipend_display="₹10,000 - ₹20,000",
        apply_link="https://example.com/apply",
        source=source,
        source_job_id="job-1",
        posted_at=timezone.now(),
        is_active=True,
    )
    defaults.update(overrides)
    return Internship.objects.create(**defaults)


class ApplicationTestBase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="applicant", email="applicant@example.com", password="StrongPass123!"
        )
        self.other_user = User.objects.create_user(
            username="other", email="other@example.com", password="StrongPass123!"
        )
        self.client.force_authenticate(self.user)

        self.source = InternshipSource.objects.create(name="Internshala")
        self.internship = make_internship(self.source)

        self.list_url = reverse("applications:application-list")
        self.stats_url = reverse("applications:stats")


class ApplicationCreateTests(ApplicationTestBase):
    def test_create_linked_to_internship(self):
        response = self.client.post(self.list_url, {"internship_id": str(self.internship.id)})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["company"], "Acme Corp")
        self.assertEqual(response.data["status"], "applied")

        application = Application.objects.get()
        self.assertEqual(application.user, self.user)
        self.assertEqual(application.internship, self.internship)

    def test_create_manual_entry(self):
        payload = {
            "manual_company": "Startup XYZ",
            "manual_role": "Growth Intern",
            "manual_apply_link": "https://startupxyz.com/careers",
            "manual_stipend": "₹15,000/month",
        }
        response = self.client.post(self.list_url, payload)

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["company"], "Startup XYZ")
        self.assertEqual(response.data["role"], "Growth Intern")
        self.assertEqual(response.data["stipend_display"], "₹15,000/month")
        self.assertIsNone(response.data["internship"])

    def test_stipend_display_uses_linked_internship_when_present(self):
        response = self.client.post(self.list_url, {"internship_id": str(self.internship.id)})
        self.assertEqual(response.data["stipend_display"], self.internship.stipend_display)

    def test_create_requires_internship_or_manual_fields(self):
        response = self.client.post(self.list_url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_assigns_current_user(self):
        self.client.post(self.list_url, {"internship_id": str(self.internship.id)})
        application = Application.objects.get()
        self.assertEqual(application.user, self.user)


class ApplicationListTests(ApplicationTestBase):
    def setUp(self):
        super().setUp()
        self.app1 = Application.objects.create(
            user=self.user, internship=self.internship, status=Application.Status.APPLIED
        )
        self.app2 = Application.objects.create(
            user=self.user,
            manual_company="Beta Inc",
            manual_role="Design Intern",
            status=Application.Status.INTERVIEW,
        )
        # Belongs to a different user — must never show up in self.user's list.
        Application.objects.create(
            user=self.other_user,
            manual_company="Hidden Co",
            manual_role="Hidden Role",
            status=Application.Status.APPLIED,
        )

    def test_list_only_returns_current_users_applications(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        companies = {item["company"] for item in response.data["results"]}
        self.assertEqual(companies, {"Acme Corp", "Beta Inc"})

    def test_list_filter_by_status(self):
        response = self.client.get(self.list_url, {"status": "interview"})
        companies = [item["company"] for item in response.data["results"]]
        self.assertEqual(companies, ["Beta Inc"])

    def test_list_search(self):
        response = self.client.get(self.list_url, {"search": "Beta"})
        companies = [item["company"] for item in response.data["results"]]
        self.assertEqual(companies, ["Beta Inc"])

    def test_list_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class ApplicationUpdateDeleteTests(ApplicationTestBase):
    def setUp(self):
        super().setUp()
        self.application = Application.objects.create(
            user=self.user, internship=self.internship, status=Application.Status.APPLIED
        )
        self.detail_url = reverse(
            "applications:application-detail", args=[self.application.id]
        )

    def test_update_status_and_notes(self):
        response = self.client.patch(
            self.detail_url, {"status": "interview", "notes": "Call scheduled Friday"}
        )

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["status"], "interview")
        self.assertEqual(response.data["notes"], "Call scheduled Friday")

        self.application.refresh_from_db()
        self.assertEqual(self.application.status, Application.Status.INTERVIEW)

    def test_cannot_access_another_users_application(self):
        self.client.force_authenticate(self.other_user)
        response = self.client.get(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_destroy_deletes_application(self):
        response = self.client.delete(self.detail_url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Application.objects.filter(id=self.application.id).exists())


class ApplicationStatsTests(ApplicationTestBase):
    def setUp(self):
        super().setUp()
        Application.objects.create(
            user=self.user, internship=self.internship, status=Application.Status.APPLIED
        )
        Application.objects.create(
            user=self.user,
            manual_company="B",
            manual_role="R",
            status=Application.Status.APPLIED,
        )
        Application.objects.create(
            user=self.user,
            manual_company="C",
            manual_role="R",
            status=Application.Status.INTERVIEW,
        )
        # Different user — must not affect these stats.
        Application.objects.create(
            user=self.other_user,
            manual_company="D",
            manual_role="R",
            status=Application.Status.SELECTED,
        )

    def test_stats_returns_counts_by_status(self):
        response = self.client.get(self.stats_url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["applied"], 2)
        self.assertEqual(response.data["interview"], 1)
        self.assertEqual(response.data["selected"], 0)
        self.assertEqual(response.data["total"], 3)

    def test_stats_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.get(self.stats_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
