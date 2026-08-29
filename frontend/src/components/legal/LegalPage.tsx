import type { ReactNode } from "react";

export default function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  children,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  children: ReactNode;
}) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-marigold-dark">
        {eyebrow}
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-slate">Last updated: {lastUpdated}</p>

      <div
        className="prose prose-slate mt-8 max-w-none
          prose-headings:font-display prose-headings:font-semibold prose-headings:text-ink
          prose-h2:mt-10 prose-h2:text-xl prose-h3:mt-6 prose-h3:text-base
          prose-p:leading-relaxed prose-p:text-ink-soft
          prose-li:text-ink-soft prose-strong:text-ink
          prose-a:text-marigold-dark prose-a:no-underline hover:prose-a:underline"
      >
        {children}
      </div>
    </div>
  );
}
