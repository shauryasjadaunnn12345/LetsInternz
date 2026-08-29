"use client";

import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import DeadlineAlertBanner from "@/components/saved/DeadlineAlertBanner";
import SavedEmptyState from "@/components/saved/SavedEmptyState";
import SavedInternshipCard from "@/components/saved/SavedInternshipCard";
import { useDeadlineAlerts, useSavedInternships } from "@/hooks/useSaved";
import type { SavedInternship } from "@/lib/types";

type SortValue = "saved_date" | "deadline" | "company";

function sortSaved(items: SavedInternship[], sort: SortValue): SavedInternship[] {
  const sorted = [...items];
  if (sort === "company") {
    sorted.sort((a, b) => a.internship.company.localeCompare(b.internship.company));
  } else if (sort === "deadline") {
    sorted.sort((a, b) => {
      if (!a.internship.deadline) return 1;
      if (!b.internship.deadline) return -1;
      return (
        new Date(a.internship.deadline).getTime() - new Date(b.internship.deadline).getTime()
      );
    });
  } else {
    sorted.sort((a, b) => new Date(b.saved_at).getTime() - new Date(a.saved_at).getTime());
  }
  return sorted;
}

export default function SavedInternshipsPage() {
  const { data: saved, isLoading } = useSavedInternships();
  const { data: deadlineAlerts } = useDeadlineAlerts();

  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortValue>("saved_date");

  const filtered = useMemo(() => {
    if (!saved) return [];
    const base = query
      ? saved.filter(
          (item) =>
            item.internship.title.toLowerCase().includes(query.toLowerCase()) ||
            item.internship.company.toLowerCase().includes(query.toLowerCase())
        )
      : saved;
    return sortSaved(base, sort);
  }, [saved, query, sort]);

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">
          Saved Internships
          <span className="ml-2 text-base font-medium text-slate">
            ({saved?.length ?? 0})
          </span>
        </h1>
        <p className="mt-1 text-sm text-slate">
          Everything you&apos;ve bookmarked while browsing, in one place.
        </p>
      </div>

      <DeadlineAlertBanner alerts={deadlineAlerts} />

      {!isLoading && (saved?.length ?? 0) > 0 && (
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex min-w-[14rem] flex-1 items-center gap-2 rounded-lg border border-border bg-paper-raised px-3 py-2">
            <Search className="h-4 w-4 shrink-0 text-slate" />
            <input
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search saved internships…"
              className="w-full bg-transparent text-sm text-ink placeholder:text-slate/60 focus:outline-none"
            />
          </div>

          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as SortValue)}
            className="rounded-lg border border-border bg-paper-raised px-3 py-2 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
          >
            <option value="saved_date">Saved date</option>
            <option value="deadline">Deadline</option>
            <option value="company">Company</option>
          </select>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <p className="text-sm text-slate">Loading your saved internships…</p>
        </div>
      ) : (saved?.length ?? 0) === 0 ? (
        <SavedEmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <SavedInternshipCard key={item.id} saved={item} />
          ))}
        </div>
      )}
    </div>
  );
}
