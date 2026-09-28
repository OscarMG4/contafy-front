import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type {
  GoodsReception,
  GoodsReceptionFilters,
  GoodsReceptionInput,
} from "../domain/reception.types";

function toPayload(input: GoodsReceptionInput) {
  return {
    reception_date: input.receptionDate,
    warehouse_id: input.warehouseId,
    supplier_id: input.supplierId || null,
    reception_number: input.receptionNumber || null,
    observations: input.observations || null,
    lines: input.lines.map((line) => ({
      product_id: line.productId,
      quantity: line.quantity,
      observations: line.observations || null,
    })),
  };
}

export const receptionsApi = {
  async list(filters: GoodsReceptionFilters): Promise<Paginated<GoodsReception>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<GoodsReception>>>("/inventory/receptions", {
      params: {
        search: filters.search || undefined,
        status: filters.status || undefined,
        page: filters.page,
        per_page: filters.perPage,
      },
    });
    return data.data;
  },

  async get(id: string): Promise<GoodsReception> {
    const { data } = await apiClient.get<ApiResponse<GoodsReception>>(`/inventory/receptions/${id}`);
    return data.data;
  },

  async create(input: GoodsReceptionInput): Promise<GoodsReception> {
    const { data } = await apiClient.post<ApiResponse<GoodsReception>>("/inventory/receptions", toPayload(input));
    return data.data;
  },

  async close(id: string): Promise<GoodsReception> {
    const { data } = await apiClient.post<ApiResponse<GoodsReception>>(`/inventory/receptions/${id}/close`);
    return data.data;
  },
};
