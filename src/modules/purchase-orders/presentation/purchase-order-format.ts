import type { PurchaseOrder } from "../domain/purchase-order.types";

/** "OC-000012" */
export function formatOrderNumber(orderNumber: number | string): string {
  return `OC-${String(orderNumber).padStart(6, "0")}`;
}

/** % atendido = Σ recibido / Σ pedido. */
export function orderProgress(order: Pick<PurchaseOrder, "lines">): number {
  const ordered = order.lines.reduce((acc, l) => acc + Number(l.quantity), 0);
  const received = order.lines.reduce((acc, l) => acc + Number(l.received_quantity), 0);
  if (ordered <= 0) return 0;
  return Math.min(100, Math.round((received / ordered) * 100));
}

export function hasReceptions(order: Pick<PurchaseOrder, "lines">): boolean {
  return order.lines.some((l) => Number(l.received_quantity) > 0);
}
