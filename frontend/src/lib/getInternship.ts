import { cache } from "react";

import type { Internship } from "@/lib/types";

const BACKEND_ORIGIN = process.env.BACKEND_API_ORIGIN ?? "http://localhost:8000";

/**
 * Fetches a single internship directly from Django (bypassing the Next.js
 * rewrite, which only applies to browser requests reaching the Next
 * server — server components fetch the backend directly).
 *
 * Wrapped in React's `cache()` so `generateMetadata` and the page component
 * — which both need this same internship — share one request per render
 * pass instead of two. That matters here specifically because `retrieve`
 * increments the internship's view count as a side effect; without
 * memoization, a single page load would double-count the view.
 */
export const getInternship = cache(async (id: string): Promise<Internship | null> => {
  try {
    const res = await fetch(`${BACKEND_ORIGIN}/api/internships/${id}/`, {
      next: { revalidate: 300 },
    });
    if (!res.ok) return null;
    return (await res.json()) as Internship;
  } catch {
    return null;
  }
});
