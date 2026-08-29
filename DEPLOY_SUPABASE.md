# Using Supabase for the Database and File Storage

This swaps two pieces of infrastructure for Supabase, while keeping
everything else in the project exactly as it is:

- **Database** → Supabase's managed Postgres, instead of RDS or a
  self-hosted Postgres. Zero code changes — Supabase *is* Postgres, so
  `DATABASE_URL` just points there.
- **File storage** (resumes, avatars, company logos) → Supabase Storage,
  instead of AWS S3. Supabase Storage speaks the S3 API, and
  `django-storages` (already installed, already how the app talks to S3)
  can point at any S3-compatible endpoint — so this is a config change,
  not a code change either.

**What does *not* change:** Django's own JWT authentication
(`djangorestframework-simplejwt`), permissions, and views are untouched.
This guide does not use Supabase Auth or Supabase's client-side JS SDK —
the Django backend connects to Supabase's Postgres directly with a normal
database role, the same way it would connect to any other Postgres server.
That distinction matters for the Row Level Security section below.

---

## 1. Create the Supabase project

1. [supabase.com](https://supabase.com) → New project.
2. Pick a region close to your users/server (matching `AWS_S3_REGION_NAME`
   isn't required, but keeping the database and your app server in the same
   region minimizes latency).
3. Set a strong database password when prompted — you'll need it in step 2.
4. Wait for provisioning (a couple of minutes).

---

## 2. Get the database connection string

**Project → Connect** (or **Project Settings → Database**) shows several
connection string variants. This distinction matters for Django
specifically:

| Mode | Port | Use it? |
|---|---|---|
| **Session pooler** | 6543 (or shown in dashboard) | **Yes — use this one.** Supports the persistent, long-lived connections Django/Gunicorn workers hold open, and works over IPv4. |
| **Direct connection** | 5432 | Works too, but is IPv6-only by default on most Supabase projects — only use this if your server has IPv6 outbound, or Supabase has assigned your project an IPv4 direct address. |
| **Transaction pooler** | 6543 (pgbouncer, transaction mode) | **Don't use this for Django.** Transaction-mode pgbouncer doesn't support prepared statements, which Django's Postgres backend relies on — you'll hit intermittent errors under load. This mode is meant for serverless functions making one query per invocation, not a long-running app server. |

Copy the **Session pooler** connection string. It looks like:
```
postgresql://postgres.xxxxxxxxxxxx:[YOUR-PASSWORD]@aws-0-<region>.pooler.supabase.com:6543/postgres
```
Replace `[YOUR-PASSWORD]` with the database password from step 1 — this
becomes `DATABASE_URL` directly, no other changes needed since it's already
a standard `postgresql://` URL matching what
`config/settings/production.py` expects.

---

## 3. Create a storage bucket and get S3 credentials

### 3a. Create the bucket

**Storage** (left sidebar) → **New bucket**. One bucket is enough for
everything (resumes, avatars, company logos all live under different
prefixes within it, matching the paths `config/aws.py` already builds:
`resumes/{user_id}/...`, `avatars/{user_id}/...`, `logos/companies/...`).

- Name: `media`
- **Public bucket: ON.** This is what makes uploaded files viewable by
  URL without needing signed/expiring links — necessary for resume links,
  avatars, and logos to just work as plain `<img src>`/`<a href>` values,
  matching how the rest of the app already expects `company_logo_url` and
  `profile.resume`/`profile.avatar` to behave.

(You can do this via SQL instead — see §5 if you'd rather run it there.)

### 3b. Generate S3 access keys

**Project Settings → Storage** (or **Storage → Settings** depending on
your dashboard version) → **S3 Connection** → **New access key**. This
gives you three things:

- **Access key ID**
- **Secret access key** (shown once — copy it immediately)
- **Endpoint URL**, in the form:
  `https://<project-ref>.supabase.co/storage/v1/s3`
- **Region** — Supabase shows a region string here (commonly `us-east-1`
  or matching your project's region); use exactly what's shown, boto3
  requires *some* region value even though Supabase Storage doesn't
  partition by it the way AWS does.

Your `<project-ref>` is the same subdomain your Supabase project URL and
API URL use — visible at the top of **Project Settings → General**.

---

## 4. Map credentials to environment variables

Add these to `backend/.env` (or wherever you're setting production env
vars — see `DEPLOY.md`/`DEPLOY_MINIMAL.md` for where that is on EC2):

```bash
DJANGO_SETTINGS_MODULE=config.settings.production

# Database — Supabase session pooler connection string from §2
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:your-db-password@aws-0-ap-south-1.pooler.supabase.com:6543/postgres

# Storage — Supabase S3-compatible credentials from §3b
AWS_ACCESS_KEY_ID=<the access key ID from §3b>
AWS_SECRET_ACCESS_KEY=<the secret access key from §3b>
AWS_STORAGE_BUCKET_NAME=media
AWS_S3_REGION_NAME=<the region shown in §3b, e.g. us-east-1>
AWS_S3_ENDPOINT_URL=https://<project-ref>.supabase.co/storage/v1/s3
AWS_S3_ADDRESSING_STYLE=path

# Public URL prefix for uploaded files — note this is NOT the same as
# AWS_S3_ENDPOINT_URL above. The endpoint URL is the private API Django
# uploads *to*; this is the public URL browsers fetch files *from*.
AWS_S3_CUSTOM_DOMAIN=<project-ref>.supabase.co/storage/v1/object/public/media
```

That last variable is the one easiest to get wrong, so to be explicit:
if your project ref is `abcdefghijk` and your bucket is named `media`,
`AWS_S3_CUSTOM_DOMAIN` is exactly:
```
abcdefghijk.supabase.co/storage/v1/object/public/media
```
No `https://` prefix (that's added automatically), no trailing slash, and
it includes the bucket name as part of the path — unlike real AWS S3 where
the bucket name is the subdomain instead. This has been verified end-to-end
in this codebase: `config/settings/base.py` builds `MEDIA_URL` from this
value, and `django-storages`' `S3Storage.url()` uses it too, so both come
out as `https://abcdefghijk.supabase.co/storage/v1/object/public/media/resumes/42/resume_....pdf`
— a permanent public URL, not a signed/expiring one.

Everything else — `SECRET_KEY`, `ALLOWED_HOSTS`, `REDIS_URL`,
`CORS_ALLOWED_ORIGINS`, etc — is unchanged from `DEPLOY.md`/
`DEPLOY_MINIMAL.md`; Supabase only replaces the database and storage
variables above.

> Email (`AWS_SES_REGION_NAME`, `DEFAULT_FROM_EMAIL`) still needs real AWS
> credentials if you're using SES — Supabase doesn't provide email sending.
> If you're moving off AWS entirely, swap `EMAIL_BACKEND` in
> `config/settings/production.py` for an SMTP backend pointed at a
> provider like Resend or Brevo instead (see `DEPLOY_MINIMAL.md`'s Track B
> for the same note).

---

## 5. SQL to run in Supabase

Open **SQL Editor** in the Supabase dashboard and run this once. It only
covers the storage bucket — **your application tables (users, internships,
applications, saved, etc.) are not created by hand-written SQL**. They're
created by Django's own migrations in §6, which is the actual source of
truth for your schema; writing a parallel SQL schema here would risk it
drifting out of sync with the Django models over time.

```sql
-- Create the bucket (skip this if you already created it via the
-- dashboard in §3a — this does the same thing, so don't run both).
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do update set public = true;

-- Explicit public-read policy. Marking the bucket "public" above already
-- makes reads work, but an explicit policy is what Supabase's own
-- dashboard generates by default for a public bucket, and makes the
-- read permission visible/auditable in the Storage → Policies tab rather
-- than being an implicit side effect of the bucket flag alone.
create policy "Public read access for media bucket"
on storage.objects for select
to public
using (bucket_id = 'media');
```

**Why there's no `INSERT`/`UPDATE`/`DELETE` policy here:** uploads from
Django go through the S3 access key from §3b, not through Supabase's
`anon`/`authenticated` client roles — S3-credentialed requests operate at
the storage-API level and aren't subject to these `storage.objects` RLS
policies the way requests from Supabase's client SDKs are. The policy
above only needs to cover reads, since that's the one path (a browser
directly fetching a file URL) that isn't going through your Django app.

**Why there's no RLS on your actual app tables:** Django connects to
Postgres with the `postgres` role (or whichever role owns the connection
string from §2), which has full table access by default — same as
connecting to any other Postgres server. Row Level Security in Supabase
exists to protect data from Supabase's own `anon`/`authenticated` API
roles, used when a client-side app talks to Supabase directly. Nothing in
this project does that; every request goes through Django's own
`IsAuthenticated`/permission-class checks first. Enabling RLS on
`users_user`, `internships_internship`, etc. would do nothing for you here
except add confusion — leave it off unless you later add a second,
Supabase-native client that queries these tables directly.

---

## 6. Run migrations and verify

```bash
cd backend
source venv/bin/activate
pip install -r requirements/production.txt

python manage.py migrate
python manage.py createsuperuser
python manage.py seed_demo_data   # optional, for testing
```

This creates every table via Django's migrations — `users`, `internships`,
`applications`, `saved`, `django_celery_beat`'s tables, everything. If you
want to see the exact SQL Django is about to run before committing to it,
`python manage.py sqlmigrate <app> <migration_name>` prints it without
executing anything.

### Verify the storage path works end-to-end

```bash
DJANGO_SETTINGS_MODULE=config.settings.production python manage.py shell -c "
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
path = default_storage.save('resumes/test/smoke-test.txt', ContentFile(b'hello from supabase'))
print('Uploaded to:', path)
print('Public URL:', default_storage.url(path))
"
```
Then open the printed URL in a browser — you should see the file contents
directly, with no login prompt and no expiring signature in the URL. If you
get a 403 or "Object not found," the most common causes are: the bucket
isn't actually public (re-check §3a/§5), or `AWS_S3_CUSTOM_DOMAIN` doesn't
exactly match your project ref and bucket name (re-check §4).

Then confirm a real upload through the app itself works — log in, go to
the profile page, and upload a resume or avatar. It should appear
immediately at a Supabase-hosted URL.

---

## 7. Things worth knowing before you commit to this

- **Free tier connection limits.** Supabase's free tier caps concurrent
  direct database connections (commonly in the dozens, depending on
  current plan limits — check your project's current cap). The session
  pooler from §2 exists specifically to let more app-server connections
  share a smaller pool of real Postgres connections, so use it rather than
  the direct connection unless you have a specific reason not to.
- **Free tier project pausing.** Free Supabase projects are typically
  paused after a period of inactivity and need manual (or API-triggered)
  un-pausing — fine for a side project, worth automating or upgrading past
  if this becomes something people depend on daily.
- **Storage egress/size limits** apply on the free tier same as AWS S3
  would have its own costs at scale — check Supabase's current storage
  pricing if you expect meaningful resume/avatar volume.
- **This doesn't preclude the AWS S3 path.** `config/settings/base.py`'s
  storage config is fully generic now — set `AWS_S3_ENDPOINT_URL` and
  you're on Supabase (or R2, or Backblaze, or MinIO); leave it unset and
  you're on real AWS S3, exactly as before. Nothing about this change is
  Supabase-specific at the code level, only at the config level.
