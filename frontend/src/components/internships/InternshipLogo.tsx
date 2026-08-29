"use client";

import { useState } from "react";

export default function InternshipLogo({
  logoUrl,
  company,
  size = "md",
}: {
  logoUrl: string | undefined;
  company: string;
  size?: "md" | "lg";
}) {
  const [failed, setFailed] = useState(false);

  const dimensions = size === "lg" ? "h-14 w-14 rounded-xl" : "h-11 w-11 rounded-lg";

  if (logoUrl && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary external scraped/admin-entered logo domains
      <img
        src={logoUrl}
        alt={`${company} logo`}
        className={`${dimensions} shrink-0 border border-border object-contain bg-white`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <img
      src="/letsinternz.png"
      alt={`${company} logo`}
      className={`${dimensions} shrink-0 border border-border object-contain bg-white`}
    />
  );
}
