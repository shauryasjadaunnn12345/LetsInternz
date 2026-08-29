"use client";

import { FileText, Upload, User as UserIcon, X } from "lucide-react";
import { useRef } from "react";

import { FieldError, Input, Label } from "@/components/ui/Field";

const MAX_RESUME_SIZE = 5 * 1024 * 1024; // 5MB

export interface LinksData {
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  resume: File | null;
  avatar: File | null;
}

export default function LinksStep({
  data,
  onChange,
  resumeError,
  setResumeError,
}: {
  data: LinksData;
  onChange: (next: LinksData) => void;
  resumeError: string | null;
  setResumeError: (message: string | null) => void;
}) {
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const handleResumeSelect = (file: File | undefined) => {
    if (!file) return;
    if (file.type !== "application/pdf") {
      setResumeError("Resume must be a PDF file.");
      return;
    }
    if (file.size > MAX_RESUME_SIZE) {
      setResumeError("Resume must be 5MB or smaller.");
      return;
    }
    setResumeError(null);
    onChange({ ...data, resume: file });
  };

  const handleAvatarSelect = (file: File | undefined) => {
    if (!file) return;
    onChange({ ...data, avatar: file });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="linkedin_url">LinkedIn URL</Label>
        <Input
          id="linkedin_url"
          type="url"
          placeholder="https://linkedin.com/in/your-name"
          value={data.linkedin_url}
          onChange={(event) => onChange({ ...data, linkedin_url: event.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="github_url">GitHub URL</Label>
        <Input
          id="github_url"
          type="url"
          placeholder="https://github.com/your-name"
          value={data.github_url}
          onChange={(event) => onChange({ ...data, github_url: event.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="portfolio_url">Portfolio URL</Label>
        <Input
          id="portfolio_url"
          type="url"
          placeholder="https://your-portfolio.com"
          value={data.portfolio_url}
          onChange={(event) => onChange({ ...data, portfolio_url: event.target.value })}
        />
      </div>

      <div>
        <Label>Resume (PDF, max 5MB)</Label>
        <input
          ref={resumeInputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(event) => handleResumeSelect(event.target.files?.[0])}
        />
        {data.resume ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-paper-raised px-3.5 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-ink-soft">
              <FileText className="h-4 w-4 text-teal" />
              {data.resume.name}
            </span>
            <button
              type="button"
              onClick={() => onChange({ ...data, resume: null })}
              aria-label="Remove resume"
              className="text-slate hover:text-coral"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => resumeInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-paper-raised px-3.5 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft"
          >
            <Upload className="h-4 w-4" />
            Upload resume
          </button>
        )}
        <FieldError>{resumeError}</FieldError>
      </div>

      <div>
        <Label>Avatar (optional)</Label>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(event) => handleAvatarSelect(event.target.files?.[0])}
        />
        {data.avatar ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-paper-raised px-3.5 py-2.5 text-sm">
            <span className="flex items-center gap-2 text-ink-soft">
              <UserIcon className="h-4 w-4 text-teal" />
              {data.avatar.name}
            </span>
            <button
              type="button"
              onClick={() => onChange({ ...data, avatar: null })}
              aria-label="Remove avatar"
              className="text-slate hover:text-coral"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border bg-paper-raised px-3.5 py-3 text-sm font-medium text-ink-soft transition-colors hover:border-ink-soft"
          >
            <Upload className="h-4 w-4" />
            Upload avatar
          </button>
        )}
      </div>
    </div>
  );
}
