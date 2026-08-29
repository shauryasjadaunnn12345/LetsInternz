from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from internships.models import Internship, InternshipSource

from .models import SavedFolder, SavedInternship

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


class SavedTestBase(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="saver", email="saver@example.com", password="StrongPass123!"
        )
        self.other_user = User.objects.create_user(
            username="other", email="other@example.com", password="StrongPass123!"
        )
        self.client.force_authenticate(self.user)

        self.source = InternshipSource.objects.create(name="Internshala")
        self.internship = make_internship(self.source, source_job_id="job-1")
        self.internship2 = make_internship(
            self.source, title="Design Intern", source_job_id="job-2"
        )

        self.list_url = reverse("saved:saved-internship-list")


class SavedInternshipCreateTests(SavedTestBase):
    def test_save_internship(self):
        response = self.client.post(self.list_url, {"internship_id": str(self.internship.id)})

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["folder"], "All")
        self.assertTrue(
            SavedInternship.objects.filter(user=self.user, internship=self.internship).exists()
        )

    def test_save_internship_with_custom_folder(self):
        response = self.client.post(
            self.list_url,
            {"internship_id": str(self.internship.id), "folder": "Dream Jobs"},
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data["folder"], "Dream Jobs")

    def test_save_duplicate_rejected(self):
        SavedInternship.objects.create(user=self.user, internship=self.internship)
        response = self.client.post(self.list_url, {"internship_id": str(self.internship.id)})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_same_internship_can_be_saved_by_different_users(self):
        SavedInternship.objects.create(user=self.user, internship=self.internship)
        self.client.force_authenticate(self.other_user)
        response = self.client.post(self.list_url, {"internship_id": str(self.internship.id)})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class SavedInternshipListTests(SavedTestBase):
    def setUp(self):
        super().setUp()
        self.saved1 = SavedInternship.objects.create(
            user=self.user, internship=self.internship, folder="All"
        )
        self.saved2 = SavedInternship.objects.create(
            user=self.user, internship=self.internship2, folder="Dream Jobs"
        )
        # Different user — must not leak into self.user's list.
        SavedInternship.objects.create(user=self.other_user, internship=self.internship)

    def test_list_only_returns_current_users_saved(self):
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data["results"]), 2)

    def test_list_filter_by_folder(self):
        response = self.client.get(self.list_url, {"folder": "Dream Jobs"})
        titles = [item["internship"]["title"] for item in response.data["results"]]
        self.assertEqual(titles, ["Design Intern"])

    def test_list_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.get(self.list_url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SavedInternshipDestroyTests(SavedTestBase):
    def test_unsave_deletes_record(self):
        saved = SavedInternship.objects.create(user=self.user, internship=self.internship)
        url = reverse("saved:saved-internship-detail", args=[saved.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SavedInternship.objects.filter(id=saved.id).exists())

    def test_cannot_delete_another_users_saved_internship(self):
        saved = SavedInternship.objects.create(user=self.other_user, internship=self.internship)
        url = reverse("saved:saved-internship-detail", args=[saved.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)


class ToggleSaveTests(SavedTestBase):
    def test_toggle_saves_when_not_saved(self):
        url = reverse("saved:toggle", args=[self.internship.id])
        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"saved": True})
        self.assertTrue(
            SavedInternship.objects.filter(user=self.user, internship=self.internship).exists()
        )

    def test_toggle_unsaves_when_already_saved(self):
        SavedInternship.objects.create(user=self.user, internship=self.internship)
        url = reverse("saved:toggle", args=[self.internship.id])

        response = self.client.post(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, {"saved": False})
        self.assertFalse(
            SavedInternship.objects.filter(user=self.user, internship=self.internship).exists()
        )

    def test_toggle_nonexistent_internship_returns_404(self):
        import uuid

        url = reverse("saved:toggle", args=[uuid.uuid4()])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_toggle_requires_authentication(self):
        self.client.force_authenticate(None)
        url = reverse("saved:toggle", args=[self.internship.id])
        response = self.client.post(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class DeadlineAlertTests(SavedTestBase):
    def setUp(self):
        super().setUp()
        today = date.today()

        self.soon = make_internship(
            self.source,
            title="Deadline Soon",
            source_job_id="soon",
            deadline=today + timedelta(days=3),
        )
        self.very_soon = make_internship(
            self.source,
            title="Deadline Tomorrow",
            source_job_id="tomorrow",
            deadline=today + timedelta(days=1),
        )
        self.far = make_internship(
            self.source,
            title="Deadline Far",
            source_job_id="far",
            deadline=today + timedelta(days=30),
        )
        self.no_deadline = make_internship(
            self.source, title="No Deadline", source_job_id="none", deadline=None
        )
        self.expired = make_internship(
            self.source,
            title="Expired",
            source_job_id="expired",
            deadline=today - timedelta(days=1),
        )

        for internship in (self.soon, self.very_soon, self.far, self.no_deadline, self.expired):
            SavedInternship.objects.create(user=self.user, internship=internship)

        self.url = reverse("saved:deadline_alerts")

    def test_returns_only_internships_within_7_days_ordered_ascending(self):
        response = self.client.get(self.url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        titles = [item["internship"]["title"] for item in response.data]
        self.assertEqual(titles, ["Deadline Tomorrow", "Deadline Soon"])

    def test_requires_authentication(self):
        self.client.force_authenticate(None)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)


class SavedFolderTests(SavedTestBase):
    def setUp(self):
        super().setUp()
        self.folders_url = reverse("saved:saved-folder-list")

    def test_create_folder(self):
        response = self.client.post(self.folders_url, {"name": "Dream Jobs"})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(SavedFolder.objects.filter(user=self.user, name="Dream Jobs").exists())

    def test_list_only_returns_current_users_folders(self):
        SavedFolder.objects.create(user=self.user, name="Mine")
        SavedFolder.objects.create(user=self.other_user, name="NotMine")

        response = self.client.get(self.folders_url)
        names = [item["name"] for item in response.data["results"]]
        self.assertEqual(names, ["Mine"])

    def test_delete_folder(self):
        folder = SavedFolder.objects.create(user=self.user, name="ToDelete")
        url = reverse("saved:saved-folder-detail", args=[folder.id])

        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(SavedFolder.objects.filter(id=folder.id).exists())
