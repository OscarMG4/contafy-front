import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type { AuthSession, LoginInput, RegisterCompanyInput, RegisteredCompany, User } from "../domain/auth.types";

export const authApi = {
  async login({ tenantId, email, password }: LoginInput): Promise<AuthSession> {
    const { data } = await apiClient.post<ApiResponse<AuthSession>>(
      "/auth/login",
      { email, password, device_name: "web" },
      { headers: { "X-Tenant": tenantId } },
    );
    return data.data;
  },

  async registerCompany(input: RegisterCompanyInput): Promise<RegisteredCompany> {
    const { data } = await apiClient.post<ApiResponse<RegisteredCompany>>("/tenants", {
      tenant_id: input.tenantId,
      company_name: input.companyName,
      name: input.name,
      email: input.email,
      password: input.password,
    });
    return data.data;
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");
    return data.data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};
