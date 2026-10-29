"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { SupplierPaymentFilters, SupplierPaymentInput, TreasuryAccountInput } from "../domain/treasury.types";
import { treasuryApi } from "../infrastructure/treasury.api";

export const treasuryKeys = {
  all: ["treasury"] as const,
  accounts: (companyId: string, onlyActive: boolean) => ["treasury", "accounts", companyId, onlyActive] as const,
  accountTypes: ["treasury", "account-types"] as const,
  pending: (companyId: string, supplierId?: string, currency?: string) =>
    ["treasury", "pending", companyId, supplierId ?? "", currency ?? ""] as const,
  aging: (companyId: string, params: object) => ["treasury", "aging", companyId, params] as const,
  statement: (companyId: string, params: object) => ["treasury", "statement", companyId, params] as const,
  payments: (companyId: string, filters: SupplierPaymentFilters) => ["treasury", "payments", companyId, filters] as const,
  payment: (id: string) => ["treasury", "payment", id] as const,
};

/** Invalida todo lo que cambia cuando se paga: tesorería y compras (estado de pago). */
function useInvalidateAfterPayment() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: treasuryKeys.all }),
      queryClient.invalidateQueries({ queryKey: ["purchases"] }),
    ]);
}

export function useTreasuryAccounts(onlyActive = false) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: treasuryKeys.accounts(company?.id ?? "", onlyActive),
    queryFn: () => treasuryApi.accounts(onlyActive),
    enabled: Boolean(company),
    staleTime: 60_000,
  });
}

export function useTreasuryAccountTypes() {
  return useQuery({ queryKey: treasuryKeys.accountTypes, queryFn: treasuryApi.accountTypes, staleTime: Infinity });
}

export function useSaveTreasuryAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id?: string; input: TreasuryAccountInput }) =>
      id ? treasuryApi.updateAccount(id, input) : treasuryApi.createAccount(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["treasury", "accounts"] }),
  });
}

export function usePendingPayables(supplierId?: string, currency?: string, enabled = true) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: treasuryKeys.pending(company?.id ?? "", supplierId, currency),
    queryFn: () => treasuryApi.pending(supplierId, currency),
    enabled: Boolean(company) && enabled,
  });
}

export function usePayablesAging(params: { supplierId?: string; currency?: string; asOf?: string }) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: treasuryKeys.aging(company?.id ?? "", params),
    queryFn: () => treasuryApi.aging(params),
    enabled: Boolean(company),
    placeholderData: keepPreviousData,
  });
}

export function useSupplierStatement(params: { supplierId?: string; currency: string; from?: string; to?: string }) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: treasuryKeys.statement(company?.id ?? "", params),
    queryFn: () => treasuryApi.statement({ ...params, supplierId: params.supplierId as string }),
    enabled: Boolean(company) && Boolean(params.supplierId),
  });
}

export function useSupplierPayments(filters: SupplierPaymentFilters) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: treasuryKeys.payments(company?.id ?? "", filters),
    queryFn: () => treasuryApi.payments(filters),
    enabled: Boolean(company),
    placeholderData: keepPreviousData,
  });
}

export function useSupplierPayment(id: string | null) {
  return useQuery({
    queryKey: treasuryKeys.payment(id ?? ""),
    queryFn: () => treasuryApi.payment(id as string),
    enabled: Boolean(id),
  });
}

export function useCreateSupplierPayment() {
  const invalidate = useInvalidateAfterPayment();
  return useMutation({
    mutationFn: (input: SupplierPaymentInput) => treasuryApi.createPayment(input),
    onSuccess: invalidate,
  });
}

export function useAnnulSupplierPayment() {
  const invalidate = useInvalidateAfterPayment();
  return useMutation({
    mutationFn: (id: string) => treasuryApi.annulPayment(id),
    onSuccess: invalidate,
  });
}
