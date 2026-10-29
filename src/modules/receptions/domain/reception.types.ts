export type GoodsReceptionStatus = "open" | "closed";

export interface GoodsReceptionLine {
  line_number: number;
  product_id: string;
  quantity: string;
  purchase_id: string | null;
  observations: string | null;
  /** Línea de la O/C atendida (recepción desde O/C). */
  purchase_order_line_number?: number | null;
  unit_price?: string | null;
}

export interface GoodsReception {
  id: string;
  company_id: string;
  reception_number: string;
  reception_date: string;
  warehouse_id: string;
  supplier_id: string | null;
  status: GoodsReceptionStatus;
  status_label?: string;
  observations: string | null;
  purchase_order_id?: string | null;
  /** N° correlativo de la O/C (se muestra como OC-000001). */
  purchase_order_number?: number | null;
  supplier_business_name?: string | null;
  guide_series?: string | null;
  guide_number?: string | null;
  lines: GoodsReceptionLine[];
  created_at: string | null;
}

export interface GoodsReceptionFilters {
  search?: string;
  status?: GoodsReceptionStatus | "";
  page: number;
  perPage: number;
}

export interface GoodsReceptionLineInput {
  productId: string;
  quantity: number;
  observations?: string | null;
  /** Obligatorio cuando la recepción viene de una O/C. */
  purchaseOrderLineNumber?: number | null;
  unitPrice?: number | null;
}

export interface GoodsReceptionInput {
  receptionDate: string;
  warehouseId: string;
  supplierId?: string | null;
  receptionNumber?: string | null;
  observations?: string | null;
  purchaseOrderId?: string | null;
  guideSeries?: string | null;
  guideNumber?: string | null;
  lines: GoodsReceptionLineInput[];
}

export const RECEPTION_STATUS_OPTIONS: { value: GoodsReceptionStatus; label: string; color: string }[] = [
  { value: "open", label: "Abierta", color: "processing" },
  { value: "closed", label: "Cerrada", color: "default" },
];
