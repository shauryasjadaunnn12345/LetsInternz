import { SOURCE_PLATFORMS } from "@/lib/constants";

export default function SourceLogoStrip() {
  return (
    <div className="relative border-t border-border bg-paper">
      <div className="mx-auto max-w-5xl px-4 py-5 sm:px-6">
        <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wide text-slate">
          Aggregating from
        </p>
        <div className="flex gap-6 overflow-x-auto pb-1 sm:flex-wrap sm:justify-center sm:overflow-visible">
          {SOURCE_PLATFORMS.map((name) => (
            <span
              key={name}
              className="shrink-0 font-display text-sm font-semibold text-slate/80"
            >
              {name}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
