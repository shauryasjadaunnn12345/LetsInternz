"use client";

import { X } from "lucide-react";

import DualRangeSlider from "@/components/internships/DualRangeSlider";
import { Input, Label } from "@/components/ui/Field";
import {
  BROWSE_CITY_OPTIONS,
  DOMAIN_OPTIONS,
  DURATION_OPTIONS,
  WORK_TYPE_OPTIONS,
} from "@/lib/constants";
import type { Domain, InternshipSource, WorkType } from "@/lib/types";

export interface BrowseFilters {
  q: string;
  location: string[];
  domain: Domain[];
  work_type: WorkType[];
  stipend: [number, number];
  duration_months: number | null;
  source: string[];
}

const STIPEND_MIN = 0;
const STIPEND_MAX = 50000;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export const EMPTY_FILTERS: BrowseFilters = {
  q: "",
  location: [],
  domain: [],
  work_type: [],
  stipend: [STIPEND_MIN, STIPEND_MAX],
  duration_months: null,
  source: [],
};

export default function FilterSidebar({
  filters,
  onChange,
  sources,
}: {
  filters: BrowseFilters;
  onChange: (next: BrowseFilters) => void;
  sources: InternshipSource[];
}) {
  const hasActiveFilters =
    filters.q !== "" ||
    filters.location.length > 0 ||
    filters.domain.length > 0 ||
    filters.work_type.length > 0 ||
    filters.source.length > 0 ||
    filters.duration_months !== null ||
    filters.stipend[0] !== STIPEND_MIN ||
    filters.stipend[1] !== STIPEND_MAX;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-sm font-semibold text-ink">Filters</h2>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="flex items-center gap-1 text-xs font-semibold text-coral hover:underline"
          >
            <X className="h-3 w-3" />
            Clear all filters
          </button>
        )}
      </div>

      <div>
        <Label htmlFor="keyword">Keyword</Label>
        <Input
          id="keyword"
          type="text"
          placeholder="Job title, company, skill…"
          value={filters.q}
          onChange={(event) => onChange({ ...filters, q: event.target.value })}
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Location</legend>
        <div className="space-y-1.5">
          {BROWSE_CITY_OPTIONS.map((city) => (
            <label key={city} className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-ink focus:ring-marigold-dark/40"
                checked={filters.location.includes(city)}
                onChange={() => onChange({ ...filters, location: toggle(filters.location, city) })}
              />
              {city}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Domain</legend>
        <div className="space-y-1.5">
          {DOMAIN_OPTIONS.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-ink focus:ring-marigold-dark/40"
                checked={filters.domain.includes(option.value)}
                onChange={() =>
                  onChange({ ...filters, domain: toggle(filters.domain, option.value) })
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Work type</legend>
        <div className="flex flex-wrap gap-2">
          {WORK_TYPE_OPTIONS.map((option) => {
            const checked = filters.work_type.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange({ ...filters, work_type: toggle(filters.work_type, option.value) })
                }
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  checked
                    ? "border-marigold-dark bg-marigold text-ink"
                    : "border-border bg-paper-raised text-ink-soft hover:border-ink-soft"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <div>
        <Label>Stipend range (₹/month)</Label>
        <DualRangeSlider
          min={STIPEND_MIN}
          max={STIPEND_MAX}
          step={1000}
          value={filters.stipend}
          onChange={(stipend) => onChange({ ...filters, stipend })}
        />
      </div>

      <fieldset>
        <legend className="mb-1.5 text-sm font-medium text-ink">Duration</legend>
        <div className="space-y-1.5">
          {DURATION_OPTIONS.map((option) => (
            <label key={option.months} className="flex items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-border text-ink focus:ring-marigold-dark/40"
                checked={filters.duration_months === option.months}
                onChange={() =>
                  onChange({
                    ...filters,
                    duration_months:
                      filters.duration_months === option.months ? null : option.months,
                  })
                }
              />
              {option.label}
            </label>
          ))}
        </div>
      </fieldset>

      {sources.length > 0 && (
        <fieldset>
          <legend className="mb-1.5 text-sm font-medium text-ink">Source platform</legend>
          <div className="max-h-48 space-y-1.5 overflow-y-auto">
            {sources.map((source) => (
              <label key={source.id} className="flex items-center gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-border text-ink focus:ring-marigold-dark/40"
                  checked={filters.source.includes(source.name)}
                  onChange={() =>
                    onChange({ ...filters, source: toggle(filters.source, source.name) })
                  }
                />
                {source.name}
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </div>
  );
}
