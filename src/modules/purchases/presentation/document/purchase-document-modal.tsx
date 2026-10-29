"use client";

import { Modal } from "antd";

import type { Purchase, PurchaseKind } from "../../domain/purchase.types";
import { PurchaseDocumentForm } from "./purchase-document-form";

export const DOCUMENT_TITLES: Record<PurchaseKind, string> = {
  merchandise: "Comprobante de Compra · Mercadería",
  expense: "Comprobante de Compra · Gastos",
  additional_cost: "Comprobante de Compra · Costo adicional",
};

interface PurchaseDocumentModalProps {
  kind: PurchaseKind;
  open: boolean;
  onClose: () => void;
  onRegistered?: (purchase: Purchase) => void;
}

/**
 * Ventana del comprobante (como el diálogo de SiempreSoft). Esc lo maneja el formulario
 * (pide confirmación si hay cambios), por eso el Modal no cierra con teclado ni clic fuera.
 */
export function PurchaseDocumentModal({ kind, open, onClose, onRegistered }: PurchaseDocumentModalProps) {
  return (
    <Modal
      open={open}
      title={DOCUMENT_TITLES[kind]}
      width="min(1280px, 97vw)"
      style={{ top: 12 }}
      styles={{ body: { paddingTop: 0 } }}
      footer={null}
      keyboard={false}
      mask={{ closable: false }}
      closable={false}
      destroyOnHidden
      onCancel={onClose}
    >
      {open && (
        <PurchaseDocumentForm
          kind={kind}
          active={open}
          onCancel={onClose}
          onDone={(purchase) => {
            onRegistered?.(purchase);
            onClose();
          }}
        />
      )}
    </Modal>
  );
}
