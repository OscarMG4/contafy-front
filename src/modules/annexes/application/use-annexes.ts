"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { AnnexFilters, AnnexInput, AnnexUpdateInput } from "../domain/annex.types";
import { annexesApi } from "../infrastructure/annexes.api";

export const annexKeys = {
  all: ["annexes"] as const,
  list: (companyId: string, filters: AnnexFilters) => ["annexes", "list", companyId, filters] as const,
  detail: (companyId: string, id: string) => ["annexes", "detail", companyId, id] as const,
  types: ["annexes", "types"] as const,
};

export function useAnnexes(filters: AnnexFilters, options: { enabled?: boolean } = {}) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: annexKeys.list(company?.id ?? "", filters),
    queryFn: () => annexesApi.list(filters),
    enabled: Boolean(company) && (options.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}

export function useAnnex(id: string | null | undefined) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: annexKeys.detail(company?.id ?? "", id ?? ""),
    queryFn: () => annexesApi.get(id as string),
    enabled: Boolean(company && id),
    staleTime: 60_000,
  });
}

export function useAnnexTypes() {
  return useQuery({ queryKey: annexKeys.types, queryFn: annexesApi.types, staleTime: Infinity });
}

function useInvalidateAnnexes() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: annexKeys.all });
}

export function useCreateAnnex() {
  const invalidate = useInvalidateAnnexes();
  return useMutation({ mutationFn: (input: AnnexInput) => annexesApi.create(input), onSuccess: invalidate });
}

export function useUpdateAnnex() {
  const invalidate = useInvalidateAnnexes();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AnnexUpdateInput }) => annexesApi.update(id, input),
    onSuccess: invalidate,
  });
}
