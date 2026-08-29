"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

import { BROWSE_CITY_OPTIONS, DOMAIN_OPTIONS } from "@/lib/constants";

const POPULAR_TAGS = [
  { label: "#Remote", params: "work_type=remote" },
  { label: "#Bangalore", params: "location=Bangalore" },
  { label: "#Python", params: "skills=Python" },
  { label: "#Marketing", params: "domain=marketing" },
];

export default function SearchWidget() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [domain, setDomain] = useState("");

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (location) params.set("location", location);
    if (domain) params.set("domain", domain);
    router.push(`/internships${params.toString() ? `?${params.toString()}` : ""}`);
  };

  return (
    <div>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-2 rounded-xl border border-border bg-paper-raised p-2 shadow-sm sm:flex-row"
      >
        <div className="flex flex-1 items-center gap-2 px-2">
          <Search className="h-4 w-4 shrink-0 text-slate" />
          <input
            type="text"
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Job title, company, skill…"
            className="w-full bg-transparent py-2 text-sm text-ink placeholder:text-slate/60 focus:outline-none"
          />
        </div>

        <select
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-marigold-dark/40 sm:w-40"
          aria-label="Location"
        >
          <option value="">Any location</option>
          {BROWSE_CITY_OPTIONS.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>

        <select
          value={domain}
          onChange={(event) => setDomain(event.target.value)}
          className="rounded-lg border border-border bg-paper px-3 py-2 text-sm text-ink-soft focus:outline-none focus:ring-2 focus:ring-marigold-dark/40 sm:w-40"
          aria-label="Domain"
        >
          <option value="">Any domain</option>
          {DOMAIN_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <button
          type="submit"
          className="rounded-lg bg-marigold-dark px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-marigold-dark/90"
        >
          Search
        </button>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium text-slate">Popular:</span>
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag.label}
            type="button"
            onClick={() => router.push(`/internships?${tag.params}`)}
            className="rounded-full border border-border bg-paper px-3 py-1 text-xs font-medium text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
          >
            {tag.label}
          </button>
        ))}
      </div>
    </div>
  );
}
