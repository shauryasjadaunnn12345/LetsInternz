import { Bell, Bookmark, ClipboardList, SearchCheck } from "lucide-react";

const FEATURES = [
  {
    icon: SearchCheck,
    title: "Centralized search",
    description: "One search box, every platform. Filter by domain, stipend, location and work type without leaving the page.",
  },
  {
    icon: ClipboardList,
    title: "Application tracker",
    description: "Log every application and move it through Applied, Interview, Offer and beyond — no more spreadsheet.",
  },
  {
    icon: Bookmark,
    title: "Save for later",
    description: "Bookmark internships into folders so the ones worth a second look never get lost in the scroll.",
  },
  {
    icon: Bell,
    title: "Deadline reminders",
    description: "We surface saved internships closing within 7 days so you never miss a deadline by accident.",
  },
];

export default function FeaturesSection() {
  return (
    <section className="border-y border-border bg-paper-raised">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-marigold-dark">
            Built for the whole search
          </p>
          <h2 className="mt-2 font-display text-3xl font-semibold text-ink">
            More than a listings page
          </h2>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <div
              key={feature.title}
              className="rounded-xl border border-border bg-paper p-6"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal/15 text-teal">
                <feature.icon className="h-5 w-5" strokeWidth={1.75} />
              </div>
              <h3 className="mt-4 font-display text-base font-semibold text-ink">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-slate">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
