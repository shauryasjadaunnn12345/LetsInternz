"""
Base settings for the LetsInternz backend.

Shared by every environment. Environment-specific settings
(development.py / production.py) import * from this module and override
or extend what they need.
"""

from datetime import timedelta
from pathlib import Path
import os

from dotenv import load_dotenv

# config/settings/base.py -> config/settings -> config -> backend
BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")


def env_bool(key, default=False):
    val = os.getenv(key)
    if val is None:
        return default
    return val.strip().lower() in ("1", "true", "yes", "on")


def env_list(key, default=""):
    val = os.getenv(key, default)
    return [item.strip() for item in val.split(",") if item.strip()]


# SECURITY WARNING: keep the secret key used in production secret!
SECRET_KEY = os.getenv("SECRET_KEY", "django-insecure-change-me-in-production")

DEBUG = False

ALLOWED_HOSTS = env_list("ALLOWED_HOSTS", "localhost,127.0.0.1")


# Application definition

DJANGO_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
]

THIRD_PARTY_APPS = [
    "rest_framework",
    "rest_framework_simplejwt",
    "rest_framework_simplejwt.token_blacklist",
    "corsheaders",
    "django_filters",
    "storages",
    "django_celery_beat",
    "django_extensions",
]

LOCAL_APPS = [
    "users",
    "internships",
    "applications",
    "saved",
    "scraper",
    "notifications",
]

INSTALLED_APPS = DJANGO_APPS + THIRD_PARTY_APPS + LOCAL_APPS

AUTH_USER_MODEL = "users.User"

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [BASE_DIR / "templates"],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"
ASGI_APPLICATION = "config.asgi.application"


# Password validation

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]


# Internationalization

LANGUAGE_CODE = "en-us"
TIME_ZONE = "Asia/Kolkata"
USE_I18N = True
USE_TZ = True


# Static & media files

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"

MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"


# ---------------------------------------------------------------------------
# AWS S3 (django-storages) — used for media in production, values sourced
# from env vars in every environment. development.py overrides STORAGES/
# MEDIA_URL back to local disk unconditionally, regardless of these being
# set, so it's always safe to develop locally without real AWS credentials.
# ---------------------------------------------------------------------------

AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
AWS_STORAGE_BUCKET_NAME = os.getenv("AWS_STORAGE_BUCKET_NAME", "")
AWS_S3_REGION_NAME = os.getenv("AWS_S3_REGION_NAME", "ap-south-1")

# Set to use any S3-compatible provider instead of real AWS S3 — Supabase
# Storage, Cloudflare R2, Backblaze B2, MinIO, etc. Left unset, boto3 talks
# to real AWS as normal. See DEPLOY_SUPABASE.md for the Supabase-specific
# values.
AWS_S3_ENDPOINT_URL = os.getenv("AWS_S3_ENDPOINT_URL") or None
# "path" is the safer default for non-AWS providers (virtual-hosted-style
# bucket subdomains often don't resolve correctly against a custom
# endpoint); real AWS works fine with "auto" too, so this only needs
# overriding when AWS_S3_ENDPOINT_URL is set.
AWS_S3_ADDRESSING_STYLE = os.getenv("AWS_S3_ADDRESSING_STYLE", "auto")

# A bucket's virtual-hosted-style domain is region-qualified for every
# region except us-east-1 (`{bucket}.s3.amazonaws.com` only resolves
# correctly there — everywhere else, including ap-south-1, it's
# `{bucket}.s3.{region}.amazonaws.com`). AWS_S3_CUSTOM_DOMAIN can be
# overridden via env (e.g. to point at a CloudFront distribution, or at a
# non-AWS provider's public object URL — see DEPLOY_SUPABASE.md);
# otherwise it's computed here assuming real AWS S3.
AWS_S3_CUSTOM_DOMAIN = os.getenv("AWS_S3_CUSTOM_DOMAIN") or (
    f"{AWS_STORAGE_BUCKET_NAME}.s3.amazonaws.com" if AWS_STORAGE_BUCKET_NAME else None
)
AWS_S3_FILE_OVERWRITE = False
AWS_DEFAULT_ACL = None
AWS_S3_OBJECT_PARAMETERS = {"CacheControl": "max-age=86400"}

_AWS_S3_CONFIGURED = bool(AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY and AWS_STORAGE_BUCKET_NAME)

