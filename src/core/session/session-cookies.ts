import Cookies from "js-cookie";

import { SESSION_COOKIES } from "./session-constants";

const options: Cookies.CookieAttributes = {
  expires: 7,
  sameSite: "lax",
  secure: typeof window !== "undefined" && window.location.protocol === "https:",
};

export const sessionCookies = {
  getToken: () => Cookies.get(SESSION_COOKIES.token),
  getTenant: () => Cookies.get(SESSION_COOKIES.tenant),

  save({ token, tenantId }: { token: string; tenantId: string }) {
    Cookies.set(SESSION_COOKIES.token, token, options);
    Cookies.set(SESSION_COOKIES.tenant, tenantId, options);
  },

  clear() {
    Cookies.remove(SESSION_COOKIES.token);
    Cookies.remove(SESSION_COOKIES.tenant);
  },
};
