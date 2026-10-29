import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type {
  CostCenter,
  CostCenterFilters,
  CostCenterInput,
  CostCenterUpdateInput,
} from "../domain/cost-center.types";

export const costCentersApi = {
  async list({ search, only_active, page, perPage }: CostCenterFilters): Promise<Paginated<CostCenter>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<CostCenter>>>("/cost-centers", {
      params: {
        search: search || undefined,
        only_active: only_active ? 1 : undefined,
        page,
        per_page: perPage,
      },
    });
    return data.data;
  },

  async get(id: string): Promise<CostCenter> {
    const { data } = await apiClient.get<ApiResponse<CostCenter>>(`/cost-centers/${id}`);
    return data.data;
  },

  async create(input: CostCenterInput): Promise<CostCenter> {
    const { data } = await apiClient.post<ApiResponse<CostCenter>>("/cost-centers", {
      code: input.code,
      name: input.name,
    });
    return data.data;
  },

  async update(id: string, input: CostCenterUpdateInput): Promise<CostCenter> {
    const { data } = await apiClient.put<ApiResponse<CostCenter>>(`/cost-centers/${id}`, {
      name: input.name,
      active: input.active,
    });
    return data.data;
  },
};
