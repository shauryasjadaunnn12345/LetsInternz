import type { ApplicationStatus, Domain, WorkType } from "@/lib/types";

export const DOMAIN_OPTIONS: { value: Domain; label: string }[] = [
  { value: "tech", label: "Tech" },
  { value: "marketing", label: "Marketing" },
  { value: "design", label: "Design" },
  { value: "finance", label: "Finance" },
  { value: "data_science", label: "Data Science" },
  { value: "hr", label: "HR" },
  { value: "operations", label: "Operations" },
  { value: "content", label: "Content" },
  { value: "sales", label: "Sales" },
];

export const WORK_TYPE_OPTIONS: { value: WorkType; label: string }[] = [
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
  { value: "onsite", label: "Onsite" },
];

/** The browse page's location filter — a fixed, curated list per spec
 * (distinct from onboarding's broader preferred-locations list). */
export const BROWSE_CITY_OPTIONS = [
  "Remote",
  "Bangalore",
  "Mumbai",
  "Delhi",
  "Hyderabad",
  "Pune",
  "Chennai",
];

/** Broader city list for the profile page's searchable "preferred
 * locations" multi-select — wider than BROWSE_CITY_OPTIONS' filter-sidebar
 * set since a student's preferences aren't limited to the cities we
 * currently have listings in. */
export const PROFILE_LOCATION_OPTIONS = [
  "Remote",
  "Bangalore",
  "Mumbai",
  "Delhi NCR",
  "Hyderabad",
  "Pune",
  "Chennai",
  "Kolkata",
  "Ahmedabad",
  "Jaipur",
  "Noida",
  "Gurugram",
  "Chandigarh",
  "Kochi",
  "Indore",
  "Coimbatore",
];

/** Duration filter buckets. The backend only supports a single `duration_months`
 * (lte) threshold, not arbitrary ranges, so these act as a single-select even
 * though they're rendered as checkboxes — picking one deselects any other. */
export const DURATION_OPTIONS = [
  { label: "Up to 1 month", months: 1 },
  { label: "Up to 3 months", months: 3 },
  { label: "Up to 6 months", months: 6 },
];

