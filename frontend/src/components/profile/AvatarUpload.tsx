"use client";

import { Camera } from "lucide-react";
import { useRef, useState } from "react";

import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

export default function AvatarUpload() {
  const { profile, user, updateProfile } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initial = (profile?.full_name || user?.username || "?").slice(0, 1).toUpperCase();

  const handleFileChange = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      await authApi.uploadAvatar(file);
      const freshProfile = await authApi.getProfile();
      updateProfile(freshProfile);
    } catch {
      setError("Upload failed — try a smaller image.");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full bg-ink/10 text-2xl font-bold text-ink">
          {profile?.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar URL is a remote S3/user-uploaded image, not a static asset
            <img src={profile.avatar} alt="Your avatar" className="h-full w-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          aria-label="Upload avatar"
          className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-paper-raised bg-marigold text-ink shadow-sm transition-colors hover:bg-marigold-dark disabled:opacity-60"
        >
          <Camera className="h-4 w-4" />
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleFileChange(event.target.files?.[0])}
        />
      </div>
      {isUploading && <p className="mt-2 text-xs text-slate">Uploading…</p>}
      {error && <p className="mt-2 text-xs text-coral">{error}</p>}
    </div>
  );
}
