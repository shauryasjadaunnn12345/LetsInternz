"use client";

import { useState } from "react";

import AvatarUpload from "@/components/profile/AvatarUpload";
import CompletionRing from "@/components/profile/CompletionRing";
import LinksTab from "@/components/profile/LinksTab";
import PersonalInfoTab from "@/components/profile/PersonalInfoTab";
import PreferencesTab from "@/components/profile/PreferencesTab";
import ResumeTab from "@/components/profile/ResumeTab";
import { useToast } from "@/components/ui/Toast";
import { useAuthStore } from "@/store/authStore";

const TABS = [
  { id: "personal", label: "Personal Info" },
  { id: "preferences", label: "Skills & Preferences" },
  { id: "links", label: "Links" },
  { id: "resume", label: "Resume" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ProfilePage() {
  const { profile, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>("personal");
  const { showToast, ToastViewport } = useToast();

  const completion = profile?.profile_completion ?? 0;
  const displayName = profile?.full_name || user?.username || "Your profile";

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="font-display text-2xl font-semibold text-ink">My Profile</h1>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-border bg-paper-raised p-6 text-center">
            <AvatarUpload />

            <h2 className="mt-4 font-display text-lg font-semibold text-ink">
              {displayName}
            </h2>
            <p className="mt-1 text-sm text-slate">{profile?.college || "Add your college"}</p>
            <p className="text-sm text-slate">
              {[profile?.branch, profile?.graduation_year].filter(Boolean).join(" · ") ||
                "Add your branch and graduation year"}
            </p>

            <div className="mt-6 flex flex-col items-center gap-2 border-t border-border pt-6">
              <CompletionRing percentage={completion} />
              <p className="text-sm font-medium text-ink-soft">
                Your profile is {completion}% complete
              </p>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-border bg-paper-raised">
            <div className="flex overflow-x-auto border-b border-border">
              {TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`shrink-0 border-b-2 px-5 py-3.5 text-sm font-semibold transition-colors ${
                    activeTab === tab.id
                      ? "border-marigold-dark text-ink"
                      : "border-transparent text-slate hover:text-ink"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6">
              {activeTab === "personal" && <PersonalInfoTab onSaved={showToast} />}
              {activeTab === "preferences" && <PreferencesTab onSaved={showToast} />}
              {activeTab === "links" && <LinksTab onSaved={showToast} />}
              {activeTab === "resume" && <ResumeTab onSaved={showToast} />}
            </div>
          </div>
        </div>
      </div>

      <ToastViewport />
    </div>
  );
}
