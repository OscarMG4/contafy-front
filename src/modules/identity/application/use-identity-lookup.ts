"use client";

import { useMutation } from "@tanstack/react-query";

import { ApiError } from "@/core/http/api-error";

import { identityApi, type IdentityLookupResult } from "../infrastructure/identity.api";

export function useIdentityLookup() {
  return useMutation({
    mutationFn: async ({
      documentType,
      documentNumber,
    }: {
      documentType: "1" | "6";
      documentNumber: string;
    }): Promise<IdentityLookupResult> => {
      if (documentType === "6") return identityApi.lookupRuc(documentNumber);
      return identityApi.lookupDni(documentNumber);
    },
  });
}

export function identityLookupErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error) return error.message;
  return "No se pudo consultar el documento.";
}
