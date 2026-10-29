"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { GoodsReceptionFilters, GoodsReceptionInput } from "../domain/reception.types";
import { receptionsApi } from "../infrastructure/receptions.api";

export const receptionKeys = {
  all: ["receptions"] as const,
  list: (companyId: string, filters: GoodsReceptionFilters) =>
    ["receptions", "list", companyId, filters] as const,
};

export function useReceptions(filters: GoodsReceptionFilters) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: receptionKeys.list(company?.id ?? "", filters),
    queryFn: () => receptionsApi.list(filters),
    enabled: Boolean(company),
    placeholderData: keepPreviousData,
  });
}

export function useOpenReceptions() {
  return useReceptions({ page: 1, perPage: 100, status: "open" });
}

export function useCreateReception() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: GoodsReceptionInput) => receptionsApi.create(input),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: receptionKeys.all }),
        // Recibir desde O/C cambia lo recibido / pendiente y el estado de la orden.
        queryClient.invalidateQueries({ queryKey: ["purchase-orders"] }),
      ]),
  });
}

export function useCloseReception() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => receptionsApi.close(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: receptionKeys.all }),
  });
}
