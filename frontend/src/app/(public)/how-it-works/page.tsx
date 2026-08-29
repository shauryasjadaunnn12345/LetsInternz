import type { Metadata } from "next";
import {
  Bell,
  Bookmark,
  ClipboardList,
  FileCheck2,
  GraduationCap,
  LayoutDashboard,
  ScanSearch,
  Sparkles,
  UserCheck,
} from "lucide-react";

import { AuthAwareCta } from "@/components/public/AuthAwareCta";
import { SOURCE_PLATFORMS } from "@/lib/constants";

export const metadata: Metadata = {
  title: "How It Works",
  description:
    "How LetsInternz aggregates internships from Internshala, Unstop, LinkedIn and 20+ platforms, matches them to your skills, and helps you track every application in one dashboard.",
  keywords: [
    "how LetsInternz works",
    "internship search process",
    "internship aggregator India",
    "internship application tracker",
    "student internship platform",
  ],
  alternates: { canonical: "/how-it-works" },
};

const STEPS = [
  {
    icon: ScanSearch,
    title: "We collect internships daily",
    body: "Every day, our team pulls and manually reviews fresh internship listings from Internshala, Unstop, LinkedIn, AngelList, and 20+ other platforms. Duplicate postings — the same internship listed on two or three sites — get merged into a single, clean entry, so you never see the same role twice.",
  },
  {
    icon: UserCheck,
    title: "You build a profile once",
    body: "During onboarding (or anytime from Settings), tell us your college, skills, preferred domains, work type, and locations. This takes about two minutes and powers everything downstream — recommendations, filters, and how internships are ranked for you.",
  },
  {
    icon: Sparkles,
    title: "You search, filter, and find your match",
    body: "Search by keyword, or narrow the full catalog by domain, city, stipend range, work type, and duration. Your Dashboard also surfaces a Recommended Internships row, scored against the skills and domains on your profile — the more complete your profile, the sharper the matches.",
  },
  {
    icon: GraduationCap,
    title: "You prepare before you apply",
    body: "Every internship page includes a \"Prepare for this role\" panel — a relevant Coursera course to brush up on the skills the listing asks for, and a resume check so your application is in the best shape before you click apply.",
  },
  {
    icon: Bookmark,
    title: "You save what's worth a second look",
    body: "Not ready to apply yet? Bookmark it. Saved internships live in their own dashboard tab, organized into folders, so the roles you're weighing don't get lost in the scroll.",
  },
  {
    icon: ClipboardList,
    title: "You track every application in one place",
    body: "Whether you applied through LetsInternz or found something elsewhere, log it in your Application Tracker. Drag cards between Applied, Under Review, Interview, Offer Received, and Rejected on the Kanban board, or work from a sortable table — whichever fits how you think.",
  },
  {
    icon: Bell,
    title: "We remind you before deadlines slip",
    body: "Saved internships with a deadline inside the next 7 days show up as a reminder on your dashboard, colored amber at 4–7 days and red at 1–3, so a closing date never catches you off guard.",
  },
  {
    icon: LayoutDashboard,
    title: "Your dashboard shows the whole picture",
    body: "One view: total applications, how many are under review, how many interviews you've landed, a status breakdown chart, and your saved internships — so you always know exactly where things stand.",
  },
];

export default function HowItWorksPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-marigold-dark">
        How it works
      </p>
      <h1 className="mt-2 font-display text-3xl font-semibold text-ink sm:text-4xl">
        From twenty tabs to one dashboard
      </h1>
      <p className="mt-4 text-base leading-relaxed text-ink-soft">
        LetsInternz exists to remove the busywork of internship hunting —
        checking a dozen sites, losing track of what you applied to, missing
        a deadline because it was buried in an email. Here&apos;s exactly how it
        works, end to end.
      </p>

      <ol className="mt-12 space-y-10">
        {STEPS.map((step, index) => (
          <li key={step.title} className="flex gap-4 sm:gap-5">
            <div className="flex flex-col items-center">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-ink text-white">
                <step.icon className="h-5 w-5" strokeWidth={1.75} />
              </span>
              {index < STEPS.length - 1 && (
                <span className="mt-2 w-px flex-1 bg-border" aria-hidden="true" />
              )}
            </div>
            <div className="pb-2">
              <p className="text-xs font-bold text-marigold-dark">STEP {index + 1}</p>
              <h2 className="mt-1 font-display text-lg font-semibold text-ink">
                {step.title}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-slate">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>

      <div className="mt-4 rounded-xl border border-border bg-paper-raised p-6">
        <h2 className="font-display text-base font-semibold text-ink">
          Where the listings actually come from
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-slate">
          Every internship on LetsInternz is sourced from a real platform —
          we link straight back to the original posting so you always apply
          on the source site, not through us. Platforms we currently cover:
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          {SOURCE_PLATFORMS.map((name) => (
            <span
              key={name}
              className="rounded-full border border-border bg-paper px-3 py-1 text-xs font-medium text-ink-soft"
            >
              {name}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-xl border border-border bg-paper-raised p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-teal/15 text-teal">
            <FileCheck2 className="h-4.5 w-4.5" strokeWidth={1.75} />
          </span>
          <div>
            <h2 className="font-display text-base font-semibold text-ink">
              A note on the Coursera and resume.io links
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate">
              We may earn a commission if you enroll in a course or use a
              paid resume.io feature through links on internship pages.
              These are optional, never required to search, save, or apply
              to internships, and are only ever surfaced as suggestions.
            </p>
          </div>
        </div>
      </div>

      <AuthAwareCta />
    </div>
  );
}
