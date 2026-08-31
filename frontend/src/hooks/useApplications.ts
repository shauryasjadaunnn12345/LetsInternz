"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { applicationsApi } from "@/lib/api";
import type {
  Application,
  ApplicationCreatePayload,
  ApplicationUpdatePayload,
} from "@/lib/types";

const FIVE_MINUTES = 5 * 60 * 1000;

/** Fetches every one of the current user's applications in one page —
 * the Kanban board needs all of them visible across columns at once, not
 * paginated. `page_size` is capped server-side (see config/pagination.py)
 * so this stays bounded even for a very active applicant. */
export function useApplications(enabled = true) {
  return useQuery({
    queryKey: ["applications", "all"],
    queryFn: () => applicationsApi.list({ page_size: 200 }),
    enabled,
    staleTime: FIVE_MINUTES,
    select: (data) => data.results,
  });
}

export function useApplicationStats(enabled = true) {
  return useQuery({
    queryKey: ["applications", "stats"],
    queryFn: () => applicationsApi.stats(),
    enabled,
    staleTime: FIVE_MINUTES,
  });
}

function invalidateApplications(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ["applications"] });
}

export function useCreateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ApplicationCreatePayload) => applicationsApi.create(payload),
    onSuccess: () => invalidateApplications(queryClient),
  });
}

export function useUpdateApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: ApplicationUpdatePayload }) =>
      applicationsApi.update(id, payload),
    // Optimistic update so Kanban drag-and-drop feels instant rather than
    // waiting on the round trip before the card moves columns.
    onMutate: async ({ id, payload }) => {
      await queryClient.cancelQueries({ queryKey: ["applications", "all"] });
      const previous = queryClient.getQueryData<Application[]>(["applications", "all"]);

      queryClient.setQueryData<Application[]>(["applications", "all"], (old) =>
        old?.map((app) => (app.id === id ? { ...app, ...payload } : app))
      );

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["applications", "all"], context.previous);
      }
    },
    onSettled: () => invalidateApplications(queryClient),
  });
}

export function useDeleteApplication() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationsApi.remove(id),
    onSuccess: () => invalidateApplications(queryClient),
  });
}
