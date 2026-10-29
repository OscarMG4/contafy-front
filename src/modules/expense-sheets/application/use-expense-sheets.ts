"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { ExpenseSheetFilters, ExpenseSheetInput } from "../domain/expense-sheet.types";
import { expenseSheetsApi } from "../infrastructure/expense-sheets.api";

export const expenseSheetKeys = {
  all: ["expense-sheets"] as const,
  list: (companyId: string, filters: ExpenseSheetFilters) => ["expense-sheets", "list", companyId, filters] as const,
  detail: (companyId: string, id: string) => ["expense-sheets", "detail", companyId, id] as const,
};

export function useExpenseSheets(filters: ExpenseSheetFilters, options: { enabled?: boolean } = {}) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: expenseSheetKeys.list(company?.id ?? "", filters),
    queryFn: () => expenseSheetsApi.list(filters),
    enabled: Boolean(company) && (options.enabled ?? true),
    placeholderData: keepPreviousData,
  });
}

export function useExpenseSheet(id: string | null | undefined) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: expenseSheetKeys.detail(company?.id ?? "", id ?? ""),
    queryFn: () => expenseSheetsApi.get(id as string),
    enabled: Boolean(company && id),
    staleTime: 60_000,
  });
}

function useInvalidateExpenseSheets() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: expenseSheetKeys.all });
}

export function useCreateExpenseSheet() {
  const invalidate = useInvalidateExpenseSheets();
  return useMutation({ mutationFn: (input: ExpenseSheetInput) => expenseSheetsApi.create(input), onSuccess: invalidate });
}

export function useUpdateExpenseSheet() {
  const invalidate = useInvalidateExpenseSheets();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ExpenseSheetInput }) => expenseSheetsApi.update(id, input),
    onSuccess: invalidate,
  });
}

export function useChangeExpenseSheetStatus() {
  const invalidate = useInvalidateExpenseSheets();
  return useMutation({
    mutationFn: ({ id, action }: { id: string; action: "close" | "reopen" }) =>
      action === "close" ? expenseSheetsApi.close(id) : expenseSheetsApi.reopen(id),
    onSuccess: invalidate,
  });
}
