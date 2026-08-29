"use client";

import { Bookmark, Check, ClipboardList, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useApplications, useCreateApplication } from "@/hooks/useApplications";
import { useSavedInternshipIds } from "@/hooks/useInternships";
import { applicationsApi, savedApi } from "@/lib/api";
import type { Internship } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

export default function InternshipDetailActions({
  internship,
  onApplyClick,
}: {
  internship: Internship;
  onApplyClick?: () => void;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { data: applications } = useApplications();
  const createApplication = useCreateApplication();

  // The page itself is fetched server-side with no user context (so the
  // API can't tell us "is this saved" as part of the initial internship
  // payload — see lib/getInternship.ts). Instead, cross-reference the same
  // saved-IDs cache the browse page uses. `savedOverride` holds this
  // user's own explicit toggle, taking precedence over the cache so the
  // button responds instantly rather than waiting on a refetch.
  const savedIds = useSavedInternshipIds(isAuthenticated);
  const [savedOverride, setSavedOverride] = useState<boolean | null>(null);
  const saved = savedOverride ?? savedIds.has(internship.id);
  const [isTogglingSave, setIsTogglingSave] = useState(false);

  const alreadyTracked =
    applications?.some((application) => application.internship?.id === internship.id) ?? false;

  const requireAuth = () => {
    if (!isAuthenticated) {
      router.push(`/login?next=/internships/${internship.id}`);
      return true;
    }
    return false;
  };

  const handleToggleSave = async () => {
    if (requireAuth() || isTogglingSave) return;
    setIsTogglingSave(true);
    const previous = saved;
    setSavedOverride(!previous);
    try {
      const result = await savedApi.toggle(internship.id);
      setSavedOverride(result.saved);
    } catch {
      setSavedOverride(previous);
    } finally {
      setIsTogglingSave(false);
    }
  };

  const handleTrack = () => {
    if (requireAuth() || alreadyTracked || createApplication.isPending) return;
    createApplication.mutate({ internship_id: internship.id });
  };

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <a
        href={internship.apply_link}
        target="_blank"
        rel="noopener noreferrer nofollow"
        onClick={() => {
          // Applying externally is a strong signal of intent — log it in
          // the tracker automatically if it isn't there already, so the
          // dashboard reflects reality without an extra click.
          if (isAuthenticated && !alreadyTracked) {
            applicationsApi.create({ internship_id: internship.id }).catch(() => {});
          }
          onApplyClick?.();
        }}
        className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-ink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-soft"
      >
        Apply on {internship.source_name ?? internship.source?.name ?? "source site"}
        <ExternalLink className="h-4 w-4" />
      </a>

      <button
        type="button"
        onClick={handleToggleSave}
        aria-pressed={saved}
        className={`flex items-center justify-center gap-2 rounded-lg border px-5 py-3 text-sm font-semibold transition-colors ${
          saved
            ? "border-marigold-dark bg-marigold text-ink"
            : "border-border bg-paper-raised text-ink-soft hover:border-ink-soft"
        }`}
      >
        <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        {saved ? "Saved" : "Save"}
      </button>

      <button
        type="button"
        onClick={handleTrack}
        disabled={alreadyTracked || createApplication.isPending}
        className="flex items-center justify-center gap-2 rounded-lg border border-border bg-paper-raised px-5 py-3 text-sm font-semibold text-ink-soft transition-colors hover:border-ink-soft disabled:opacity-70"
      >
        {alreadyTracked ? (
          <>
            <Check className="h-4 w-4 text-teal" />
            Tracked
          </>
        ) : (
          <>
            <ClipboardList className="h-4 w-4" />
            {createApplication.isPending ? "Adding…" : "Track Application"}
          </>
        )}
      </button>
    </div>
  );
}
