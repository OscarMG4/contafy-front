"use client";

import { useQuery } from "@tanstack/react-query";

import { reportsApi } from "../infrastructure/reports.api";
import type { PurchaseRegisterFilters } from "../domain/report.types";

export const reportKeys = {
  purchaseRegister: (filters: PurchaseRegisterFilters) => ["reports", "purchase-register", filters] as const,
};

export function usePurchaseRegister(filters: PurchaseRegisterFilters, enabled = true) {
  return useQuery({
    queryKey: reportKeys.purchaseRegister(filters),
    queryFn: () => reportsApi.purchaseRegister(filters),
    enabled: enabled && Boolean(filters.period),
  });
}
