"use client";

import DeadlineRemindersPanel from "@/components/dashboard/DeadlineRemindersPanel";
import ProfileCompletionBanner from "@/components/dashboard/ProfileCompletionBanner";
import RecentApplicationsTable from "@/components/dashboard/RecentApplicationsTable";
import RecommendedInternships from "@/components/dashboard/RecommendedInternships";
import StatsRow from "@/components/dashboard/StatsRow";
import StatusDonutChart from "@/components/dashboard/StatusDonutChart";
import WelcomeBanner from "@/components/dashboard/WelcomeBanner";
import { useApplicationStats, useApplications } from "@/hooks/useApplications";
import { useDeadlineAlerts, useSavedInternships } from "@/hooks/useSaved";
import { useAuthStore } from "@/store/authStore";

export default function DashboardHome() {
  const { user, profile } = useAuthStore();
  const { data: stats } = useApplicationStats();
  const { data: applications } = useApplications();
  const { data: saved } = useSavedInternships();
  const { data: deadlineAlerts } = useDeadlineAlerts();

  const displayName = profile?.full_name || user?.username || "there";
  const firstName = displayName.split(" ")[0];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <WelcomeBanner name={firstName} />

      <ProfileCompletionBanner completion={profile?.profile_completion ?? 0} />

      <StatsRow stats={stats} savedCount={saved?.length} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <StatusDonutChart stats={stats} />
        </div>
        <div className="lg:col-span-7">
          <RecentApplicationsTable applications={applications} />
        </div>
      </div>

      <RecommendedInternships />

      <DeadlineRemindersPanel alerts={deadlineAlerts} />
    </div>
  );
}
