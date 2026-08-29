"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { authApi, setAuthTokens } from "@/lib/api";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "@/store/authStore";

export default function AuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const finishSignIn = async () => {
      if (!supabase) {
        router.replace("/login");
        return;
      }

      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        router.replace("/login");
        return;
      }

      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      if (error || !data.session || !data.session.user.email) {
        console.error("Supabase auth callback failed", error);
        router.replace("/login");
        return;
      }

      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL ?? "/api"}/auth/google-login/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider: "supabase",
            email: data.session.user.email,
            username:
              data.session.user.user_metadata?.full_name ||
              data.session.user.email.split("@")[0],
            credential: data.session.access_token,
          }),
        });

        if (!response.ok) {
          console.error("Django auth exchange failed");
          router.replace("/login");
          return;
        }

        const authData = await response.json();
        setAuthTokens(authData.access, authData.refresh);
        useAuthStore.setState({ user: authData.user, isAuthenticated: true });

        let profile = null;
        try {
          profile = await authApi.getProfile();
          useAuthStore.setState({ profile });
        } catch {
          // best effort
        }

        router.replace(profile && profile.profile_completion > 0 ? "/dashboard" : "/onboarding");
      } catch (err) {
        console.error("Supabase callback exchange error", err);
        router.replace("/login");
      }
    };

    void finishSignIn();
  }, [router]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-6">
      <div className="text-center">
        <p className="text-lg font-semibold text-ink">Finishing sign in…</p>
        <p className="mt-2 text-sm text-ink-soft">You’ll be redirected shortly.</p>
      </div>
    </main>
  );
}
