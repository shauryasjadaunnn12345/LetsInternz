"use client";

import Link from "next/link";

import { useAuthStore } from "@/store/authStore";

export function AuthAwareCta({
  primaryLabel = "Browse Internships",
  primaryHref = "/internships",
  secondaryLabel = "Sign Up Free",
  secondaryHref = "/signup",
  variant = "default",
}: {
  primaryLabel?: string;
  primaryHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
  variant?: "default" | "dark";
}) {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const primaryClassName =
    variant === "dark"
      ? "rounded-lg bg-marigold px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-marigold-dark"
      : "rounded-lg bg-ink px-5 py-2.5 text-center text-sm font-semibold text-white transition-colors hover:bg-ink-soft";

  const secondaryClassName =
    variant === "dark"
      ? "rounded-lg border border-white/20 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10"
      : "rounded-lg border border-border px-5 py-2.5 text-center text-sm font-semibold text-ink transition-colors hover:border-ink-soft";

  return (
    <div className="mt-10 flex flex-col gap-3 sm:flex-row">
      <Link href={isAuthenticated ? "/dashboard" : primaryHref} className={primaryClassName}>
        {isAuthenticated ? "Go to Dashboard" : primaryLabel}
      </Link>
      {!isAuthenticated && (
        <Link href={secondaryHref} className={secondaryClassName}>
          {secondaryLabel}
        </Link>
      )}
    </div>
  );
}
