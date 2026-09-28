"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import type { CompanyFilters, CompanyInput } from "../domain/company.types";
import { companiesApi } from "../infrastructure/companies.api";

/** Límite para el selector de empresa activa; un estudio rara vez supera esta cantidad. */
const SWITCHER_LIMIT = 200;

export const companyKeys = {
  all: ["companies"] as const,
  list: (filters: CompanyFilters) => ["companies", "list", filters] as const,
  active: ["companies", "active"] as const,
  taxRegimes: ["companies", "tax-regimes"] as const,
};

export function useCompanies(filters: CompanyFilters) {
  return useQuery({
    queryKey: companyKeys.list(filters),
    queryFn: () => companiesApi.list(filters),
    placeholderData: keepPreviousData,
  });
}

export function useActiveCompanies() {
  return useQuery({
    queryKey: companyKeys.active,
    queryFn: () => companiesApi.list({ status: "active", page: 1, perPage: SWITCHER_LIMIT }),
    staleTime: 30_000,
  });
}

export function useTaxRegimes() {
  return useQuery({ queryKey: companyKeys.taxRegimes, queryFn: companiesApi.taxRegimes, staleTime: Infinity });
}

function useInvalidateCompanies() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: companyKeys.all });
}

export function useCreateCompany() {
  const invalidate = useInvalidateCompanies();
  return useMutation({ mutationFn: (input: CompanyInput) => companiesApi.create(input), onSuccess: invalidate });
}

export function useUpdateCompany() {
  const invalidate = useInvalidateCompanies();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Omit<CompanyInput, "ruc"> }) => companiesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useChangeCompanyStatus() {
  const invalidate = useInvalidateCompanies();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "archive" | "restore" }) =>
      action === "archive" ? companiesApi.archive(id) : companiesApi.restore(id),
    onSuccess: invalidate,
  });
}
