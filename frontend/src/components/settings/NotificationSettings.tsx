"use client";

import { useState } from "react";

import Toggle from "@/components/ui/Toggle";
import { authApi } from "@/lib/api";
import type { Profile } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

const DIGEST_OPTIONS: { value: Profile["email_digest"]; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "never", label: "Never" },
];

export default function NotificationSettings({
  onSaved,
}: {
  onSaved: (message: string, variant?: "success" | "error") => void;
}) {
  const { profile, updateProfile } = useAuthStore();

  const save = async (partial: Partial<Profile>) => {
    try {
      const updated = await authApi.updateProfile(partial);
      updateProfile(updated);
      onSaved("Notification settings updated.");
    } catch {
      onSaved("Couldn't save — please try again.", "error");
    }
  };

  const [digest, setDigest] = useState(profile?.email_digest ?? "weekly");

  return (
    <section className="rounded-xl border border-border bg-paper-raised p-6">
      <h2 className="font-display text-base font-semibold text-ink">
        Notification Settings
      </h2>

      <div className="mt-4 border-b border-border pb-4">
        <label htmlFor="email-digest" className="mb-1.5 block text-sm font-medium text-ink">
          Email digest
        </label>
        <select
          id="email-digest"
          value={digest}
          onChange={(event) => {
            const value = event.target.value as Profile["email_digest"];
            setDigest(value);
            save({ email_digest: value });
          }}
          className="w-full max-w-xs rounded-lg border border-border bg-paper px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
        >
          {DIGEST_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="divide-y divide-border">
        <Toggle
          label="Deadline reminders"
          description="Get notified when a saved internship's deadline is 7 days out."
          checked={profile?.deadline_reminders_enabled ?? true}
          onChange={(checked) => save({ deadline_reminders_enabled: checked })}
        />
        <Toggle
          label="New matching internships"
          description="Alerts when a new listing matches your skills and preferences."
          checked={profile?.new_matches_alert_enabled ?? true}
          onChange={(checked) => save({ new_matches_alert_enabled: checked })}
        />
        <Toggle
          label="Application status change alerts"
          description="Email when an application you're tracking changes status."
          checked={profile?.application_status_alerts_enabled ?? true}
          onChange={(checked) => save({ application_status_alerts_enabled: checked })}
        />
      </div>
    </section>
  );
}
