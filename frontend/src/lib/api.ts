import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";
import type {
  Application,
  ApplicationCreatePayload,
  ApplicationStats,
  ApplicationUpdatePayload,
  DeadlineAlert,
  Domain,
  DomainCount,
  Internship,
  InternshipListParams,
  InternshipSource,
  PaginatedResponse,
  Profile,
  ProfileUpdatePayload,
  SavedFolder,
  SavedInternship,
  SkillCount,
  User,
} from "./types";

// ---------------------------------------------------------------------------
// Token storage
//
// Tokens live in localStorage — that's what this axios client reads on every
// request. They're also mirrored into plain (non-httpOnly) cookies purely so
// middleware.ts, which runs on the server/edge and has no access to
// localStorage, can gate protected routes without an extra network round
// trip. The cookie is never trusted as the source of truth for auth calls —
// only localStorage is.
// ---------------------------------------------------------------------------

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const ACCESS_TOKEN_MAX_AGE = 60 * 60 * 24; // 1 day — mirrors SIMPLE_JWT ACCESS_TOKEN_LIFETIME
const REFRESH_TOKEN_MAX_AGE = 60 * 60 * 24 * 30; // 30 days — mirrors REFRESH_TOKEN_LIFETIME

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${value}; path=/; max-age=${maxAgeSeconds}; SameSite=Lax`;
}

function deleteCookie(name: string) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; path=/; max-age=0`;
}

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_KEY);
}

/** Persist a fresh token pair. `refresh` is optional since token-refresh
 * calls sometimes only return a new access token. */
export function setAuthTokens(access: string, refresh?: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESS_TOKEN_KEY, access);
  setCookie(ACCESS_TOKEN_KEY, access, ACCESS_TOKEN_MAX_AGE);

  if (refresh) {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
    setCookie(REFRESH_TOKEN_KEY, refresh, REFRESH_TOKEN_MAX_AGE);
  }
}

export function clearAuthTokens() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  deleteCookie(ACCESS_TOKEN_KEY);
  deleteCookie(REFRESH_TOKEN_KEY);
}

// ---------------------------------------------------------------------------
// Axios instance
// ---------------------------------------------------------------------------

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor: on 401, refresh the access token once and retry the
// original request. Concurrent 401s while a refresh is already in flight are
// queued and replayed once the new token is available, so we never fire off
// multiple simultaneous refresh calls. If the refresh itself fails, clear
// auth state and send the user to /login.
// ---------------------------------------------------------------------------

interface RetriableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

function resolveQueue(token: string) {
  refreshQueue.forEach(({ resolve }) => resolve(token));
  refreshQueue = [];
}

function rejectQueue(error: unknown) {
  refreshQueue.forEach(({ reject }) => reject(error));
  refreshQueue = [];
}

function redirectToLogin() {
  clearAuthTokens();
  if (typeof window !== "undefined") {
    // Hard navigation, not router.push() — this runs inside an axios
    // interceptor, outside React's render tree, so useRouter isn't
    // available. A full reload also fully resets in-memory app state.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = "/login";
  }
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableRequestConfig | undefined;

    if (!originalRequest || error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // Never try to "refresh" the refresh call itself, and never retry twice.
    if (originalRequest.url?.includes("/auth/token/refresh/") || originalRequest._retry) {
      redirectToLogin();
      return Promise.reject(error);
    }

    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      redirectToLogin();
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        refreshQueue.push({
          resolve: (token) => {
            originalRequest.headers.set("Authorization", `Bearer ${token}`);
            resolve(api(originalRequest));
          },
          reject,
        });
      });
    }

    isRefreshing = true;
    try {
      const { data } = await axios.post<{ access: string; refresh?: string }>(
        `${API_BASE_URL}/auth/token/refresh/`,
        { refresh: refreshToken }
      );
      setAuthTokens(data.access, data.refresh);
      resolveQueue(data.access);

      originalRequest.headers.set("Authorization", `Bearer ${data.access}`);
      return api(originalRequest);
    } catch (refreshError) {
      rejectQueue(refreshError);
      redirectToLogin();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ---------------------------------------------------------------------------
// Typed API functions
// ---------------------------------------------------------------------------

export interface AuthResponse {
  user: User;
  access: string;
  refresh: string;
}

export interface SignupResponse {
  detail: string;
  email: string;
}

export const authApi = {
  register: (payload: {
    email: string;
    username: string;
    password: string;
    password2: string;
  }) => api.post<SignupResponse>("/auth/register/", payload).then((r) => r.data),

  verifyEmail: (email: string, otp: string) =>
    api.post<AuthResponse>("/auth/verify-email/", { email, otp }).then((r) => r.data),

  login: (payload: { email: string; password: string }) =>
    api.post<AuthResponse>("/auth/login/", payload).then((r) => r.data),

  requestPasswordReset: (email: string) =>
    api.post<{ detail: string }>("/auth/password/forgot/", { email }).then((r) => r.data),

  verifyPasswordResetOtp: (email: string, otp: string) =>
    api
      .post<{ reset_token: string }>("/auth/password/verify-otp/", { email, otp })
      .then((r) => r.data),

  resetPassword: (payload: {
    email: string;
    reset_token: string;
    password: string;
    password2: string;
  }) => api.post<{ detail: string }>("/auth/password/reset/", payload).then((r) => r.data),

  logout: (refresh: string) => api.post("/auth/logout/", { refresh }).then((r) => r.data),

  getProfile: () => api.get<Profile>("/auth/profile/").then((r) => r.data),

  updateProfile: (payload: ProfileUpdatePayload) =>
    api.put<Profile>("/auth/profile/", payload).then((r) => r.data),

  uploadResume: (file: File, onUploadProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append("resume", file);
    return api
      .post<{ resume: string; profile_completion: number }>(
        "/auth/profile/resume/",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: onUploadProgress
            ? (event) => {
                const percent = event.total
                  ? Math.round((event.loaded / event.total) * 100)
                  : 0;
                onUploadProgress(percent);
              }
            : undefined,
        }
      )
      .then((r) => r.data);
  },

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append("avatar", file);
    return api
      .post<{ avatar: string; profile_completion: number }>(
        "/auth/profile/avatar/",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
      )
      .then((r) => r.data);
  },

  changePassword: (payload: {
    old_password: string;
    new_password: string;
    new_password2: string;
  }) => api.post<{ detail: string }>("/auth/change-password/", payload).then((r) => r.data),

  deleteAccount: (password: string) =>
    api.delete("/auth/delete-account/", { data: { password } }).then((r) => r.data),
};

