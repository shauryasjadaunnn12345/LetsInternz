"use client";

import { LayoutGrid, Plus, Rows3 } from "lucide-react";
import { useMemo, useState } from "react";

import AddApplicationModal from "@/components/applications/AddApplicationModal";
import ApplicationFilters, {
  emptyTrackerFilters,
  type TrackerFilters,
} from "@/components/applications/ApplicationFilters";
import KanbanBoard from "@/components/applications/KanbanBoard";
import ListView from "@/components/applications/ListView";
import NotesSlideOver from "@/components/applications/NotesSlideOver";
import { useApplications } from "@/hooks/useApplications";
import type { Application } from "@/lib/types";

type ViewMode = "kanban" | "list";

function applyFilters(applications: Application[], filters: TrackerFilters): Application[] {
  let result = applications;

  if (filters.search) {
    const query = filters.search.toLowerCase();
    result = result.filter(
      (app) =>
        app.company.toLowerCase().includes(query) || app.role.toLowerCase().includes(query)
    );
  }

  if (filters.status) {
    result = result.filter((app) => app.status === filters.status);
  }

  if (filters.dateFrom) {
    const from = new Date(filters.dateFrom).getTime();
    result = result.filter((app) => new Date(app.applied_at).getTime() >= from);
  }

  if (filters.dateTo) {
    const to = new Date(filters.dateTo).getTime();
    result = result.filter((app) => new Date(app.applied_at).getTime() <= to);
  }

  result = [...result].sort((a, b) => {
    if (filters.sort === "company") return a.company.localeCompare(b.company);
    const diff = new Date(a.applied_at).getTime() - new Date(b.applied_at).getTime();
    return filters.sort === "oldest" ? diff : -diff;
  });

  return result;
}

export default function ApplicationTracker() {
  const { data: applications, isLoading } = useApplications();
  const [viewMode, setViewMode] = useState<ViewMode>("kanban");
  const [filters, setFilters] = useState<TrackerFilters>(emptyTrackerFilters);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [notesApplication, setNotesApplication] = useState<Application | null>(null);

  const filteredApplications = useMemo(
    () => applyFilters(applications ?? [], filters),
    [applications, filters]
  );

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">
            My Applications
          </h1>
          <p className="mt-1 text-sm text-slate">
            Track every application from first click to offer.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex rounded-lg border border-border bg-paper-raised p-1">
            <button
              type="button"
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                viewMode === "kanban" ? "bg-ink text-white" : "text-ink-soft"
              }`}
            >
              <LayoutGrid className="h-4 w-4" />
              Kanban
            </button>
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-semibold transition-colors ${
                viewMode === "list" ? "bg-ink text-white" : "text-ink-soft"
              }`}
            >
              <Rows3 className="h-4 w-4" />
              List
            </button>
          </div>

          <button
            type="button"
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-1.5 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-ink-soft"
          >
            <Plus className="h-4 w-4" />
            Add Application
          </button>
        </div>
      </div>

      <ApplicationFilters filters={filters} onChange={setFilters} />

      {isLoading ? (
        <div className="flex justify-center py-16">
          <p className="text-sm text-slate">Loading your applications…</p>
        </div>
      ) : viewMode === "kanban" ? (
        <KanbanBoard applications={filteredApplications} onOpenNotes={setNotesApplication} />
      ) : (
        <ListView applications={filteredApplications} onOpenNotes={setNotesApplication} />
      )}

      <AddApplicationModal open={addModalOpen} onOpenChange={setAddModalOpen} />
      <NotesSlideOver
        application={notesApplication}
        onOpenChange={(open) => !open && setNotesApplication(null)}
      />
    </div>
  );
}
