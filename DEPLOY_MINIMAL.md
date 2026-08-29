# Deploying LetsInternz for Minimal Cost

`DEPLOY.md` documents a "real" production setup — RDS, S3, CloudFront,
Amplify, separate EC2 instances for app and workers. That's the right shape
once you have real traffic, but it's more infrastructure (and cost) than a
new project needs. This document is the cheapest path that's still a
genuine production deploy — not a toy.

**Two tracks, pick one:**
- **Track A — Single AWS free-tier box.** Everything on one small EC2
  instance. Free for your first 12 months on a new AWS account, then a
  small fixed monthly cost. Best if you're already comfortable with Linux
  servers, or want SES for email either way.
- **Track B — No servers, no AWS account.** Vercel + a free-tier managed
  Postgres + a free/cheap backend host. Less to manage, effectively $0/month
  at hobby scale indefinitely, but you're on someone else's free tier terms.

Either way, **a domain name (~$10–15/year) is the one cost you can't avoid**
if you want a real URL instead of a platform subdomain.

> Note on figures below: cloud free-tier terms change fairly often. Treat
> the dollar amounts here as "roughly what to expect," and check the
> provider's current pricing page before you commit — don't take these
> numbers as gospel.

---

## What actually costs money, and what doesn't

The architecture in `DEPLOY.md` has five paid pieces: RDS, EC2, S3,
CloudFront, and Amplify. Here's what's actually load-bearing vs. what's
there for scale you don't have yet:

| Piece | Do you need it on day one? |
|---|---|
| **Postgres** | Yes — but it doesn't need to be RDS. Postgres on the same box as Django, or a free-tier managed Postgres (Neon/Supabase), works fine at low traffic. |
| **Redis** | Only for the list-page cache and Celery. `apt install redis-server` on the same box costs nothing — no need for ElastiCache. |
| **S3** | No longer required — as of this change, `config/settings/production.py` falls back to local disk storage for media if AWS credentials aren't set, rather than refusing to start. Fine for one server; move to S3 (or R2/Backblaze) before you run more than one. |
| **CloudFront** | Only matters once you have real traffic to media files. Skip it. |
| **EC2 (backend)** | Yes, something has to run Django. |
| **Amplify (frontend)** | No — `next build && next start` runs fine as a second process on the same box, behind the same Nginx. One less service, one less bill. |
| **SES** | Cheapest option if you're already on AWS (near-free at low volume). If you go the zero-AWS route (Track B), swap in a free-tier SMTP provider instead (see that section). |

The consolidation in Track A below is: **one EC2 instance running Nginx +
Gunicorn (Django) + `next start` (Next.js) + Redis + (optionally) Postgres
itself**, instead of five separate AWS services.

---

## Track A — Single free-tier EC2 instance

### 1. Launch the instance

