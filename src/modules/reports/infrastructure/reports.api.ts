import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type { PurchaseRegisterFilters, PurchaseRegisterReport } from "../domain/report.types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

export const reportsApi = {
  async purchaseRegister(filters: PurchaseRegisterFilters): Promise<PurchaseRegisterReport> {
    const { data } = await apiClient.get<ApiResponse<PurchaseRegisterReport>>("/reports/purchase-register", {
      params: {
        period: filters.period,
        include_annulled: filters.includeAnnulled ? 1 : 0,
      },
    });
    return data.data;
  },

  async exportPurchaseRegister(filters: PurchaseRegisterFilters, format: "csv" | "txt"): Promise<void> {
    const response = await apiClient.get("/reports/purchase-register/export", {
      params: {
        period: filters.period,
        include_annulled: filters.includeAnnulled ? 1 : 0,
        format,
      },
      responseType: "blob",
    });
    const filename = `registro-compras-${filters.period}.${format}`;
    downloadBlob(response.data as Blob, filename);
  },

  async exportKardex(params: {
    productId: string;
    warehouseId: string;
    from?: string;
    to?: string;
  }): Promise<void> {
    const response = await apiClient.get("/inventory/kardex/export", {
      params: {
        product_id: params.productId,
        warehouse_id: params.warehouseId,
        from: params.from,
        to: params.to,
      },
      responseType: "blob",
    });
    downloadBlob(response.data as Blob, `kardex-${params.productId}.csv`);
  },
};
