"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import { dashboardApi } from "../infrastructure/dashboard.api";

export const dashboardKeys = {
  summary: (companyId?: string) => ["dashboard", "summary", companyId] as const,
};

export function useDashboardSummary() {
  const { company } = useActiveCompany();

  return useQuery({
    queryKey: dashboardKeys.summary(company?.id),
    queryFn: () => dashboardApi.summary(false),
    enabled: Boolean(company?.id),
    staleTime: 5 * 60_000,
  });
}

/** Fuerza recálculo en Redis (nocache=true) y refresca React Query. */
export function useRefreshDashboardSummary() {
  const queryClient = useQueryClient();
  const { company } = useActiveCompany();

  return async () => {
    if (!company?.id) return;
    const fresh = await dashboardApi.summary(true);
    queryClient.setQueryData(dashboardKeys.summary(company.id), fresh);
  };
}
