"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { ProductFilters, ProductInput } from "../domain/product.types";
import { productsApi } from "../infrastructure/products.api";

export const productKeys = {
  all: ["products"] as const,
  list: (companyId: string, filters: ProductFilters) => ["products", "list", companyId, filters] as const,
  operationTypes: ["products", "operation-types"] as const,
  unitsOfMeasure: ["catalogs", "units_of_measure"] as const,
  existenceTypes: ["catalogs", "existence_types"] as const,
};

export function useProducts(filters: ProductFilters) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: productKeys.list(company?.id ?? "", filters),
    queryFn: () => productsApi.list(filters),
    enabled: Boolean(company),
    placeholderData: keepPreviousData,
  });
}

export function useOperationTypes() {
  return useQuery({ queryKey: productKeys.operationTypes, queryFn: productsApi.operationTypes, staleTime: Infinity });
}

export function useUnitsOfMeasure() {
  return useQuery({ queryKey: productKeys.unitsOfMeasure, queryFn: productsApi.unitsOfMeasure, staleTime: Infinity });
}

export function useExistenceTypes() {
  return useQuery({ queryKey: productKeys.existenceTypes, queryFn: productsApi.existenceTypes, staleTime: Infinity });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: productKeys.all });
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({ mutationFn: (input: ProductInput) => productsApi.create(input), onSuccess: invalidate });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProductInput }) => productsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useChangeProductStatus() {
  const invalidate = useInvalidateProducts();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "archive" | "restore" }) =>
      action === "archive" ? productsApi.archive(id) : productsApi.restore(id),
    onSuccess: invalidate,
  });
}
