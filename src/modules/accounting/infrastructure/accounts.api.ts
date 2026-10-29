import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type {
  Account,
  AccountFilters,
  AccountInput,
  AccountUpdateInput,
  ChartImportInputRow,
  ChartImportPlan,
  NatureOption,
} from "../domain/account.types";

function toCreatePayload(input: AccountInput) {
  return {
    code: input.code,
    name: input.name,
    parent_code: input.parentCode || null,
    nature: input.nature,
    is_leaf: input.isLeaf,
  };
}

function toUpdatePayload(input: AccountUpdateInput) {
  return {
    name: input.name,
    active: input.active,
    debit_destination_code: input.debitDestinationCode || null,
    credit_destination_code: input.creditDestinationCode || null,
  };
}

export const accountsApi = {
  async list({ search, nature, only_leaves, only_active, page, perPage }: AccountFilters): Promise<Paginated<Account>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<Account>>>("/accounting/accounts", {
      params: {
        search: search || undefined,
        nature,
        only_leaves: only_leaves ? 1 : undefined,
        only_active: only_active ? 1 : undefined,
        page,
        per_page: perPage,
      },
    });
    return data.data;
  },

  async natures(): Promise<NatureOption[]> {
    const { data } = await apiClient.get<ApiResponse<NatureOption[]>>("/accounting/accounts/natures");
    return data.data;
  },

  async create(input: AccountInput): Promise<Account> {
    const { data } = await apiClient.post<ApiResponse<Account>>("/accounting/accounts", toCreatePayload(input));
    return data.data;
  },

  async update(id: string, input: AccountUpdateInput): Promise<Account> {
    const { data } = await apiClient.put<ApiResponse<Account>>(`/accounting/accounts/${id}`, toUpdatePayload(input));
    return data.data;
  },

  async previewImport(rows: ChartImportInputRow[], updateNames: boolean): Promise<ChartImportPlan> {
    const { data } = await apiClient.post<ApiResponse<ChartImportPlan>>("/accounting/accounts/import/preview", {
      rows,
      update_names: updateNames,
    });
    return data.data;
  },

  async import(rows: ChartImportInputRow[], updateNames: boolean): Promise<{ plan: ChartImportPlan; message: string }> {
    const { data } = await apiClient.post<ApiResponse<ChartImportPlan>>("/accounting/accounts/import", {
      rows,
      update_names: updateNames,
    });
    return { plan: data.data, message: data.message ?? "Plan importado." };
  },
};
