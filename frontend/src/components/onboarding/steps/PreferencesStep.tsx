"use client";

import { Label } from "@/components/ui/Field";
import TagInput from "@/components/ui/TagInput";
import type { Domain, WorkType } from "@/lib/types";

export interface PreferencesData {
  skills: string[];
  preferred_domains: Domain[];
  preferred_work_types: WorkType[];
  preferred_locations: string[];
}

const DOMAIN_OPTIONS: { value: Domain; label: string }[] = [
  { value: "tech", label: "Tech" },
  { value: "marketing", label: "Marketing" },
  { value: "design", label: "Design" },
  { value: "finance", label: "Finance" },
  { value: "data_science", label: "Data Science" },
  { value: "hr", label: "HR" },
  { value: "operations", label: "Operations" },
  { value: "content", label: "Content" },
  { value: "sales", label: "Sales" },
];

const WORK_TYPE_OPTIONS: { value: WorkType; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

const LOCATION_OPTIONS = [
  "Remote",
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Noida",
  "Gurugram",
];

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function PreferencesStep({
  data,
  onChange,
}: {
  data: PreferencesData;
  onChange: (next: PreferencesData) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="skills-input">Skills</Label>
        <TagInput
          value={data.skills}
          onChange={(skills) => onChange({ ...data, skills })}
          placeholder="e.g. Python — press Enter to add"
        />
      </div>

      <div>
        <Label>Preferred domains</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DOMAIN_OPTIONS.map((option) => {
            const checked = data.preferred_domains.includes(option.value);
            return (
              <label
                key={option.value}
                className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors ${
                  checked
                    ? "border-ink bg-ink text-white"
                    : "border-border bg-paper-raised text-ink-soft hover:border-ink-soft"
                }`}
              >
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={checked}
                  onChange={() =>
                    onChange({
                      ...data,
                      preferred_domains: toggle(data.preferred_domains, option.value),
                    })
                  }
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Preferred work type</Label>
        <div className="flex flex-wrap gap-2">
          {WORK_TYPE_OPTIONS.map((option) => {
            const checked = data.preferred_work_types.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    preferred_work_types: toggle(data.preferred_work_types, option.value),
                  })
                }
                className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
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
      </div>

      <div>
        <Label>Preferred locations</Label>
        <div className="flex flex-wrap gap-2">
          {LOCATION_OPTIONS.map((city) => {
            const checked = data.preferred_locations.includes(city);
            return (
              <button
                key={city}
                type="button"
                onClick={() =>
                  onChange({
                    ...data,
                    preferred_locations: toggle(data.preferred_locations, city),
                  })
                }
                className={`rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  checked
                    ? "border-teal bg-teal text-white"
                    : "border-border bg-paper-raised text-ink-soft hover:border-ink-soft"
                }`}
              >
                {city}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
