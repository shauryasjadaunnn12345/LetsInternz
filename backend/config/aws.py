"""
AWS integration helpers: boto3 clients for S3 and SES, plus utilities for
building consistently-organized S3 object keys.

Scope note: everyday resume/avatar uploads from authenticated users go
through Django's file storage abstraction (STORAGES / FileField on
users.models.Profile), which already uses S3Storage in production — see
config/settings/base.py and users/models.py. The boto3 clients and helpers
here are for lower-level use cases that don't go through a Django model
field:

- Company logo uploads from the scraper pipeline (internships are scraped
  and inserted directly via the ORM, not through a form/FileField, so their
  logos are fetched and pushed to S3 with a direct boto3 call instead).
- Transactional email via SES from notifications/email.py, for cases where
  Django's EMAIL_BACKEND abstraction (used for simple templated sends) isn't
  a fit — e.g. sends that need SES-specific features.
"""

import os
from datetime import datetime, timezone
from functools import lru_cache

import boto3
from django.conf import settings
from django.utils.text import slugify


@lru_cache(maxsize=1)
def get_s3_client():
    """Boto3 S3 client, credentialed from the same env vars Django's S3
    storage backend uses. Cached — boto3 clients are thread-safe and cheap
    to reuse, expensive to keep re-creating."""
    return boto3.client(
        "s3",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        region_name=settings.AWS_S3_REGION_NAME,
    )


@lru_cache(maxsize=1)
def get_ses_client():
    """Boto3 SES client for transactional email."""
    return boto3.client(
        "ses",
        aws_access_key_id=settings.AWS_ACCESS_KEY_ID or None,
        aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY or None,
        region_name=getattr(settings, "AWS_SES_REGION_NAME", settings.AWS_S3_REGION_NAME),
    )


# ---------------------------------------------------------------------------
# S3 key builders. Kept here as the single source of truth for upload paths
# so users/models.py (Django FileField uploads) and the scraper pipeline
# (direct boto3 uploads) can't drift apart from each other:
#
#   resumes/{user_id}/resume_{timestamp}.pdf
#   avatars/{user_id}/avatar_{timestamp}.jpg
#   logos/companies/{company_slug}.png
# ---------------------------------------------------------------------------


def _timestamp() -> int:
    return int(datetime.now(timezone.utc).timestamp())


def resume_key(user_id, filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower() or ".pdf"
    return f"resumes/{user_id}/resume_{_timestamp()}{ext}"


def avatar_key(user_id, filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower() or ".jpg"
    return f"avatars/{user_id}/avatar_{_timestamp()}{ext}"


def company_logo_key(company_name: str) -> str:
    return f"logos/companies/{slugify(company_name)}.png"


def s3_public_url(key: str) -> str:
    domain = settings.AWS_S3_CUSTOM_DOMAIN or f"{settings.AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com"
    return f"https://{domain}/{key}"


def upload_company_logo(company_name: str, image_bytes: bytes, content_type: str = "image/png") -> str:
    """Upload a scraped company logo directly to S3 and return its public
    URL. Called from the scraper pipeline — logos arrive as raw bytes
    fetched from the source platform, with no Django model field involved,
    so this bypasses the FileField/storage abstraction entirely."""
    if not settings.AWS_STORAGE_BUCKET_NAME:
        raise RuntimeError(
            "AWS_STORAGE_BUCKET_NAME is not configured — cannot upload company logo."
        )

    key = company_logo_key(company_name)
    get_s3_client().put_object(
        Bucket=settings.AWS_STORAGE_BUCKET_NAME,
        Key=key,
        Body=image_bytes,
        ContentType=content_type,
        CacheControl="max-age=86400",
    )
    return s3_public_url(key)
