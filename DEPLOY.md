# Deploying LetsInternz to AWS

A step-by-step checklist for standing up production infrastructure: RDS
(Postgres), S3 (media), SES (email), EC2 (Django API), CloudFront, and
Amplify (Next.js frontend). Written for a first production deploy — adjust
instance sizes/regions to taste.

All examples use `ap-south-1` (Mumbai), matching `AWS_S3_REGION_NAME` in
`backend/config/settings/base.py`. Keep every AWS resource in the same
region unless you have a specific reason not to (cross-region traffic costs
money and adds latency).

---

## 1. AWS RDS (PostgreSQL)

1. **Create the database.**
   - RDS console → Create database → Standard create → PostgreSQL (16.x, matching local dev).
   - Templates: "Production" (Multi-AZ) once you have real users, "Dev/Test" (single-AZ) is fine to start.
   - DB instance identifier: `letsinternz-prod`.
   - Credentials: set a strong master password, save it in a password manager (or AWS Secrets Manager — see §8).
   - Instance class: `db.t4g.micro` is enough to start; scale up as traffic grows.
   - Storage: 20GB gp3, enable storage autoscaling.
   - Connectivity: put it in the **same VPC** as your EC2 instance (§4), and set "Public access" to **No**.
   - VPC security group: create a new one (`letsinternz-rds-sg`) — open port 5432 to the EC2 security group only, not to the internet.
   - Initial database name: `letsinternz`.
2. **Lock down access.** Once created, edit `letsinternz-rds-sg` inbound rules: allow port 5432 from the EC2 security group (§4) only — never `0.0.0.0/0`.
3. **Get the connection string.** From the RDS console, copy the endpoint hostname. Build `DATABASE_URL`:
   ```
   DATABASE_URL=postgresql://<master_username>:<master_password>@<rds-endpoint>:5432/letsinternz
   ```
   This is exactly the format `config/settings/production.py` parses.
4. **Enable automated backups** (7+ day retention) — on by default with the "Production" template, double-check it's on if you used "Dev/Test".

---

## 2. AWS S3 (media: resumes, avatars, company logos)

S3 is recommended for anything beyond a single instance — durable,
CDN-friendly, and survives instance replacement. It's not strictly
required: if `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY`/
`AWS_STORAGE_BUCKET_NAME` aren't set, `config/settings/production.py`
falls back to local disk storage instead of refusing to start. See
`DEPLOY_MINIMAL.md` if you're deliberately trying to avoid this cost on a
single-server setup — this section assumes you want the real thing.

1. **Create the bucket.**
   - S3 console → Create bucket → name it something globally unique, e.g. `letsinternz-media-prod`.
   - Region: `ap-south-1`.
   - Block Public Access: **keep all four boxes checked** (block everything) — we serve files through CloudFront (§6) or the app's credentialed access, not a public bucket policy, since resumes are personal documents.
   - Enable bucket versioning (protects against accidental overwrite/delete).