if _AWS_S3_CONFIGURED:
    MEDIA_URL = f"https://{AWS_S3_CUSTOM_DOMAIN}/"
    # STORAGES (below) is what Django 5+/6 actually reads. DEFAULT_FILE_STORAGE
    # is the pre-4.2 setting name — Django 6 no longer reads it at all, but it's
    # set too for readability and for any third-party tooling that still
    # inspects it directly.
    DEFAULT_FILE_STORAGE = "storages.backends.s3.S3Storage"
    STORAGES = {
        "default": {"BACKEND": "storages.backends.s3.S3Storage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }
else:
    STORAGES = {
        "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
        "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
    }


# ---------------------------------------------------------------------------
# Django REST Framework
# ---------------------------------------------------------------------------

REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
        "rest_framework.authentication.SessionAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": (
        "rest_framework.permissions.IsAuthenticated",
    ),
    "DEFAULT_FILTER_BACKENDS": (
        "django_filters.rest_framework.DjangoFilterBackend",
        "rest_framework.filters.SearchFilter",
        "rest_framework.filters.OrderingFilter",
    ),
    "DEFAULT_PAGINATION_CLASS": "config.pagination.StandardPagination",
    "PAGE_SIZE": 20,
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(days=1),
    "REFRESH_TOKEN_LIFETIME": timedelta(days=30),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------

CORS_ALLOWED_ORIGINS = env_list(
    "CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000"
)
CORS_ALLOW_CREDENTIALS = True


# ---------------------------------------------------------------------------
# Celery (only if Redis is intentionally configured for task broker/result
# backend. The app does not require Redis for Django's cache or for the
# public internship API.
# ---------------------------------------------------------------------------

REDIS_URL = os.getenv("REDIS_URL")

CELERY_BROKER_URL = REDIS_URL or ""
CELERY_RESULT_BACKEND = REDIS_URL or ""
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"


# ---------------------------------------------------------------------------
# Cache
#
# Default to LocMemCache so Django cache_page() and other cache usage work
# without requiring a separate Redis service. A Redis cache is only used when
# explicitly enabled via CACHE_BACKEND=redis and REDIS_URL; otherwise we keep
# the app self-contained and safe in production.
# ---------------------------------------------------------------------------

CACHE_BACKEND = os.getenv("CACHE_BACKEND", "locmem").strip().lower()

if CACHE_BACKEND == "redis" and REDIS_URL:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.redis.RedisCache",
            "LOCATION": REDIS_URL,
        }
    }
else:
    CACHES = {
        "default": {
            "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
            "LOCATION": "letsinternz-cache",
        }
    }


# ---------------------------------------------------------------------------
# Email — SMTP is preferred when configured (for Hostinger/other providers),
# with AWS SES as a production fallback and a console backend for local dev.
# ---------------------------------------------------------------------------

DEFAULT_FROM_EMAIL = (os.getenv("DEFAULT_FROM_EMAIL") or "").strip()
EMAIL_HOST = (os.getenv("EMAIL_HOST") or "").strip()
EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
EMAIL_HOST_USER = (os.getenv("EMAIL_HOST_USER") or "").strip()
EMAIL_HOST_PASSWORD = (os.getenv("EMAIL_HOST_PASSWORD") or "").strip()
EMAIL_USE_TLS = env_bool("EMAIL_USE_TLS", True)
EMAIL_USE_SSL = env_bool("EMAIL_USE_SSL", False)
EMAIL_TIMEOUT = int(os.getenv("EMAIL_TIMEOUT", "30"))

# Many SMTP providers reject a different MAIL FROM than the authenticated account,
# even when the address is on the same domain. For hosted mailboxes like Hostinger,
# this must match the SMTP login address exactly.
if EMAIL_HOST and EMAIL_HOST_USER:
    DEFAULT_FROM_EMAIL = DEFAULT_FROM_EMAIL or EMAIL_HOST_USER
    if DEFAULT_FROM_EMAIL.lower() != EMAIL_HOST_USER.lower():
        DEFAULT_FROM_EMAIL = EMAIL_HOST_USER
else:
    DEFAULT_FROM_EMAIL = DEFAULT_FROM_EMAIL or "help@letsinternz.com"

if EMAIL_HOST and EMAIL_HOST_USER and EMAIL_HOST_PASSWORD:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

AWS_SES_REGION_NAME = os.getenv("AWS_SES_REGION_NAME", AWS_S3_REGION_NAME)
AWS_SES_REGION_ENDPOINT = os.getenv(
    "AWS_SES_REGION_ENDPOINT", f"email.{AWS_SES_REGION_NAME}.amazonaws.com"
)
