import Link from "next/link";

import { SOURCE_PLATFORMS } from "@/lib/constants";

export default function SourcePlatformsGrid() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-marigold-dark">
          Sources
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
          Every major platform, already searched
        </h2>
        <p className="mt-3 text-sm text-slate">
          Tap a platform to see only its listings.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {SOURCE_PLATFORMS.map((name) => (
          <Link
            key={name}
            href={`/internships?source=${encodeURIComponent(name)}`}
            className="flex items-center justify-center rounded-xl border border-border bg-paper-raised px-4 py-6 text-center font-display text-sm font-semibold text-ink-soft transition-colors hover:border-marigold-dark hover:text-ink"
          >
            {name}
          </Link>
        ))}
      </div>
    </section>
  );
}
