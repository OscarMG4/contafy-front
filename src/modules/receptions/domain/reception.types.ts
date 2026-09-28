export type GoodsReceptionStatus = "open" | "closed";

export interface GoodsReceptionLine {
  line_number: number;
  product_id: string;
  quantity: string;
  purchase_id: string | null;
  observations: string | null;
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
}

export interface GoodsReceptionInput {
  receptionDate: string;
  warehouseId: string;
  supplierId?: string | null;
  receptionNumber?: string | null;
  observations?: string | null;
  lines: GoodsReceptionLineInput[];
}

export const RECEPTION_STATUS_OPTIONS: { value: GoodsReceptionStatus; label: string; color: string }[] = [
  { value: "open", label: "Abierta", color: "processing" },
  { value: "closed", label: "Cerrada", color: "default" },
];
