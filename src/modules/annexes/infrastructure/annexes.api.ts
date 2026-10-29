import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type { Annex, AnnexFilters, AnnexInput, AnnexTypeOption, AnnexUpdateInput } from "../domain/annex.types";

export const annexesApi = {
  async list({ search, type, only_active, page, perPage }: AnnexFilters): Promise<Paginated<Annex>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<Annex>>>("/annexes", {
      params: {
        search: search || undefined,
        type,
        only_active: only_active ? 1 : undefined,
        page,
        per_page: perPage,
      },
    });
    return data.data;
  },

  async types(): Promise<AnnexTypeOption[]> {
    const { data } = await apiClient.get<ApiResponse<AnnexTypeOption[]>>("/annexes/types");
    return data.data;
  },

  async get(id: string): Promise<Annex> {
    const { data } = await apiClient.get<ApiResponse<Annex>>(`/annexes/${id}`);
    return data.data;
  },

  async create(input: AnnexInput): Promise<Annex> {
    const { data } = await apiClient.post<ApiResponse<Annex>>("/annexes", {
      code: input.code,
      name: input.name,
      type: input.type,
      document_number: input.documentNumber || null,
    });
    return data.data;
  },

  async update(id: string, input: AnnexUpdateInput): Promise<Annex> {
    const { data } = await apiClient.put<ApiResponse<Annex>>(`/annexes/${id}`, {
      name: input.name,
      type: input.type,
      document_number: input.documentNumber || null,
      active: input.active,
    });
    return data.data;
  },
};