2. **Bucket policy.** Since the bucket is private, access goes through the IAM user credentials the Django app uses (via `django-storages`), not a public policy:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "AppReadWrite",
         "Effect": "Allow",
         "Principal": { "AWS": "arn:aws:iam::<ACCOUNT_ID>:user/letsinternz-app" },
         "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::letsinternz-media-prod/*"
       }
     ]
   }
   ```
3. **CORS configuration** (needed so the browser can `PUT` avatar/resume uploads and load them back):
   ```json
   [
     {
       "AllowedOrigins": ["https://letsinternz.com"],
       "AllowedMethods": ["GET", "PUT", "POST"],
       "AllowedHeaders": ["*"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```
4. **Create the IAM user** the app authenticates as:
   - IAM console → Users → Create user `letsinternz-app` → Access key - Programmatic access.
   - Attach an inline policy scoped to just this bucket (the statement above, but as an IAM policy on the user rather than a bucket policy — either works; a bucket policy is simpler to audit for a single-app setup).
   - Save the Access Key ID / Secret Access Key — these become `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.
5. **Env vars this maps to** (`config/settings/base.py`):
   ```
   AWS_ACCESS_KEY_ID=<access key>
   AWS_SECRET_ACCESS_KEY=<secret key>
   AWS_STORAGE_BUCKET_NAME=letsinternz-media-prod
   AWS_S3_REGION_NAME=ap-south-1
   ```
   `AWS_S3_CUSTOM_DOMAIN` and `MEDIA_URL` are computed automatically from these — override `AWS_S3_CUSTOM_DOMAIN` only if you put CloudFront in front of the bucket (recommended, see §6).

---

## 3. AWS SES (transactional email)

1. **Verify your sending domain.** SES console → Verified identities → Create identity → Domain → `letsinternz.com`. Add the DKIM CNAME records SES gives you to your DNS (Route 53 or wherever the domain is hosted) — verification usually completes within minutes to a few hours.
2. **Verify the from-address** if you're not verifying the whole domain: Create identity → Email address → `noreply@letsinternz.com` → click the confirmation link SES emails you.
3. **Request production access.** New SES accounts start in the **sandbox** (can only send to verified addresses, ~200 emails/day). SES console → Account dashboard → "Request production access" → fill in the use-case form (transactional: welcome emails, deadline reminders, application status updates). Usually approved within 24 hours.
4. **Set a sending rate limit** you're comfortable with in the SES console once out of sandbox, so a bug can't blow through your budget.
5. **Env vars this maps to:**
   ```
   DEFAULT_FROM_EMAIL=noreply@letsinternz.com
   AWS_SES_REGION_NAME=ap-south-1
   ```
   `EMAIL_BACKEND` is already hardcoded to `django_ses.SESBackend` in `config/settings/production.py` — nothing else to configure. The same `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` from §2 need `ses:SendEmail`/`ses:SendRawEmail` permission (add this to the IAM user's policy, or create a dedicated `letsinternz-ses` user if you'd rather keep S3 and SES credentials separate).

---

## 4. EC2 setup for Django (Gunicorn + Nginx)

1. **Launch the instance.**
   - EC2 console → Launch instance → Ubuntu 24.04 LTS, `t3.small` (bump up if needed).
   - Create/reuse a key pair for SSH.
   - Security group `letsinternz-ec2-sg`: inbound 22 (SSH, restrict to your IP), 80, 443 from `0.0.0.0/0`.
   - Put it in the same VPC as RDS (§1).
2. **Elastic IP.** Allocate and associate an Elastic IP so the instance's public address doesn't change on reboot — point your DNS `A` record at it.
3. **System setup** (SSH in as `ubuntu`):
   ```bash
   sudo apt update && sudo apt upgrade -y
   sudo apt install -y python3.12-venv python3-pip nginx git redis-server
   sudo systemctl enable --now redis-server
   ```
   (Redis runs locally on the same box here for simplicity — for real scale, use ElastiCache instead and point `REDIS_URL` at it.)
4. **Deploy the code:**
   ```bash
   sudo mkdir -p /opt/letsinternz && sudo chown ubuntu:ubuntu /opt/letsinternz
   cd /opt/letsinternz
   git clone <your-repo-url> .
   cd backend
   python3.12 -m venv venv
   source venv/bin/activate
   pip install -r requirements/production.txt
   ```
5. **Environment file.** Create `/opt/letsinternz/backend/.env` (never commit this) with every variable from the §8 checklist below, plus:
   ```
   DJANGO_SETTINGS_MODULE=config.settings.production
   ```
6. **Migrate and collect static files** (see §9 for the exact commands).
7. **Gunicorn systemd service** — `/etc/systemd/system/letsinternz.service`:
   ```ini
   [Unit]
   Description=LetsInternz Django (Gunicorn)
   After=network.target

   [Service]
   User=ubuntu
   Group=www-data
   WorkingDirectory=/opt/letsinternz/backend
   EnvironmentFile=/opt/letsinternz/backend/.env
   ExecStart=/opt/letsinternz/backend/venv/bin/gunicorn config.wsgi:application \
       --workers 3 --bind unix:/opt/letsinternz/backend/gunicorn.sock
   Restart=always

   [Install]
   WantedBy=multi-user.target
   ```
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now letsinternz
   sudo systemctl status letsinternz   # confirm it's running
   ```
8. **Nginx reverse proxy** — `/etc/nginx/sites-available/letsinternz`:
   ```nginx
   server {
       listen 80;
       server_name api.letsinternz.com;

       location /static/ {
           alias /opt/letsinternz/backend/staticfiles/;
       }

       location / {
           proxy_pass http://unix:/opt/letsinternz/backend/gunicorn.sock;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
   ```bash
   sudo ln -s /etc/nginx/sites-available/letsinternz /etc/nginx/sites-enabled/
   sudo nginx -t && sudo systemctl reload nginx
   ```
9. **HTTPS via Let's Encrypt:**
   ```bash
   sudo apt install -y certbot python3-certbot-nginx
   sudo certbot --nginx -d api.letsinternz.com
   ```
   Certbot edits the Nginx config to redirect HTTP→HTTPS and auto-renews via a systemd timer it installs.
10. **Redeploy workflow** (what the GitHub Actions job in `.github/workflows/deploy.yml` runs over SSH):
    ```bash
    cd /opt/letsinternz/backend
    git pull
    source venv/bin/activate
    pip install -r requirements/production.txt
    python manage.py migrate
    python manage.py collectstatic --noinput
    sudo systemctl restart letsinternz
    ```

---

## 5. Celery worker on EC2

Run Celery as a second systemd service on the same box (or a separate
instance once the scraper load justifies it).

`/etc/systemd/system/letsinternz-celery.service`:
```ini
[Unit]
Description=LetsInternz Celery Worker
After=network.target redis-server.service

[Service]
User=ubuntu
WorkingDirectory=/opt/letsinternz/backend
EnvironmentFile=/opt/letsinternz/backend/.env
ExecStart=/opt/letsinternz/backend/venv/bin/celery -A config worker --loglevel=info
Restart=always

[Install]
WantedBy=multi-user.target
```

For scheduled jobs (daily scraping, deadline-reminder emails) add Celery
Beat as a third service, same pattern:
```ini
ExecStart=/opt/letsinternz/backend/venv/bin/celery -A config beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now letsinternz-celery letsinternz-celery-beat
```

`django-celery-beat` is already in `INSTALLED_APPS`, so scheduled tasks are
configured via the Django admin (Periodic Tasks) once this is running — no
extra migration step beyond the regular `migrate` in §9.

---

## 6. CloudFront distribution

Fronting the S3 media bucket with CloudFront gives fast, cached
resume/avatar/logo delivery instead of hitting S3 directly on every request.

1. CloudFront console → Create distribution.
2. Origin domain: select your S3 bucket (`letsinternz-media-prod`) from the
   dropdown — pick the **S3 bucket** origin type, not "S3 website endpoint".
3. Origin access: **Origin Access Control (OAC)** — CloudFront creates one
   for you, then gives you a bucket policy snippet to paste into the S3
   bucket's permissions (this supplements, or can replace, the IAM-user
   policy from §2 — CloudFront's OAC principal also needs `s3:GetObject`).
4. Viewer protocol policy: Redirect HTTP to HTTPS.
5. Once deployed, CloudFront gives you a `*.cloudfront.net` domain — either
   use it directly or add a custom domain (`media.letsinternz.com`) with an
   ACM certificate (must be issued in `us-east-1` for CloudFront regardless
   of your bucket's region).
6. **Point the app at it:**
   ```
   AWS_S3_CUSTOM_DOMAIN=media.letsinternz.com
   ```
   (or the `*.cloudfront.net` hostname). `MEDIA_URL` is derived from this
   automatically in `config/settings/base.py`, so uploaded file URLs switch
   to CloudFront with no other code change.

---

## 7. Frontend: AWS Amplify

1. Amplify console → New app → Host web app → connect your GitHub repo,
   branch `main`.
2. Monorepo setting: set the app root to `frontend/` (Amplify supports
   monorepos — specify the subdirectory when connecting the repo).
3. Build settings (`amplify.yml`, Amplify usually detects Next.js and
   generates this — confirm it looks like):
   ```yaml
   version: 1
   applications:
     - appRoot: frontend
       frontend:
         phases:
           preBuild:
             commands:
               - npm ci
           build:
             commands:
               - npm run build
         artifacts:
           baseDirectory: .next
           files:
             - '**/*'
         cache:
           paths:
             - node_modules/**/*
   ```
4. Environment variables (Amplify console → App settings → Environment
   variables) — see the checklist in §8 for the full frontend list.
5. Custom domain: App settings → Domain management → add
   `letsinternz.com`, follow the DNS verification steps (Amplify manages
   the ACM certificate for you).
6. Every push to `main` triggers a new build/deploy automatically once
   connected — the GitHub Actions workflow (`deploy.yml`) triggers this via
   the Amplify webhook rather than pushing a build itself (see that file
   for details).

---

## 8. Environment variables checklist

### Backend (`/opt/letsinternz/backend/.env` on EC2)

| Variable | Where it comes from |
|---|---|
| `DJANGO_SETTINGS_MODULE` | `config.settings.production` |
| `SECRET_KEY` | Generate with `python -c "import secrets; print(secrets.token_urlsafe(50))"` |
| `ALLOWED_HOSTS` | `api.letsinternz.com` |
| `DATABASE_URL` | §1 (RDS) |
| `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` | §2 (IAM user) |
| `AWS_STORAGE_BUCKET_NAME` | §2 |
| `AWS_S3_REGION_NAME` | `ap-south-1` |
| `AWS_S3_CUSTOM_DOMAIN` | §6 (CloudFront domain), optional |
| `DEFAULT_FROM_EMAIL` | §3 |
| `AWS_SES_REGION_NAME` | §3 |
| `REDIS_URL` | `redis://localhost:6379/0` (or ElastiCache endpoint) |
| `CORS_ALLOWED_ORIGINS` | `https://letsinternz.com` |
| `CSRF_TRUSTED_ORIGINS` | `https://letsinternz.com` |
| `SENTRY_DSN` | Optional — from sentry.io if you use it |

### Frontend (Amplify environment variables)

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_APP_URL` | `https://letsinternz.com` |
| `NEXT_PUBLIC_API_URL` | `/api` (same-origin — see `next.config.ts` rewrite) |
| `BACKEND_API_ORIGIN` | `https://api.letsinternz.com` (server-side only; the rewrite destination) |

### GitHub Actions secrets (for `deploy.yml`)

| Secret | Purpose |
|---|---|
| `EC2_HOST` | Elastic IP or DNS of the Django instance |
| `EC2_SSH_KEY` | Private key for the EC2 key pair |
| `EC2_USER` | `ubuntu` |
| `AMPLIFY_WEBHOOK_URL` | Amplify app → General → Build triggers → webhook URL |

---

## 9. Database migration commands

Run from `/opt/letsinternz/backend` with the venv active and `.env` in place:

```bash
# Preview what would run, without applying anything
python manage.py migrate --plan

# Apply migrations
python manage.py migrate

# One-off: seed demo data (staging only — do NOT run against real prod data)
python manage.py seed_demo_data

# Create an admin user
python manage.py createsuperuser
```

For zero-downtime schema changes on a live table (adding a NOT NULL column,
renaming a column, etc.), split into two deploys: (1) migration that adds
the new nullable column / new table, ship code that writes to both old and
new shape, (2) backfill + migration that drops the old column, once the
first deploy has been running cleanly. Not needed for early-stage growth,
but worth knowing before your first genuinely breaking schema change.

---

## 10. Post-deploy smoke test

After every deploy, confirm before walking away:

```bash
curl -I https://api.letsinternz.com/api/internships/featured/   # 200
curl -I https://letsinternz.com                                  # 200
```
Then in the browser: sign up, browse internships, save one, log an
application, confirm a deadline-reminder or welcome email actually arrives
(check SES sending stats if it doesn't).
