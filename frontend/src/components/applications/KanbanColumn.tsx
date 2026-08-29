"use client";

import { useDroppable } from "@dnd-kit/core";

import ApplicationCard from "@/components/applications/ApplicationCard";
import { STATUS_META } from "@/lib/constants";
import type { Application, ApplicationStatus } from "@/lib/types";

export default function KanbanColumn({
  status,
  label,
  applications,
  onOpenNotes,
}: {
  status: ApplicationStatus;
  label: string;
  applications: Application[];
  onOpenNotes: (application: Application) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = STATUS_META[status];

  return (
    <div className="flex w-72 shrink-0 flex-col rounded-xl bg-paper">
      <div className="flex items-center justify-between px-1 py-2">
        <div className="flex items-center gap-2">
          <span
            className="h-2 w-2 rounded-full"
            style={{ backgroundColor: meta.chartColor }}
          />
          <h3 className="text-sm font-semibold text-ink">{label}</h3>
        </div>
        <span className="rounded-full bg-paper-raised px-2 py-0.5 text-xs font-semibold text-ink-soft">
          {applications.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 space-y-2.5 rounded-xl border-2 border-dashed p-2 transition-colors ${
          isOver ? "border-marigold-dark bg-marigold/5" : "border-transparent"
        }`}
      >
        {applications.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-slate">Nothing here yet</p>
        ) : (
          applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onOpenNotes={onOpenNotes}
            />
          ))
        )}
      </div>
    </div>
  );
}
