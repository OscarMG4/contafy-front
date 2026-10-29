import { apiClient, type ApiResponse } from "@/core/http/api-client";

import { ATTACHMENT_MAX_FILES_PER_UPLOAD, type PurchaseAttachment } from "../domain/attachment.types";

const base = (purchaseId: string) => `/purchases/${purchaseId}/attachments`;

export const attachmentsApi = {
  async list(purchaseId: string): Promise<PurchaseAttachment[]> {
    const { data } = await apiClient.get<ApiResponse<PurchaseAttachment[]>>(base(purchaseId));
    return data.data;
  },

  /** Sube en lotes de 10 (límite del backend por petición). */
  async upload(purchaseId: string, files: File[]): Promise<PurchaseAttachment[]> {
    const created: PurchaseAttachment[] = [];
    for (let i = 0; i < files.length; i += ATTACHMENT_MAX_FILES_PER_UPLOAD) {
      const form = new FormData();
      files.slice(i, i + ATTACHMENT_MAX_FILES_PER_UPLOAD).forEach((file) => form.append("files[]", file, file.name));
      // Sin Content-Type explícito: axios pone multipart con boundary y el interceptor mantiene auth/tenant/empresa.
      const { data } = await apiClient.post<ApiResponse<PurchaseAttachment[]>>(base(purchaseId), form);
      created.push(...data.data);
    }
    return created;
  },

  async remove(purchaseId: string, attachmentId: string): Promise<void> {
    await apiClient.delete(`${base(purchaseId)}/${attachmentId}`);
  },

  /** Descarga como blob (para enviar los headers de auth) y la dispara con un enlace temporal. */
  async download(attachment: PurchaseAttachment): Promise<void> {
    const { data } = await apiClient.get<Blob>(attachment.download_url, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.original_name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  },
};
