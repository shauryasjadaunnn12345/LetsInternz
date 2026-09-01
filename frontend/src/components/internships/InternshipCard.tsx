"use client";

import { Bookmark, MapPin } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import InternshipLogo from "@/components/internships/InternshipLogo";
import { savedApi } from "@/lib/api";
import { isPublicBrowsingEnabled } from "@/lib/publicBrowsing";
import { sourceColor } from "@/lib/sourceColor";
import type { Internship } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const diffMs = new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

const WORK_TYPE_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

export default function InternshipCard({
  internship,
  initiallySaved = false,
}: {
  internship: Internship;
  initiallySaved?: boolean;
}) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [saved, setSaved] = useState(initiallySaved);
  const [isToggling, setIsToggling] = useState(false);

  const handleToggleSave = async () => {
    // TEMPORARY: Public browsing mode keeps save actions available without blocking users.
    if (!isAuthenticated && !isPublicBrowsingEnabled()) {
      return;
    }
    if (isToggling) return;

    setIsToggling(true);
    const previous = saved;
    setSaved(!previous); // optimistic
    try {
      const result = await savedApi.toggle(internship.id);
      setSaved(result.saved);
    } catch {
      setSaved(previous); // revert on failure
    } finally {
      setIsToggling(false);
    }
  };

  const skills = internship.skills_required ?? [];
  const visibleSkills = skills.slice(0, 3);
  const extraSkillCount = skills.length - visibleSkills.length;

  const remainingDays = daysUntil(internship.deadline);
  const isUrgent = remainingDays !== null && remainingDays <= 3;

  const source = sourceColor(internship.source_name ?? internship.source?.name ?? "");

  return (
    <div className="flex flex-col rounded-xl border border-border bg-paper-raised p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <InternshipLogo logoUrl={internship.company_logo_url} company={internship.company} />
          <div>
            <Link href={`/internships/${internship.id}`} className="hover:text-marigold-dark">
              <h3 className="font-display text-base font-semibold leading-snug text-ink">
                {internship.title}
              </h3>
            </Link>
            <p className="text-sm font-semibold text-ink-soft">{internship.company}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleSave}
          aria-label={saved ? "Unsave internship" : "Save internship"}
          aria-pressed={saved}
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${
            saved
              ? "border-marigold-dark bg-marigold text-ink"
              : "border-border text-slate hover:border-ink-soft hover:text-ink"
          }`}
        >
          <Bookmark className="h-4 w-4" fill={saved ? "currentColor" : "none"} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        {(internship.source_name ?? internship.source?.name) && (
          <span
            className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${source.bg} ${source.text}`}
          >
            {internship.source_name ?? internship.source?.name}
          </span>
        )}
        <span className="flex items-center gap-1 rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">
          <MapPin className="h-3 w-3" />
          {internship.city || internship.location}
        </span>
        <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">
          {WORK_TYPE_LABEL[internship.work_type] ?? internship.work_type}
        </span>
      </div>

      <div className="mt-3 flex items-center justify-between text-sm">
        <span className="font-semibold text-teal">
          {internship.is_unpaid ? "Unpaid" : internship.stipend_display || "Stipend N/A"}
        </span>
        <span className="text-slate">{internship.duration}</span>
      </div>

      {skills.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {visibleSkills.map((skill) => (
            <span
              key={skill}
              className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-ink-soft"
            >
              {skill}
            </span>
          ))}
          {extraSkillCount > 0 && (
            <span className="rounded-full border border-border px-2 py-0.5 text-xs font-medium text-slate">
              +{extraSkillCount} more
            </span>
          )}
        </div>
      )}

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
        {remainingDays !== null ? (
          <span
            className={`text-xs font-semibold ${isUrgent ? "text-coral" : "text-slate"}`}
          >
            {remainingDays < 0
              ? "Deadline passed"
              : remainingDays === 0
                ? "Deadline today"
                : `${remainingDays} day${remainingDays === 1 ? "" : "s"} left`}
          </span>
        ) : (
          <span className="text-xs text-slate">No deadline listed</span>
        )}

        <Link
          href={`/internships/${internship.id}`}
          className="flex items-center gap-1 text-sm font-semibold text-ink hover:text-marigold-dark"
        >
          View Details →
        </Link>
      </div>
    </div>
  );
}
