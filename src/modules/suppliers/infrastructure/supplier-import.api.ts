import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type { SupplierImportInputRow, SupplierImportResult } from "../domain/supplier-import.types";

export const supplierImportApi = {
  async preview(rows: SupplierImportInputRow[], updateExisting: boolean): Promise<SupplierImportResult> {
    const { data } = await apiClient.post<ApiResponse<SupplierImportResult>>("/suppliers/import/preview", {
      rows,
      update_existing: updateExisting,
    });
    return data.data;
  },

  async import(
    rows: SupplierImportInputRow[],
    updateExisting: boolean,
  ): Promise<{ result: SupplierImportResult; message: string }> {
    const { data } = await apiClient.post<ApiResponse<SupplierImportResult>>("/suppliers/import", {
      rows,
      update_existing: updateExisting,
    });
    return { result: data.data, message: data.message ?? "Proveedores importados." };
  },
};
