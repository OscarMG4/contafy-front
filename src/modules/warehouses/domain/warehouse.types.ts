export type WarehouseStatus = "active" | "archived";

export interface Warehouse {
  id: string;
  company_id: string;
  code: string;
  name: string;
  type: string;
  type_label: string | null;
  status: WarehouseStatus;
  created_at: string | null;
}

export interface WarehouseFilters {
  search?: string;
  status?: WarehouseStatus;
  page: number;
  perPage: number;
}

export interface WarehouseInput {
  name: string;
  type: string;
}

export interface WarehouseTypeOption {
  value: string;
  label: string;
}

export const WAREHOUSE_STATUS_OPTIONS: { value: WarehouseStatus; label: string; color: string }[] = [
  { value: "active", label: "Activo", color: "success" },
  { value: "archived", label: "Archivado", color: "default" },
];
