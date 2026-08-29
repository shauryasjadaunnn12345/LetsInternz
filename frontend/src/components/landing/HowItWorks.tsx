import { LayoutDashboard, ScanSearch, Sparkles } from "lucide-react";
import Link from "next/link";

const STEPS = [
  {
    icon: ScanSearch,
    title: "We collect daily",
    description: "Our scrapers pull fresh listings from 20+ platforms every day, deduplicated into one feed.",
  },
  {
    icon: Sparkles,
    title: "You search and filter",
    description: "Narrow by domain, location, stipend, and work type until you find the perfect match.",
  },
  {
    icon: LayoutDashboard,
    title: "Track every application",
    description: "Log applications as you send them and watch their status move from applied to offer, all in one dashboard.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-marigold-dark">
          How it works
        </p>
        <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
          Three steps from search to offer
        </h2>
      </div>

      <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-3">
        {STEPS.map((step, index) => (
          <div key={step.title} className="relative text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ink text-white">
              <step.icon className="h-6 w-6" strokeWidth={1.75} />
            </div>
            <p className="mt-4 text-xs font-bold text-marigold-dark">
              STEP {index + 1}
            </p>
            <h3 className="mt-1 font-display text-lg font-semibold text-ink">
              {step.title}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-slate">
              {step.description}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          href="/how-it-works"
          className="text-sm font-semibold text-ink hover:text-marigold-dark"
        >
          See the full walkthrough →
        </Link>
      </div>
    </section>
  );
}
