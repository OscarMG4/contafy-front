// Sin dependencias: este archivo también se importa desde src/proxy.ts.
export const SESSION_COOKIES = {
  token: "contafy_token",
  tenant: "contafy_tenant",
} as const;

export const THEME_COOKIE = "contafy_theme";

export const PUBLIC_ROUTES = ["/login", "/register"] as const;

export const HOME_ROUTE = "/dashboard";
