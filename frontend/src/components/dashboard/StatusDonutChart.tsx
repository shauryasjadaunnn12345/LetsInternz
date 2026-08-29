"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import { STATUS_META, STATUS_ORDER } from "@/lib/constants";
import type { ApplicationStats } from "@/lib/types";

export default function StatusDonutChart({ stats }: { stats: ApplicationStats | undefined }) {
  const data = STATUS_ORDER.map((status) => ({
    status,
    label: STATUS_META[status].label,
    value: stats?.[status] ?? 0,
    color: STATUS_META[status].chartColor,
  })).filter((entry) => entry.value > 0);

  if (!stats || stats.total === 0) {
    return (
      <div className="flex h-full flex-col items-center justify-center rounded-xl border border-border bg-paper-raised p-6 text-center">
        <p className="text-sm font-medium text-slate">
          No applications yet — your status breakdown will show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-paper-raised p-5">
      <h3 className="font-display text-sm font-semibold text-ink">
        Application status
      </h3>

      <div className="mt-2 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="label"
              innerRadius="60%"
              outerRadius="90%"
              paddingAngle={2}
            >
              {data.map((entry) => (
                <Cell key={entry.status} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => [String(value), String(name)]}
              contentStyle={{
                borderRadius: 8,
                border: "1px solid var(--color-border)",
                fontSize: 12,
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-1.5">
        {data.map((entry) => (
          <div key={entry.status} className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            {entry.label} ({entry.value})
          </div>
        ))}
      </div>
    </div>
  );
}
