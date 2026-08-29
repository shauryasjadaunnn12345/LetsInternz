"use client";

import { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Input, Label } from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function DeleteAccountModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { logout } = useAuthStore();

  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const canDelete = confirmText === "DELETE" && password.length > 0 && !isDeleting;

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) {
      setConfirmText("");
      setPassword("");
      setError(null);
    }
    onOpenChange(nextOpen);
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await authApi.deleteAccount(password);
      // Account is already gone server-side — just clear local state and
      // leave, rather than calling the (now pointless) logout endpoint.
      await logout();
      router.push("/");
    } catch (err) {
      if (err instanceof AxiosError && err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError("Couldn't delete your account. Please try again.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Modal open={open} onOpenChange={handleClose} title="Delete your account">
      <p className="text-sm leading-relaxed text-ink-soft">
        This permanently deletes your account, profile, applications, and
        saved internships. <strong>This can&apos;t be undone.</strong>
      </p>

      {error && (
        <div className="mt-4 rounded-lg border border-coral/30 bg-coral/10 px-3.5 py-2.5 text-sm font-medium text-coral">
          {error}
        </div>
      )}

      <div className="mt-5 space-y-4">
        <div>
          <Label htmlFor="delete-password">Confirm your password</Label>
          <Input
            id="delete-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="delete-confirm">
            Type <span className="font-mono font-bold text-coral">DELETE</span> to confirm
          </Label>
          <Input
            id="delete-confirm"
            type="text"
            value={confirmText}
            onChange={(event) => setConfirmText(event.target.value)}
          />
        </div>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <button
          type="button"
          onClick={() => handleClose(false)}
          className="rounded-lg px-4 py-2.5 text-sm font-semibold text-ink-soft hover:text-ink"
        >
          Cancel
        </button>
        <button
          type="button"
          disabled={!canDelete}
          onClick={handleDelete}
          className="rounded-lg bg-coral px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-coral/90 disabled:opacity-50"
        >
          {isDeleting ? "Deleting…" : "Delete my account"}
        </button>
      </div>
    </Modal>
  );
}
