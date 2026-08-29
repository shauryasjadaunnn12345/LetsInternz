"use client";

import { Input, Label } from "@/components/ui/Field";

export interface BasicsData {
  college: string;
  branch: string;
  graduation_year: number | "";
  cgpa: string;
}

const GRADUATION_YEARS = [2024, 2025, 2026, 2027, 2028];

export default function BasicsStep({
  data,
  onChange,
}: {
  data: BasicsData;
  onChange: (next: BasicsData) => void;
}) {
  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="college">College</Label>
        <Input
          id="college"
          type="text"
          placeholder="e.g. IIT Delhi"
          value={data.college}
          onChange={(event) => onChange({ ...data, college: event.target.value })}
        />
      </div>

      <div>
        <Label htmlFor="branch">Branch</Label>
        <Input
          id="branch"
          type="text"
          placeholder="e.g. Computer Science"
          value={data.branch}
          onChange={(event) => onChange({ ...data, branch: event.target.value })}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="graduation_year">Graduation year</Label>
          <select
            id="graduation_year"
            value={data.graduation_year}
            onChange={(event) =>
              onChange({
                ...data,
                graduation_year: event.target.value ? Number(event.target.value) : "",
              })
            }
            className="w-full rounded-lg border border-border bg-paper-raised px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
          >
            <option value="">Select</option>
            {GRADUATION_YEARS.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div>
          <Label htmlFor="cgpa">CGPA</Label>
          <Input
            id="cgpa"
            type="number"
            step="0.01"
            min={0}
            max={10}
            placeholder="e.g. 8.4"
            value={data.cgpa}
            onChange={(event) => onChange({ ...data, cgpa: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
