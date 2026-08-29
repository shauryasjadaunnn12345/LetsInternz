"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import AuthShell from "@/components/auth/AuthShell";
import { Input, Label } from "@/components/ui/Field";
import { useAuthStore } from "@/store/authStore";

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={null}>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { verifyEmail, isLoading } = useAuthStore();
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    try {
      await verifyEmail(email, otp);
      router.replace("/onboarding");
    } catch (requestError) {
      const data = requestError instanceof AxiosError ? requestError.response?.data : null;
      setError(data?.detail ?? "That code is invalid or expired. Please try again.");
    }
  };

  return (
    <AuthShell
      eyebrow="Verify your email"
      title="One quick check before you start finding your next role."
      subtitle="Enter the six-digit code we sent to your email address."
    >
      <h1 className="font-display text-2xl font-semibold text-ink">Check your inbox</h1>
      <p className="mt-1.5 text-sm text-slate">Your account is ready. Verify your email to continue.</p>

      {error && <div className="mt-5 rounded-lg border border-coral/30 bg-coral/10 px-3.5 py-2.5 text-sm font-medium text-coral">{error}</div>}

      <form onSubmit={submit} className="mt-7 space-y-4">
        <div><Label htmlFor="verification-email">Email</Label><Input id="verification-email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
        <div><Label htmlFor="verification-otp">6-digit verification code</Label><Input id="verification-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
        <button disabled={isLoading} className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60">{isLoading ? "Verifying..." : "Verify email"}</button>
      </form>

      <p className="mt-5 text-center text-sm text-slate"><Link href="/signup" className="font-semibold text-ink hover:underline">Start signup again</Link></p>
    </AuthShell>
  );
}