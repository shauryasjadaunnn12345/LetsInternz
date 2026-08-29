"use client";

import Toggle from "@/components/ui/Toggle";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function PrivacySettings({
  onSaved,
}: {
  onSaved: (message: string, variant?: "success" | "error") => void;
}) {
  const { profile, updateProfile } = useAuthStore();

  const handleToggle = async (checked: boolean) => {
    try {
      const updated = await authApi.updateProfile({ is_profile_public: checked });
      updateProfile(updated);
      onSaved("Privacy settings updated.");
    } catch {
      onSaved("Couldn't save — please try again.", "error");
    }
  };

  return (
    <section className="rounded-xl border border-border bg-paper-raised p-6">
      <h2 className="font-display text-base font-semibold text-ink">Privacy Settings</h2>

      <div className="mt-4">
        <Toggle
          label="Profile visibility"
          description="When on, recruiters browsing LetsInternz can view your public profile summary. Your contact details stay private either way."
          checked={profile?.is_profile_public ?? false}
          onChange={handleToggle}
        />
      </div>
    </section>
  );
}
