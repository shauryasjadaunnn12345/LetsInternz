"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Check, ChevronDown } from "lucide-react";
import type { ReactNode } from "react";

import { STATUS_META, STATUS_ORDER } from "@/lib/constants";
import type { ApplicationStatus } from "@/lib/types";

export default function StatusDropdown({
  status,
  onChange,
  trigger,
}: {
  status: ApplicationStatus;
  onChange: (status: ApplicationStatus) => void;
  /** Custom trigger element (e.g. an icon button). Defaults to a colored badge-button. */
  trigger?: ReactNode;
}) {
  const meta = STATUS_META[status];

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        {trigger ?? (
          <button
            type="button"
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold transition-opacity hover:opacity-80 ${meta.badgeBg} ${meta.badgeText}`}
          >
            {meta.label}
            <ChevronDown className="h-3 w-3" />
          </button>
        )}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="start"
          sideOffset={6}
          className="z-50 min-w-[11rem] rounded-xl border border-border bg-paper-raised p-1.5 shadow-lg"
        >
          {STATUS_ORDER.map((option) => {
            const optionMeta = STATUS_META[option];
            const isCurrent = option === status;
            return (
              <DropdownMenu.Item
                key={option}
                onSelect={() => onChange(option)}
                className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium text-ink outline-none transition-colors hover:bg-paper"
              >
                <span className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: optionMeta.chartColor }}
                  />
                  {optionMeta.label}
                </span>
                {isCurrent && <Check className="h-3.5 w-3.5 text-marigold-dark" />}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
