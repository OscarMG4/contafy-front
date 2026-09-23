"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";

import { HOME_ROUTE } from "@/core/session/session-constants";
import { sessionCookies } from "@/core/session/session-cookies";

import type { LoginInput, RegisterCompanyInput, User } from "../domain/auth.types";
import { authApi } from "../infrastructure/auth.api";

export const authKeys = {
  me: ["auth", "me"] as const,
};

function useStartSession() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const searchParams = useSearchParams();

  return (tenantId: string, token: string, user: User) => {
    sessionCookies.save({ token, tenantId });
    queryClient.setQueryData(authKeys.me, user);

    const next = searchParams.get("next");
    router.replace(next?.startsWith("/") ? next : HOME_ROUTE);
  };
}

export function useLogin() {
  const startSession = useStartSession();

  return useMutation({
    mutationFn: (input: LoginInput) => authApi.login(input),
    onSuccess: (session, input) => startSession(input.tenantId, session.token, session.user),
  });
}

export function useRegisterCompany() {
  const startSession = useStartSession();

  return useMutation({
    mutationFn: (input: RegisterCompanyInput) => authApi.registerCompany(input),
    onSuccess: (result) => startSession(result.tenant.id, result.token, result.user),
  });
}

export function useCurrentUser() {
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    staleTime: 5 * 60_000,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      sessionCookies.clear();
      queryClient.clear();
      router.replace("/login");
    },
  });
}
