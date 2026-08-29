import { differenceInCalendarDays } from "date-fns";
import { Clock } from "lucide-react";

import type { DeadlineAlert } from "@/lib/types";

function urgencyClasses(daysLeft: number) {
  if (daysLeft <= 3) return "border-coral/30 bg-coral/10 text-coral";
  return "border-marigold-dark/30 bg-marigold/10 text-marigold-dark";
}

export default function DeadlineRemindersPanel({
  alerts,
}: {
  alerts: DeadlineAlert[] | undefined;
}) {
  const items = alerts ?? [];

  return (
    <div className="rounded-xl border border-border bg-paper-raised p-5">
      <h3 className="font-display text-sm font-semibold text-ink">
        Deadline reminders
      </h3>

      {items.length === 0 ? (
        <p className="mt-3 text-sm text-slate">
          No saved internships closing within 7 days.
        </p>
      ) : (
        <div className="mt-3 space-y-2.5">
          {items.map((alert) => {
            const daysLeft = differenceInCalendarDays(
              new Date(alert.deadline),
              new Date()
            );
            return (
              <div
                key={alert.saved_id}
                className={`flex items-center justify-between gap-3 rounded-lg border px-3.5 py-2.5 ${urgencyClasses(daysLeft)}`}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-ink">
                    {alert.internship.title}
                  </p>
                  <p className="truncate text-xs text-ink-soft">
                    {alert.internship.company}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1 text-xs font-bold">
                  <Clock className="h-3.5 w-3.5" />
                  {daysLeft <= 0
                    ? "Today"
                    : `${daysLeft} day${daysLeft === 1 ? "" : "s"}`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
