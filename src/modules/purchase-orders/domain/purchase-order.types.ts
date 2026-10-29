export type PurchaseOrderStatus = "open" | "partial" | "received" | "cancelled";

export interface PurchaseOrderLine {
  line_number: number;
  product_id: string;
  product_code: string;
  product_description: string;
  unit_of_measure: string | null;
  quantity: string;
  unit_price: string;
  line_total: string;
  received_quantity: string;
  pending_quantity: string;
}

export interface PurchaseOrder {
  id: string;
  order_number: number;
  issue_date: string;
  expected_date: string | null;
  supplier_id: string;
  supplier_business_name: string;
  warehouse_id: string;
  payment_term: "cash" | "credit";
  credit_days: number;
  currency: string;
  prices_include_tax: boolean;
  reference: string | null;
  observations: string | null;
  status: PurchaseOrderStatus;
  status_label: string;
  totals: { taxable_base: string; igv: string; total: string };
  lines: PurchaseOrderLine[];
  created_at: string | null;
}

export interface PurchaseOrderFilters {
  supplierId?: string;
  /** Uno o varios estados separados por coma, ej. "open,partial". */
  status?: string;
  search?: string;
  page: number;
  perPage: number;
}

export interface PurchaseOrderInput {
  issueDate: string;
  expectedDate?: string | null;
  supplierId: string;
  warehouseId: string;
  paymentTerm: "cash" | "credit";
  creditDays?: number;
  currency: string;
  pricesIncludeTax: boolean;
  reference?: string | null;
  observations?: string | null;
  lines: { productId: string; quantity: number; unitPrice: number }[];
}

export const PURCHASE_ORDER_STATUS_OPTIONS: { value: PurchaseOrderStatus; label: string; color: string }[] = [
  { value: "open", label: "Pendiente", color: "processing" },
  { value: "partial", label: "Atendida parcial", color: "warning" },
  { value: "received", label: "Atendida", color: "success" },
  { value: "cancelled", label: "Anulada", color: "default" },
];
