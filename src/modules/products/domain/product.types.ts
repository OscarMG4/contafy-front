export type ProductStatus = "active" | "archived";

export interface Product {
  id: string;
  company_id: string;
  code: string;
  description: string;
  unit_of_measure: string;
  existence_type: string;
  default_operation_type: string;
  default_operation_type_label: string | null;
  status: ProductStatus;
  created_at: string | null;
}

export interface ProductFilters {
  search?: string;
  status?: ProductStatus;
  page: number;
  perPage: number;
}

export interface ProductInput {
  description: string;
  unitOfMeasure: string;
  existenceType: string;
  defaultOperationType: string;
}

export interface OperationTypeOption {
  value: string;
  label: string;
}

export interface CatalogEntry {
  code: string;
  description: string;
  meta?: Record<string, unknown>;
  active?: boolean;
}

export const PRODUCT_STATUS_OPTIONS: { value: ProductStatus; label: string; color: string }[] = [
  { value: "active", label: "Activo", color: "success" },
  { value: "archived", label: "Archivado", color: "default" },
];
