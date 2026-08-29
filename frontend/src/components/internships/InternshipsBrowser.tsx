"use client";

import { SlidersHorizontal, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";

import FilterSidebar, { type BrowseFilters } from "@/components/internships/FilterSidebar";
import InternshipCard from "@/components/internships/InternshipCard";
import InternshipCardSkeleton from "@/components/internships/InternshipCardSkeleton";
import Pagination from "@/components/internships/Pagination";
import { SORT_OPTIONS, type SortValue } from "@/lib/constants";
import type { Domain, InternshipListParams, WorkType } from "@/lib/types";
import {
  useInternshipSources,
  useInternships,
  useSavedInternshipIds,
} from "@/hooks/useInternships";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuthStore } from "@/store/authStore";

const DEFAULT_SORT: SortValue = "-posted_at";

function parseFilters(searchParams: URLSearchParams): BrowseFilters {
  const csv = (key: string) => {
    const raw = searchParams.get(key);
    return raw ? raw.split(",").filter(Boolean) : [];
  };

  const stipendMin = searchParams.get("stipend_min");
  const stipendMax = searchParams.get("stipend_max");
  const durationMonths = searchParams.get("duration_months");

  return {
    q: searchParams.get("q") ?? "",
    location: csv("location"),
    domain: csv("domain") as Domain[],
    work_type: csv("work_type") as WorkType[],
    stipend: [stipendMin ? Number(stipendMin) : 0, stipendMax ? Number(stipendMax) : 50000],
    duration_months: durationMonths ? Number(durationMonths) : null,
    source: csv("source"),
  };
}

function filtersToSearchParams(filters: BrowseFilters, sort: SortValue, page: number) {
  const params = new URLSearchParams();

  if (filters.q) params.set("q", filters.q);
  if (filters.location.length) params.set("location", filters.location.join(","));
  if (filters.domain.length) params.set("domain", filters.domain.join(","));
  if (filters.work_type.length) params.set("work_type", filters.work_type.join(","));
  if (filters.stipend[0] > 0) params.set("stipend_min", String(filters.stipend[0]));
  if (filters.stipend[1] < 50000) params.set("stipend_max", String(filters.stipend[1]));
  if (filters.duration_months !== null)
    params.set("duration_months", String(filters.duration_months));
  if (filters.source.length) params.set("source", filters.source.join(","));
  if (sort !== DEFAULT_SORT) params.set("sort", sort);
  if (page > 1) params.set("page", String(page));

  return params;
}

export default function InternshipsBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useAuthStore();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const filters = useMemo(() => parseFilters(searchParams), [searchParams]);
  const sort = (searchParams.get("sort") as SortValue) || DEFAULT_SORT;
  const page = Number(searchParams.get("page") ?? 1);

  const debouncedQuery = useDebounce(filters.q, 300);

  const updateUrl = (nextFilters: BrowseFilters, nextSort: SortValue, nextPage: number) => {
    const params = filtersToSearchParams(nextFilters, nextSort, nextPage);
    const query = params.toString();
    router.replace(`/internships${query ? `?${query}` : ""}`, { scroll: false });
  };

  const handleFiltersChange = (next: BrowseFilters) => {
    updateUrl(next, sort, 1); // any filter change resets to page 1
  };

  const handleSortChange = (next: SortValue) => {
    updateUrl(filters, next, 1);
  };

  const handlePageChange = (next: number) => {
    updateUrl(filters, sort, next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const apiParams: InternshipListParams = {
    page,
    search: debouncedQuery || undefined,
    domain: filters.domain.length ? filters.domain : undefined,
    work_type: filters.work_type.length ? filters.work_type : undefined,
    city: filters.location.length ? filters.location : undefined,
    source__name: filters.source.length ? filters.source : undefined,
    stipend_min: filters.stipend[0] > 0 ? filters.stipend[0] : undefined,
    stipend_max: filters.stipend[1] < 50000 ? filters.stipend[1] : undefined,
    duration_months: filters.duration_months ?? undefined,
    // Not exposed in the sidebar UI, but read directly from the URL so
    // links from elsewhere (e.g. the landing page's "#Python" tag) work.
    skills: searchParams.get("skills") ?? undefined,
    ordering: sort,
  };

  const { data, isLoading, isFetching } = useInternships(apiParams);
  const { data: sources } = useInternshipSources();
  const savedIds = useSavedInternshipIds(isAuthenticated);

  const results = data?.results ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / 20));

  const sidebar = (
    <FilterSidebar
      filters={filters}
      onChange={handleFiltersChange}
      sources={sources ?? []}
    />
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Browse Internships</h1>
        <p className="mt-1 text-sm text-slate">
          Filter by domain, location, and stipend to find your match.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[16rem_1fr]">
        <aside className="hidden lg:block">
          <div className="sticky top-24">{sidebar}</div>
        </aside>

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-medium text-ink-soft">
              {isLoading ? "Loading…" : `Showing ${totalCount} internship${totalCount === 1 ? "" : "s"}`}
            </p>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(true)}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm font-semibold text-ink-soft hover:border-ink-soft lg:hidden"
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filter
              </button>

              <select
                value={sort}
                onChange={(event) => handleSortChange(event.target.value as SortValue)}
                className="rounded-lg border border-border bg-paper-raised px-3 py-1.5 text-sm font-medium text-ink focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
                aria-label="Sort internships"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 12 }).map((_, i) => (
                <InternshipCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-paper-raised px-6 py-16 text-center">
              <p className="font-display text-lg font-semibold text-ink">
                No internships match those filters
              </p>
              <p className="mt-1 text-sm text-slate">
                Try widening your search or clearing a few filters.
              </p>
            </div>
          ) : (
            <div
              className={`grid grid-cols-1 gap-4 sm:grid-cols-2 ${isFetching ? "opacity-60" : ""}`}
            >
              {results.map((internship) => (
                <InternshipCard
                  key={internship.id}
                  internship={internship}
                  initiallySaved={savedIds.has(internship.id)}
                />
              ))}
            </div>
          )}

          <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
        </div>
      </div>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileFiltersOpen(false)}
          />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-paper-raised p-5 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <span className="font-display text-base font-semibold text-ink">Filters</span>
              <button
                type="button"
                onClick={() => setMobileFiltersOpen(false)}
                aria-label="Close filters"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-soft hover:bg-paper"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            {sidebar}
            <button
              type="button"
              onClick={() => setMobileFiltersOpen(false)}
              className="mt-6 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white"
            >
              Show {totalCount} results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
