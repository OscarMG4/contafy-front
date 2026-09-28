import Cookies from "js-cookie";

import { SESSION_COOKIES } from "./session-constants";

const baseOptions: Cookies.CookieAttributes = {
  sameSite: "lax",
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
};

/** Access token: 1 día (el refresh renueva antes si expira el JWT). */
const accessOptions: Cookies.CookieAttributes = { ...baseOptions, expires: 1 };

/** Refresh token: ~14 días (alineado con JWT_REFRESH_TTL). */
const refreshOptions: Cookies.CookieAttributes = { ...baseOptions, expires: 14 };

export const sessionCookies = {
  getToken: () => Cookies.get(SESSION_COOKIES.token),
  getRefreshToken: () => Cookies.get(SESSION_COOKIES.refreshToken),
  getTenant: () => Cookies.get(SESSION_COOKIES.tenant),
  getCompany: () => Cookies.get(SESSION_COOKIES.company),

  save({
    token,
    refreshToken,
    tenantId,
  }: {
    token: string;
    refreshToken?: string;
    tenantId: string;
  }) {
    Cookies.set(SESSION_COOKIES.token, token, accessOptions);
    Cookies.set(SESSION_COOKIES.tenant, tenantId, refreshOptions);
    if (refreshToken) {
      Cookies.set(SESSION_COOKIES.refreshToken, refreshToken, refreshOptions);
    }
  },

  saveTokens({ token, refreshToken }: { token: string; refreshToken?: string }) {
    Cookies.set(SESSION_COOKIES.token, token, accessOptions);
    if (refreshToken) {
      Cookies.set(SESSION_COOKIES.refreshToken, refreshToken, refreshOptions);
    }
  },

  saveCompany(companyId: string) {
    Cookies.set(SESSION_COOKIES.company, companyId, { ...baseOptions, expires: 365 });
  },

  clearCompany() {
    Cookies.remove(SESSION_COOKIES.company);
  },

  clear() {
    Cookies.remove(SESSION_COOKIES.token);
    Cookies.remove(SESSION_COOKIES.refreshToken);
    Cookies.remove(SESSION_COOKIES.tenant);
    Cookies.remove(SESSION_COOKIES.company);
  },
};
