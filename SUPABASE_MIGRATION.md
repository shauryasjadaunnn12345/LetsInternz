# Supabase PostgreSQL Migration Guide

## ✅ Backend Migration Completed

Your Django backend has been successfully configured to use **Supabase PostgreSQL** instead of SQLite.

### Changes Made

#### 1. **Requirements Updated** (`backend/requirements.txt`)
- Added `dj-database-url==2.1.0` for reliable DATABASE_URL parsing
- Already includes `psycopg2-binary==2.9.12` for PostgreSQL support

#### 2. **Settings Updated**

**`config/settings/development.py`**
- Now uses `DATABASE_URL` from `.env` if provided (Supabase PostgreSQL)
- Falls back to SQLite if `DATABASE_URL` is not set
- Imported `dj_database_url` for reliable URL parsing

**`config/settings/production.py`**
- Replaced regex-based URL parsing with `dj_database_url`
- Now handles passwords with special characters correctly
- Cleaner, more maintainable code

#### 3. **Environment Configuration** (`.env`)
Updated with Supabase connection string:
```
DATABASE_URL=postgresql://postgres:Shaurya12345%40%40%40%40@db.jlrwesfaoaznmpzpgjxk.supabase.co:5432/postgres
```

Note: The `@` symbols in the password are URL-encoded as `%40` to prevent parsing issues.

### Database Schema

✅ **All migrations applied successfully:**
- Django auth system
- Users (custom user model with profile, OTP, etc.)
- Internships
- Applications
- Saved (for bookmarks)
- Notifications
- Celery Beat (scheduled tasks)
- Token blacklist (JWT revocation)

Total: 50+ migrations applied to Supabase

### Connection Details

Your Supabase PostgreSQL Instance:
- **Host**: `db.jlrwesfaoaznmpzpgjxk.supabase.co`
- **Port**: `5432`
- **Database**: `postgres`
- **User**: `postgres`
- **Password**: `Shaurya12345@@@@` (4 @ symbols)

### API Keys for Supabase

**Anon Key** (for client-side requests):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impscndlc2Zhb2F6bm1wenBnanhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc5ODQyNTEsImV4cCI6MjEwMzU2MDI1MX0.dZ81ibgO6CuRNknSV9208sdLXmLZk3cId7T0YjDOlBE
```

**Service Role Key** (for server-side requests):
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impscndlc2Zhb2F6bm1wenBnanhrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4Nzk4NDI1MSwiZXhwIjoyMTAzNTYwMjUxfQ.XspKseDeRx2jp0_vj2L6GPIbS1JU_bInAnlTGU4Rz-k
```

## Running the Application

### Start the Django Development Server

```bash
cd backend
python manage.py runserver
```

The server will connect to your Supabase PostgreSQL database automatically.

### Create a Superuser

```bash
python manage.py createsuperuser
```

Then access Django admin at: `http://localhost:8000/admin/`

### Useful Commands

**Check database connection:**
```bash
python manage.py shell -c "from django.db import connection; print('Connected to:', connection.settings_dict['NAME'])"
```

**Run migrations:**
```bash
python manage.py migrate
```

**Create new migration after model changes:**
```bash
python manage.py makemigrations
python manage.py migrate
```

**Run tests:**
```bash
python manage.py test
```

## Important Notes

1. **Media Files**: Upload paths still default to local disk. To store media in Supabase Storage, update `AWS_STORAGE_BUCKET_NAME` in `.env` and configure Supabase Storage credentials.

2. **Email**: SMTP configuration is already set up for Hostinger. Verify in `.env`:
   - `EMAIL_HOST=smtp.hostinger.com`
   - `EMAIL_HOST_USER=help@letsinternz.com`
   - `EMAIL_HOST_PASSWORD=Shaurya12345@@@@`

3. **Google OAuth**: Already configured with your credentials in `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

4. **Database Backups**: Supabase automatically backs up your data. Access backups via the Supabase dashboard.

5. **Connection Pooling**: The Django configuration uses `conn_max_age=600` (10 minutes) for connection pooling.

## Troubleshooting

### Connection refused
- Verify Supabase project is running
- Check that your IP is allowed in Supabase firewall settings
- Verify `DATABASE_URL` is correctly set in `.env`

### Django check errors
- Run `python manage.py check` to identify any configuration issues
- Ensure `DJANGO_SETTINGS_MODULE=config.settings.development` is set

### Migration conflicts
- If migrations fail, check Supabase dashboard for table locks
- Use `python manage.py showmigrations` to see migration status

## Next Steps

1. ✅ Backend is now using Supabase PostgreSQL
2. ✅ Frontend is already configured to use the backend API
3. Test the full auth flow:
   - Sign up with email/OTP
   - Login with email/password
   - Login with Google
   - Edit profile and verify data persists

4. Deploy to production:
   - Set `DJANGO_SETTINGS_MODULE=config.settings.production`
   - Set all required environment variables
   - Configure allowed hosts and CORS origins
   - Consider setting up S3 for media storage (optional)

---

**Configuration Date**: 2026-08-29
**Database**: Supabase PostgreSQL
**Django Version**: 6.0.8
