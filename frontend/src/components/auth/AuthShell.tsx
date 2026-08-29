import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";

/**
 * Shared split-panel shell for the login/signup pages: a quiet form panel
 * on the right, and an ink-dark brand panel on the left (hidden on mobile)
 * carrying a short line of positioning copy — no stock photography, no
 * gradient hero, just type and the marigold mark doing the work.
 */
export default function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-1">
      <div className="relative hidden w-[42%] flex-col justify-between bg-ink px-12 py-12 text-white lg:flex">
        <BrandLogo size="lg" />

        <div>
          <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-marigold">
            {eyebrow}
          </p>
          <h2 className="mt-4 max-w-sm font-display text-3xl font-semibold leading-tight">
            {title}
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-white/70">{subtitle}</p>
        </div>

        <p className="text-xs text-white/40">
          © {new Date().getFullYear()} LetsInternz
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <BrandLogo size="lg" />
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
