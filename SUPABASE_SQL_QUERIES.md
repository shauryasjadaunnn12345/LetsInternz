# Supabase SQL Queries Reference

## Useful SQL Queries for Your LetsInternz Database

### User Management

**View all users:**
```sql
SELECT id, email, username, is_active, created_at FROM auth_user;
```

**Count users:**
```sql
SELECT COUNT(*) as total_users FROM auth_user;
```

**Find user by email:**
```sql
SELECT * FROM auth_user WHERE email = 'user@example.com';
```

**Activate an inactive user:**
```sql
UPDATE auth_user SET is_active = true WHERE email = 'user@example.com';
```

**View user profiles with completion status:**
```sql
SELECT 
    u.id,
    u.email,
    u.username,
    p.full_name,
    p.profile_completion,
    p.college,
    p.phone
FROM auth_user u
LEFT JOIN users_profile p ON u.id = p.user_id
ORDER BY u.created_at DESC;
```

### Profile Statistics

**Profile completion distribution:**
```sql
SELECT 
    CASE 
        WHEN profile_completion = 0 THEN '0% (Empty)'
        WHEN profile_completion < 25 THEN '1-25% (Minimal)'
        WHEN profile_completion < 50 THEN '25-50% (Basic)'
        WHEN profile_completion < 75 THEN '50-75% (Good)'
        ELSE '75-100% (Complete)'
    END as completion_range,
    COUNT(*) as user_count,
    ROUND(AVG(profile_completion), 1) as avg_completion
FROM users_profile
GROUP BY completion_range
ORDER BY AVG(profile_completion);
```

**Most popular colleges:**
```sql
SELECT college, COUNT(*) as user_count
FROM users_profile
WHERE college != ''
GROUP BY college
ORDER BY user_count DESC
LIMIT 10;
```

**Most popular skills:**
```sql
SELECT 
    skill,
    COUNT(*) as skill_count
FROM users_profile,
LATERAL jsonb_array_elements_text(skills) as skill
WHERE skills != '[]'::jsonb
GROUP BY skill
ORDER BY skill_count DESC
LIMIT 20;
```

### Internship Data

**Total internships by source:**
```sql
SELECT source, COUNT(*) as count
FROM internships_internship
GROUP BY source
ORDER BY count DESC;
```

**Internships with highest stipend:**
```sql
SELECT 
    id,
    title,
    company,
    stipend_min,
    stipend_max,
    deadline
FROM internships_internship
WHERE stipend_max IS NOT NULL
ORDER BY stipend_max DESC
LIMIT 10;
```

**Upcoming deadlines (next 7 days):**
```sql
SELECT 
    id,
    title,
    company,
    deadline
FROM internships_internship
WHERE deadline BETWEEN NOW() AND NOW() + INTERVAL '7 days'
ORDER BY deadline ASC;
```

### Application Tracking

**User applications summary:**
```sql
SELECT 
    u.email,
    COUNT(a.id) as total_applications,
    COUNT(CASE WHEN a.status = 'applied' THEN 1 END) as applied,
    COUNT(CASE WHEN a.status = 'interview' THEN 1 END) as interviews,
    COUNT(CASE WHEN a.status = 'rejected' THEN 1 END) as rejected,
    COUNT(CASE WHEN a.status = 'selected' THEN 1 END) as selected
FROM auth_user u
LEFT JOIN applications_application a ON u.id = a.user_id
GROUP BY u.id, u.email
ORDER BY total_applications DESC;
```

**Application status distribution:**
```sql
SELECT 
    status,
    COUNT(*) as count,
    ROUND(100.0 * COUNT(*) / (SELECT COUNT(*) FROM applications_application), 1) as percentage
FROM applications_application
GROUP BY status
ORDER BY count DESC;
```

### Saved Internships

**Most saved internships:**
```sql
SELECT 
    i.id,
    i.title,
    i.company,
    COUNT(s.id) as save_count
FROM internships_internship i
LEFT JOIN saved_savedinternship s ON i.id = s.internship_id
GROUP BY i.id, i.title, i.company
ORDER BY save_count DESC
LIMIT 10;
```

### Notifications & Email Preferences

**Users with email notifications enabled:**
```sql
SELECT 
    COUNT(*) as total,
    SUM(CASE WHEN new_matches_alert_enabled THEN 1 ELSE 0 END) as new_match_alerts,
    SUM(CASE WHEN deadline_reminders_enabled THEN 1 ELSE 0 END) as deadline_reminders,
    SUM(CASE WHEN application_status_alerts_enabled THEN 1 ELSE 0 END) as application_alerts
FROM users_profile;
```

**Email digest preferences:**
```sql
SELECT 
    email_digest,
    COUNT(*) as user_count
FROM users_profile
GROUP BY email_digest
ORDER BY user_count DESC;
```

### Authentication

**View OTP records (for debugging):**
```sql
SELECT 
    eov.id,
    u.email,
    eov.verified_at IS NOT NULL as is_verified,
    eov.expires_at,
    eov.attempts
FROM users_emailverificationotp eov
JOIN auth_user u ON eov.user_id = u.id
ORDER BY eov.created_at DESC
LIMIT 20;
```

**Password reset requests (last 7 days):**
```sql
SELECT 
    email,
    COUNT(*) as request_count,
    MAX(created_at) as last_request
FROM users_passwordresetotp
WHERE created_at > NOW() - INTERVAL '7 days'
GROUP BY email
ORDER BY request_count DESC;
```

### Maintenance Queries

**Delete expired OTPs (older than 30 days):**
```sql
DELETE FROM users_emailverificationotp
WHERE created_at < NOW() - INTERVAL '30 days'
AND verified_at IS NULL;
```

**Reset user profile completion (recalculate):**
```sql
-- Note: This is database-level. Django .save() method recalculates.
-- Manually updating should match the Python calculation logic.
-- It's safer to use: python manage.py shell to update via Django ORM.
```

**Check database size:**
```sql
SELECT 
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema')
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**View active connections:**
```sql
SELECT 
    datname,
    count(*) as connections
FROM pg_stat_activity
GROUP BY datname
ORDER BY connections DESC;
```

## Running Queries in Supabase

1. **Via Supabase Dashboard:**
   - Go to your Supabase project
   - Click "SQL Editor"
   - Create a new query
   - Paste any SQL from above
   - Click "Run"

2. **Via psql (command line):**
```bash
psql postgresql://postgres:Shaurya12345@@@@db.jlrwesfaoaznmpzpgjxk.supabase.co:5432/postgres
```

Then paste queries at the `postgres=#` prompt.

3. **Via Django shell (recommended for data modifications):**
```bash
cd backend
python manage.py shell
```

Example:
```python
from users.models import User, Profile
from django.utils import timezone

# Query users
users = User.objects.filter(is_active=True)

# Update profile
profile = Profile.objects.get(user__email='user@example.com')
profile.full_name = 'New Name'
profile.save()
```

## Important Notes

- **Don't modify authentication tables directly** - Use Django ORM or Django admin
- **Profile completion recalculation** - Always use Django `.save()` to ensure proper calculation
- **Foreign key constraints** - Be careful with DELETE queries; use CASCADE carefully
- **Backups** - Supabase automatically backs up your data. Use the dashboard to access recovery points.

---

**Last Updated**: 2026-08-29
