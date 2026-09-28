"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { useSyncExternalStore } from "react";

import { HOME_ROUTE } from "@/core/session/session-constants";
import { sessionCookies } from "@/core/session/session-cookies";
import { sessionUser } from "@/core/session/session-user";
import { beginLogout, endLogout } from "@/core/http/api-client";

import type { AuthSession, LoginInput, LoginResult, User } from "../domain/auth.types";
import { isTenantSelection } from "../domain/auth.types";
import { LAST_TENANT_KEY } from "../domain/tenant-id";
import { authApi } from "../infrastructure/auth.api";

export const authKeys = {
  me: ["auth", "me"] as const,
};

function useStartSession() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (tenantId: string, token: string, user: User, refreshToken?: string) => {
    endLogout();
    sessionCookies.save({ token, refreshToken, tenantId });
    localStorage.setItem(LAST_TENANT_KEY, tenantId);
    sessionUser.save(user);
    queryClient.setQueryData(authKeys.me, user);

    const next = searchParams.get("next");
    router.replace(next?.startsWith("/") ? next : HOME_ROUTE);
  };
}

export function useLogin() {
  const startSession = useStartSession();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (result: LoginResult) => {
      if (isTenantSelection(result)) return;
      const session = result as AuthSession;
      const tenantId = session.user.tenant_id;
      if (!tenantId) throw new Error("Sesión sin tenant_id.");
      startSession(tenantId, session.token, session.user, session.refresh_token);
    },
  });
}

const noopSubscribe = () => () => {};

function useIsHydrated() {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useCurrentUser() {
  const hydrated = useIsHydrated();

  return useQuery({
    queryKey: authKeys.me,
    queryFn: async () => {
      const user = await authApi.me();
      sessionUser.save(user);
      return user;
    },
    staleTime: 5 * 60_000,
    retry: 1,
    placeholderData: () => (hydrated ? (sessionUser.get() ?? undefined) : undefined),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: async () => {
      beginLogout();
      try {
        await authApi.logout();
      } catch {
        // Igual limpiamos la sesión local.
      }
    },
    onSettled: () => {
      sessionCookies.clear();
      sessionUser.clear();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
