"use client";

import { AxiosError } from "axios";
import Link from "next/link";
import { useState } from "react";

import AuthShell from "@/components/auth/AuthShell";
import { Input, Label } from "@/components/ui/Field";
import { authApi } from "@/lib/api";

function errorMessage(error: unknown) {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data?.detail) return data.detail;
    if (data?.password?.[0]) return data.password[0];
    if (data?.password2?.[0]) return data.password2[0];
  }
  return "Something went wrong. Please try again.";
}

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [step, setStep] = useState<"email" | "otp" | "password" | "done">("email");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async (action: () => Promise<void>) => {
    setError(null);
    setMessage(null);
    setIsSubmitting(true);
    try {
      await action();
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const requestOtp = (event: React.FormEvent) => {
    event.preventDefault();
    void submit(async () => {
      await authApi.requestPasswordReset(email);
      setMessage("If an account exists for that email, a reset code has been sent.");
      setStep("otp");
    });
  };

  const verifyOtp = (event: React.FormEvent) => {
    event.preventDefault();
    void submit(async () => {
      const result = await authApi.verifyPasswordResetOtp(email, otp);
      setResetToken(result.reset_token);
      setStep("password");
    });
  };

  const resetPassword = (event: React.FormEvent) => {
    event.preventDefault();
    if (password !== password2) {
      setError("Passwords do not match.");
      return;
    }
    void submit(async () => {
      await authApi.resetPassword({ email, reset_token: resetToken ?? "", password, password2 });
      setStep("done");
    });
  };

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Get back to the internships you were building toward."
      subtitle="Use a one-time code sent to your email to create a new password."
    >
      {step === "done" ? (
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Password updated</h1>
          <p className="mt-2 text-sm leading-relaxed text-slate">Your password has been reset. You can sign in with it now.</p>
          <Link href="/login" className="mt-6 block w-full rounded-lg bg-ink px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-ink-soft">
            Go to login
          </Link>
        </div>
      ) : (
        <>
          <h1 className="font-display text-2xl font-semibold text-ink">Reset your password</h1>
          <p className="mt-1.5 text-sm text-slate">Remembered it? <Link href="/login" className="font-semibold text-ink hover:underline">Log in</Link></p>

          {message && <div className="mt-5 rounded-lg border border-teal/30 bg-teal/10 px-3.5 py-2.5 text-sm font-medium text-teal">{message}</div>}
          {error && <div className="mt-5 rounded-lg border border-coral/30 bg-coral/10 px-3.5 py-2.5 text-sm font-medium text-coral">{error}</div>}

          {step === "email" && (
            <form onSubmit={requestOtp} className="mt-7 space-y-4">
              <div><Label htmlFor="reset-email">Email</Label><Input id="reset-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></div>
              <button disabled={isSubmitting} className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60">{isSubmitting ? "Sending code..." : "Send reset code"}</button>
            </form>
          )}

          {step === "otp" && (
            <form onSubmit={verifyOtp} className="mt-7 space-y-4">
              <div><Label htmlFor="reset-otp">6-digit code</Label><Input id="reset-otp" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={otp} onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))} /></div>
              <button disabled={isSubmitting} className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60">{isSubmitting ? "Checking code..." : "Verify code"}</button>
              <button type="button" onClick={() => setStep("email")} className="w-full text-sm font-medium text-slate hover:text-ink">Use a different email</button>
            </form>
          )}

          {step === "password" && (
            <form onSubmit={resetPassword} className="mt-7 space-y-4">
              <div><Label htmlFor="new-password">New password</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></div>
              <div><Label htmlFor="confirm-new-password">Confirm new password</Label><Input id="confirm-new-password" type="password" autoComplete="new-password" minLength={8} required value={password2} onChange={(event) => setPassword2(event.target.value)} /></div>
              <button disabled={isSubmitting} className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white hover:bg-ink-soft disabled:opacity-60">{isSubmitting ? "Updating password..." : "Update password"}</button>
            </form>
          )}
        </>
      )}
    </AuthShell>
  );
}