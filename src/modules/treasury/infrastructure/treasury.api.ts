import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type {
  PayableDocument,
  PayablesAging,
  SupplierPayment,
  SupplierPaymentFilters,
  SupplierPaymentInput,
  SupplierStatement,
  TreasuryAccount,
  TreasuryAccountInput,
  TreasuryAccountTypeOption,
} from "../domain/treasury.types";

function accountPayload(input: TreasuryAccountInput) {
  return {
    name: input.name,
    type: input.type,
    currency: input.currency,
    account_code: input.accountCode || null,
    bank_name: input.bankName || null,
    account_number: input.accountNumber || null,
    ...(input.active !== undefined ? { active: input.active } : {}),
  };
}

export const treasuryApi = {
  async accounts(onlyActive = false): Promise<TreasuryAccount[]> {
    const { data } = await apiClient.get<ApiResponse<TreasuryAccount[]>>("/treasury/accounts", {
      params: { only_active: onlyActive ? 1 : undefined },
    });
    return data.data;
  },

  async accountTypes(): Promise<TreasuryAccountTypeOption[]> {
    const { data } = await apiClient.get<ApiResponse<TreasuryAccountTypeOption[]>>("/treasury/accounts/types");
    return data.data;
  },

  async createAccount(input: TreasuryAccountInput): Promise<TreasuryAccount> {
    const { data } = await apiClient.post<ApiResponse<TreasuryAccount>>("/treasury/accounts", accountPayload(input));
    return data.data;
  },

  async updateAccount(id: string, input: TreasuryAccountInput): Promise<TreasuryAccount> {
    const { data } = await apiClient.put<ApiResponse<TreasuryAccount>>(`/treasury/accounts/${id}`, accountPayload(input));
    return data.data;
  },

  async pending(supplierId?: string, currency?: string): Promise<PayableDocument[]> {
    const { data } = await apiClient.get<ApiResponse<PayableDocument[]>>("/treasury/payables/pending", {
      params: { supplier_id: supplierId || undefined, currency: currency || undefined },
    });
    return data.data;
  },

  async aging(params: { supplierId?: string; currency?: string; asOf?: string }): Promise<PayablesAging> {
    const { data } = await apiClient.get<ApiResponse<PayablesAging>>("/treasury/payables/aging", {
      params: {
        supplier_id: params.supplierId || undefined,
        currency: params.currency || undefined,
        as_of: params.asOf || undefined,
      },
    });
    return data.data;
  },

  async statement(params: { supplierId: string; currency: string; from?: string; to?: string }): Promise<SupplierStatement> {
    const { data } = await apiClient.get<ApiResponse<SupplierStatement>>("/treasury/payables/statement", {
      params: {
        supplier_id: params.supplierId,
        currency: params.currency,
        from: params.from || undefined,
        to: params.to || undefined,
      },
    });
    return data.data;
  },

  async payments(filters: SupplierPaymentFilters): Promise<Paginated<SupplierPayment>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<SupplierPayment>>>("/treasury/supplier-payments", {
      params: {
        supplier_id: filters.supplierId || undefined,
        from: filters.from || undefined,
        to: filters.to || undefined,
        status: filters.status || undefined,
        page: filters.page,
        per_page: filters.perPage,
      },
    });
    return data.data;
  },

  async payment(id: string): Promise<SupplierPayment> {
    const { data } = await apiClient.get<ApiResponse<SupplierPayment>>(`/treasury/supplier-payments/${id}`);
    return data.data;
  },

  async createPayment(input: SupplierPaymentInput): Promise<SupplierPayment> {
    const { data } = await apiClient.post<ApiResponse<SupplierPayment>>("/treasury/supplier-payments", {
      supplier_id: input.supplierId,
      treasury_account_id: input.treasuryAccountId,
      method: input.method,
      currency: input.currency,
      paid_at: input.paidAt,
      reference: input.reference || null,
      observations: input.observations || null,
      applications: input.applications.map((a) => ({ purchase_id: a.purchaseId, amount: a.amount })),
    });
    return data.data;
  },

  async annulPayment(id: string): Promise<SupplierPayment> {
    const { data } = await apiClient.post<ApiResponse<SupplierPayment>>(`/treasury/supplier-payments/${id}/annul`);
    return data.data;
  },
};
