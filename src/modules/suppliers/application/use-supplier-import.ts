"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { SupplierImportInputRow } from "../domain/supplier-import.types";
import { supplierImportApi } from "../infrastructure/supplier-import.api";
import { supplierKeys } from "./use-suppliers";

type ImportArgs = { rows: SupplierImportInputRow[]; updateExisting: boolean };

export function usePreviewSupplierImport() {
  return useMutation({
    mutationFn: ({ rows, updateExisting }: ImportArgs) => supplierImportApi.preview(rows, updateExisting),
  });
}

export function useImportSuppliers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ rows, updateExisting }: ImportArgs) => supplierImportApi.import(rows, updateExisting),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: supplierKeys.all }),
  });
}
