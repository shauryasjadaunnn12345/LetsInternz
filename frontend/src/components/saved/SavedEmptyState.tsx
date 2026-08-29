import { Bookmark } from "lucide-react";
import Link from "next/link";

export default function SavedEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-20 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-marigold/15 text-marigold-dark">
        <Bookmark className="h-7 w-7" strokeWidth={1.75} />
      </div>
      <h3 className="mt-4 font-display text-lg font-semibold text-ink">
        No saved internships
      </h3>
      <p className="mt-1.5 max-w-xs text-sm text-slate">
        Bookmark internships while browsing and they&apos;ll show up here for
        easy access later.
      </p>
      <Link
        href="/internships"
        className="mt-6 rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft"
      >
        Browse Internships
      </Link>
    </div>
  );
}
