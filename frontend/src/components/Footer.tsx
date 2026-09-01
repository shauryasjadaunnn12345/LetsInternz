"use client";

import Link from "next/link";

import BrandLogo from "@/components/BrandLogo";
import { LINKEDIN_URL } from "@/lib/constants";
import { useAuthStore } from "@/store/authStore";

function LinkedInIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.11 20.45H3.56V9h3.55v11.45z" />
    </svg>
  );
}

const FOOTER_LINKS = [
  {
    heading: "Product",
    links: [
      { href: "/internships", label: "Browse Internships" },
      { href: "/how-it-works", label: "How It Works" },
      // { href: "/dashboard", label: "Dashboard" },
    ],
  },
  // Login/signup links are intentionally disabled in public browsing mode.
  {
    heading: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

export default function Footer() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <footer className="border-t border-border bg-paper-raised">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-10 md:flex-row md:justify-between">
          <div className="max-w-xs">
            <BrandLogo size="md" />
            <p className="mt-3 text-sm leading-relaxed text-slate">
              Every internship worth applying to, in one place — matched to
              your skills, tracked to the offer.
            </p>
            <a
              href={LINKEDIN_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LetsInternz on LinkedIn"
              className="mt-4 flex h-9 w-9 items-center justify-center rounded-lg border border-border text-ink-soft transition-colors hover:border-ink-soft hover:text-ink"
            >
              <LinkedInIcon />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {FOOTER_LINKS.filter((group) => !isAuthenticated || group.heading !== "Account").map((group) => (
              <div key={group.heading}>
                <h3 className="font-display text-xs font-semibold uppercase tracking-wide text-slate">
                  {group.heading}
                </h3>
                <ul className="mt-3 space-y-2">
                  {group.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-ink-soft transition-colors hover:text-ink"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-xs text-slate">
          © {new Date().getFullYear()} LetsInternz. Built for students, by
          people who remember application season.
        </div>
      </div>
    </footer>
  );
}
