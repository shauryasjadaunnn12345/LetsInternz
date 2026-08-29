import { Bookmark, ClipboardCheck, ClipboardList, Users } from "lucide-react";

import type { ApplicationStats } from "@/lib/types";

export default function StatsRow({
  stats,
  savedCount,
}: {
  stats: ApplicationStats | undefined;
  savedCount: number | undefined;
}) {
  const cards = [
    {
      label: "Total Applications",
      value: stats?.total ?? 0,
      icon: ClipboardList,
      tint: "bg-blue-100 text-blue-700",
    },
    {
      label: "Under Review",
      value: stats?.under_review ?? 0,
      icon: ClipboardCheck,
      tint: "bg-yellow-100 text-yellow-800",
    },
    {
      label: "Interviews",
      value: stats?.interview ?? 0,
      icon: Users,
      tint: "bg-purple-100 text-purple-700",
    },
    {
      label: "Saved Internships",
      value: savedCount ?? 0,
      icon: Bookmark,
      tint: "bg-teal/15 text-teal",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-xl border border-border bg-paper-raised p-5"
        >
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg ${card.tint}`}>
            <card.icon className="h-4.5 w-4.5" strokeWidth={1.75} />
          </div>
          <p className="mt-3 font-display text-2xl font-semibold text-ink">
            {card.value}
          </p>
          <p className="mt-0.5 text-xs font-medium text-slate">{card.label}</p>
        </div>
      ))}
    </div>
  );
}
