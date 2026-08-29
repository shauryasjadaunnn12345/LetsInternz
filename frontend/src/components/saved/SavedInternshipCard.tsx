"use client";

import { format } from "date-fns";
import { Check, ClipboardPlus, ExternalLink, MapPin, Trash2 } from "lucide-react";
import { useState } from "react";

import { useCreateApplication } from "@/hooks/useApplications";
import { useRemoveSaved } from "@/hooks/useSaved";
import type { SavedInternship } from "@/lib/types";

const WORK_TYPE_LABEL: Record<string, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  onsite: "Onsite",
};

export default function SavedInternshipCard({ saved }: { saved: SavedInternship }) {
  const { internship } = saved;
  const removeSaved = useRemoveSaved();
  const createApplication = useCreateApplication();
  const [logoFailed, setLogoFailed] = useState(false);
  const [addedToTracker, setAddedToTracker] = useState(false);

  const skills = internship.skills_required ?? [];
  const visibleSkills = skills.slice(0, 3);
  const extraSkillCount = skills.length - visibleSkills.length;

  const handleRemove = () => {
    removeSaved.mutate(saved.id);
  };

  const handleAddToTracker = () => {
    createApplication.mutate(
      { internship_id: internship.id },
      { onSuccess: () => setAddedToTracker(true) }
    );
  };

  return (
    <div className="flex flex-col rounded-xl border border-border bg-paper-raised p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start gap-3">
        {internship.company_logo_url && !logoFailed ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary external scraped-logo domains
          <img
            src={internship.company_logo_url}
            alt=""
            className="h-11 w-11 rounded-lg border border-border object-contain"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-ink text-base font-bold text-white">
            {internship.company.charAt(0).toUpperCase()}
          </span>
        )}
        <div className="min-w-0">
          <h3 className="truncate font-display text-base font-semibold leading-snug text-ink">
            {internship.title}
          </h3>
          <p className="truncate text-sm font-semibold text-ink-soft">{internship.company}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
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

      <p className="mt-3 text-xs text-slate">
        Saved on {format(new Date(saved.saved_at), "MMM d, yyyy")}
      </p>

      <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-border pt-3">
        <a
          href={internship.apply_link}
          target="_blank"
          rel="noopener noreferrer nofollow"
          className="flex flex-col items-center gap-1 rounded-lg py-2 text-center text-xs font-semibold text-ink transition-colors hover:bg-paper"
        >
          <ExternalLink className="h-4 w-4" />
          Apply Now
        </a>
        <button
          type="button"
          onClick={handleAddToTracker}
          disabled={addedToTracker || createApplication.isPending}
          className="flex flex-col items-center gap-1 rounded-lg py-2 text-center text-xs font-semibold text-ink transition-colors hover:bg-paper disabled:text-teal"
        >
          {addedToTracker ? <Check className="h-4 w-4" /> : <ClipboardPlus className="h-4 w-4" />}
          {addedToTracker ? "Added" : "Track It"}
        </button>
        <button
          type="button"
          onClick={handleRemove}
          disabled={removeSaved.isPending}
          className="flex flex-col items-center gap-1 rounded-lg py-2 text-center text-xs font-semibold text-coral transition-colors hover:bg-coral/10"
        >
          <Trash2 className="h-4 w-4" />
          Remove
        </button>
      </div>
    </div>
  );
}
