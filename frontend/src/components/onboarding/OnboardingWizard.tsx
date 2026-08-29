"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import OnboardingProgress from "@/components/onboarding/OnboardingProgress";
import BasicsStep, { type BasicsData } from "@/components/onboarding/steps/BasicsStep";
import LinksStep, { type LinksData } from "@/components/onboarding/steps/LinksStep";
import PreferencesStep, {
  type PreferencesData,
} from "@/components/onboarding/steps/PreferencesStep";
import { authApi } from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import BrandLogo from "@/components/BrandLogo";

type Step = 1 | 2 | 3;

const STEP_COPY: Record<Step, { title: string; subtitle: string }> = {
  1: {
    title: "Let's start with the basics",
    subtitle: "This helps us match internships to where you're studying.",
  },
  2: {
    title: "What are you looking for?",
    subtitle: "Skills and preferences power your personalized recommendations.",
  },
  3: {
    title: "Almost there",
    subtitle: "Add your links and resume so applying takes one click.",
  },
};

export default function OnboardingWizard() {
  const router = useRouter();
  const { updateProfile } = useAuthStore();

  const [step, setStep] = useState<Step>(1);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [resumeError, setResumeError] = useState<string | null>(null);

  const [basics, setBasics] = useState<BasicsData>({
    college: "",
    branch: "",
    graduation_year: "",
    cgpa: "",
  });

  const [preferences, setPreferences] = useState<PreferencesData>({
    skills: [],
    preferred_domains: [],
    preferred_work_types: [],
    preferred_locations: [],
  });

  const [links, setLinks] = useState<LinksData>({
    linkedin_url: "",
    github_url: "",
    portfolio_url: "",
    resume: null,
    avatar: null,
  });

  const saveBasics = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const profile = await authApi.updateProfile({
        college: basics.college,
        branch: basics.branch,
        graduation_year: basics.graduation_year === "" ? null : basics.graduation_year,
        cgpa: basics.cgpa || null,
      });
      updateProfile(profile);
      setStep(2);
    } catch {
      setSaveError("Couldn't save — please check your details and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const savePreferences = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const profile = await authApi.updateProfile({
        skills: preferences.skills,
        preferred_domains: preferences.preferred_domains,
        preferred_work_types: preferences.preferred_work_types,
        preferred_locations: preferences.preferred_locations,
      });
      updateProfile(profile);
      setStep(3);
    } catch {
      setSaveError("Couldn't save your preferences — please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const completeOnboarding = async () => {
    if (resumeError) return;

    setIsSaving(true);
    setSaveError(null);
    try {
      const profile = await authApi.updateProfile({
        linkedin_url: links.linkedin_url,
        github_url: links.github_url,
        portfolio_url: links.portfolio_url,
      });
      updateProfile(profile);

      if (links.resume) {
        await authApi.uploadResume(links.resume);
      }
      if (links.avatar) {
        await authApi.uploadAvatar(links.avatar);
      }

      const finalProfile = await authApi.getProfile();
      updateProfile(finalProfile);

      router.push("/dashboard");
    } catch {
      setSaveError("Couldn't save your links — please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const copy = STEP_COPY[step];

  return (
    <div className="mx-auto flex w-full max-w-xl flex-1 flex-col justify-center px-4 py-12 sm:px-6">
      <div className="mb-8 flex justify-center">
        <BrandLogo size="lg" />
      </div>

      <OnboardingProgress currentStep={step} />

      <div className="rounded-2xl border border-border bg-paper-raised p-6 sm:p-8">
        <h1 className="font-display text-xl font-semibold text-ink">{copy.title}</h1>
        <p className="mt-1 text-sm text-slate">{copy.subtitle}</p>

        {saveError && (
          <div className="mt-4 rounded-lg border border-coral/30 bg-coral/10 px-3.5 py-2.5 text-sm font-medium text-coral">
            {saveError}
          </div>
        )}

        <div className="mt-6">
          {step === 1 && <BasicsStep data={basics} onChange={setBasics} />}
          {step === 2 && <PreferencesStep data={preferences} onChange={setPreferences} />}
          {step === 3 && (
            <LinksStep
              data={links}
              onChange={setLinks}
              resumeError={resumeError}
              setResumeError={setResumeError}
            />
          )}
        </div>

        <div className="mt-8 flex items-center justify-between">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((current) => (current - 1) as Step)}
              className="text-sm font-semibold text-slate hover:text-ink"
            >
              Back
            </button>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-3">
            {step > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (step === 2) setStep(3);
                  else router.push("/dashboard");
                }}
                className="text-sm font-semibold text-slate hover:text-ink"
              >
                Skip
              </button>
            )}

            <button
              type="button"
              disabled={isSaving}
              onClick={() => {
                if (step === 1) saveBasics();
                else if (step === 2) savePreferences();
                else completeOnboarding();
              }}
              className="rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-ink-soft disabled:opacity-60"
            >
              {isSaving ? "Saving…" : step === 3 ? "Complete" : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
