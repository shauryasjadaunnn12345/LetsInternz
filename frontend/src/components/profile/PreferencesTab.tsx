"use client";

import { useState } from "react";

import DualRangeSlider from "@/components/internships/DualRangeSlider";
import { Label } from "@/components/ui/Field";
import SearchableMultiSelect from "@/components/ui/SearchableMultiSelect";
import TagInput from "@/components/ui/TagInput";
import { authApi } from "@/lib/api";
import { DOMAIN_OPTIONS, PROFILE_LOCATION_OPTIONS, WORK_TYPE_OPTIONS } from "@/lib/constants";
import type { Domain, WorkType } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

const MIN_STIPEND = 0;
const MAX_STIPEND = 50000;

function toggle<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

export default function PreferencesTab({
  onSaved,
}: {
  onSaved: (message: string, variant?: "success" | "error") => void;
}) {
  const { profile, updateProfile } = useAuthStore();

  const [skills, setSkills] = useState<string[]>(profile?.skills ?? []);
  const [domains, setDomains] = useState<Domain[]>(
    (profile?.preferred_domains as Domain[]) ?? []
  );
  const [workTypes, setWorkTypes] = useState<WorkType[]>(
    (profile?.preferred_work_types as WorkType[]) ?? []
  );
  const [locations, setLocations] = useState<string[]>(profile?.preferred_locations ?? []);
  const [stipendRange, setStipendRange] = useState<[number, number]>([
    profile?.expected_stipend_min ?? MIN_STIPEND,
    profile?.expected_stipend_max ?? MAX_STIPEND,
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        skills,
        preferred_domains: domains,
        preferred_work_types: workTypes,
        preferred_locations: locations,
        expected_stipend_min: stipendRange[0],
        expected_stipend_max: stipendRange[1],
      });
      updateProfile(updated);
      onSaved("Preferences saved.");
    } catch {
      onSaved("Couldn't save — please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Label htmlFor="skills-input">Skills</Label>
        <TagInput value={skills} onChange={setSkills} placeholder="Type a skill and press Enter" />
      </div>

      <div>
        <Label>Preferred domains</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {DOMAIN_OPTIONS.map((option) => {
            const checked = domains.includes(option.value);
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
                  onChange={() => setDomains(toggle(domains, option.value))}
                />
                {option.label}
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <Label>Preferred work types</Label>
        <div className="flex flex-wrap gap-2">
          {WORK_TYPE_OPTIONS.map((option) => {
            const checked = workTypes.includes(option.value);
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setWorkTypes(toggle(workTypes, option.value))}
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
        <SearchableMultiSelect
          value={locations}
          onChange={setLocations}
          options={PROFILE_LOCATION_OPTIONS}
          placeholder="Search cities…"
        />
      </div>

      <div>
        <Label>Expected stipend range</Label>
        <div className="rounded-lg border border-border bg-paper-raised px-4 py-4">
          <div className="mb-2 flex justify-between text-sm font-semibold text-ink">
            <span>₹{stipendRange[0].toLocaleString("en-IN")}</span>
            <span>₹{stipendRange[1].toLocaleString("en-IN")}</span>
          </div>
          <DualRangeSlider
            min={MIN_STIPEND}
            max={MAX_STIPEND}
            step={1000}
            value={stipendRange}
            onChange={setStipendRange}
          />
        </div>
      </div>

      <button
        type="button"
        disabled={isSaving}
        onClick={handleSave}
        className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
      >
        {isSaving ? "Saving…" : "Save"}
      </button>
    </div>
  );
}
