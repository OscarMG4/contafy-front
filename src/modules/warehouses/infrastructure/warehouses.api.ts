import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type { Warehouse, WarehouseFilters, WarehouseInput, WarehouseTypeOption } from "../domain/warehouse.types";

function toPayload(input: WarehouseInput) {
  return {
    name: input.name,
    type: input.type,
  };
}

export const warehousesApi = {
  async list({ search, status, page, perPage }: WarehouseFilters): Promise<Paginated<Warehouse>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<Warehouse>>>("/warehouses", {
      params: { search: search || undefined, status, page, per_page: perPage },
    });
    return data.data;
  },

  async warehouseTypes(): Promise<WarehouseTypeOption[]> {
    const { data } = await apiClient.get<ApiResponse<WarehouseTypeOption[]>>("/warehouses/warehouse-types");
    return data.data;
  },

  async create(input: WarehouseInput): Promise<Warehouse> {
    const { data } = await apiClient.post<ApiResponse<Warehouse>>("/warehouses", toPayload(input));
    return data.data;
  },

  async update(id: string, input: WarehouseInput): Promise<Warehouse> {
    const { data } = await apiClient.put<ApiResponse<Warehouse>>(`/warehouses/${id}`, toPayload(input));
    return data.data;
  },

  async archive(id: string): Promise<Warehouse> {
    const { data } = await apiClient.post<ApiResponse<Warehouse>>(`/warehouses/${id}/archive`);
    return data.data;
  },

  async restore(id: string): Promise<Warehouse> {
    const { data } = await apiClient.post<ApiResponse<Warehouse>>(`/warehouses/${id}/restore`);
    return data.data;
  },
};
