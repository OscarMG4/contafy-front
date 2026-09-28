"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { AccountFilters, AccountInput, AccountUpdateInput } from "../domain/account.types";
import { accountsApi } from "../infrastructure/accounts.api";

export const accountKeys = {
  all: ["accounting", "accounts"] as const,
  list: (companyId: string, filters: AccountFilters) => ["accounting", "accounts", "list", companyId, filters] as const,
  natures: ["accounting", "accounts", "natures"] as const,
};

export function useAccounts(filters: AccountFilters) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: accountKeys.list(company?.id ?? "", filters),
    queryFn: () => accountsApi.list(filters),
    enabled: Boolean(company),
    placeholderData: keepPreviousData,
  });
}

export function useNatures() {
  return useQuery({ queryKey: accountKeys.natures, queryFn: accountsApi.natures, staleTime: Infinity });
}

function useInvalidateAccounts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: accountKeys.all });
}

export function useCreateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({ mutationFn: (input: AccountInput) => accountsApi.create(input), onSuccess: invalidate });
}

export function useUpdateAccount() {
  const invalidate = useInvalidateAccounts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: AccountUpdateInput }) => accountsApi.update(id, input),
    onSuccess: invalidate,
  });
}
