// Sin dependencias: este archivo también se importa desde src/proxy.ts.
export const SESSION_COOKIES = {
  token: "contafy_token",
  refreshToken: "contafy_refresh_token",
  tenant: "contafy_tenant",
  /** Empresa cliente activa dentro del estudio (header X-Company). */
  company: "contafy_company",
} as const;

export const THEME_COOKIE = "contafy_theme";

export const PUBLIC_ROUTES = ["/login"] as const;

export const HOME_ROUTE = "/dashboard";
