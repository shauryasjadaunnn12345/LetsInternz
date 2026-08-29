"use client";

import { useState } from "react";

import { Input, Label, Textarea } from "@/components/ui/Field";
import Modal from "@/components/ui/Modal";
import { useCreateApplication } from "@/hooks/useApplications";
import { useDebounce } from "@/hooks/useDebounce";
import { useInternships } from "@/hooks/useInternships";
import { useSavedInternships } from "@/hooks/useSaved";
import { STATUS_META, STATUS_ORDER } from "@/lib/constants";
import type { ApplicationStatus, Internship } from "@/lib/types";

type Mode = "letsinternz" | "manual";

const emptyManualForm = {
  manual_company: "",
  manual_role: "",
  manual_apply_link: "",
  manual_stipend: "",
  status: "applied" as ApplicationStatus,
  notes: "",
};

export default function AddApplicationModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("letsinternz");
  const [query, setQuery] = useState("");
  const [selectedInternship, setSelectedInternship] = useState<Internship | null>(null);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [error, setError] = useState<string | null>(null);

  const createApplication = useCreateApplication();
  const debouncedQuery = useDebounce(query, 300);

  const { data: savedInternships } = useSavedInternships();
  const { data: searchResults, isLoading: isSearching } = useInternships(
    debouncedQuery ? { search: debouncedQuery } : {}
  );

  const reset = () => {
    setMode("letsinternz");
    setQuery("");
    setSelectedInternship(null);
    setManualForm(emptyManualForm);
    setError(null);
  };

  const handleClose = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const handleAddFromLetsInternz = () => {
    if (!selectedInternship) {
      setError("Choose an internship first.");
      return;
    }
    createApplication.mutate(
      { internship_id: selectedInternship.id },
      { onSuccess: () => handleClose(false) }
    );
  };

  const handleAddManual = () => {
    if (!manualForm.manual_company || !manualForm.manual_role) {
      setError("Company name and role title are required.");
      return;
    }
    createApplication.mutate(manualForm, { onSuccess: () => handleClose(false) });
  };

  const candidateInternships: Internship[] = debouncedQuery
    ? (searchResults?.results ?? [])
    : (savedInternships?.map((s) => s.internship) ?? []);

  return (
    <Modal open={open} onOpenChange={handleClose} title="Add application" maxWidthClassName="max-w-xl">
      <div className="mb-5 flex rounded-lg border border-border bg-paper p-1">
        <button
          type="button"
          onClick={() => setMode("letsinternz")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
            mode === "letsinternz" ? "bg-ink text-white" : "text-ink-soft"
          }`}
        >
          From LetsInternz
        </button>
        <button
          type="button"
          onClick={() => setMode("manual")}
          className={`flex-1 rounded-md py-2 text-sm font-semibold transition-colors ${
            mode === "manual" ? "bg-ink text-white" : "text-ink-soft"
          }`}
        >
          Add manually
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-coral/30 bg-coral/10 px-3.5 py-2.5 text-sm font-medium text-coral">
          {error}
        </div>
      )}

      {mode === "letsinternz" ? (
        <div>
          <Input
            type="text"
            placeholder="Search by company or role…"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedInternship(null);
            }}
          />

          <p className="mb-1.5 mt-3 text-xs font-semibold uppercase tracking-wide text-slate">
            {debouncedQuery ? "Search results" : "Your saved internships"}
          </p>

          <div className="max-h-64 space-y-1.5 overflow-y-auto">
            {isSearching && debouncedQuery && (
              <p className="py-4 text-center text-sm text-slate">Searching…</p>
            )}

            {!isSearching && candidateInternships.length === 0 && (
              <p className="py-4 text-center text-sm text-slate">
                {debouncedQuery
                  ? "No internships match that search."
                  : "Nothing saved yet — search above to find one."}
              </p>
            )}

            {candidateInternships.map((internship) => (
              <button
                key={internship.id}
                type="button"
                onClick={() => setSelectedInternship(internship)}
                className={`flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-colors ${
                  selectedInternship?.id === internship.id
                    ? "border-marigold-dark bg-marigold/10"
                    : "border-border hover:border-ink-soft"
                }`}
              >
                <span>
                  <span className="block text-sm font-semibold text-ink">
                    {internship.title}
                  </span>
                  <span className="block text-xs text-slate">{internship.company}</span>
                </span>
                <span className="shrink-0 text-xs font-medium text-ink-soft">
                  {internship.stipend_display}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            disabled={createApplication.isPending}
            onClick={handleAddFromLetsInternz}
            className="mt-5 w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
          >
            {createApplication.isPending ? "Adding…" : "Add application"}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <Label htmlFor="manual-company">Company name</Label>
            <Input
              id="manual-company"
              type="text"
              value={manualForm.manual_company}
              onChange={(event) =>
                setManualForm({ ...manualForm, manual_company: event.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="manual-role">Role title</Label>
            <Input
              id="manual-role"
              type="text"
              value={manualForm.manual_role}
              onChange={(event) =>
                setManualForm({ ...manualForm, manual_role: event.target.value })
              }
            />
          </div>

          <div>
            <Label htmlFor="manual-link">Apply link</Label>
            <Input
              id="manual-link"
              type="url"
              placeholder="https://…"
              value={manualForm.manual_apply_link}
              onChange={(event) =>
                setManualForm({ ...manualForm, manual_apply_link: event.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="manual-stipend">Stipend</Label>
              <Input
                id="manual-stipend"
                type="text"
                placeholder="e.g. ₹15,000/month"
                value={manualForm.manual_stipend}
                onChange={(event) =>
                  setManualForm({ ...manualForm, manual_stipend: event.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="manual-status">Status</Label>
              <select
                id="manual-status"
                value={manualForm.status}
                onChange={(event) =>
                  setManualForm({
                    ...manualForm,
                    status: event.target.value as ApplicationStatus,
                  })
                }
                className="w-full rounded-lg border border-border bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
              >
                {STATUS_ORDER.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_META[status].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="manual-notes">Notes</Label>
            <Textarea
              id="manual-notes"
              rows={3}
              value={manualForm.notes}
              onChange={(event) => setManualForm({ ...manualForm, notes: event.target.value })}
            />
          </div>

          <button
            type="button"
            disabled={createApplication.isPending}
            onClick={handleAddManual}
            className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
          >
            {createApplication.isPending ? "Adding…" : "Add application"}
          </button>
        </div>
      )}
    </Modal>
  );
}
