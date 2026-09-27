"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { CategoryInput } from "../domain/category.types";
import { categoriesApi } from "../infrastructure/categories.api";

export const categoryKeys = {
  all: ["accounting", "categories"] as const,
  list: (companyId: string) => ["accounting", "categories", "list", companyId] as const,
};

export function useCategories() {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: categoryKeys.list(company?.id ?? ""),
    queryFn: () => categoriesApi.list(),
    enabled: Boolean(company),
  });
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: categoryKeys.all });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: CategoryInput }) => categoriesApi.update(id, input),
    onSuccess: invalidate,
  });
}
