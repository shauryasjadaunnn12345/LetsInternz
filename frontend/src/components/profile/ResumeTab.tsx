"use client";

import { FileText, Upload } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";

import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";

const MAX_SIZE = 5 * 1024 * 1024; // 5MB

function filenameFromUrl(url: string) {
  try {
    const path = new URL(url).pathname;
    return decodeURIComponent(path.split("/").pop() || "resume.pdf");
  } catch {
    return "resume.pdf";
  }
}

export default function ResumeTab({
  onSaved,
}: {
  onSaved: (message: string, variant?: "success" | "error") => void;
}) {
  const { profile, updateProfile } = useAuthStore();
  const inputRef = useRef<HTMLInputElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (file: File) => {
    setError(null);

    if (file.type !== "application/pdf") {
      setError("Resume must be a PDF file.");
      return;
    }
    if (file.size > MAX_SIZE) {
      setError("Resume must be 5MB or smaller.");
      return;
    }

    setUploadProgress(0);
    try {
      await authApi.uploadResume(file, setUploadProgress);
      const freshProfile = await authApi.getProfile();
      updateProfile(freshProfile);
      onSaved("Resume uploaded successfully.");
    } catch {
      onSaved("Upload failed — please try again.", "error");
    } finally {
      setUploadProgress(null);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  };

  return (
    <div className="space-y-5">
      {profile?.resume && (
        <div className="flex items-center justify-between rounded-lg border border-border bg-paper-raised px-4 py-3">
          <span className="flex items-center gap-2 text-sm text-ink-soft">
            <FileText className="h-4 w-4 text-teal" />
            {filenameFromUrl(profile.resume)}
          </span>
          <a
            href={profile.resume}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-semibold text-ink hover:text-marigold-dark"
          >
            Preview
          </a>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) uploadFile(file);
        }}
      />

      <div
        onDragOver={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-10 text-center transition-colors ${
          isDragging
            ? "border-marigold-dark bg-marigold/10"
            : "border-border bg-paper-raised hover:border-ink-soft"
        }`}
      >
        <Upload className="h-6 w-6 text-slate" />
        <p className="text-sm font-medium text-ink">
          Drag and drop your resume, or click to browse
        </p>
        <p className="text-xs text-slate">PDF only, max 5MB</p>
      </div>

      {uploadProgress !== null && (
        <div>
          <div className="h-2 overflow-hidden rounded-full bg-paper-raised">
            <div
              className="h-full rounded-full bg-marigold-dark transition-[width]"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-slate">Uploading… {uploadProgress}%</p>
        </div>
      )}

      {error && <p className="text-sm text-coral">{error}</p>}
    </div>
  );
}
