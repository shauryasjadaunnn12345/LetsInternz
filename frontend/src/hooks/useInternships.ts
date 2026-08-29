"use client";

import { useQuery } from "@tanstack/react-query";

import { internshipsApi, savedApi } from "@/lib/api";
import type { InternshipListParams } from "@/lib/types";

const FIVE_MINUTES = 5 * 60 * 1000;

/**
 * Fetches the paginated internship list for a given filter set. `params` is
 * expected to be derived straight from the URL search params so the browse
 * page's filtered views stay shareable/bookmarkable.
 */
export function useInternships(params: InternshipListParams) {
  return useQuery({
    queryKey: ["internships", params],
    queryFn: () => internshipsApi.list(params),
    staleTime: FIVE_MINUTES,
    refetchOnWindowFocus: true,
    placeholderData: (previousData) => previousData,
  });
}

export function useFeaturedInternships() {
  return useQuery({
    queryKey: ["internships", "featured"],
    queryFn: async () => {
      const data = await internshipsApi.featured();

      if (Array.isArray(data)) return data;
      if (data && Array.isArray((data as { results?: unknown[] }).results)) {
        return (data as { results: unknown[] }).results;
      }

      return [];
    },
    staleTime: FIVE_MINUTES,
  });
}

export function useRecommendedInternships() {
  return useQuery({
    queryKey: ["internships", "recommended"],
    queryFn: () => internshipsApi.recommended(),
    staleTime: FIVE_MINUTES,
  });
}

export function useInternshipSources() {
  return useQuery({
    queryKey: ["internships", "sources"],
    queryFn: () => internshipsApi.sources(),
    staleTime: FIVE_MINUTES,
  });
}

export function useInternshipDomains() {
  return useQuery({
    queryKey: ["internships", "domains"],
    queryFn: () => internshipsApi.domains(),
    staleTime: FIVE_MINUTES,
  });
}

/** IDs of the current user's saved internships, used to initialize each
 * InternshipCard's save-toggle state. Only fetches the first page — a
 * reasonable approximation for initializing UI state, not a full sync. */
export function useSavedInternshipIds(enabled: boolean) {
  const query = useQuery({
    queryKey: ["saved", "ids"],
    queryFn: () => savedApi.list(),
    staleTime: FIVE_MINUTES,
    enabled,
  });

  const ids = new Set(query.data?.results.map((item) => item.internship.id) ?? []);
  return ids;
}
