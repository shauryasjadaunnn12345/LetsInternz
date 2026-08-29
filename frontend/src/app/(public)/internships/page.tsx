import type { Metadata } from "next";
import { Suspense } from "react";

import InternshipsBrowser from "@/components/internships/InternshipsBrowser";

export const metadata: Metadata = {
  title: "Browse Internships",
  description:
    "Search and filter internships from Internshala, Unstop, LinkedIn and 20+ platforms by domain, location, stipend, and work type.",
  keywords: [
    "browse internships",
    "internship listings India",
    "filter internships by domain",
    "remote internships",
    "internships by city",
    "paid internships",
    "internship stipend India",
  ],
  alternates: { canonical: "/internships" },
};

export default function InternshipsPage() {
  return (
    <Suspense fallback={null}>
      <InternshipsBrowser />
    </Suspense>
  );
}
