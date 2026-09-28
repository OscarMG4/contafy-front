import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";

import { env } from "@/core/config/env";
import { sessionCookies } from "@/core/session/session-cookies";
import { unwrapSession } from "@/modules/auth/infrastructure/auth-session";

import { ApiError } from "./api-error";

/** Respuesta estándar del backend: { data, message } */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface Paginated<T> {
  items: T[];
  meta: { total: number; page: number; per_page: number };
}

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: { Accept: "application/json" },
});

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

let refreshPromise: Promise<string | null> | null = null;

/** Evita mostrar "sesión expiró" cuando el usuario cierra sesión a propósito. */
let loggingOut = false;

export function beginLogout(): void {
  loggingOut = true;
}

export function endLogout(): void {
  loggingOut = false;
}

async function tryRefreshAccessToken(): Promise<string | null> {
  if (loggingOut) return null;

  const refreshToken = sessionCookies.getRefreshToken();
  const tenant = sessionCookies.getTenant();
  if (!refreshToken || !tenant) return null;

  try {
    const { data } = await axios.post<ApiResponse<unknown>>(
      `${env.apiUrl}/auth/refresh`,
      { refresh_token: refreshToken },
      {
        headers: {
          Accept: "application/json",
          "X-Tenant": tenant,
        },
      },
    );
    const session = unwrapSession(data.data);
    sessionCookies.saveTokens({ token: session.token, refreshToken: session.refresh_token });
    return session.token;
  } catch {
    return null;
  }
}

function redirectToLogin() {
  if (loggingOut) return;

  sessionCookies.clear();
  // Fuera de React no hay router; además la recarga completa descarta la caché de React Query.
  // eslint-disable-next-line @next/next/no-location-assign-relative-destination
  window.location.href = "/login?expired=1";
}

apiClient.interceptors.request.use((config) => {
  const token = sessionCookies.getToken();
  const tenant = sessionCookies.getTenant();
  const company = sessionCookies.getCompany();

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenant && !config.headers.has("X-Tenant")) config.headers.set("X-Tenant", tenant);
  if (company && !config.headers.has("X-Company")) config.headers.set("X-Company", company);

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const apiError = ApiError.from(error);
    const config = error.config as RetriableConfig | undefined;
    const url = config?.url ?? "";
    const isAuthBootstrap =
      url.includes("/auth/login") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout") ||
      url.includes("/tenants");

    if (loggingOut || isAuthBootstrap) {
      return Promise.reject(apiError);
    }

    if (apiError.status === 401 && config && !config._retry && typeof window !== "undefined") {
      config._retry = true;

      refreshPromise ??= tryRefreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      const newToken = await refreshPromise;
      if (newToken) {
        config.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(config);
      }

      redirectToLogin();
    } else if (apiError.status === 401 && typeof window !== "undefined") {
      redirectToLogin();
    }

    return Promise.reject(apiError);
  },
);
