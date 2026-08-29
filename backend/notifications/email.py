"""
Transactional email for LetsInternz.

Sends go through Django's standard mail API (EmailMultiAlternatives +
settings.EMAIL_BACKEND) rather than boto3 directly — this keeps the same
call sites working whether EMAIL_BACKEND is the console backend (dev) or
django_ses.SESBackend (production), matching how config/settings/base.py is
already set up. config/aws.get_ses_client() remains available for any
future SES-specific need (e.g. bulk sends, custom headers) that doesn't fit
Django's abstraction.
"""

import logging
import os

from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

logger = logging.getLogger(__name__)

APP_URL = os.getenv("NEXT_PUBLIC_APP_URL") or getattr(settings, "APP_URL", "http://localhost:3000")

# Mirrors frontend/src/lib/constants.ts STATUS_META so status-update emails
# use the same color language as the dashboard.
_STATUS_COLORS = {
    "applied": {"bg": "#DBEAFE", "color": "#1D4ED8"},
    "under_review": {"bg": "#FEF9C3", "color": "#854D0E"},
    "interview": {"bg": "#EDE9FE", "color": "#6D28D9"},
    "offer_received": {"bg": "#CFFAFE", "color": "#0E7490"},
    "selected": {"bg": "#DCFCE7", "color": "#15803D"},
    "rejected": {"bg": "#FEE2E2", "color": "#B91C1C"},
}


def _user_display_name(user) -> str:
    profile = getattr(user, "profile", None)
    full_name = getattr(profile, "full_name", "") if profile else ""
    return full_name or user.username or user.email.split("@")[0]


def _send_html_email(*, subject: str, template_name: str, context: dict, to_email: str) -> None:
    context = {"app_url": APP_URL, **context}
    html_body = render_to_string(template_name, context)
    text_body = strip_tags(html_body)

    message = EmailMultiAlternatives(
        subject=subject,
        body=text_body,
        from_email=settings.DEFAULT_FROM_EMAIL,
        to=[to_email],
    )
    message.attach_alternative(html_body, "text/html")

    try:
        message.send(fail_silently=False)
    except Exception:
        # Email failures shouldn't break the request/task that triggered
        # them (e.g. a Celery deadline-reminder job processing many users).
        logger.exception("Failed to send email %r to %s", template_name, to_email)


def send_deadline_reminder(user, internship) -> None:
    """Send 'Deadline in {N} days: {title} at {company}'."""
    days_left = (internship.deadline - timezone.localdate()).days if internship.deadline else 0

    subject = f"Deadline in {days_left} day{'s' if days_left != 1 else ''}: {internship.title} at {internship.company}"

    _send_html_email(
        subject=subject,
        template_name="email/deadline_reminder.html",
        context={
            "user_display_name": _user_display_name(user),
            "internship": internship,
            "days_left": days_left,
        },
        to_email=user.email,
    )


def send_welcome_email(user) -> None:
    """Send the welcome + onboarding-tips email after registration."""
    _send_html_email(
        subject="Welcome to LetsInternz \U0001F44B",
        template_name="email/welcome.html",
        context={"user_display_name": _user_display_name(user)},
        to_email=user.email,
    )


def send_application_update(user, application) -> None:
    """Send 'Your application status updated to {status}'."""
    status_label = application.get_status_display()
    colors = _STATUS_COLORS.get(application.status, {"bg": "#E4E4E7", "color": "#16213E"})

    _send_html_email(
        subject=f"Your application status updated to {status_label}",
        template_name="email/application_update.html",
        context={
            "user_display_name": _user_display_name(user),
            "application": application,
            "status_label": status_label,
            "status_bg": colors["bg"],
            "status_color": colors["color"],
        },
        to_email=user.email,
    )
