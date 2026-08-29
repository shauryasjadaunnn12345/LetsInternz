import { format } from "date-fns";
import { ExternalLink } from "lucide-react";
import Link from "next/link";

import StatusBadge from "@/components/applications/StatusBadge";
import type { Application } from "@/lib/types";

export default function RecentApplicationsTable({
  applications,
}: {
  applications: Application[] | undefined;
}) {
  const recent = [...(applications ?? [])]
    .sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime())
    .slice(0, 5);

  return (
    <div className="rounded-xl border border-border bg-paper-raised">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h3 className="font-display text-sm font-semibold text-ink">
          Recent applications
        </h3>
        <Link
          href="/applications"
          className="text-xs font-semibold text-ink-soft hover:text-ink"
        >
          View all
        </Link>
      </div>

      {recent.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-slate">
          No applications logged yet.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs font-semibold uppercase tracking-wide text-slate">
                <th className="px-5 py-2.5">Company</th>
                <th className="px-5 py-2.5">Role</th>
                <th className="px-5 py-2.5">Applied</th>
                <th className="px-5 py-2.5">Status</th>
                <th className="px-5 py-2.5" />
              </tr>
            </thead>
            <tbody>
              {recent.map((application) => (
                <tr key={application.id} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-medium text-ink">
                    {application.company}
                  </td>
                  <td className="px-5 py-3 text-ink-soft">{application.role}</td>
                  <td className="px-5 py-3 text-ink-soft">
                    {format(new Date(application.applied_at), "MMM d, yyyy")}
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={application.status} />
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      href="/applications"
                      className="inline-flex items-center gap-1 text-xs font-semibold text-ink-soft hover:text-ink"
                    >
                      View <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
