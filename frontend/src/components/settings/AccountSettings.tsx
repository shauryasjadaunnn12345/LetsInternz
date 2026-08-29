"use client";

import { AxiosError } from "axios";
import { useState } from "react";

import DeleteAccountModal from "@/components/settings/DeleteAccountModal";
import { Input, Label } from "@/components/ui/Field";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data?.old_password?.[0]) return data.old_password[0];
    if (data?.new_password?.[0]) return data.new_password[0];
    if (data?.new_password2?.[0]) return data.new_password2[0];
    if (data?.detail) return data.detail;
  }
  return "Something went wrong. Please try again.";
}

export default function AccountSettings({
  onSaved,
}: {
  onSaved: (message: string, variant?: "success" | "error") => void;
}) {
  const { user } = useAuthStore();

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
    new_password2: "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const handleChangePassword = async () => {
    setError(null);
    setIsSaving(true);
    try {
      await authApi.changePassword(passwordForm);
      setPasswordForm({ old_password: "", new_password: "", new_password2: "" });
      onSaved("Password updated.");
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      onSaved(message, "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section className="rounded-xl border border-border bg-paper-raised p-6">
      <h2 className="font-display text-base font-semibold text-ink">Account Settings</h2>

      <div className="mt-4 border-b border-border pb-6">
        <Label htmlFor="account-email">Email</Label>
        <Input id="account-email" type="email" value={user?.email ?? ""} disabled readOnly />
        <p className="mt-1.5 text-xs text-slate">
          Your email can&apos;t be changed from here — contact support if you need to update it.
        </p>
      </div>

      <div className="mt-6 border-b border-border pb-6">
        <h3 className="mb-3 text-sm font-semibold text-ink">Change password</h3>

        {error && (
          <div className="mb-3 rounded-lg border border-coral/30 bg-coral/10 px-3.5 py-2.5 text-sm font-medium text-coral">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <div>
            <Label htmlFor="old_password">Current password</Label>
            <Input
              id="old_password"
              type="password"
              autoComplete="current-password"
              value={passwordForm.old_password}
              onChange={(event) =>
                setPasswordForm({ ...passwordForm, old_password: event.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="new_password">New password</Label>
            <Input
              id="new_password"
              type="password"
              autoComplete="new-password"
              value={passwordForm.new_password}
              onChange={(event) =>
                setPasswordForm({ ...passwordForm, new_password: event.target.value })
              }
            />
          </div>
          <div>
            <Label htmlFor="new_password2">Confirm new password</Label>
            <Input
              id="new_password2"
              type="password"
              autoComplete="new-password"
              value={passwordForm.new_password2}
              onChange={(event) =>
                setPasswordForm({ ...passwordForm, new_password2: event.target.value })
              }
            />
          </div>
        </div>

        <button
          type="button"
          disabled={
            isSaving ||
            !passwordForm.old_password ||
            !passwordForm.new_password ||
            !passwordForm.new_password2
          }
          onClick={handleChangePassword}
          className="mt-4 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
        >
          {isSaving ? "Updating…" : "Update password"}
        </button>
      </div>

      <div className="mt-6">
        <h3 className="text-sm font-semibold text-coral">Delete account</h3>
        <p className="mt-1 text-xs text-slate">
          Permanently deletes your account, applications, saved internships, and profile.
          This can&apos;t be undone.
        </p>
        <button
          type="button"
          onClick={() => setIsDeleteModalOpen(true)}
          className="mt-3 rounded-lg border border-coral/40 px-5 py-2.5 text-sm font-semibold text-coral transition-colors hover:bg-coral/10"
        >
          Delete my account
        </button>
      </div>

      <DeleteAccountModal open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen} />
    </section>
  );
}
