import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type { ExpenseSheet, ExpenseSheetFilters, ExpenseSheetInput } from "../domain/expense-sheet.types";

function toPayload(input: ExpenseSheetInput) {
  return {
    issue_date: input.issueDate,
    responsible: input.responsible,
    concept: input.concept,
    description: input.description || null,
  };
}

export const expenseSheetsApi = {
  async list({ search, status, page, perPage }: ExpenseSheetFilters): Promise<Paginated<ExpenseSheet>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<ExpenseSheet>>>("/expense-sheets", {
      params: { search: search || undefined, status, page, per_page: perPage },
    });
    return data.data;
  },

  async get(id: string): Promise<ExpenseSheet> {
    const { data } = await apiClient.get<ApiResponse<ExpenseSheet>>(`/expense-sheets/${id}`);
    return data.data;
  },

  async create(input: ExpenseSheetInput): Promise<ExpenseSheet> {
    const { data } = await apiClient.post<ApiResponse<ExpenseSheet>>("/expense-sheets", toPayload(input));
    return data.data;
  },

  async update(id: string, input: ExpenseSheetInput): Promise<ExpenseSheet> {
    const { data } = await apiClient.put<ApiResponse<ExpenseSheet>>(`/expense-sheets/${id}`, toPayload(input));
    return data.data;
  },

  async close(id: string): Promise<ExpenseSheet> {
    const { data } = await apiClient.post<ApiResponse<ExpenseSheet>>(`/expense-sheets/${id}/close`);
    return data.data;
  },

  async reopen(id: string): Promise<ExpenseSheet> {
    const { data } = await apiClient.post<ApiResponse<ExpenseSheet>>(`/expense-sheets/${id}/reopen`);
    return data.data;
  },
};