export const SORT_OPTIONS = [
  { value: "-posted_at", label: "Latest" },
  { value: "-stipend_max", label: "Stipend: High to Low" },
  { value: "deadline", label: "Deadline: Soonest" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

// ---------------------------------------------------------------------------
// Application status — shared across the dashboard donut chart, Kanban
// board, list view badges, and status dropdowns so colors/labels never
// drift between them.
//
// The backend has 6 statuses (applied, under_review, interview,
// offer_received, selected, rejected). The Kanban spec calls for 5 columns
// (omitting "selected") and the donut chart spec calls for 5 segments
// (omitting "offer_received") — rather than silently dropping whichever
// status each view left out, both views surface all 6: the Kanban board
// visually buckets "selected" into the "Offer Received" column (dropping a
// card there sets status back to "offer_received", since the column has one
// canonical status), and the donut chart adds "Offer Received" as a 6th
// segment alongside the 5 named colors.
// ---------------------------------------------------------------------------

export const STATUS_META: Record<
  ApplicationStatus,
  { label: string; badgeBg: string; badgeText: string; chartColor: string }
> = {
  applied: {
    label: "Applied",
    badgeBg: "bg-blue-100",
    badgeText: "text-blue-700",
    chartColor: "#3B82F6",
  },
  under_review: {
    label: "Under Review",
    badgeBg: "bg-yellow-100",
    badgeText: "text-yellow-800",
    chartColor: "#EAB308",
  },
  interview: {
    label: "Interview",
    badgeBg: "bg-purple-100",
    badgeText: "text-purple-700",
    chartColor: "#8B5CF6",
  },
  offer_received: {
    label: "Offer Received",
    badgeBg: "bg-cyan-100",
    badgeText: "text-cyan-700",
    chartColor: "#06B6D4",
  },
  selected: {
    label: "Selected",
    badgeBg: "bg-green-100",
    badgeText: "text-green-700",
    chartColor: "#22C55E",
  },
  rejected: {
    label: "Rejected",
    badgeBg: "bg-red-100",
    badgeText: "text-red-700",
    chartColor: "#EF4444",
  },
};

export const STATUS_ORDER: ApplicationStatus[] = [
  "applied",
  "under_review",
  "interview",
  "offer_received",
  "selected",
  "rejected",
];

/** The 5 Kanban columns per spec. "selected" applications are bucketed into
 * the "offer_received" column for display (see note above). */
export const KANBAN_COLUMNS: { status: ApplicationStatus; label: string }[] = [
  { status: "applied", label: "Applied" },
  { status: "under_review", label: "Under Review" },
  { status: "interview", label: "Interview" },
  { status: "offer_received", label: "Offer Received" },
  { status: "rejected", label: "Rejected" },
];

/**
 * Platforms LetsInternz aggregates from. Rendered as text wordmarks rather
 * than reproduced logo artwork — avoids any trademark/copyright concerns
 * while still being immediately recognizable by name. No live "sources"
 * data is seeded in a fresh dev database, so the marketing pages (hero
 * strip, source grid) use this static list rather than fetching from the
 * API and risking an empty section.
 */
export const SOURCE_PLATFORMS = [
  "Internshala",
  "Unstop",
  "LinkedIn",
  "AngelList",
  "Naukri Campus",
  "Indeed",
  "Glassdoor",
  "Foundit",
  "Hirist",
  "Cutshort",
  "HackerEarth",
  "Instahyre",
] as const;

export interface FAQItem {
  question: string;
  answer: string;
}

/** Shared by the FAQ section's rendered accordion and its FAQPage JSON-LD
 * so the structured data always matches what's actually on the page. */
export const FAQ_ITEMS: FAQItem[] = [
  {
    question: "What is LetsInternz?",
    answer:
      "LetsInternz is a search engine for internships. Instead of checking Internshala, Unstop, LinkedIn and a dozen other sites separately, you search once here and see listings from all of them in one place.",
  },
  {
    question: "Which platforms do you aggregate from?",
    answer:
      "We pull daily from 20+ platforms including Internshala, Unstop, LinkedIn, AngelList, Naukri Campus, Indeed, Glassdoor, Foundit, Hirist, Cutshort, HackerEarth and Instahyre — with more added regularly.",
  },
  {
    question: "Is LetsInternz free to use?",
    answer:
      "Yes. Searching, filtering, saving internships and tracking your applications are all free, with no hidden tiers for students.",
  },
  {
    question: "How often are listings updated?",
    answer:
      "Our scrapers run daily, so new postings typically appear within 24 hours of going live on the source platform, and closed or expired listings are removed automatically.",
  },
  {
    question: "Do I apply on LetsInternz or on the original platform?",
    answer:
      "You apply on the original platform. Every listing's \"View & Apply\" button takes you straight to the source posting — LetsInternz is where you find and track opportunities, not where you submit applications.",
  },
  {
    question: "Can I track the internships I've applied to?",
    answer:
      "Yes. Your dashboard's Application Tracker lets you log applications (linked to a listing or added manually), update their status as you hear back, and see everything in one view instead of scattered across emails.",
  },
  {
    question: "Can I save internships for later?",
    answer:
      "Yes. Tap the bookmark icon on any listing to save it to a folder, and we'll surface a deadline alert if a saved internship is closing within 7 days.",
  },
  {
    question: "Do I need an account to browse internships?",
    answer:
      "No — browsing and filtering internships is open to everyone. You only need an account to save listings, track applications, or get personalized recommendations based on your skills.",
  },
];

// ---------------------------------------------------------------------------
// Social links
// ---------------------------------------------------------------------------

export const LINKEDIN_URL = "https://www.linkedin.com/company/135163925";

// ---------------------------------------------------------------------------
// Affiliate links — shown on the internship detail page as "Prepare for this
// role" (Coursera) and "Check your resume" (resume.io). Both work as plain
// links out of the box; the affiliate tag constants below are empty
// placeholders — fill them in once you've signed up for each program and
// every link on the site starts carrying your tracking ID automatically.
//
//   Coursera affiliate program: https://about.coursera.org/affiliates
//   Resume.io affiliate program: run through Impact or a similar network —
//   check resume.io's own site footer for their current partner program.
// ---------------------------------------------------------------------------

const COURSERA_AFFILIATE_ID = ""; // e.g. an Impact Radius "irclickid" or partner ID
const RESUME_IO_AFFILIATE_ID = ""; // e.g. a partner/ref code

/** Coursera search results for a given skill/domain, so "Prepare for this
 * role" links somewhere relevant rather than Coursera's homepage. */
export function buildCourseraLink(query: string): string {
  const params = new URLSearchParams({ query });
  if (COURSERA_AFFILIATE_ID) params.set("irclickid", COURSERA_AFFILIATE_ID);
  return `https://www.coursera.org/search?${params.toString()}`;
}

export function buildResumeIoLink(): string {
  return RESUME_IO_AFFILIATE_ID
    ? `https://resume.io/?ref=${RESUME_IO_AFFILIATE_ID}`
    : "https://resume.io/";
}

/** Interview-prep search, scoped by domain so a marketing internship gets
 * marketing-interview content rather than generic/software-only prep.
 * Reuses the Coursera affiliate account for now (real, working link from
 * day one, no dead button while waiting on a dedicated partner) — swap the
 * base URL here for a dedicated interview-coaching affiliate program
 * (e.g. Big Interview, Exponent, Prepfully) once you've signed up for one;
 * every call site stays the same. */
export function buildInterviewPrepLink(domainLabel: string): string {
  return buildCourseraLink(`${domainLabel} interview preparation`);
}
