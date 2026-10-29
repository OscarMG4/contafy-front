"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { PurchaseOrderFilters, PurchaseOrderInput } from "../domain/purchase-order.types";
import { purchaseOrdersApi } from "../infrastructure/purchase-orders.api";

export const purchaseOrderKeys = {
  all: ["purchase-orders"] as const,
  list: (companyId: string, filters: PurchaseOrderFilters) => ["purchase-orders", "list", companyId, filters] as const,
  detail: (id: string) => ["purchase-orders", "detail", id] as const,
};

export function usePurchaseOrders(filters: PurchaseOrderFilters, enabled = true) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: purchaseOrderKeys.list(company?.id ?? "", filters),
    queryFn: () => purchaseOrdersApi.list(filters),
    enabled: Boolean(company) && enabled,
    placeholderData: keepPreviousData,
  });
}

/** O/C que aún tienen mercadería por llegar (para "Recepción desde O/C" y "Traer de O/C"). */
export function useOpenPurchaseOrders(supplierId?: string) {
  return usePurchaseOrders({ supplierId, status: "open,partial", page: 1, perPage: 100 });
}

export function usePurchaseOrder(id: string | null | undefined) {
  return useQuery({
    queryKey: purchaseOrderKeys.detail(id ?? ""),
    queryFn: () => purchaseOrdersApi.get(id as string),
    enabled: Boolean(id),
  });
}

export function useCreatePurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: PurchaseOrderInput) => purchaseOrdersApi.create(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
}

export function useCancelPurchaseOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => purchaseOrdersApi.cancel(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: purchaseOrderKeys.all }),
  });
}
