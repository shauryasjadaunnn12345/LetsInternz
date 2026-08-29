"use client";

import AccountSettings from "@/components/settings/AccountSettings";
import NotificationSettings from "@/components/settings/NotificationSettings";
import PrivacySettings from "@/components/settings/PrivacySettings";
import { useToast } from "@/components/ui/Toast";

export default function SettingsPage() {
  const { showToast, ToastViewport } = useToast();

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>

      <NotificationSettings onSaved={showToast} />
      <AccountSettings onSaved={showToast} />
      <PrivacySettings onSaved={showToast} />

      <ToastViewport />
    </div>
  );
}
