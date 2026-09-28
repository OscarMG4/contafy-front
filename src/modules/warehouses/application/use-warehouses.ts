"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { WarehouseFilters, WarehouseInput } from "../domain/warehouse.types";
import { warehousesApi } from "../infrastructure/warehouses.api";

export const warehouseKeys = {
  all: ["warehouses"] as const,
  list: (companyId: string, filters: WarehouseFilters) => ["warehouses", "list", companyId, filters] as const,
  warehouseTypes: ["warehouses", "warehouse-types"] as const,
};

export function useWarehouses(filters: WarehouseFilters) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: warehouseKeys.list(company?.id ?? "", filters),
    queryFn: () => warehousesApi.list(filters),
    enabled: Boolean(company),
    placeholderData: keepPreviousData,
  });
}

export function useWarehouseTypes() {
  return useQuery({ queryKey: warehouseKeys.warehouseTypes, queryFn: warehousesApi.warehouseTypes, staleTime: Infinity });
}

function useInvalidateWarehouses() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: warehouseKeys.all });
}

export function useCreateWarehouse() {
  const invalidate = useInvalidateWarehouses();
  return useMutation({ mutationFn: (input: WarehouseInput) => warehousesApi.create(input), onSuccess: invalidate });
}

export function useUpdateWarehouse() {
  const invalidate = useInvalidateWarehouses();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: WarehouseInput }) => warehousesApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useChangeWarehouseStatus() {
  const invalidate = useInvalidateWarehouses();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "archive" | "restore" }) =>
      action === "archive" ? warehousesApi.archive(id) : warehousesApi.restore(id),
    onSuccess: invalidate,
  });
}
