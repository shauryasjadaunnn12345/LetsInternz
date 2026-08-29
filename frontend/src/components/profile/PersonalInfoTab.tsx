"use client";

import { useState } from "react";

import { Input, Label } from "@/components/ui/Field";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028];

export default function PersonalInfoTab({
  onSaved,
}: {
  onSaved: (message: string, variant?: "success" | "error") => void;
}) {
  const { profile, updateProfile } = useAuthStore();

  const [form, setForm] = useState({
    full_name: profile?.full_name ?? "",
    phone: profile?.phone ?? "",
    college: profile?.college ?? "",
    branch: profile?.branch ?? "",
    graduation_year: profile?.graduation_year ?? "",
    cgpa: profile?.cgpa ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile({
        full_name: form.full_name,
        phone: form.phone,
        college: form.college,
        branch: form.branch,
        graduation_year: form.graduation_year === "" ? null : Number(form.graduation_year),
        cgpa: form.cgpa === "" ? null : String(form.cgpa),
      });
      updateProfile(updated);
      onSaved("Personal info saved.");
    } catch {
      onSaved("Couldn't save — please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          type="text"
          value={form.full_name}
          onChange={(event) => setForm({ ...form, full_name: event.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          type="tel"
          value={form.phone}
          onChange={(event) => setForm({ ...form, phone: event.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="college">College</Label>
        <Input
          id="college"
          type="text"
          value={form.college}
          onChange={(event) => setForm({ ...form, college: event.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="branch">Branch</Label>
        <Input
          id="branch"
          type="text"
          value={form.branch}
          onChange={(event) => setForm({ ...form, branch: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="graduation_year">Graduation year</Label>
          <select
            id="graduation_year"
            value={form.graduation_year}
            onChange={(event) => setForm({ ...form, graduation_year: event.target.value })}
            className="w-full rounded-lg border border-border bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
          >
            <option value="">Select</option>
            {GRADUATION_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="cgpa">CGPA</Label>
          <Input
            id="cgpa"
            type="number"
            step="0.01"
            min={0}
            max={10}
            value={form.cgpa}
            onChange={(event) => setForm({ ...form, cgpa: event.target.value })}
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
