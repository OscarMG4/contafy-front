import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type { PurchaseImportInputRow, PurchaseImportResult } from "../domain/purchase-import.types";

export const purchaseImportApi = {
  async preview(rows: PurchaseImportInputRow[]): Promise<PurchaseImportResult> {
    const { data } = await apiClient.post<ApiResponse<PurchaseImportResult>>("/purchases/import/preview", { rows });
    return data.data;
  },

  async import(rows: PurchaseImportInputRow[]): Promise<{ result: PurchaseImportResult; message: string }> {
    const { data } = await apiClient.post<ApiResponse<PurchaseImportResult>>("/purchases/import", { rows });
    return { result: data.data, message: data.message ?? "Compras registradas." };
  },
};
