"use client";

import { useDraggable } from "@dnd-kit/core";
import { format } from "date-fns";
import { NotebookPen, Pencil, Trash2 } from "lucide-react";
import { useState } from "react";

import StatusDropdown from "@/components/applications/StatusDropdown";
import { useDeleteApplication, useUpdateApplication } from "@/hooks/useApplications";
import type { Application } from "@/lib/types";

function initial(name: string) {
  return name.trim().charAt(0).toUpperCase() || "?";
}

export default function ApplicationCard({
  application,
  onOpenNotes,
}: {
  application: Application;
  onOpenNotes: (application: Application) => void;
}) {
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();
  const [logoFailed, setLogoFailed] = useState(false);

  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: application.id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 20,
      }
    : undefined;

  const logoUrl = application.internship?.company_logo_url;
  const sourceLabel = application.internship?.source_name ?? "Manual";

  const handleDelete = () => {
    if (window.confirm(`Remove your application to ${application.company}?`)) {
      deleteApplication.mutate(application.id);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border border-border bg-paper-raised p-3.5 shadow-sm ${
        isDragging ? "opacity-50" : ""
      }`}
    >
      <div
        {...listeners}
        {...attributes}
        className="cursor-grab touch-none active:cursor-grabbing"
      >
        <div className="flex items-start gap-2.5">
          {logoUrl && !logoFailed ? (
            // eslint-disable-next-line @next/next/no-img-element -- external, unoptimizable source domains
            <img
              src={logoUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-lg border border-border object-contain"
              onError={() => setLogoFailed(true)}
            />
          ) : (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-ink text-sm font-bold text-white">
              {initial(application.company)}
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{application.role}</p>
            <p className="truncate text-xs text-slate">{application.company}</p>
          </div>
        </div>

        <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft">
          {application.stipend_display && <span>{application.stipend_display}</span>}
          <span>{format(new Date(application.applied_at), "MMM d")}</span>
        </div>

        <span className="mt-2 inline-flex items-center rounded-full bg-paper px-2 py-0.5 text-[11px] font-semibold text-ink-soft">
          {sourceLabel}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1 border-t border-border pt-2.5">
        <StatusDropdown
          status={application.status}
          onChange={(status) =>
            updateApplication.mutate({ id: application.id, payload: { status } })
          }
          trigger={
            <button
              type="button"
              aria-label="Change status"
              className="rounded-md p-1.5 text-slate transition-colors hover:bg-paper hover:text-ink"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
          }
        />
        <button
          type="button"
          aria-label="Notes"
          onClick={() => onOpenNotes(application)}
          className="rounded-md p-1.5 text-slate transition-colors hover:bg-paper hover:text-ink"
        >
          <NotebookPen className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          aria-label="Delete"
          onClick={handleDelete}
          className="ml-auto rounded-md p-1.5 text-slate transition-colors hover:bg-coral/10 hover:text-coral"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
