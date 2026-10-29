import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type {
  AccountingLink,
  AccountingLinkInput,
  AccountingLinkTypeOption,
  AccountingScheme,
  ResolvedLinkAccount,
} from "../domain/accounting-link.types";

export const accountingLinksApi = {
  async types(): Promise<AccountingLinkTypeOption[]> {
    const { data } = await apiClient.get<ApiResponse<AccountingLinkTypeOption[]>>("/accounting/links/types");
    return data.data;
  },

  async schemes(): Promise<AccountingScheme[]> {
    const { data } = await apiClient.get<ApiResponse<AccountingScheme[]>>("/accounting/links/schemes");
    return data.data;
  },

  async createScheme(input: { name: string; copy_from_id?: string | null }): Promise<AccountingScheme> {
    const { data } = await apiClient.post<ApiResponse<AccountingScheme>>("/accounting/links/schemes", input);
    return data.data;
  },

  async updateScheme(id: string, input: { name: string; active: boolean; is_default: boolean }): Promise<AccountingScheme> {
    const { data } = await apiClient.put<ApiResponse<AccountingScheme>>(`/accounting/links/schemes/${id}`, input);
    return data.data;
  },

  async list(schemeId: string, linkType?: string): Promise<AccountingLink[]> {
    const { data } = await apiClient.get<ApiResponse<AccountingLink[]>>("/accounting/links", {
      params: { scheme_id: schemeId, link_type: linkType || undefined },
    });
    return data.data;
  },

  async create(input: AccountingLinkInput): Promise<AccountingLink> {
    const { data } = await apiClient.post<ApiResponse<AccountingLink>>("/accounting/links", input);
    return data.data;
  },

  async update(id: string, input: AccountingLinkInput): Promise<AccountingLink> {
    const { data } = await apiClient.put<ApiResponse<AccountingLink>>(`/accounting/links/${id}`, input);
    return data.data;
  },

  async copy(id: string): Promise<AccountingLink> {
    const { data } = await apiClient.post<ApiResponse<AccountingLink>>(`/accounting/links/${id}/copy`);
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/accounting/links/${id}`);
  },

  async resolve(params: {
    link_type: string;
    scheme_id?: string | null;
    document_type?: string | null;
    product_category?: string | null;
    partner_category?: string | null;
    concept?: string | null;
  }): Promise<ResolvedLinkAccount | null> {
    const { data } = await apiClient.get<ApiResponse<ResolvedLinkAccount | null>>("/accounting/links/resolve", {
      params,
    });
    return data.data;
  },
};
