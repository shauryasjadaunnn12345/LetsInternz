"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { savedApi } from "@/lib/api";

const FIVE_MINUTES = 5 * 60 * 1000;

export function useSavedInternships() {
  return useQuery({
    queryKey: ["saved", "all"],
    queryFn: () => savedApi.list({ page_size: 200 }),
    staleTime: FIVE_MINUTES,
    select: (data) => data.results,
  });
}

export function useDeadlineAlerts() {
  return useQuery({
    queryKey: ["saved", "deadline-alerts"],
    queryFn: () => savedApi.deadlineAlerts(),
    staleTime: FIVE_MINUTES,
  });
}

export function useRemoveSaved() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => savedApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saved"] });
    },
  });
}
