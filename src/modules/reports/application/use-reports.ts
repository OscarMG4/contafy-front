"use client";

import { useQuery } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import { reportsApi } from "../infrastructure/reports.api";
import type { PurchaseRegisterFilters } from "../domain/report.types";

export const reportKeys = {
  purchaseRegister: (filters: PurchaseRegisterFilters) => ["reports", "purchase-register", filters] as const,
  feeReceipts: (companyId: string, period: string) => ["reports", "fee-receipts", companyId, period] as const,
};

export function usePurchaseRegister(filters: PurchaseRegisterFilters, enabled = true) {
  return useQuery({
    queryKey: reportKeys.purchaseRegister(filters),
    queryFn: () => reportsApi.purchaseRegister(filters),
    enabled: enabled && Boolean(filters.period),
  });
}

export function useFeeReceipts(period: string) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: reportKeys.feeReceipts(company?.id ?? "", period),
    queryFn: () => reportsApi.feeReceipts(period),
    enabled: Boolean(company) && Boolean(period),
  });
}
