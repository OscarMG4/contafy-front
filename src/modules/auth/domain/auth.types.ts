export type UserRole = "owner" | "admin" | "accountant" | "viewer";

export interface User {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  tenant_id: string;
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
}

export interface RegisteredCompany extends AuthSession {
  tenant: Tenant;
}

export interface LoginInput {
  tenantId: string;
  email: string;
  password: string;
}

export interface RegisterCompanyInput {
  companyName: string;
  tenantId: string;
  name: string;
  email: string;
  password: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  accountant: "Contador",
  viewer: "Lector",
};
