"use client";

import { DndContext, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useState } from "react";

import KanbanColumn from "@/components/applications/KanbanColumn";
import { useUpdateApplication } from "@/hooks/useApplications";
import { KANBAN_COLUMNS } from "@/lib/constants";
import type { Application, ApplicationStatus } from "@/lib/types";

/** Which Kanban column an application currently belongs to. "selected"
 * applications are bucketed into the "offer_received" column for display
 * (see lib/constants.ts for the full rationale). */
function columnStatusFor(application: Application): ApplicationStatus {
  return application.status === "selected" ? "offer_received" : application.status;
}

export default function KanbanBoard({
  applications,
  onOpenNotes,
}: {
  applications: Application[];
  onOpenNotes: (application: Application) => void;
}) {
  const updateApplication = useUpdateApplication();
  const [activeApplication, setActiveApplication] = useState<Application | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const application = applications.find((app) => app.id === event.active.id);
    setActiveApplication(application ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveApplication(null);
    const { active, over } = event;
    if (!over) return;

    const application = applications.find((app) => app.id === active.id);
    if (!application) return;

    const newStatus = over.id as ApplicationStatus;
    if (columnStatusFor(application) === newStatus) return; // dropped back in place

    updateApplication.mutate({ id: application.id, payload: { status: newStatus } });
  };

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {KANBAN_COLUMNS.map((column) => (
          <KanbanColumn
            key={column.status}
            status={column.status}
            label={column.label}
            applications={applications.filter(
              (app) => columnStatusFor(app) === column.status
            )}
            onOpenNotes={onOpenNotes}
          />
        ))}
      </div>

      <DragOverlay>
        {activeApplication && (
          <div className="w-64 rounded-xl border border-marigold-dark bg-paper-raised p-3.5 shadow-lg">
            <p className="truncate text-sm font-semibold text-ink">
              {activeApplication.role}
            </p>
            <p className="truncate text-xs text-slate">{activeApplication.company}</p>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