- EC2 console → Launch instance → Ubuntu 24.04 LTS → **`t2.micro` or
  `t3.micro`** (both are free-tier eligible on a new AWS account — check
  which one your account's free tier currently covers).
- Security group: inbound 22 (SSH, your IP only), 80, 443 from anywhere.
- Allocate an Elastic IP and associate it — free while attached to a
  running instance, only charged if left unattached.
- 20–30GB gp3 root volume is enough (free tier includes up to 30GB EBS).

### 2. Database: same box, or free-tier managed

**Option 2a — Postgres on the same instance (cheapest, more to manage):**
```bash
sudo apt install -y postgresql
sudo -u postgres createuser --pwprompt letsinternz
sudo -u postgres createdb -O letsinternz letsinternz
```
`DATABASE_URL=postgresql://letsinternz:<password>@localhost:5432/letsinternz`

**Option 2b — Free-tier managed Postgres (Neon or Supabase, less to
manage, one less thing to back up yourself):** create a free project,
copy the connection string it gives you as `DATABASE_URL`. Either provider's
free tier is fine for low traffic; check current storage/compute limits
before committing to one.

Either way, the format is identical to what `config/settings/production.py`
already expects — no code changes needed.

### 3. Everything else, on the same box

```bash
sudo apt update && sudo apt install -y python3.12-venv python3-pip nginx git redis-server nodejs npm
sudo systemctl enable --now redis-server

sudo mkdir -p /opt/letsinternz && sudo chown ubuntu:ubuntu /opt/letsinternz
cd /opt/letsinternz && git clone <your-repo-url> .

# Backend
cd backend
python3.12 -m venv venv && source venv/bin/activate
pip install -r requirements/production.txt
# .env — see DEPLOY.md §8 for the full variable list. At minimum for this
# track: DJANGO_SETTINGS_MODULE=config.settings.production, SECRET_KEY,
# ALLOWED_HOSTS, DATABASE_URL, REDIS_URL=redis://localhost:6379/0.
# Leave AWS_ACCESS_KEY_ID/AWS_SECRET_ACCESS_KEY/AWS_STORAGE_BUCKET_NAME
# blank to use local disk storage instead of S3.
python manage.py migrate
python manage.py collectstatic --noinput
deactivate

# Frontend
cd ../frontend
npm ci
# .env.local: NEXT_PUBLIC_API_URL=/api, NEXT_PUBLIC_APP_URL=https://yourdomain.com,
# BACKEND_API_ORIGIN=http://localhost:8000 (same box, so localhost is correct here —
# this is the one case where that's right, unlike the Docker Compose setup).
npm run build
```

> `npm run build` needs outbound internet access to `fonts.googleapis.com`
> (Next.js fetches Google Fonts at build time). A default EC2 security
> group allows all outbound traffic, so this normally isn't an issue —
> only worth checking if you've locked down egress rules.

### 4. Run both apps as systemd services

`/etc/systemd/system/letsinternz-backend.service`:
```ini
[Unit]
Description=LetsInternz Django (Gunicorn)
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/letsinternz/backend
EnvironmentFile=/opt/letsinternz/backend/.env
ExecStart=/opt/letsinternz/backend/venv/bin/gunicorn config.wsgi:application \
    --workers 2 --bind unix:/opt/letsinternz/backend/gunicorn.sock
Restart=always

[Install]
WantedBy=multi-user.target
```
(2 workers, not 3 — a `t2/t3.micro` only has 1GB RAM, don't over-provision
Gunicorn workers on it.)

`/etc/systemd/system/letsinternz-frontend.service`:
```ini
[Unit]
Description=LetsInternz Next.js
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/opt/letsinternz/frontend
EnvironmentFile=/opt/letsinternz/frontend/.env.local
ExecStart=/usr/bin/npm run start -- -p 3000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now letsinternz-backend letsinternz-frontend
```

Skip Celery/Celery Beat entirely on this track unless you're actually
running the scraper on a schedule — nothing else in the app requires a
background worker to function (email sends happen synchronously in the
request/response cycle).

### 5. Nginx — one server block routing both

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location /static/ {
        alias /opt/letsinternz/backend/staticfiles/;
    }

    location /media/ {
        alias /opt/letsinternz/backend/media/;
    }

    location /api/ {
        proxy_pass http://unix:/opt/letsinternz/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /admin/ {
        proxy_pass http://unix:/opt/letsinternz/backend/gunicorn.sock;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
```bash
sudo ln -s /etc/nginx/sites-available/letsinternz /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

Note this Nginx config routes `/api/` and `/admin/` straight to Django and
everything else to Next.js — so `next.config.ts`'s own rewrite (which also
proxies `/api/*` to `BACKEND_API_ORIGIN`) never actually fires in this setup
since Nginx intercepts `/api/` first. That's fine; it's redundant-but-not-
conflicting, and keeps the Next.js app's own config valid if you ever split
it out to Track B or `DEPLOY.md`'s full setup later.

### 6. Email without paying for anything extra

If you have an AWS account for the EC2 instance anyway, SES is the cheapest
option — near-free at low volume, and DEPLOY.md §3 covers domain
verification. You do still need to verify a sending domain/address and
request production access (SES starts in a sandbox that can only email
verified addresses).

### 7. What this actually costs

- **First 12 months** (new AWS account): $0 for the instance and the
  outbound bandwidth free tier covers typical hobby traffic. SES is
  effectively free at low volume regardless of the 12-month clock. Your
  only real cost is the domain.
- **After 12 months**: roughly one small VM's on-demand price (`t3.micro`
  in most regions is in the low tens of dollars/month if left running
  24/7) plus the domain. A **Reserved Instance or Savings Plan** cuts that
  substantially if you know you'll keep it running — worth doing once
  you're past the free tier and confident you're keeping the project up.

---

## Track B — No AWS account at all

If you'd rather not manage a Linux server:

- **Frontend → Vercel.** Next.js is Vercel's own framework; connect the
  repo, set root directory to `frontend/`, add the same env vars as
  before. Vercel's free (Hobby) tier is built for exactly this scale.
- **Database → Neon or Supabase** free-tier Postgres. Copy the connection
  string into `DATABASE_URL`.
- **Backend → Render or Railway** free/cheap tier. Point it at
  `backend/`, set the start command to
  `gunicorn config.wsgi:application`, add the env vars from `DEPLOY.md`
  §8 (`DJANGO_SETTINGS_MODULE=config.settings.production`, `SECRET_KEY`,
  `ALLOWED_HOSTS`, `DATABASE_URL`, `CORS_ALLOWED_ORIGINS`,
  `CSRF_TRUSTED_ORIGINS`). Free tiers on these platforms commonly mean
  the backend sleeps after inactivity and wakes on the next request with
  a several-second delay — fine for a low-traffic project, worth knowing
  before you rely on it for something latency-sensitive.
- **Media storage** — with no AWS account, S3 isn't an option; the
  local-disk fallback from Track A works if your host's disk persists
  across deploys (check — some PaaS platforms use ephemeral filesystems
  that wipe on every redeploy, which would silently delete uploaded
  resumes/avatars). If that's a risk on your chosen host, Cloudflare R2's
  free tier is S3-API-compatible and works with `django-storages` — set
  `AWS_S3_CUSTOM_DOMAIN`/endpoint to point at R2 instead of AWS.
- **Email** — `django_ses.SESBackend` needs AWS credentials to function
  even without S3, so it won't work here. Swap `EMAIL_BACKEND` in
  `config/settings/production.py` for an SMTP-based backend
  (`django.core.mail.backends.smtp.EmailBackend`) pointed at a free-tier
  provider like Resend or Brevo, using their SMTP credentials.
- **Since there's no reverse proxy to consolidate, `next.config.ts`'s
  `/api/*` rewrite (pointed at `BACKEND_API_ORIGIN`) is what connects the
  two** — set `BACKEND_API_ORIGIN` to your Render/Railway backend's URL.

This track has no fixed cost at hobby scale — everything above has a
real, currently-offered free tier — but every platform's exact free-tier
limits and sleep/cold-start behavior are worth checking directly before
you depend on them, since these terms shift over time in ways a static
document like this one can't track for you.

---

## Either track: things not worth cutting

A few costs are small enough, or risky enough to skip, that cutting them
isn't actually "minimal cost" — it's just deferred cost with interest:

- **Backups.** A free-tier managed Postgres (Neon/Supabase) usually
  includes some backup retention for free — genuinely worth it over
  self-hosting Postgres with no backup plan. If you do self-host Postgres
  on the EC2 box, at minimum cron a nightly `pg_dump` to the same disk;
  it's free and takes ten minutes to set up.
- **HTTPS.** Let's Encrypt via Certbot is free — there's no cost tradeoff
  here, only a setup step. Don't skip it.
- **A real `SECRET_KEY`.** Free. Generate one
  (`python -c "import secrets; print(secrets.token_urlsafe(50))"`) instead
  of reusing a placeholder — this one's just about not shooting yourself
  in the foot for zero savings.
