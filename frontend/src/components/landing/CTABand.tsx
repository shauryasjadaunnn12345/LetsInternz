"use client";

import Link from "next/link";

import { useAuthStore } from "@/store/authStore";

export default function CTABand() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section className="bg-ink">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold text-white sm:text-4xl">
          Stop checking a dozen tabs.
        </h2>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-white/70">
          Search 20+ internship platforms in one place, and keep every
          application organized from here on out.
        </p>
        <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {isAuthenticated ? (
            <Link
              href="/dashboard"
              className="rounded-lg bg-marigold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-marigold-dark"
            >
              Go to Dashboard
            </Link>
          ) : null}
          <Link
            href="/internships"
            className="rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
          >
            Browse Internships
          </Link>
        </div>
      </div>
    </section>
  );
}
