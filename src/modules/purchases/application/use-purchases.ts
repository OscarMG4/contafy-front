"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type {
  AdditionalCostPurchaseInput,
  ExpensePurchaseInput,
  PurchaseFilters,
  PurchaseInput,
  RegisterPurchasePaymentInput,
} from "../domain/purchase.types";
import { kardexApi, purchasesApi } from "../infrastructure/purchases.api";

export const purchaseKeys = {
  all: ["purchases"] as const,
  list: (companyId: string, filters: PurchaseFilters) => ["purchases", "list", companyId, filters] as const,
  detail: (companyId: string, id: string) => ["purchases", "detail", companyId, id] as const,
  payments: (companyId: string, id: string) => ["purchases", "payments", companyId, id] as const,
  operationTypes: ["purchases", "operation-types"] as const,
  allocationMethods: ["purchases", "allocation-methods"] as const,
  detractions: ["catalogs", "detractions"] as const,
  kardex: (companyId: string, productId: string, warehouseId: string, from?: string, to?: string) =>
    ["kardex", companyId, productId, warehouseId, from, to] as const,
};

export function usePurchases(filters: PurchaseFilters) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: purchaseKeys.list(company?.id ?? "", filters),
    queryFn: () => purchasesApi.list(filters),
    enabled: Boolean(company),
    placeholderData: keepPreviousData,
  });
}

export function usePurchase(id: string | null) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: purchaseKeys.detail(company?.id ?? "", id ?? ""),
    queryFn: () => purchasesApi.get(id!),
    enabled: Boolean(company && id),
  });
}

export function usePurchaseOperationTypes() {
  return useQuery({
    queryKey: purchaseKeys.operationTypes,
    queryFn: purchasesApi.operationTypes,
    staleTime: Infinity,
  });
}

export function useAllocationMethods() {
  return useQuery({
    queryKey: purchaseKeys.allocationMethods,
    queryFn: purchasesApi.allocationMethods,
    staleTime: Infinity,
  });
}

export function useDetractions() {
  return useQuery({
    queryKey: purchaseKeys.detractions,
    queryFn: purchasesApi.detractions,
    staleTime: Infinity,
  });
}

export function useCreatePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseInput) => purchasesApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
  });
}

export function useCreateExpensePurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ExpensePurchaseInput) => purchasesApi.createExpense(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
  });
}

export function useCreateAdditionalCostPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: AdditionalCostPurchaseInput) => purchasesApi.createAdditionalCost(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
  });
}

export function useAnnulPurchase() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchasesApi.annul(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
  });
}

export function usePurchasePayments(purchaseId: string | null) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: purchaseKeys.payments(company?.id ?? "", purchaseId ?? ""),
    queryFn: () => purchasesApi.listPayments(purchaseId!),
    enabled: Boolean(company && purchaseId),
  });
}

export function useRegisterPurchasePayment(purchaseId: string | null) {
  const queryClient = useQueryClient();
  const { company } = useActiveCompany();
  return useMutation({
    mutationFn: (input: RegisterPurchasePaymentInput) => purchasesApi.registerPayment(purchaseId!, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.all });
      if (purchaseId && company) {
        queryClient.invalidateQueries({ queryKey: purchaseKeys.payments(company.id, purchaseId) });
        queryClient.invalidateQueries({ queryKey: purchaseKeys.detail(company.id, purchaseId) });
      }
    },
  });
}

export function usePreviewPurchase() {
  return useMutation({
    mutationFn: (
      input: Pick<
        PurchaseInput,
        "currency" | "issueDate" | "lines" | "iscAmount" | "discountAmount" | "detractionCode" | "detractionPercent"
      >,
    ) => purchasesApi.preview(input),
  });
}

export function usePreviewExpensePurchase() {
  return useMutation({
    mutationFn: (
      input: Pick<
        ExpensePurchaseInput,
        "currency" | "issueDate" | "lines" | "iscAmount" | "discountAmount" | "detractionCode" | "detractionPercent"
      >,
    ) => purchasesApi.previewExpense(input),
  });
}

export function usePreviewAdditionalCostPurchase() {
  return useMutation({
    mutationFn: (
      input: Pick<
        AdditionalCostPurchaseInput,
        | "currency"
        | "issueDate"
        | "lines"
        | "allocationMethod"
        | "targetPurchaseIds"
        | "manualAllocations"
        | "iscAmount"
        | "discountAmount"
        | "detractionCode"
        | "detractionPercent"
      >,
    ) => purchasesApi.previewAdditionalCost(input),
  });
}

export function useKardex(params: {
  productId?: string;
  warehouseId?: string;
  from?: string;
  to?: string;
}) {
  const { company } = useActiveCompany();
  const enabled = Boolean(company && params.productId && params.warehouseId);
  return useQuery({
    queryKey: purchaseKeys.kardex(
      company?.id ?? "",
      params.productId ?? "",
      params.warehouseId ?? "",
      params.from,
      params.to,
    ),
    queryFn: () =>
      kardexApi.list({
        productId: params.productId!,
        warehouseId: params.warehouseId!,
        from: params.from,
        to: params.to,
      }),
    enabled,
  });
}
