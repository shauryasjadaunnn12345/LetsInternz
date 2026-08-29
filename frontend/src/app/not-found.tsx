import { Search } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";

export const metadata: Metadata = {
  title: "Page Not Found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-paper px-4 py-16 text-center">
      <div className="mb-8">
        <BrandLogo size="lg" />
      </div>

      <p className="font-display text-7xl font-bold text-marigold-dark">404</p>
      <h1 className="mt-3 font-display text-2xl font-semibold text-ink">
        This page took a different internship.
      </h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate">
        The page you&apos;re looking for doesn&apos;t exist, or the listing may have
        closed. Let&apos;s get you back to something useful.
      </p>

      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
        <Link
          href="/internships"
          className="flex items-center gap-2 rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-soft"
        >
          <Search className="h-4 w-4" />
          Browse Internships
        </Link>
        <Link
          href="/"
          className="rounded-lg border border-border bg-paper-raised px-6 py-3 text-sm font-semibold text-ink transition-colors hover:border-ink-soft"
        >
          Go to Homepage
        </Link>
      </div>
    </div>
  );
}
