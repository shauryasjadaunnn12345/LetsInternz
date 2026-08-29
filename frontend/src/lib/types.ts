/**
 * TypeScript types mirroring the LetsInternz Django REST API responses.
 * Field names match the DRF serializers exactly (backend "*" apps' serializers.py).
 */

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------

export type UserRole = "student" | "admin";

/** Shape returned inside the register/login response's `user` object. */
export interface User {
  id: number;
  email: string;
  username: string;
  role?: UserRole;
}

export interface Profile {
  id: number;
  email: string;
  username: string;
  full_name: string;
  phone: string;
  college: string;
  branch: string;
  graduation_year: number | null;
  cgpa: string | null; // DRF DecimalField serializes as a string
  skills: string[];
  preferred_domains: string[];
  preferred_work_types: string[];
  preferred_locations: string[];
  expected_stipend_min: number | null;
  expected_stipend_max: number | null;
  resume: string | null; // URL
  avatar: string | null; // URL
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  profile_completion: number;
  email_digest: "daily" | "weekly" | "never";
  deadline_reminders_enabled: boolean;
  new_matches_alert_enabled: boolean;
  application_status_alerts_enabled: boolean;
  is_profile_public: boolean;
  created_at: string;
  updated_at: string;
}

export type ProfileUpdatePayload = Partial<
  Pick<
    Profile,
    | "full_name"
    | "phone"
    | "college"
    | "branch"
    | "graduation_year"
    | "cgpa"
    | "skills"
    | "preferred_domains"
    | "preferred_work_types"
    | "preferred_locations"
    | "expected_stipend_min"
    | "expected_stipend_max"
    | "linkedin_url"
    | "github_url"
    | "portfolio_url"
    | "email_digest"
    | "deadline_reminders_enabled"
    | "new_matches_alert_enabled"
    | "application_status_alerts_enabled"
    | "is_profile_public"
  >
>;

// ---------------------------------------------------------------------------
// Internships
// ---------------------------------------------------------------------------

export type WorkType = "remote" | "hybrid" | "onsite";

export type Domain =
  | "tech"
  | "marketing"
  | "design"
  | "finance"
  | "data_science"
  | "hr"
  | "operations"
  | "content"
  | "sales";

export interface InternshipSource {
  id: number;
  name: string;
  base_url: string;
  logo_url: string;
  is_active: boolean;
  last_scraped_at: string | null;
  total_internships_scraped: number;
  /** Only present on the /internships/sources/ endpoint. */
  active_internships_count?: number;
}

/**
 * Covers both the list (lightweight) and detail (full) shapes returned by
 * InternshipListSerializer / InternshipDetailSerializer — fields only
 * present on one or the other are optional.
 */
export interface Internship {
  id: string; // UUID
  title: string;
  company: string;
  company_logo_url: string;
  location: string;
  city: string;
  work_type: WorkType;
  domain: Domain;
  duration: string;
  duration_months: number | null;
  stipend_display: string;
  is_unpaid: boolean;
  skills_required: string[];
  apply_link: string;
  deadline: string | null; // date
  posted_at: string; // datetime
  views_count: number;

  /** List view only. */
  source_name?: string;

  /** Detail view only. */
  stipend_min?: number | null;
  stipend_max?: number | null;
  description?: string;
  requirements?: string;
  perks?: string[];
  source?: InternshipSource;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface DomainCount {
  value: Domain;
  label: string;
  count: number;
}

export interface SkillCount {
  skill: string;
  count: number;
}

export interface InternshipListParams {
  page?: number;
  search?: string;
  domain?: Domain[];
  work_type?: WorkType[];
  city?: string[];
  source__name?: string[];
  stipend_min?: number;
  stipend_max?: number;
  duration_months?: number;
  skills?: string;
  deadline__gte?: string;
  is_unpaid?: boolean;
  /** Maps to the browse page's sort dropdown: "-posted_at" | "-stipend_max" | "deadline" */
  ordering?: string;
}

// ---------------------------------------------------------------------------
// Applications
// ---------------------------------------------------------------------------

export type ApplicationStatus =
  | "applied"
  | "under_review"
  | "interview"
  | "offer_received"
  | "selected"
  | "rejected";

export interface Application {
  id: string; // UUID
  internship: Internship | null;
  company: string;
  role: string;
  manual_company: string;
  manual_role: string;
  manual_apply_link: string;
  manual_stipend: string;
  stipend_display: string;
  status: ApplicationStatus;
  notes: string;
  next_step: string;
  reminder_date: string | null;
  applied_at: string;
  updated_at: string;
}

export interface ApplicationCreatePayload {
  internship_id?: string;
  manual_company?: string;
  manual_role?: string;
  manual_apply_link?: string;
  manual_stipend?: string;
  status?: ApplicationStatus;
  notes?: string;
  next_step?: string;
  reminder_date?: string | null;
}

export interface ApplicationUpdatePayload {
  status?: ApplicationStatus;
  notes?: string;
  next_step?: string;
  reminder_date?: string | null;
  manual_company?: string;
  manual_role?: string;
  manual_apply_link?: string;
  manual_stipend?: string;
}

export type ApplicationStats = Record<ApplicationStatus, number> & {
  total: number;
};

// ---------------------------------------------------------------------------
// Saved internships
// ---------------------------------------------------------------------------

export interface SavedInternship {
  id: number;
  internship: Internship;
  folder: string;
  saved_at: string;
}

export interface SavedFolder {
  id: number;
  name: string;
  created_at: string;
}

export interface DeadlineAlert {
  saved_id: number;
  internship: Internship;
  deadline: string;
  folder: string;
}

// ---------------------------------------------------------------------------
// Generic API envelopes
// ---------------------------------------------------------------------------

/**
 * The Django backend doesn't wrap successful responses in an envelope —
 * a request for a `Profile` just returns a `Profile` body. This alias exists
 * so call sites can express "the response shape for T" consistently, and to
 * leave room for a real envelope later without changing call sites.
 */
export type APIResponse<T> = T;

/** DRF's PageNumberPagination shape. */
export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/** Shape of DRF validation-error / detail-error bodies. */
export interface APIError {
  detail?: string;
  [field: string]: unknown;
}
