"""
Development settings for the LetsInternz backend.

Can use PostgreSQL (if DATABASE_URL is set) or SQLite (for offline dev).
Email is printed to console unless SMTP credentials are in .env.
"""

import dj_database_url
from .base import *  # noqa: F401,F403
from .base import BASE_DIR

DEBUG = True

ALLOWED_HOSTS = ["*"]

# PostgreSQL via DATABASE_URL (e.g. Supabase), or SQLite for offline dev
if os.getenv("DATABASE_URL"):
    DATABASES = {"default": dj_database_url.config(default=os.getenv("DATABASE_URL"), conn_max_age=600)}
else:
    DATABASES = {
        "default": {
            "ENGINE": "django.db.backends.sqlite3",
            "NAME": BASE_DIR / "db.sqlite3",
        }
    }

# SMTP credentials can be supplied in .env to send real OTP emails during
# development; otherwise the app falls back to the console backend.
if os.getenv("EMAIL_HOST") and os.getenv("EMAIL_HOST_USER") and os.getenv("EMAIL_HOST_PASSWORD"):
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"

# Media served from local disk in development regardless of AWS env vars.
STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
MEDIA_URL = "media/"

# Relaxed CORS for local frontend dev server.
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Cookies don't need to be secure over local HTTP.
SESSION_COOKIE_SECURE = False
CSRF_COOKIE_SECURE = False

# In-memory cache instead of Redis — `cache_page` on the internships list
# endpoint (see internships/views.py) needs *some* working cache backend to
# avoid a hard 500 on every request, and requiring a separately-running
# Redis server just to use `manage.py runserver` directly (i.e. without
# docker-compose, which does provide one) is unnecessary friction for local
# dev. This still exercises the same caching code path — just per-process
# rather than shared across processes, which doesn't matter for a single
# dev server. Celery's REDIS_URL (base.py) is untouched, since local task
# queuing isn't needed for the web server itself to come up correctly.
CACHES = {
    "default": {"BACKEND": "django.core.cache.backends.locmem.LocMemCache"}
}
