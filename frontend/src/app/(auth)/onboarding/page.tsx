import type { Metadata } from "next";

import OnboardingWizard from "@/components/onboarding/OnboardingWizard";

export const metadata: Metadata = {
  title: "Complete your profile",
};

export default function OnboardingPage() {
  return <OnboardingWizard />;
}
