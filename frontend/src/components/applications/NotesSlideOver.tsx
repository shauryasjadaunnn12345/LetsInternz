"use client";

import { useEffect, useRef, useState } from "react";

import { Label, Textarea } from "@/components/ui/Field";
import SlideOver from "@/components/ui/SlideOver";
import { useUpdateApplication } from "@/hooks/useApplications";
import { STATUS_META, STATUS_ORDER } from "@/lib/constants";
import type { Application, ApplicationStatus } from "@/lib/types";

const AUTOSAVE_DELAY_MS = 1000;

type SaveState = "idle" | "saving" | "saved";

function NotesSlideOverContent({ application }: { application: Application }) {
  const updateApplication = useUpdateApplication();

  // Lazy initializers seed state from `application` on mount only. The
  // parent renders this component with `key={application.id}`, so opening a
  // different application remounts it fresh rather than needing an effect
  // to reset state on prop change.
  const [notes, setNotes] = useState(() => application.notes ?? "");
  const [nextStep, setNextStep] = useState(() => application.next_step ?? "");
  const [reminderDate, setReminderDate] = useState(() => application.reminder_date ?? "");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [status, setStatus] = useState<ApplicationStatus>(application.status);

  const handleStatusChange = (nextStatus: ApplicationStatus) => {
    setStatus(nextStatus);
    updateApplication.mutate({ id: application.id, payload: { status: nextStatus } });
  };

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);
    setSaveState("saving");

    debounceRef.current = setTimeout(() => {
      updateApplication.mutate(
        {
          id: application.id,
          payload: {
            notes,
            next_step: nextStep,
            reminder_date: reminderDate || null,
          },
        },
        { onSuccess: () => setSaveState("saved") }
      );
    }, AUTOSAVE_DELAY_MS);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally excludes `application.id`/`updateApplication` to avoid re-triggering the debounce timer
  }, [notes, nextStep, reminderDate]);

  return (
    <div className="space-y-5">
      <div>
        <Label htmlFor="app-status">Status</Label>
        <select
          id="app-status"
          value={status}
          onChange={(event) => handleStatusChange(event.target.value as ApplicationStatus)}
          className="w-full rounded-lg border border-border bg-paper px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
        >
          {STATUS_ORDER.map((value) => (
            <option key={value} value={value}>
              {STATUS_META[value].label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-between">
        <label htmlFor="app-notes" className="text-sm font-medium text-ink">
          Notes
        </label>
        <span className="text-xs font-medium text-slate">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "Saved"}
        </span>
      </div>
      <Textarea
        id="app-notes"
        rows={6}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
        placeholder="Interview format, referral contact, follow-up notes…"
      />

      <div>
        <Label htmlFor="app-next-step">Next step</Label>
        <input
          id="app-next-step"
          type="text"
          value={nextStep}
          onChange={(event) => setNextStep(event.target.value)}
          placeholder="e.g. Follow up with recruiter"
          className="w-full rounded-lg border border-border bg-paper px-3.5 py-2.5 text-sm text-ink placeholder:text-slate/60 focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
        />
      </div>

      <div>
        <Label htmlFor="app-reminder-date">Reminder date</Label>
        <input
          id="app-reminder-date"
          type="date"
          value={reminderDate}
          onChange={(event) => setReminderDate(event.target.value)}
          className="w-full rounded-lg border border-border bg-paper px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
        />
      </div>

      <div className="rounded-lg border border-border bg-paper p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate">
          Interview tips
        </p>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">
          Research the team you&apos;re interviewing with, prepare 2-3
          questions about the role, and revisit your notes above before the
          call so nothing catches you off guard.
        </p>
      </div>
    </div>
  );
}

export default function NotesSlideOver({
  application,
  onOpenChange,
}: {
  application: Application | null;
  onOpenChange: (open: boolean) => void;
}) {
  return (
    <SlideOver
      open={application !== null}
      onOpenChange={onOpenChange}
      title={application ? `${application.role} at ${application.company}` : "Notes"}
    >
      {application && (
        <NotesSlideOverContent key={application.id} application={application} />
      )}
    </SlideOver>
  );
}
