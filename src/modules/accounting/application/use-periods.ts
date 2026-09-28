"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import { periodsApi } from "../infrastructure/periods.api";

export const periodKeys = {
  all: ["accounting", "periods"] as const,
  closed: (companyId: string) => ["accounting", "periods", "closed", companyId] as const,
};

export function useClosedPeriods() {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: periodKeys.closed(company?.id ?? ""),
    queryFn: () => periodsApi.listClosed(),
    enabled: Boolean(company),
  });
}

function useInvalidatePeriods() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: periodKeys.all });
}

export function useClosePeriod() {
  const invalidate = useInvalidatePeriods();
  return useMutation({
    mutationFn: (period: string) => periodsApi.close(period),
    onSuccess: invalidate,
  });
}

export function useReopenPeriod() {
  const invalidate = useInvalidatePeriods();
  return useMutation({
    mutationFn: (period: string) => periodsApi.reopen(period),
    onSuccess: invalidate,
  });
}
