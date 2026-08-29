"""
Management command: seed 50 sample internships for local testing/demos.

Usage:
    python manage.py seed_demo_data
    python manage.py seed_demo_data --count 100
    python manage.py seed_demo_data --clear   # wipe existing seeded data first
"""

import random
from datetime import timedelta

from django.core.management.base import BaseCommand
from django.utils import timezone

from internships.models import Internship, InternshipSource

SOURCE_NAMES = [
    "Internshala",
    "Unstop",
    "LinkedIn",
    "AngelList",
    "Naukri Campus",
    "Indeed",
    "Glassdoor",
    "Foundit",
    "Hirist",
    "Cutshort",
    "HackerEarth",
    "Instahyre",
]

COMPANIES = [
    "Acme Corp", "Zenith Labs", "Bluepeak Technologies", "Nimbus Analytics",
    "Vertex Software", "Northstar Digital", "Coral Systems", "Ember Health",
    "Quanta Robotics", "Fable Media", "Ridge Finance", "Sable Studios",
    "Orbit Commerce", "Lumen Data", "Trace Security", "Harbor AI",
    "Cascade Logistics", "Willow Design", "Granite Cloud", "Petal Retail",
]

ROLE_TEMPLATES = {
    "tech": ["Backend Developer Intern", "Frontend Developer Intern", "Full Stack Intern",
             "Mobile App Development Intern", "QA Engineering Intern"],
    "data_science": ["Data Science Intern", "Machine Learning Intern", "Data Analyst Intern"],
    "design": ["UI/UX Design Intern", "Product Design Intern", "Graphic Design Intern"],
    "marketing": ["Digital Marketing Intern", "Growth Marketing Intern", "SEO Intern"],
    "content": ["Content Writing Intern", "Copywriting Intern", "Content Strategy Intern"],
    "sales": ["Business Development Intern", "Sales Intern", "Inside Sales Intern"],
    "finance": ["Finance Intern", "Investment Banking Intern", "Accounting Intern"],
    "hr": ["HR Intern", "Talent Acquisition Intern", "People Ops Intern"],
    "operations": ["Operations Intern", "Supply Chain Intern", "Project Coordination Intern"],
}

SKILLS_BY_DOMAIN = {
    "tech": ["Python", "Django", "JavaScript", "React", "Node.js", "SQL", "Git", "REST APIs"],
    "data_science": ["Python", "Pandas", "NumPy", "SQL", "Machine Learning", "TensorFlow"],
    "design": ["Figma", "Adobe XD", "Sketch", "Prototyping", "User Research"],
    "marketing": ["SEO", "Google Analytics", "Content Marketing", "Social Media", "A/B Testing"],
    "content": ["Content Writing", "Copywriting", "SEO Writing", "Editing"],
    "sales": ["Cold Calling", "CRM", "Negotiation", "Lead Generation"],
    "finance": ["Excel", "Financial Modeling", "Accounting", "SQL"],
    "hr": ["Recruiting", "Onboarding", "HRIS", "Communication"],
    "operations": ["Excel", "Project Management", "Process Improvement", "Logistics"],
}

CITIES = [
    ("Bangalore", "Bangalore, India"),
    ("Mumbai", "Mumbai, India"),
    ("Delhi NCR", "Delhi NCR, India"),
    ("Hyderabad", "Hyderabad, India"),
    ("Pune", "Pune, India"),
    ("Chennai", "Chennai, India"),
    ("Kolkata", "Kolkata, India"),
    ("Remote", "Remote"),
]

PERKS_POOL = [
    "Certificate", "Letter of Recommendation", "Flexible hours",
    "Pre-placement offer", "5-day week", "Free snacks", "Health insurance",
]


class Command(BaseCommand):
    help = "Seed the database with sample internships for local testing/demos."

    def add_arguments(self, parser):
        parser.add_argument(
            "--count", type=int, default=50, help="Number of internships to create (default 50)."
        )
        parser.add_argument(
            "--clear", action="store_true", help="Delete existing seeded internships first."
        )

    def handle(self, *args, **options):
        count = options["count"]

        # Seeded so re-running with the same --count is idempotent: each
        # index always generates identical field values, so update_or_create
        # below updates existing rows instead of accumulating duplicates
        # under a different (source, source_job_id) combination each run.
        random.seed(42)

        if options["clear"]:
            deleted, _ = Internship.objects.filter(source_job_id__startswith="demo-").delete()
            self.stdout.write(self.style.WARNING(f"Deleted {deleted} previously seeded internship(s)."))

        sources = {}
        for name in SOURCE_NAMES:
            source, _ = InternshipSource.objects.get_or_create(
                name=name, defaults={"is_active": True}
            )
            sources[name] = source

        domains = list(ROLE_TEMPLATES.keys())
        work_types = [choice[0] for choice in Internship.WorkType.choices]
        today = timezone.localdate()

        created = 0
        for i in range(count):
            domain = random.choice(domains)
            role = random.choice(ROLE_TEMPLATES[domain])
            company = random.choice(COMPANIES)
            city_name, location = random.choice(CITIES)
            work_type = "remote" if city_name == "Remote" else random.choice(work_types)
            source_name = random.choice(SOURCE_NAMES)
            skills = random.sample(
                SKILLS_BY_DOMAIN[domain], k=min(4, len(SKILLS_BY_DOMAIN[domain]))
            )
            duration_months = random.choice([2, 3, 6])
            is_unpaid = random.random() < 0.15

            if is_unpaid:
                stipend_min = stipend_max = 0
                stipend_display = "Unpaid"
            else:
                stipend_min = random.choice([5000, 8000, 10000, 15000, 20000])
                stipend_max = stipend_min + random.choice([5000, 10000, 15000])
                stipend_display = f"₹{stipend_min:,} - ₹{stipend_max:,}"

            deadline = today + timedelta(days=random.randint(-5, 45))
            posted_at = timezone.now() - timedelta(days=random.randint(0, 30))

            job_id = f"demo-{i}"
            Internship.objects.update_or_create(
                source=sources[source_name],
                source_job_id=job_id,
                defaults=dict(
                    title=role,
                    company=company,
                    company_logo_url="",
                    location=location,
                    city=city_name,
                    work_type=work_type,
                    domain=domain,
                    duration=f"{duration_months} Months",
                    duration_months=duration_months,
                    stipend_min=stipend_min,
                    stipend_max=stipend_max,
                    stipend_display=stipend_display,
                    is_unpaid=is_unpaid,
                    skills_required=skills,
                    description=(
                        f"Join {company} as a {role} and work alongside our "
                        f"{domain.replace('_', ' ')} team on real projects with mentorship "
                        f"and hands-on ownership."
                    ),
                    requirements="Currently pursuing a degree, strong communication skills, "
                    "eagerness to learn.",
                    perks=random.sample(PERKS_POOL, k=3),
                    apply_link=f"https://example.com/apply/{job_id}",
                    deadline=deadline,
                    posted_at=posted_at,
                    is_active=deadline >= today,
                ),
            )
            created += 1

        for source in sources.values():
            source.total_internships_scraped = source.internships.count()
            source.last_scraped_at = timezone.now()
            source.save(update_fields=["total_internships_scraped", "last_scraped_at"])

        self.stdout.write(self.style.SUCCESS(f"Seeded {created} demo internship(s)."))
