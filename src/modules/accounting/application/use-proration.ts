"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { ProrationInput } from "../domain/proration.types";
import { prorationApi } from "../infrastructure/proration.api";

export const prorationKeys = {
  all: ["accounting", "proration"] as const,
  get: (companyId: string, period: string) => ["accounting", "proration", companyId, period] as const,
};

export function useProration(period: string) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: prorationKeys.get(company?.id ?? "", period),
    queryFn: () => prorationApi.get(period),
    enabled: Boolean(company && period),
  });
}

function useInvalidateProration() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: prorationKeys.all });
}

export function useUpdateProration() {
  const invalidate = useInvalidateProration();
  return useMutation({
    mutationFn: ({ period, input }: { period: string; input: ProrationInput }) => prorationApi.update(period, input),
    onSuccess: invalidate,
  });
}
