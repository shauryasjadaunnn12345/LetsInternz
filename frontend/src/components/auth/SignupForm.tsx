"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AxiosError } from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import AuthShell from "@/components/auth/AuthShell";
import { FieldError, Input, Label } from "@/components/ui/Field";
import { useAuthStore } from "@/store/authStore";

const signupSchema = z
  .object({
    full_name: z.string().min(2, "Enter your full name"),
    email: z.string().min(1, "Email is required").email("Enter a valid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must include at least one letter")
      .regex(/[0-9]/, "Password must include at least one number"),
    confirm_password: z.string(),
    terms: z.boolean().refine((val) => val === true, {
      message: "You must accept the Terms of Service to continue",
    }),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

type SignupValues = z.infer<typeof signupSchema>;

/** Derive a best-effort username from the email's local part — the backend
 * requires a username but the signup form (per spec) only asks for a full
 * name, so we don't surface a separate username field to the user. */
function usernameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "user";
  return local.toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 30) || "user";
}

function extractErrorMessage(error: unknown): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data;
    if (data?.email?.[0]) return data.email[0];
    if (data?.username?.[0]) return data.username[0];
    if (data?.password?.[0]) return data.password[0];
    if (data?.password2?.[0]) return data.password2[0];
    if (data?.non_field_errors?.[0]) return data.non_field_errors[0];
    if (data?.detail) return data.detail;
  }
  return "Something went wrong. Please try again.";
}

export default function SignupForm() {
  const router = useRouter();
  const { register: registerUser, isAuthenticated } = useAuthStore();
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/dashboard");
    }
  }, [isAuthenticated, router]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
  });

  const onSubmit = async (values: SignupValues) => {
    setFormError(null);
    try {
      const email = await registerUser({
        email: values.email,
        username: usernameFromEmail(values.email),
        full_name: values.full_name,
        password: values.password,
        password2: values.confirm_password,
      });
      router.push(`/verify-email?email=${encodeURIComponent(email)}`);
    } catch (error) {
      setFormError(extractErrorMessage(error));
    }
  };

  return (
    <AuthShell
      eyebrow="Get started"
      title="One profile. Every internship platform, matched to you."
      subtitle="We pull listings from Internshala, Unstop, LinkedIn and more, then rank them against your skills."
    >
      <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
      <p className="mt-1.5 text-sm text-slate">
        Already have one?{" "}
        <Link href="/login" className="font-semibold text-ink hover:underline">
          Log in
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-7 space-y-4" noValidate>
        {formError && (
          <div className="rounded-lg border border-coral/30 bg-coral/10 px-3.5 py-2.5 text-sm font-medium text-coral">
            {formError}
          </div>
        )}

        <div>
          <Label htmlFor="full_name">Full name</Label>
          <Input
            id="full_name"
            type="text"
            autoComplete="name"
            invalid={!!errors.full_name}
            {...register("full_name")}
          />
          <FieldError>{errors.full_name?.message}</FieldError>
        </div>

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
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.password}
            {...register("password")}
          />
          <FieldError>{errors.password?.message}</FieldError>
        </div>

        <div>
          <Label htmlFor="confirm_password">Confirm password</Label>
          <Input
            id="confirm_password"
            type="password"
            autoComplete="new-password"
            invalid={!!errors.confirm_password}
            {...register("confirm_password")}
          />
          <FieldError>{errors.confirm_password?.message}</FieldError>
        </div>

        <div>
          <label className="flex items-start gap-2.5 text-sm text-ink-soft">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-ink focus:ring-marigold-dark/40"
              {...register("terms")}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-medium text-ink hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link href="/privacy" className="font-medium text-ink hover:underline">
                Privacy Policy
              </Link>
              .
            </span>
          </label>
          <FieldError>{errors.terms?.message}</FieldError>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
        >
          {isSubmitting ? "Creating account…" : "Create account"}
        </button>
      </form>

    </AuthShell>
  );
}
