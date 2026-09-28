"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { SupplierFilters, SupplierInput } from "../domain/supplier.types";
import { suppliersApi } from "../infrastructure/suppliers.api";

export const supplierKeys = {
  all: ["suppliers"] as const,
  list: (companyId: string, filters: SupplierFilters) => ["suppliers", "list", companyId, filters] as const,
  paymentTerms: ["suppliers", "payment-terms"] as const,
  documentTypes: ["suppliers", "document-types"] as const,
};

export function useSuppliers(filters: SupplierFilters) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: supplierKeys.list(company?.id ?? "", filters),
    queryFn: () => suppliersApi.list(filters),
    enabled: Boolean(company),
    placeholderData: keepPreviousData,
  });
}

export function usePaymentTerms() {
  return useQuery({ queryKey: supplierKeys.paymentTerms, queryFn: suppliersApi.paymentTerms, staleTime: Infinity });
}

export function useDocumentTypes() {
  return useQuery({ queryKey: supplierKeys.documentTypes, queryFn: suppliersApi.documentTypes, staleTime: Infinity });
}

function useInvalidateSuppliers() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: supplierKeys.all });
}

export function useCreateSupplier() {
  const invalidate = useInvalidateSuppliers();
  return useMutation({ mutationFn: (input: SupplierInput) => suppliersApi.create(input), onSuccess: invalidate });
}

export function useUpdateSupplier() {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: ({
      id,
      input,
    }: {
      id: string;
      input: Omit<SupplierInput, "documentType" | "documentNumber">;
    }) => suppliersApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useChangeSupplierStatus() {
  const invalidate = useInvalidateSuppliers();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "archive" | "restore" }) =>
      action === "archive" ? suppliersApi.archive(id) : suppliersApi.restore(id),
    onSuccess: invalidate,
  });
}
