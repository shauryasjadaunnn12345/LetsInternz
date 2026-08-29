import { create } from "zustand";
import { persist } from "zustand/middleware";

import { authApi, clearAuthTokens, getRefreshToken, setAuthTokens } from "@/lib/api";
import type { Profile, User } from "@/lib/types";

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /** Persist a token pair and mark the session as authenticated. */
  setTokens: (access: string, refresh?: string) => void;

  /** Log in with email/password, store tokens, and fetch the profile. */
  login: (email: string, password: string) => Promise<void>;

  /** Register a new account, store tokens, and fetch the (empty) profile. */
  register: (payload: {
    email: string;
    username: string;
    full_name: string;
    password: string;
    password2: string;
  }) => Promise<string>;

  verifyEmail: (email: string, otp: string) => Promise<void>;

  /** Best-effort server-side logout, then always clear local state. */
  logout: () => Promise<void>;

  /** Merge partial profile fields into the store (e.g. after an update). */
  updateProfile: (profile: Profile) => void;

  /** Fetch the current user's profile and store it — used to refresh
   * onboarding-completion state without a full page reload. */
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      profile: null,
      isAuthenticated: false,
      isLoading: false,

      setTokens: (access, refresh) => {
        setAuthTokens(access, refresh);
        set({ isAuthenticated: true });
      },

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const data = await authApi.login({ email, password });
          setAuthTokens(data.access, data.refresh);
          set({ user: data.user, isAuthenticated: true });

          try {
            const profile = await authApi.getProfile();
            set({ profile });
          } catch {
            // Profile fetch is best-effort — auth itself still succeeded.
          }
        } finally {
          set({ isLoading: false });
        }
      },

      register: async (payload) => {
        set({ isLoading: true });
        try {
          const data = await authApi.register(payload);
          return data.email;
        } finally {
          set({ isLoading: false });
        }
      },

      verifyEmail: async (email, otp) => {
        set({ isLoading: true });
        try {
          const data = await authApi.verifyEmail(email, otp);
          setAuthTokens(data.access, data.refresh);
          set({ user: data.user, isAuthenticated: true });
          try {
            const profile = await authApi.getProfile();
            set({ profile });
          } catch {
            // Profile fetch is best-effort after successful verification.
          }
        } finally {
          set({ isLoading: false });
        }
      },

      logout: async () => {
        const refresh = getRefreshToken();
        try {
          if (refresh) {
            await authApi.logout(refresh);
          }
        } catch {
          // Ignore — we clear local state regardless of server-side result.
        } finally {
          clearAuthTokens();
          set({ user: null, profile: null, isAuthenticated: false });
        }
      },

      updateProfile: (profile) => set({ profile }),

      refreshProfile: async () => {
        if (!get().isAuthenticated) return;
        const profile = await authApi.getProfile();
        set({ profile });
      },
    }),
    {
      name: "letsinternz-auth",
      // Only persist plain state — never the async action functions.
      partialize: (state) => ({
        user: state.user,
        profile: state.profile,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
