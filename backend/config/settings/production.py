"""
Production settings for the LetsInternz backend.

PostgreSQL via DATABASE_URL, S3 for media, SES for email, and hardened
cookie/security settings. Assumes the app runs behind TLS (e.g. behind a
load balancer or reverse proxy terminating HTTPS).
"""

import os

import dj_database_url

from .base import *  # noqa: F401,F403
from .base import (
    AWS_ACCESS_KEY_ID,
    AWS_STORAGE_BUCKET_NAME,
    AWS_SECRET_ACCESS_KEY,
    MIDDLEWARE,
    env_list,
)

DEBUG = False

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "")
if not ALLOWED_HOSTS:
    raise RuntimeError(
        "ALLOWED_HOSTS must be set via env var when running with production settings."
    )


# ---------------------------------------------------------------------------
# Database — PostgreSQL via DATABASE_URL
# ---------------------------------------------------------------------------

DATABASE_URL = os.getenv("DATABASE_URL")
if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL must be set via env var when running with production settings."
    )

DATABASES = {"default": dj_database_url.config(default=DATABASE_URL, conn_max_age=600)}


# ---------------------------------------------------------------------------
# AWS S3 — media storage (recommended, not required)
#
# S3 costs pennies at low volume, but it's not mandatory: for a genuinely
# minimal-cost deploy (e.g. a single small VM with no AWS account at all),
# media falls back to local disk when S3 credentials aren't set, rather than
# refusing to start. Local disk works fine for a low-traffic single-instance
# deploy — the tradeoffs are no CDN, no automatic backup of uploaded files,
# and it won't survive a instance replacement, so move to S3 before scaling
# past one server.
# ---------------------------------------------------------------------------

import warnings

if AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME:
    STORAGES = {
        "default": {"BACKEND": "storages.backends.s3.S3Storage"},
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
    }
else:
    warnings.warn(
        "AWS S3 credentials not set — falling back to local disk storage for "
        "media in production. Fine for a single small instance; move to S3 "
        "(or another object store) before running multiple instances or at "
        "any real scale.",
        stacklevel=1,
    )
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "whitenoise.storage.CompressedStaticFilesStorage"},
    }

# Serve static files directly via whitenoise (sits right after SecurityMiddleware).
MIDDLEWARE = [MIDDLEWARE[0], "whitenoise.middleware.WhiteNoiseMiddleware", *MIDDLEWARE[1:]]


# ---------------------------------------------------------------------------
# Email — prefer SMTP when configured (Hostinger, Gmail, or similar),
# otherwise fall back to AWS SES as the production mail backend.
# ---------------------------------------------------------------------------

if os.getenv("EMAIL_HOST") and os.getenv("EMAIL_HOST_USER") and os.getenv("EMAIL_HOST_PASSWORD"):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django_ses.SESBackend"


# ---------------------------------------------------------------------------
# Security / secure cookies
# ---------------------------------------------------------------------------

SECURE_SSL_REDIRECT = True
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = False  # CSRF cookie must be readable by JS to set the header

SECURE_HSTS_SECONDS = 60 * 60 * 24 * 365  # 1 year
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = "DENY"

CORS_ALLOWED_ORIGINS = env_list("CORS_ALLOWED_ORIGINS", "")

CSRF_TRUSTED_ORIGINS = env_list("CSRF_TRUSTED_ORIGINS", "")

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "console": {
            "format": "%(asctime)s %(levelname)s %(name)s %(message)s",
        }
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "formatter": "console",
            "stream": "ext://sys.stdout",
        }
    },
    "root": {
        "handlers": ["console"],
        "level": "INFO",
    },
    "loggers": {
        "django.request": {
            "handlers": ["console"],
            "level": "ERROR",
            "propagate": False,
        },
    },
}


# ---------------------------------------------------------------------------
# Error tracking (optional — only enabled if SENTRY_DSN is set)
# ---------------------------------------------------------------------------

SENTRY_DSN = os.getenv("SENTRY_DSN")
if SENTRY_DSN:
    import sentry_sdk
    from sentry_sdk.integrations.django import DjangoIntegration

    sentry_sdk.init(
        dsn=SENTRY_DSN,
        integrations=[DjangoIntegration()],
        traces_sample_rate=float(os.getenv("SENTRY_TRACES_SAMPLE_RATE", "0.1")),
        send_default_pii=False,
    )
