import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type {
  AuthSession,
  LoginInput,
  LoginResult,
  Tenant,
  User,
} from "../domain/auth.types";
import { unwrapSession, unwrapUserPayload } from "./auth-session";

export { unwrapSession } from "./auth-session";

function unwrapLoginResult(payload: unknown): LoginResult {
  if (!payload || typeof payload !== "object") {
    throw new Error("Respuesta de login inválida.");
  }

  const record = payload as Record<string, unknown>;
  if (record.requires_tenant_selection === true && Array.isArray(record.tenants)) {
    return {
      requires_tenant_selection: true,
      tenants: record.tenants as Tenant[],
    };
  }

  return unwrapSession(payload);
}

export const authApi = {
  /** Login central: no envía X-Tenant (se resuelve por email). */
  async login({ email, password, tenantId }: LoginInput): Promise<LoginResult> {
    const { data } = await apiClient.post<ApiResponse<unknown>>("/auth/login", {
      email,
      password,
      device_name: "web",
      ...(tenantId ? { tenant_id: tenantId } : {}),
    });
    return unwrapLoginResult(data.data);
  },

  async refresh(refreshToken: string, tenantId: string): Promise<AuthSession> {
    const { data } = await apiClient.post<ApiResponse<AuthSession>>(
      "/auth/refresh",
      { refresh_token: refreshToken },
      { headers: { "X-Tenant": tenantId } },
    );
    return unwrapSession(data.data);
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get<ApiResponse<User>>("/auth/me");
    return unwrapUserPayload(data.data);
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },
};
