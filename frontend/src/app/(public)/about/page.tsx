import type { Metadata } from "next";

import { AuthAwareCta } from "@/components/public/AuthAwareCta";
import { SOURCE_PLATFORMS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About",
  description:
    "LetsInternz aggregates internships from Internshala, Unstop, LinkedIn and 20+ platforms so students can search once and track every application in one place.",
  keywords: [
    "about LetsInternz",
    "internship aggregator platform",
    "internship search engine India",
    "student internship platform",
  ],
  alternates: { canonical: "/about" },
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-marigold-dark">
        About
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
        Application season, minus the twenty open tabs
      </h1>

      <div className="mt-6 space-y-5 text-base leading-relaxed text-ink-soft">
        <p>
          Every internship season, students end up with the same problem:
          the roles worth applying to are scattered across a dozen
          platforms, each with its own filters, its own login, and its own
          way of telling you a deadline just passed. LetsInternz exists to
          collapse that into one search.
        </p>
        <p>
          Our scrapers run daily across {SOURCE_PLATFORMS.length}+ platforms
          — including {SOURCE_PLATFORMS.slice(0, 4).join(", ")} and more —
          normalizing every listing into one searchable, filterable feed.
          You still apply on the original platform; we just make sure you
          never miss the listing in the first place.
        </p>
        <p>
          Past search, LetsInternz gives you a place to keep track of what
          you&apos;ve actually applied to: a dashboard for logging applications,
          folders for saving internships worth a second look, and alerts
          when a saved listing&apos;s deadline is a week out.
        </p>
      </div>

      <AuthAwareCta />
    </div>
  );
}
