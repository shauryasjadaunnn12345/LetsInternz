"use client";

import { useState } from "react";

import { Input, Label } from "@/components/ui/Field";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function LinksTab({
  onSaved,
}: {
  onSaved: (message: string, variant?: "success" | "error") => void;
}) {
  const { profile, updateProfile } = useAuthStore();

  const [form, setForm] = useState({
    linkedin_url: profile?.linkedin_url ?? "",
    github_url: profile?.github_url ?? "",
    portfolio_url: profile?.portfolio_url ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await authApi.updateProfile(form);
      updateProfile(updated);
      onSaved("Links saved.");
    } catch {
      onSaved("Couldn't save — please check the URLs and try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
        <Input
          id="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/in/your-name"
          value={form.linkedin_url}
          onChange={(event) => setForm({ ...form, linkedin_url: event.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="github_url">GitHub URL</Label>
        <Input
          id="github_url"
          type="url"
          placeholder="https://github.com/your-name"
          value={form.github_url}
          onChange={(event) => setForm({ ...form, github_url: event.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="portfolio_url">Portfolio URL</Label>
        <Input
          id="portfolio_url"
          type="url"
          placeholder="https://your-portfolio.com"
          value={form.portfolio_url}
          onChange={(event) => setForm({ ...form, portfolio_url: event.target.value })}
        />
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
