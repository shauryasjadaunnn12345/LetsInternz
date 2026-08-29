import { AlertTriangle } from "lucide-react";

import type { DeadlineAlert } from "@/lib/types";

export default function DeadlineAlertBanner({ alerts }: { alerts: DeadlineAlert[] | undefined }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="flex items-start gap-3 rounded-xl border border-coral/30 bg-coral/10 p-4">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-coral" />
      <p className="text-sm font-medium text-coral">
        {alerts.length} saved internship{alerts.length === 1 ? "" : "s"} closing within 7
        days — {alerts.map((alert) => alert.internship.title).join(", ")}
      </p>
    </div>
  );
}
