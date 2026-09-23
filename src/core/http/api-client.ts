import axios from "axios";

import { env } from "@/core/config/env";
import { sessionCookies } from "@/core/session/session-cookies";

import { ApiError } from "./api-error";

/** Respuesta estándar del backend: { data, message } */
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export const apiClient = axios.create({
  baseURL: env.apiUrl,
  headers: { Accept: "application/json" },
});

apiClient.interceptors.request.use((config) => {
  const token = sessionCookies.getToken();
  const tenant = sessionCookies.getTenant();

  if (token) config.headers.Authorization = `Bearer ${token}`;
  if (tenant && !config.headers.has("X-Tenant")) config.headers.set("X-Tenant", tenant);

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = ApiError.from(error);
    const isLoginRequest = error?.config?.url?.includes("/auth/login");

    if (apiError.status === 401 && !isLoginRequest && typeof window !== "undefined") {
      sessionCookies.clear();
      // Fuera de React no hay router; además la recarga completa descarta la caché de React Query.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.href = "/login?expired=1";
    }

    return Promise.reject(apiError);
  },
);
