"use client";

import { format } from "date-fns";
import { ArrowDown, ArrowUp, ExternalLink, NotebookPen, Trash2 } from "lucide-react";
import { useState } from "react";

import StatusDropdown from "@/components/applications/StatusDropdown";
import { useDeleteApplication, useUpdateApplication } from "@/hooks/useApplications";
import type { Application } from "@/lib/types";

type SortKey = "company" | "role" | "applied_at" | "status";
type SortDirection = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "company", label: "Company" },
  { key: "role", label: "Role" },
  { key: "applied_at", label: "Applied" },
  { key: "status", label: "Status" },
];

export default function ListView({
  applications,
  onOpenNotes,
}: {
  applications: Application[];
  onOpenNotes: (application: Application) => void;
}) {
  const [sortKey, setSortKey] = useState<SortKey>("applied_at");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sorted = [...applications].sort((a, b) => {
    let result = 0;
    if (sortKey === "applied_at") {
      result = new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
    } else {
      result = a[sortKey].localeCompare(b[sortKey]);
    }
    return sortDirection === "asc" ? result : -result;
  });

  const handleDelete = (application: Application) => {
    if (window.confirm(`Remove your application to ${application.company}?`)) {
      deleteApplication.mutate(application.id);
    }
  };

  if (applications.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-paper-raised py-16 text-center">
        <p className="text-sm text-slate">No applications match your filters.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-paper-raised">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-slate">
            {COLUMNS.map((col) => (
              <th key={col.key} className="px-5 py-3">
                <button
                  type="button"
                  onClick={() => handleSort(col.key)}
                  className="flex items-center gap-1 hover:text-ink"
                >
                  {col.label}
                  {sortKey === col.key &&
                    (sortDirection === "asc" ? (
                      <ArrowUp className="h-3 w-3" />
                    ) : (
                      <ArrowDown className="h-3 w-3" />
                    ))}
                </button>
              </th>
            ))}
            <th className="px-5 py-3">Stipend</th>
            <th className="px-5 py-3" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((application) => (
            <tr key={application.id} className="border-b border-border last:border-0">
              <td className="px-5 py-3 font-medium text-ink">{application.company}</td>
              <td className="px-5 py-3 text-ink-soft">{application.role}</td>
              <td className="px-5 py-3 text-ink-soft">
                {format(new Date(application.applied_at), "MMM d, yyyy")}
              </td>
              <td className="px-5 py-3">
                <StatusDropdown
                  status={application.status}
                  onChange={(status) =>
                    updateApplication.mutate({ id: application.id, payload: { status } })
                  }
                />
              </td>
              <td className="px-5 py-3 text-ink-soft">{application.stipend_display || "—"}</td>
              <td className="px-5 py-3">
                <div className="flex items-center justify-end gap-1">
                  {(application.internship?.apply_link || application.manual_apply_link) && (
                    <a
                      href={application.internship?.apply_link || application.manual_apply_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label="View details"
                      className="rounded-md p-1.5 text-slate transition-colors hover:bg-paper hover:text-ink"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <button
                    type="button"
                    aria-label="Notes"
                    onClick={() => onOpenNotes(application)}
                    className="rounded-md p-1.5 text-slate transition-colors hover:bg-paper hover:text-ink"
                  >
                    <NotebookPen className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Delete"
                    onClick={() => handleDelete(application)}
                    className="rounded-md p-1.5 text-slate transition-colors hover:bg-coral/10 hover:text-coral"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
