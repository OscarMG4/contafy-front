import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type {
  IdentityDocumentTypeOption,
  PaymentTermOption,
  Supplier,
  SupplierFilters,
  SupplierInput,
} from "../domain/supplier.types";

function toPayload(input: SupplierInput, isEdit = false) {
  const payload: Record<string, unknown> = {
    business_name: input.businessName,
    trade_name: input.tradeName || null,
    address: input.address || null,
    email: input.email || null,
    phone: input.phone || null,
    payment_term: input.paymentTerm,
    credit_days: input.creditDays,
  };

  if (!isEdit) {
    payload.document_type = input.documentType;
    payload.document_number = input.documentNumber;
  }

  return payload;
}

export const suppliersApi = {
  async list({ search, status, page, perPage }: SupplierFilters): Promise<Paginated<Supplier>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<Supplier>>>("/suppliers", {
      params: { search: search || undefined, status, page, per_page: perPage },
    });
    return data.data;
  },

  async paymentTerms(): Promise<PaymentTermOption[]> {
    const { data } = await apiClient.get<ApiResponse<PaymentTermOption[]>>("/suppliers/payment-terms");
    return data.data;
  },

  async documentTypes(): Promise<IdentityDocumentTypeOption[]> {
    const { data } = await apiClient.get<ApiResponse<IdentityDocumentTypeOption[]>>("/catalogs/identity_document_types");
    return data.data;
  },

  async create(input: SupplierInput): Promise<Supplier> {
    const { data } = await apiClient.post<ApiResponse<Supplier>>("/suppliers", toPayload(input));
    return data.data;
  },

  async update(id: string, input: Omit<SupplierInput, "documentType" | "documentNumber">): Promise<Supplier> {
    const { data } = await apiClient.put<ApiResponse<Supplier>>(`/suppliers/${id}`, toPayload(input as SupplierInput, true));
    return data.data;
  },

  async archive(id: string): Promise<Supplier> {
    const { data } = await apiClient.post<ApiResponse<Supplier>>(`/suppliers/${id}/archive`);
    return data.data;
  },

  async restore(id: string): Promise<Supplier> {
    const { data } = await apiClient.post<ApiResponse<Supplier>>(`/suppliers/${id}/restore`);
    return data.data;
  },
};
