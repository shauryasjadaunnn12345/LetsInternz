"use client";

import Link from "next/link";

import AnimatedCounter from "@/components/landing/AnimatedCounter";
import SearchWidget from "@/components/landing/SearchWidget";
import SourceLogoStrip from "@/components/landing/SourceLogoStrip";
import { useAuthStore } from "@/store/authStore";

/**
 * Signature visual: thin paths converging from many origins on the left to
 * a single point on the right — the aggregation story ("20+ platforms, one
 * place") rendered literally rather than as a stock hero image or gradient
 * blob. Sits low-opacity behind the copy, decorative only.
 */
function ConvergingPaths() {
  const startYs = [40, 90, 140, 190, 240, 290, 340];
  const endPoint = { x: 640, y: 190 };
  const colors = ["var(--color-marigold)", "var(--color-teal)", "var(--color-coral)"];

  return (
    <svg
      viewBox="0 0 680 380"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.16]"
      preserveAspectRatio="xMidYMid slice"
    >
      {startYs.map((y, index) => (
        <path
          key={y}
          d={`M -20 ${y} C ${endPoint.x * 0.4} ${y}, ${endPoint.x * 0.55} ${endPoint.y}, ${endPoint.x} ${endPoint.y}`}
          fill="none"
          stroke={colors[index % colors.length]}
          strokeWidth={1.5}
        />
      ))}
      <circle cx={endPoint.x} cy={endPoint.y} r={5} fill="var(--color-ink)" />
    </svg>
  );
}

export default function Hero() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return (
    <section className="relative overflow-hidden border-b border-border bg-paper-raised">
      <ConvergingPaths />

      <div className="relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 className="font-display text-4xl font-semibold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-6xl">
          Find Your Perfect Internship —{" "}
          <span className="text-marigold-dark">All Platforms, One Place</span>
        </h1>

        <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
          We aggregate from Internshala, Unstop, LinkedIn, AngelList and 20+
          more platforms daily.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href={isAuthenticated ? "/dashboard" : "/internships"}
            className="rounded-lg bg-ink px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-ink-soft"
          >
            {isAuthenticated ? "Go to Dashboard" : "Browse Internships"}
          </Link>
          {/* Signup CTA disabled while public browsing is active. */}
        </div>

        <div className="mx-auto mt-10 max-w-xl">
          <SearchWidget />
        </div>

        <dl className="mt-12 flex items-center justify-center gap-10 sm:gap-16">
          <div>
            <dt className="sr-only">Platforms aggregated</dt>
            <dd className="font-display text-3xl font-semibold text-ink">
              <AnimatedCounter end={20} suffix="+" />
            </dd>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate">
              Sources
            </p>
          </div>
          <div className="h-10 w-px bg-border" />
          <div>
            <dt className="sr-only">Internships listed</dt>
            <dd className="font-display text-3xl font-semibold text-ink">
              <AnimatedCounter end={10000} suffix="+" />
            </dd>
            <p className="mt-1 text-xs font-medium uppercase tracking-wide text-slate">
              Internships
            </p>
          </div>
        </dl>
      </div>

      <SourceLogoStrip />
    </section>
  );
}
