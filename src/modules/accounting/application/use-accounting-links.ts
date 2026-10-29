"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { AccountingLinkInput } from "../domain/accounting-link.types";
import { accountingLinksApi } from "../infrastructure/accounting-links.api";

export const accountingLinkKeys = {
  all: ["accounting", "links"] as const,
  types: ["accounting", "links", "types"] as const,
  schemes: (companyId: string) => ["accounting", "links", "schemes", companyId] as const,
  list: (companyId: string, schemeId: string, linkType?: string) =>
    ["accounting", "links", "list", companyId, schemeId, linkType ?? ""] as const,
};

export function useAccountingLinkTypes() {
  return useQuery({ queryKey: accountingLinkKeys.types, queryFn: accountingLinksApi.types, staleTime: Infinity });
}

export function useAccountingSchemes() {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: accountingLinkKeys.schemes(company?.id ?? ""),
    queryFn: accountingLinksApi.schemes,
    enabled: Boolean(company),
  });
}

export function useAccountingLinks(schemeId: string | undefined, linkType?: string) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: accountingLinkKeys.list(company?.id ?? "", schemeId ?? "", linkType),
    queryFn: () => accountingLinksApi.list(schemeId!, linkType),
    enabled: Boolean(company && schemeId),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: accountingLinkKeys.all });
}

export function useSaveAccountingLink() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: AccountingLinkInput }) =>
      id ? accountingLinksApi.update(id, input) : accountingLinksApi.create(input),
    onSuccess: invalidate,
  });
}

export function useCopyAccountingLink() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => accountingLinksApi.copy(id), onSuccess: invalidate });
}

export function useDeleteAccountingLink() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: string) => accountingLinksApi.remove(id), onSuccess: invalidate });
}

export function useCreateAccountingScheme() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: accountingLinksApi.createScheme, onSuccess: invalidate });
}

export function useUpdateAccountingScheme() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: { name: string; active: boolean; is_default: boolean } }) =>
      accountingLinksApi.updateScheme(id, input),
    onSuccess: invalidate,
  });
}
