"use client";

import { FileCheck2, GraduationCap, MessageSquareText, Sparkles } from "lucide-react";

import {
  buildCourseraLink,
  buildInterviewPrepLink,
  buildResumeIoLink,
  DOMAIN_OPTIONS,
} from "@/lib/constants";
import type { Internship } from "@/lib/types";

function domainLabel(internship: Internship) {
  return (
    DOMAIN_OPTIONS.find((option) => option.value === internship.domain)?.label ??
    internship.domain.replace("_", " ")
  );
}

const CARD_STYLES = {
  marigold: {
    border: "border-marigold-dark/30",
    bg: "bg-marigold/10",
    hoverBorder: "hover:border-marigold-dark",
    hoverBg: "hover:bg-marigold/20",
    iconBg: "bg-marigold",
    iconText: "text-ink",
  },
  teal: {
    border: "border-teal/30",
    bg: "bg-teal/10",
    hoverBorder: "hover:border-teal",
    hoverBg: "hover:bg-teal/20",
    iconBg: "bg-teal",
    iconText: "text-white",
  },
  coral: {
    border: "border-coral/30",
    bg: "bg-coral/10",
    hoverBorder: "hover:border-coral",
    hoverBg: "hover:bg-coral/20",
    iconBg: "bg-coral",
    iconText: "text-white",
  },
} as const;

function PrepCard({
  href,
  icon: Icon,
  title,
  description,
  style,
}: {
  href: string;
  icon: typeof GraduationCap;
  title: string;
  description: string;
  style: (typeof CARD_STYLES)[keyof typeof CARD_STYLES];
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer sponsored"
      className={`group flex items-start gap-3 rounded-xl border p-4 transition-colors ${style.border} ${style.bg} ${style.hoverBorder} ${style.hoverBg}`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${style.iconBg} ${style.iconText}`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.75} />
      </span>
      <span>
        <span className="block font-display text-sm font-semibold text-ink">{title}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-ink-soft">{description}</span>
      </span>
    </a>
  );
}

export default function InternshipPrepPanel({
  internship,
  justApplied = false,
}: {
  internship: Internship;
  justApplied?: boolean;
}) {
  const domain = domainLabel(internship);
  const topSkill = internship.skills_required?.[0];

  const courseraHref = buildCourseraLink(topSkill || domain);
  const interviewHref = buildInterviewPrepLink(domain);
  const resumeHref = buildResumeIoLink();

  return (
    <div
      className={`mt-5 rounded-2xl transition-all ${
        justApplied
          ? "border-2 border-marigold-dark bg-marigold/5 p-4 shadow-sm"
          : "border-0 p-0"
      }`}
    >
      {justApplied ? (
        <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-marigold-dark">
          <Sparkles className="h-4 w-4" />
          Your application&apos;s opening in a new tab — while you wait, here&apos;s how
          applicants often strengthen their shot:
        </p>
      ) : (
        <p className="mb-3 font-display text-sm font-semibold text-ink">
          Level up before you apply
        </p>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <PrepCard
          href={courseraHref}
          icon={GraduationCap}
          title="Build a skill recruiters look for"
          description={`A short ${topSkill ? `${topSkill} ` : ""}course on Coursera is a concrete, resume-ready way to back up this application.`}
          style={CARD_STYLES.marigold}
        />
        <PrepCard
          href={interviewHref}
          icon={MessageSquareText}
          title="Walk into the interview ready"
          description={`Practice the kinds of questions ${domain} interviews actually ask, before you're asked them.`}
          style={CARD_STYLES.teal}
        />
        <PrepCard
          href={resumeHref}
          icon={FileCheck2}
          title="Make sure your resume gets read"
          description="A free review from resume.io before you apply — recruiters skim fast, so first impressions count."
          style={CARD_STYLES.coral}
        />
      </div>

      <p className="mt-3 text-[11px] leading-relaxed text-slate">
        Affiliate links — LetsInternz may earn a commission if you sign up,
        at no extra cost to you. We only link to tools we think are
        genuinely worth your time.
      </p>
    </div>
  );
}
