import { apiClient, type ApiResponse } from "@/core/http/api-client";

export interface IdentityLookupResult {
  document_type: "1" | "6";
  document_number: string;
  business_name: string;
  trade_name?: string | null;
  address?: string | null;
  state?: string | null;
  condition?: string | null;
  ubigeo?: string | null;
  first_names?: string | null;
  paternal_surname?: string | null;
  maternal_surname?: string | null;
  source: string;
}

export const identityApi = {
  async lookupRuc(ruc: string): Promise<IdentityLookupResult> {
    const { data } = await apiClient.get<ApiResponse<IdentityLookupResult>>(`/identity/ruc/${ruc}`);
    return data.data;
  },

  async lookupDni(dni: string): Promise<IdentityLookupResult> {
    const { data } = await apiClient.get<ApiResponse<IdentityLookupResult>>(`/identity/dni/${dni}`);
    return data.data;
  },

  async lookup(documentType: "1" | "6", documentNumber: string): Promise<IdentityLookupResult> {
    const { data } = await apiClient.get<ApiResponse<IdentityLookupResult>>("/identity/lookup", {
      params: { document_type: documentType, document_number: documentNumber },
    });
    return data.data;
  },
};
