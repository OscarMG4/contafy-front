"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { PurchaseImportInputRow } from "../domain/purchase-import.types";
import { purchaseImportApi } from "../infrastructure/purchase-import.api";
import { purchaseKeys } from "./use-purchases";

export function usePreviewPurchaseImport() {
  return useMutation({ mutationFn: (rows: PurchaseImportInputRow[]) => purchaseImportApi.preview(rows) });
}

export function useImportPurchases() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: PurchaseImportInputRow[]) => purchaseImportApi.import(rows),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
        queryClient.invalidateQueries({ queryKey: ["treasury"] }),
        queryClient.invalidateQueries({ queryKey: ["suppliers"] }),
      ]),
  });
}
