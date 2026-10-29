"use client";

import type { Purchase } from "../domain/purchase.types";
import { PurchaseDocumentModal } from "./document/purchase-document-modal";

interface ExpensePurchaseFormDrawerProps {
  open: boolean;
  onClose: () => void;
  onRegistered?: (purchase: Purchase) => void;
}

/** Compra de gastos, incluido recibo por honorarios (02) con retención de 4ta. */
export function ExpensePurchaseFormDrawer({ open, onClose, onRegistered }: ExpensePurchaseFormDrawerProps) {
  return <PurchaseDocumentModal kind="expense" open={open} onClose={onClose} onRegistered={onRegistered} />;
}
