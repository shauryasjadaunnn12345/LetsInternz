import type { Metadata } from "next";

import CTABand from "@/components/landing/CTABand";
import FAQSection from "@/components/landing/FAQSection";
import FeaturedInternships from "@/components/landing/FeaturedInternships";
import FeaturesSection from "@/components/landing/FeaturesSection";
import Hero from "@/components/landing/Hero";
import HowItWorks from "@/components/landing/HowItWorks";
import SourcePlatformsGrid from "@/components/landing/SourcePlatformsGrid";
import { FAQ_ITEMS } from "@/lib/constants";

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const TITLE = "LetsInternz — Find Internships from 20+ Platforms";
const DESCRIPTION =
  "Search internships from Internshala, Unstop, LinkedIn and 20+ platforms. Track applications and save opportunities.";

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  keywords: [
    "internships India",
    "internship aggregator",
    "internships from Internshala Unstop LinkedIn",
    "find internships online",
    "student internship search",
    "remote internships for students",
    "internship tracker dashboard",
    "internship application tracker India",
    "summer internships India",
    "work from home internships",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "LetsInternz",
  url: SITE_URL,
  description: DESCRIPTION,
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "LetsInternz",
  url: SITE_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: `${SITE_URL}/internships?q={search_term_string}`,
    "query-input": "required name=search_term_string",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: item.answer,
    },
  })),
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      <Hero />
      <HowItWorks />
      <FeaturedInternships />
      <SourcePlatformsGrid />
      <FeaturesSection />
      <FAQSection />
      <CTABand />
    </>
  );
}
