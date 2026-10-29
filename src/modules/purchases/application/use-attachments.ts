"use client";

import { useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useActiveCompany } from "@/modules/companies/application/active-company";

import type { PurchaseAttachment } from "../domain/attachment.types";
import { attachmentsApi } from "../infrastructure/attachments.api";

export const attachmentKeys = {
  list: (companyId: string, purchaseId: string) => ["purchases", "attachments", companyId, purchaseId] as const,
};

export function usePurchaseAttachments(purchaseId: string | null | undefined) {
  const { company } = useActiveCompany();
  return useQuery({
    queryKey: attachmentKeys.list(company?.id ?? "", purchaseId ?? ""),
    queryFn: () => attachmentsApi.list(purchaseId!),
    enabled: Boolean(company && purchaseId),
  });
}

function useInvalidateAttachments() {
  const queryClient = useQueryClient();
  const { company } = useActiveCompany();
  return useCallback(
    (purchaseId: string) =>
      queryClient.invalidateQueries({ queryKey: attachmentKeys.list(company?.id ?? "", purchaseId) }),
    [queryClient, company?.id],
  );
}

export function useUploadAttachments(purchaseId: string | null | undefined) {
  const invalidate = useInvalidateAttachments();
  return useMutation({
    mutationFn: (files: File[]) => attachmentsApi.upload(purchaseId!, files),
    onSettled: () => (purchaseId ? invalidate(purchaseId) : undefined),
  });
}

export function useDeleteAttachment(purchaseId: string | null | undefined) {
  const invalidate = useInvalidateAttachments();
  return useMutation({
    mutationFn: (attachmentId: string) => attachmentsApi.remove(purchaseId!, attachmentId),
    onSettled: () => (purchaseId ? invalidate(purchaseId) : undefined),
  });
}

export function useDownloadAttachment() {
  return useMutation({ mutationFn: (attachment: PurchaseAttachment) => attachmentsApi.download(attachment) });
}

/**
 * Para el formulario de compra: sube los archivos elegidos antes de guardar, justo después de crear la compra.
 * No hace nada si no hay archivos.
 */
export function useUploadPendingAttachments(): (purchaseId: string, files: File[]) => Promise<void> {
  const invalidate = useInvalidateAttachments();
  return useCallback(
    async (purchaseId: string, files: File[]) => {
      if (files.length === 0) return;
      try {
        await attachmentsApi.upload(purchaseId, files);
      } finally {
        await invalidate(purchaseId);
      }
    },
    [invalidate],
  );
}
