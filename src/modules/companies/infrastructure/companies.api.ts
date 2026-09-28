import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type { Company, CompanyFilters, CompanyInput, TaxRegimeOption } from "../domain/company.types";

function toPayload(input: Omit<CompanyInput, "ruc">) {
  return {
    business_name: input.businessName,
    trade_name: input.tradeName || null,
    address: input.address || null,
    tax_regime: input.taxRegime,
  };
}

export const companiesApi = {
  async list({ search, status, page, perPage }: CompanyFilters): Promise<Paginated<Company>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<Company>>>("/companies", {
      params: { search: search || undefined, status, page, per_page: perPage },
    });
    return data.data;
  },

  async taxRegimes(): Promise<TaxRegimeOption[]> {
    const { data } = await apiClient.get<ApiResponse<TaxRegimeOption[]>>("/companies/tax-regimes");
    return data.data;
  },

  async create(input: CompanyInput): Promise<Company> {
    const { data } = await apiClient.post<ApiResponse<Company>>("/companies", { ruc: input.ruc, ...toPayload(input) });
    return data.data;
  },

  async update(id: string, input: Omit<CompanyInput, "ruc">): Promise<Company> {
    const { data } = await apiClient.put<ApiResponse<Company>>(`/companies/${id}`, toPayload(input));
    return data.data;
  },

  async archive(id: string): Promise<Company> {
    const { data } = await apiClient.post<ApiResponse<Company>>(`/companies/${id}/archive`);
    return data.data;
  },

  async restore(id: string): Promise<Company> {
    const { data } = await apiClient.post<ApiResponse<Company>>(`/companies/${id}/restore`);
    return data.data;
  },
};
