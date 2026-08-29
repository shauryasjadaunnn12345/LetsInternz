import { ChevronRight, Clock, ExternalLink, Eye, MapPin } from "lucide-react";
import Link from "next/link";

import ApplyAndPrepSection from "@/components/internships/ApplyAndPrepSection";
import InternshipLogo from "@/components/internships/InternshipLogo";
import { DOMAIN_OPTIONS, WORK_TYPE_OPTIONS } from "@/lib/constants";
import { sourceColor } from "@/lib/sourceColor";
import type { Internship } from "@/lib/types";

function daysUntil(deadline: string | null): number | null {
  if (!deadline) return null;
  const diffMs = new Date(deadline).getTime() - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function InternshipDetailContent({ internship }: { internship: Internship }) {
  const sourceName = internship.source_name ?? internship.source?.name ?? "";
  const badge = sourceColor(sourceName);
  const domainLabel =
    DOMAIN_OPTIONS.find((option) => option.value === internship.domain)?.label ?? internship.domain;
  const workTypeLabel =
    WORK_TYPE_OPTIONS.find((option) => option.value === internship.work_type)?.label ??
    internship.work_type;

  const remainingDays = daysUntil(internship.deadline);
  const isUrgent = remainingDays !== null && remainingDays <= 3;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 lg:px-8">
      <nav className="mb-6 flex items-center gap-1.5 text-xs font-medium text-slate">
        <Link href="/internships" className="hover:text-ink">
          Internships
        </Link>
        <ChevronRight className="h-3 w-3" />
        <span className="truncate text-ink-soft">{internship.title}</span>
      </nav>

      <div className="rounded-2xl border border-border bg-paper-raised p-6 sm:p-8">
        <div className="flex items-start gap-4">
          <InternshipLogo logoUrl={internship.company_logo_url} company={internship.company} size="lg" />

          <div className="min-w-0">
            <h1 className="font-display text-xl font-semibold leading-snug text-ink sm:text-2xl">
              {internship.title}
            </h1>
            <p className="mt-0.5 text-base font-semibold text-ink-soft">{internship.company}</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          {sourceName && (
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${badge.bg} ${badge.text}`}
            >
              {sourceName}
            </span>
          )}
          <span className="flex items-center gap-1 rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">
            <MapPin className="h-3 w-3" />
            {internship.location}
          </span>
          <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">
            {workTypeLabel}
          </span>
          <span className="rounded-full bg-paper px-2.5 py-0.5 text-xs font-medium text-ink-soft">
            {domainLabel}
          </span>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-4 border-y border-border py-5 sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Stipend</p>
            <p className="mt-1 text-sm font-semibold text-teal">
              {internship.is_unpaid ? "Unpaid" : internship.stipend_display || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Duration</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {internship.duration || "Not specified"}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Posted</p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {formatDate(internship.posted_at)}
            </p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-slate">Deadline</p>
            <p
              className={`mt-1 flex items-center gap-1 text-sm font-semibold ${isUrgent ? "text-coral" : "text-ink"}`}
            >
              <Clock className="h-3.5 w-3.5" />
              {internship.deadline
                ? remainingDays !== null && remainingDays >= 0
                  ? `${formatDate(internship.deadline)} (${remainingDays === 0 ? "today" : `${remainingDays}d left`})`
                  : formatDate(internship.deadline)
                : "Rolling"}
            </p>
          </div>
        </div>

        <div className="mt-6">
          <ApplyAndPrepSection internship={internship} />
        </div>
      </div>

      {internship.description && (
        <section className="mt-6 rounded-2xl border border-border bg-paper-raised p-6 sm:p-8">
          <h2 className="font-display text-base font-semibold text-ink">About this role</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {internship.description}
          </p>
        </section>
      )}

      {internship.requirements && (
        <section className="mt-6 rounded-2xl border border-border bg-paper-raised p-6 sm:p-8">
          <h2 className="font-display text-base font-semibold text-ink">Requirements</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink-soft">
            {internship.requirements}
          </p>
        </section>
      )}

      {internship.skills_required.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-paper-raised p-6 sm:p-8">
          <h2 className="font-display text-base font-semibold text-ink">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {internship.skills_required.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-border px-3 py-1 text-xs font-medium text-ink-soft"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}

      {internship.perks && internship.perks.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-paper-raised p-6 sm:p-8">
          <h2 className="font-display text-base font-semibold text-ink">Perks</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {internship.perks.map((perk) => (
              <span
                key={perk}
                className="rounded-full bg-teal/10 px-3 py-1 text-xs font-medium text-teal"
              >
                {perk}
              </span>
            ))}
          </div>
        </section>
      )}

      <div className="mt-6 flex items-center justify-between text-xs text-slate">
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {internship.views_count} view{internship.views_count === 1 ? "" : "s"}
        </span>
        {internship.source?.base_url && (
          <a
            href={internship.source.base_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 hover:text-ink"
          >
            Visit {sourceName}
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
