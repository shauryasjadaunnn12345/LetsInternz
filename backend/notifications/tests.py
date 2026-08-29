from datetime import date, timedelta

from django.contrib.auth import get_user_model
from django.core import mail
from django.test import TestCase
from django.utils import timezone

from applications.models import Application
from internships.models import Internship, InternshipSource
from notifications.email import (
    send_application_update,
    send_deadline_reminder,
    send_welcome_email,
)

User = get_user_model()


def make_internship(**overrides):
    source = InternshipSource.objects.create(name="Internshala")
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
        deadline=date.today() + timedelta(days=3),
        posted_at=timezone.now(),
    )
    defaults.update(overrides)
    return Internship.objects.create(**defaults)


class EmailTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username="emailuser", email="email@example.com", password="StrongPass123!"
        )
        self.user.profile.full_name = "Jamie Doe"
        self.user.profile.save()

    def test_send_deadline_reminder(self):
        internship = make_internship()

        send_deadline_reminder(self.user, internship)

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.to, ["email@example.com"])
        self.assertEqual(
            sent.subject, "Deadline in 3 days: Backend Developer Intern at Acme Corp"
        )
        html_body = sent.alternatives[0][0]
        self.assertIn("Jamie Doe", html_body)
        self.assertIn("Acme Corp", html_body)

    def test_send_deadline_reminder_singular_day(self):
        internship = make_internship(deadline=date.today() + timedelta(days=1))

        send_deadline_reminder(self.user, internship)

        self.assertEqual(mail.outbox[0].subject.split(":")[0], "Deadline in 1 day")

    def test_send_welcome_email(self):
        send_welcome_email(self.user)

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.to, ["email@example.com"])
        self.assertIn("Welcome to LetsInternz", sent.subject)
        self.assertIn("Jamie Doe", sent.alternatives[0][0])

    def test_send_application_update(self):
        internship = make_internship()
        application = Application.objects.create(
            user=self.user, internship=internship, status=Application.Status.INTERVIEW
        )

        send_application_update(self.user, application)

        self.assertEqual(len(mail.outbox), 1)
        sent = mail.outbox[0]
        self.assertEqual(sent.subject, "Your application status updated to Interview")
        html_body = sent.alternatives[0][0]
        self.assertIn("Backend Developer Intern", html_body)
        self.assertIn("Acme Corp", html_body)

    def test_falls_back_to_username_when_no_full_name(self):
        self.user.profile.full_name = ""
        self.user.profile.save()

        send_welcome_email(self.user)

        self.assertIn("emailuser", mail.outbox[0].alternatives[0][0])
