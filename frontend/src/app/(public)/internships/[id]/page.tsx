import type { Metadata } from "next";
import { notFound } from "next/navigation";

import InternshipDetailContent from "@/components/internships/InternshipDetailContent";
import { getInternship } from "@/lib/getInternship";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const internship = await getInternship(id);

  if (!internship) {
    return { title: "Internship not found" };
  }

  const title = `${internship.title} at ${internship.company}`;
  const description = internship.description
    ? internship.description.slice(0, 155)
    : `${internship.title} internship at ${internship.company} — ${internship.location}. ${internship.stipend_display || ""}`.trim();

  const keywords = [
    internship.title,
    `${internship.title} internship`,
    `${internship.company} internship`,
    `${internship.domain.replace("_", " ")} internship`,
    `internship in ${internship.city || internship.location}`,
    ...(internship.skills_required?.slice(0, 5) ?? []),
  ].filter(Boolean);

  return {
    title,
    description,
    keywords,
    alternates: { canonical: `/internships/${id}` },
    openGraph: {
      title,
      description,
      type: "article",
      images: internship.company_logo_url ? [internship.company_logo_url] : undefined,
    },
    twitter: { card: "summary", title, description },
  };
}

/** Google Jobs-eligible structured data — by far the highest-leverage SEO
 * addition for a listings page like this one, since it makes individual
 * internships eligible for rich results / Google for Jobs rather than a
 * plain blue link. Only the fields we can back with real data are included
 * — no invented salary or address details. */
function buildJobPostingSchema(internship: NonNullable<Awaited<ReturnType<typeof getInternship>>>) {
  const fallbackDescription = [
    `${internship.title} at ${internship.company}.`,
    internship.location && `Location: ${internship.location}.`,
    internship.duration && `Duration: ${internship.duration}.`,
    internship.stipend_display && `Stipend: ${internship.stipend_display}.`,
  ]
    .filter(Boolean)
    .join(" ");

  const schema: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: internship.title,
    description: internship.description || fallbackDescription,
    datePosted: internship.posted_at,
    employmentType: "INTERN",
    hiringOrganization: {
      "@type": "Organization",
      name: internship.company,
      ...(internship.company_logo_url ? { logo: internship.company_logo_url } : {}),
    },
    directApply: false,
    identifier: {
      "@type": "PropertyValue",
      name: internship.company,
      value: internship.id,
    },
  };

  // Google for Jobs treats postings without validThrough as needing more
  // frequent re-verification and may deprioritize them — fall back to a
  // conservative 60-day window from posting date when no deadline was set,
  // rather than omitting the field entirely.
  if (internship.deadline) {
    schema.validThrough = internship.deadline;
  } else {
    const fallback = new Date(internship.posted_at);
    fallback.setDate(fallback.getDate() + 60);
    schema.validThrough = fallback.toISOString().slice(0, 10);
  }

  if (internship.work_type === "remote") {
    schema.jobLocationType = "TELECOMMUTE";
    schema.applicantLocationRequirements = { "@type": "Country", name: "IN" };
  } else if (internship.location) {
    schema.jobLocation = {
      "@type": "Place",
      address: { "@type": "PostalAddress", addressLocality: internship.location, addressCountry: "IN" },
    };
  }

  if (!internship.is_unpaid && internship.stipend_min) {
    schema.baseSalary = {
      "@type": "MonetaryAmount",
      currency: "INR",
      value: {
        "@type": "QuantitativeValue",
        minValue: internship.stipend_min,
        ...(internship.stipend_max ? { maxValue: internship.stipend_max } : {}),
        unitText: "MONTH",
      },
    };
  }

  return schema;
}

function buildBreadcrumbSchema(internship: NonNullable<Awaited<ReturnType<typeof getInternship>>>, id: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Internships", item: `${SITE_URL}/internships` },
      {
        "@type": "ListItem",
        position: 3,
        name: `${internship.title} at ${internship.company}`,
        item: `${SITE_URL}/internships/${id}`,
      },
    ],
  };
}

export default async function InternshipDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const internship = await getInternship(id);

  if (!internship) {
    notFound();
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJobPostingSchema(internship)) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(buildBreadcrumbSchema(internship, id)) }}
      />
      <InternshipDetailContent internship={internship} />
    </>
  );
}
