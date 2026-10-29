"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { CostCenterFilters, CostCenterInput, CostCenterUpdateInput } from "../domain/cost-center.types";
import { costCentersApi } from "../infrastructure/cost-centers.api";

export const costCenterKeys = {
  all: ["cost-centers"] as const,
  list: (companyId: string, filters: CostCenterFilters) => ["cost-centers", "list", companyId, filters] as const,
  detail: (companyId: string, id: string) => ["cost-centers", "detail", companyId, id] as const,
};

export function useCostCenters(filters: CostCenterFilters, options: { enabled?: boolean } = {}) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: costCenterKeys.list(company?.id ?? "", filters),
    queryFn: () => costCentersApi.list(filters),
    enabled: Boolean(company) && (options.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}

export function useCostCenter(id: string | null | undefined) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: costCenterKeys.detail(company?.id ?? "", id ?? ""),
    queryFn: () => costCentersApi.get(id as string),
    enabled: Boolean(company && id),
    staleTime: 60_000,
  });
}

function useInvalidateCostCenters() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: costCenterKeys.all });
}

export function useCreateCostCenter() {
  const invalidate = useInvalidateCostCenters();
  return useMutation({ mutationFn: (input: CostCenterInput) => costCentersApi.create(input), onSuccess: invalidate });
}

export function useUpdateCostCenter() {
  const invalidate = useInvalidateCostCenters();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CostCenterUpdateInput }) => costCentersApi.update(id, input),
    onSuccess: invalidate,
  });
}
