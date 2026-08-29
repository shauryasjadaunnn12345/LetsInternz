import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
const BACKEND_API_ORIGIN = process.env.BACKEND_API_ORIGIN ?? "http://localhost:8000";

// Safety cap on how many internship detail pages get listed in one sitemap
// pass. Comfortably covers today's catalog; if the catalog grows past this,
// switch to Next's generateSitemaps() to split into multiple sitemap files
// instead of raising this number indefinitely.
const MAX_INTERNSHIP_URLS = 5000;
const PAGE_SIZE = 200;

interface InternshipListItem {
  id: string;
  posted_at: string;
}

interface InternshipListResponse {
  results: InternshipListItem[];
  next: string | null;
}

async function fetchAllInternshipUrls(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];
  let url: string | null =
    `${BACKEND_API_ORIGIN}/api/internships/?page_size=${PAGE_SIZE}&ordering=-posted_at`;

  try {
    while (url && entries.length < MAX_INTERNSHIP_URLS) {
      const res = await fetch(url, { next: { revalidate: 3600 } });
      if (!res.ok) break;

      const data: InternshipListResponse = await res.json();
      for (const internship of data.results) {
        entries.push({
          url: `${SITE_URL}/internships/${internship.id}`,
          lastModified: new Date(internship.posted_at),
          changeFrequency: "weekly",
          priority: 0.7,
        });
      }

      // Django returns absolute backend URLs in `next` already.
      url = data.next;
    }
  } catch {
    // If the backend is unreachable at build/request time, ship the
    // sitemap with just the static pages rather than failing the route.
  }

  return entries;
}

/**
 * Static pages plus every active internship's detail page — the detail
 * pages are the highest-value SEO surface for an aggregator (each one can
 * rank for "<role> internship <company>"-style long-tail searches), so
 * they're generated dynamically here rather than left out.
 *
 * `/dashboard/*` and the `(auth)` pages (login/signup/onboarding) are
 * intentionally omitted — a sitemap only ever lists what should be
 * crawled, so leaving them out is how they stay un-indexed. `robots.ts`
 * additionally disallows them outright for crawlers as a second layer.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const lastModified = new Date();

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "daily",
      priority: 1,
    },
    {
      url: `${SITE_URL}/internships`,
      lastModified,
      changeFrequency: "hourly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/how-it-works`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${SITE_URL}/about`,
      lastModified,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/privacy`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ];

  const internshipPages = await fetchAllInternshipUrls();

  return [...staticPages, ...internshipPages];
}
