/** Archivo adjunto a una compra (pestaña "Archivos"). */
export interface PurchaseAttachment {
  id: string;
  original_name: string;
  mime_type: string;
  size: number;
  uploaded_by?: string | null;
  created_at: string | null;
  /** Ruta relativa al API: /purchases/{id}/attachments/{attachmentId}/download */
  download_url: string;
}

export const ATTACHMENT_EXTENSIONS = ["pdf", "xml", "zip", "jpg", "jpeg", "png"] as const;
export const ATTACHMENT_ACCEPT = ATTACHMENT_EXTENSIONS.map((ext) => `.${ext}`).join(",");
export const ATTACHMENT_MAX_SIZE_BYTES = 10 * 1024 * 1024;
export const ATTACHMENT_MAX_FILES_PER_UPLOAD = 10;

export function attachmentExtension(fileName: string): string {
  const dot = fileName.lastIndexOf(".");
  return dot >= 0 ? fileName.slice(dot + 1).toLowerCase() : "";
}

/** Mismas reglas que el backend; devuelve el motivo de rechazo o null si el archivo es válido. */
export function validateAttachmentFile(file: { name: string; size: number }): string | null {
  if (!(ATTACHMENT_EXTENSIONS as readonly string[]).includes(attachmentExtension(file.name))) {
    return `«${file.name}»: formato no permitido (solo ${ATTACHMENT_EXTENSIONS.join(", ")}).`;
  }
  if (file.size <= 0) return `«${file.name}» está vacío.`;
  if (file.size > ATTACHMENT_MAX_SIZE_BYTES) return `«${file.name}» supera el máximo de 10 MB.`;
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
