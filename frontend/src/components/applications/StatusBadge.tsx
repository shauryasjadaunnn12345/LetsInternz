import { STATUS_META } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/types";

export default function StatusBadge({ status }: { status: ApplicationStatus }) {
  const meta = STATUS_META[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.badgeBg} ${meta.badgeText}`}
    >
      {meta.label}
    </span>
  );
}
