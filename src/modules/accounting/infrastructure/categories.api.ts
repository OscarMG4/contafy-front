import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type { Category, CategoryInput } from "../domain/category.types";

function toPayload(input: CategoryInput) {
  return {
    name: input.name,
    account_code: input.accountCode,
    active: input.active,
  };
}

export const categoriesApi = {
  async list(): Promise<Category[]> {
    const { data } = await apiClient.get<ApiResponse<Category[]>>("/accounting/categories");
    return data.data;
  },

  async update(id: string, input: CategoryInput): Promise<Category> {
    const { data } = await apiClient.put<ApiResponse<Category>>(`/accounting/categories/${id}`, toPayload(input));
    return data.data;
  },
};
