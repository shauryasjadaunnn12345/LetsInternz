"use client";

import { X } from "lucide-react";
import { useState } from "react";

export default function SearchableMultiSelect({
  value,
  onChange,
  options,
  placeholder = "Search…",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  options: string[];
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const filtered = options.filter(
    (option) =>
      !value.includes(option) && option.toLowerCase().includes(query.toLowerCase())
  );

  const addOption = (option: string) => {
    onChange([...value, option]);
    setQuery("");
  };

  const removeOption = (option: string) => {
    onChange(value.filter((existing) => existing !== option));
  };

  return (
    <div>
      {value.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1.5">
          {value.map((option) => (
            <span
              key={option}
              className="flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-xs font-medium text-white"
            >
              {option}
              <button
                type="button"
                onClick={() => removeOption(option)}
                aria-label={`Remove ${option}`}
                className="rounded-full hover:bg-white/20"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 150)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-border bg-paper-raised px-3.5 py-2.5 text-sm text-ink placeholder:text-slate/60 focus:outline-none focus:ring-2 focus:ring-marigold-dark/40"
        />

        {isOpen && filtered.length > 0 && (
          <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-48 overflow-y-auto rounded-lg border border-border bg-paper-raised shadow-lg">
            {filtered.map((option) => (
              <button
                key={option}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => addOption(option)}
                className="block w-full px-3.5 py-2 text-left text-sm text-ink-soft hover:bg-paper hover:text-ink"
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
