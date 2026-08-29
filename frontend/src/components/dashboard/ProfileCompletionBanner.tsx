import Link from "next/link";

export default function ProfileCompletionBanner({ completion }: { completion: number }) {
  if (completion >= 80) return null;

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-marigold-dark/30 bg-marigold/10 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex-1">
        <p className="font-display text-sm font-semibold text-ink">
          Complete your profile to get better matches
        </p>
        <div className="mt-2.5 flex items-center gap-3">
          <div className="h-2 max-w-xs flex-1 overflow-hidden rounded-full bg-paper-raised">
            <div
              className="h-full rounded-full bg-marigold-dark transition-[width]"
              style={{ width: `${completion}%` }}
            />
          </div>
          <span className="text-xs font-semibold text-ink-soft">{completion}%</span>
        </div>
      </div>

      <Link
        href="/profile"
        className="shrink-0 rounded-lg bg-ink px-4 py-2 text-center text-sm font-semibold text-white transition-colors hover:bg-ink-soft"
      >
        Complete Profile
      </Link>
    </div>
  );
}
