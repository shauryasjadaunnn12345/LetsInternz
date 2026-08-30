"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";

import InternshipCard from "@/components/internships/InternshipCard";
import InternshipCardSkeleton from "@/components/internships/InternshipCardSkeleton";
import { useFeaturedInternships } from "@/hooks/useInternships";
import type { Internship } from "@/lib/types";

export default function FeaturedInternships() {
  const { data: internships, isLoading, isError } = useFeaturedInternships();
  const pageResults = internships as { results?: Internship[] } | undefined;
  const normalizedInternships: Internship[] = Array.isArray(internships)
    ? internships
    : Array.isArray(pageResults?.results)
      ? pageResults.results
      : [];

  if (isError || (!isLoading && normalizedInternships.length === 0)) {
    return null;
  }

  return (
    <section className="border-y border-border bg-paper-raised">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-marigold-dark">
              Fresh today
            </p>
            <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
              Featured internships
            </h2>
          </div>
          <Link
            href="/internships"
            className="flex items-center gap-1 text-sm font-semibold text-ink hover:text-marigold-dark"
          >
            View All Internships
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => <InternshipCardSkeleton key={i} />)
            : normalizedInternships.map((internship) => (
                <InternshipCard key={internship.id} internship={internship} />
              ))}
        </div>
      </div>
    </section>
  );
}
