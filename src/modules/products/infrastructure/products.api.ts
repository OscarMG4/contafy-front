import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type { CatalogEntry, OperationTypeOption, Product, ProductFilters, ProductInput } from "../domain/product.types";

function toPayload(input: ProductInput) {
  return {
    description: input.description,
    unit_of_measure: input.unitOfMeasure,
    existence_type: input.existenceType,
    default_operation_type: input.defaultOperationType,
  };
}

export const productsApi = {
  async list({ search, status, page, perPage }: ProductFilters): Promise<Paginated<Product>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<Product>>>("/products", {
      params: { search: search || undefined, status, page, per_page: perPage },
    });
    return data.data;
  },

  async operationTypes(): Promise<OperationTypeOption[]> {
    const { data } = await apiClient.get<ApiResponse<OperationTypeOption[]>>("/products/operation-types");
    return data.data;
  },

  async unitsOfMeasure(): Promise<CatalogEntry[]> {
    const { data } = await apiClient.get<ApiResponse<CatalogEntry[]>>("/catalogs/units_of_measure");
    return data.data;
  },

  async existenceTypes(): Promise<CatalogEntry[]> {
    const { data } = await apiClient.get<ApiResponse<CatalogEntry[]>>("/catalogs/existence_types");
    return data.data;
  },

  async create(input: ProductInput): Promise<Product> {
    const { data } = await apiClient.post<ApiResponse<Product>>("/products", toPayload(input));
    return data.data;
  },

  async update(id: string, input: ProductInput): Promise<Product> {
    const { data } = await apiClient.put<ApiResponse<Product>>(`/products/${id}`, toPayload(input));
    return data.data;
  },

  async archive(id: string): Promise<Product> {
    const { data } = await apiClient.post<ApiResponse<Product>>(`/products/${id}/archive`);
    return data.data;
  },

  async restore(id: string): Promise<Product> {
    const { data } = await apiClient.post<ApiResponse<Product>>(`/products/${id}/restore`);
    return data.data;
  },
};