function buildInternshipParams(params: InternshipListParams = {}) {
  const query: Record<string, string | number | boolean> = {};

  if (params.page) query.page = params.page;
  if (params.search) query.search = params.search;
  if (params.domain?.length) query.domain = params.domain.join(",");
  if (params.work_type?.length) query.work_type = params.work_type.join(",");
  if (params.city?.length) query.city = params.city.join(",");
  if (params.source__name?.length) query.source__name = params.source__name.join(",");
  if (params.stipend_min !== undefined) query.stipend_min = params.stipend_min;
  if (params.stipend_max !== undefined) query.stipend_max = params.stipend_max;
  if (params.duration_months !== undefined) query.duration_months = params.duration_months;
  if (params.skills) query.skills = params.skills;
  if (params.deadline__gte) query.deadline__gte = params.deadline__gte;
  if (params.is_unpaid !== undefined) query.is_unpaid = params.is_unpaid;
  if (params.ordering) query.ordering = params.ordering;

  return query;
}

export const internshipsApi = {
  list: (params?: InternshipListParams) =>
    api
      .get<PaginatedResponse<Internship>>("/internships/", {
        params: buildInternshipParams(params),
      })
      .then((r) => r.data),

  detail: (id: string) => api.get<Internship>(`/internships/${id}/`).then((r) => r.data),

  recommended: () => api.get<Internship[]>("/internships/recommended/").then((r) => r.data),

  featured: () => api.get<Internship[]>("/internships/featured/").then((r) => r.data),

  sources: () => api.get<InternshipSource[]>("/internships/sources/").then((r) => r.data),

  domains: () => api.get<DomainCount[]>("/internships/domains/").then((r) => r.data),

  skills: (limit?: number) =>
    api
      .get<SkillCount[]>("/internships/skills/", { params: limit ? { limit } : undefined })
      .then((r) => r.data),
};

export const applicationsApi = {
  list: (params?: { status?: string; search?: string; page?: number; page_size?: number }) =>
    api
      .get<PaginatedResponse<Application>>("/applications/", { params })
      .then((r) => r.data),

  create: (payload: ApplicationCreatePayload) =>
    api.post<Application>("/applications/", payload).then((r) => r.data),

  update: (id: string, payload: ApplicationUpdatePayload) =>
    api.patch<Application>(`/applications/${id}/`, payload).then((r) => r.data),

  remove: (id: string) => api.delete(`/applications/${id}/`).then(() => undefined),

  stats: () => api.get<ApplicationStats>("/applications/stats/").then((r) => r.data),
};

export const savedApi = {
  list: (params?: { folder?: string; page?: number; page_size?: number }) =>
    api
      .get<PaginatedResponse<SavedInternship>>("/saved/", { params })
      .then((r) => r.data),

  create: (payload: { internship_id: string; folder?: string }) =>
    api.post<SavedInternship>("/saved/", payload).then((r) => r.data),

  remove: (id: number) => api.delete(`/saved/${id}/`).then(() => undefined),

  toggle: (internshipId: string, folder?: string) =>
    api
      .post<{ saved: boolean }>(`/saved/toggle/${internshipId}/`, folder ? { folder } : undefined)
      .then((r) => r.data),

  deadlineAlerts: () => api.get<DeadlineAlert[]>("/saved/deadline-alerts/").then((r) => r.data),

  folders: {
    list: () =>
      api.get<PaginatedResponse<SavedFolder>>("/saved/folders/").then((r) => r.data),

    create: (name: string) =>
      api.post<SavedFolder>("/saved/folders/", { name }).then((r) => r.data),

    remove: (id: number) => api.delete(`/saved/folders/${id}/`).then(() => undefined),
  },
};

// Re-exported for convenience so `Domain` is available wherever `internshipsApi` is imported.
export type { Domain };

export default api;
