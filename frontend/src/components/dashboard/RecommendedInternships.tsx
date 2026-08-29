"use client";

import InternshipCard from "@/components/internships/InternshipCard";
import InternshipCardSkeleton from "@/components/internships/InternshipCardSkeleton";
import { useRecommendedInternships } from "@/hooks/useInternships";
import { useAuthStore } from "@/store/authStore";

export default function RecommendedInternships() {
  const { profile } = useAuthStore();
  const { data: internships, isLoading } = useRecommendedInternships();

  const skills = profile?.skills ?? [];
  const skillsLabel = skills.slice(0, 3).join(", ");

  return (
    <div className="rounded-xl border border-border bg-paper-raised p-5">
      <h3 className="font-display text-sm font-semibold text-ink">
        Recommended internships
      </h3>
      {skillsLabel && (
        <p className="mt-1 text-xs text-slate">Based on your skills: {skillsLabel}</p>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 8 }).map((_, i) => <InternshipCardSkeleton key={i} />)
          : internships?.map((internship) => (
              <InternshipCard key={internship.id} internship={internship} />
            ))}
      </div>

      {!isLoading && (internships?.length ?? 0) === 0 && (
        <p className="py-6 text-center text-sm text-slate">
          Add a few skills to your profile to get personalized recommendations.
        </p>
      )}
    </div>
  );
}
