"use client";

import { Search } from "lucide-react";

import { STATUS_META, STATUS_ORDER } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/types";

export interface TrackerFilters {
  search: string;
  status: ApplicationStatus | "";
  dateFrom: string;
  dateTo: string;
  sort: "newest" | "oldest" | "company";
}

export const emptyTrackerFilters: TrackerFilters = {
  search: "",
  status: "",
  dateFrom: "",
  dateTo: "",
  sort: "newest",
};

export default function ApplicationFilters({
  filters,
  onChange,
}: {
  filters: TrackerFilters;
  onChange: (next: TrackerFilters) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex min-w-[14rem] flex-1 items-center gap-2 rounded-lg border border-border bg-paper-raised px-3 py-2">
        <Search className="h-4 w-4 shrink-0 text-slate" />
        <input
          type="text"
          value={filters.search}
          onChange={(event) => onChange({ ...filters, search: event.target.value })}
          placeholder="Search company or role…"
          className="w-full bg-transparent text-sm text-ink placeholder:text-slate/60 focus:outline-none"
        />
      </div>

      <select
        value={filters.status}
        onChange={(event) =>
          onChange({ ...filters, status: event.target.value as ApplicationStatus | "" })
        }
        className="rounded-lg border border-border bg-paper-raised px-3 py-2 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
      >
        <option value="">All statuses</option>
        {STATUS_ORDER.map((status) => (
          <option key={status} value={status}>
            {STATUS_META[status].label}
          </option>
        ))}
      </select>

      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={filters.dateFrom}
          onChange={(event) => onChange({ ...filters, dateFrom: event.target.value })}
          aria-label="Applied from"
          className="rounded-lg border border-border bg-paper-raised px-2.5 py-2 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
        />
        <span className="text-xs text-slate">to</span>
        <input
          type="date"
          value={filters.dateTo}
          onChange={(event) => onChange({ ...filters, dateTo: event.target.value })}
          aria-label="Applied to"
          className="rounded-lg border border-border bg-paper-raised px-2.5 py-2 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
        />
      </div>

      <select
        value={filters.sort}
        onChange={(event) =>
          onChange({ ...filters, sort: event.target.value as TrackerFilters["sort"] })
        }
        className="rounded-lg border border-border bg-paper-raised px-3 py-2 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
      >
        <option value="newest">Newest first</option>
        <option value="oldest">Oldest first</option>
        <option value="company">Company A-Z</option>
      </select>
    </div>
  );
}
