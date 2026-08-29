"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AuthShell from "@/components/auth/AuthShell";
import GoogleButton from "@/components/auth/GoogleButton";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { useAuthStore } from "@/store/authStore";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginValues = z.infer<typeof loginSchema>;

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data?.non_field_errors?.[0]) return data.non_field_errors[0];
    if (data?.detail) return data.detail;
  }
  return "Something went wrong. Please try again.";
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isAuthenticated } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);

  // Only accept a same-site relative path (e.g. "/internships/abc") — never
  // an absolute URL, which would make this an open redirect.
  const rawNext = searchParams.get("next");
  const nextPath = rawNext && rawNext.startsWith("/") && !rawNext.startsWith("//") ? rawNext : "/dashboard";

  useEffect(() => {
    if (isAuthenticated) {
      router.replace(nextPath);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- nextPath is derived from searchParams, stable enough for this redirect-once effect
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (values: LoginValues) => {
    setFormError(null);
    try {
      await login(values.email, values.password);
      router.push(nextPath);
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Every internship you're tracking, right where you left off."
      subtitle="Log back in to pick up your applications, saved listings, and deadline alerts."
    >
      <h1 className="font-display text-2xl font-semibold text-ink">Log in</h1>
      <p className="mt-1.5 text-sm text-slate">
        New to LetsInternz?{" "}
        <Link href="/signup" className="font-semibold text-ink hover:underline">
          Create an account
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        {formError && (
          <div className="rounded-lg border border-coral/30 bg-coral/10 px-3.5 py-2.5 text-sm font-medium text-coral">
            {formError}
          </div>
        )}

        <div>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            invalid={!!errors.email}
            {...register("email")}
          />
          <FieldError>{errors.email?.message}</FieldError>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-ink">
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-slate hover:text-ink"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
        >
          {isSubmitting ? "Logging in…" : "Log in"}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-xs font-medium text-slate">OR</span>
        <div className="h-px flex-1 bg-border" />
      </div>

      <GoogleButton />
    </AuthShell>
  );
}
