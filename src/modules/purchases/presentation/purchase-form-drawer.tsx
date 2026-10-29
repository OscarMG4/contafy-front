"use client";

import type { Purchase } from "../domain/purchase.types";
import { PurchaseDocumentModal } from "./document/purchase-document-modal";

interface PurchaseFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onRegistered?: (purchase: Purchase) => void;
}

/** Compra de mercadería (Comprobante de Compra estilo SiempreSoft). */
export function PurchaseFormDrawer({ open, onClose, onRegistered }: PurchaseFormDrawerProps) {
  return <PurchaseDocumentModal kind="merchandise" open={open} onClose={onClose} onRegistered={onRegistered} />;
}
