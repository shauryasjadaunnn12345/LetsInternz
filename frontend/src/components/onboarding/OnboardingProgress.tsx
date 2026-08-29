"use client";

import { Check, PlaneTakeoff } from "lucide-react";

const STEPS = [
  { label: "Basics" },
  { label: "Preferences" },
  { label: "Links" },
] as const;

/**
 * "Boarding pass" progress rail — the onboarding wizard is framed as the
 * first leg of the student's internship journey, so progress is shown as a
 * plane travelling along a route between three checkpoints rather than a
 * generic numbered stepper.
 */
export default function OnboardingProgress({ currentStep }: { currentStep: 1 | 2 | 3 }) {
  const progressFraction = (currentStep - 1) / (STEPS.length - 1);

  return (
    <div className="mb-10">
      <div className="relative mb-3 h-5">
        <PlaneTakeoff
          className="absolute -top-1 h-6 w-6 -translate-x-1/2 text-marigold-dark transition-[left] duration-500 ease-out"
          style={{ left: `${progressFraction * 100}%` }}
          strokeWidth={2.25}
        />
      </div>

      <div className="relative">
        <div className="absolute left-0 right-0 top-4 h-0.5 bg-border" />
        <div
          className="absolute left-0 top-4 h-0.5 bg-marigold-dark transition-[width] duration-500 ease-out"
          style={{ width: `${progressFraction * 100}%` }}
        />

        <ol className="relative flex justify-between">
          {STEPS.map((step, index) => {
            const stepNumber = index + 1;
            const isComplete = stepNumber < currentStep;
            const isActive = stepNumber === currentStep;

            return (
              <li key={step.label} className="flex flex-col items-center gap-2">
                <span
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold transition-colors ${
                    isComplete
                      ? "border-marigold-dark bg-marigold-dark text-white"
                      : isActive
                        ? "border-marigold-dark bg-paper-raised text-ink"
                        : "border-border bg-paper-raised text-slate"
                  }`}
                >
                  {isComplete ? <Check className="h-4 w-4" /> : stepNumber}
                </span>
                <span
                  className={`text-xs font-medium ${
                    isActive || isComplete ? "text-ink" : "text-slate"
                  }`}
                >
                  {step.label}
                </span>
              </li>
            );
          })}
        </ol>
      </div>
    </div>
  );
}
