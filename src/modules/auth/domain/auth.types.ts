export type UserRole = "owner" | "admin" | "accountant" | "viewer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  tenant_id: string;
  tenant_name?: string | null;
  created_at: string;
}

export interface Tenant {
  id: string;
  name: string;
  plan: string;
}

export interface AuthSession {
  user: User;
  token: string;
  refresh_token?: string;
  expires_in?: number;
  token_type?: string;
}

export interface TenantSelection {
  requires_tenant_selection: true;
  tenants: Tenant[];
}

export type LoginResult = AuthSession | TenantSelection;

export function isTenantSelection(result: LoginResult): result is TenantSelection {
  return "requires_tenant_selection" in result && result.requires_tenant_selection === true;
}

export interface LoginInput {
  email: string;
  password: string;
  tenantId?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  accountant: "Contador",
  viewer: "Lector",
};
