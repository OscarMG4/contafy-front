/** Campos de una fila del Excel de proveedores. */
export type SupplierImportField =
  | "document_type"
  | "document_number"
  | "business_name"
  | "trade_name"
  | "address"
  | "email"
  | "phone"
  | "payment_term"
  | "credit_days";

export type SupplierImportInputRow = { line: number } & Partial<Record<SupplierImportField, string>>;

export type SupplierImportStatus = "new" | "existing" | "update" | "error";

export interface SupplierImportResultRow {
  line: number;
  status: SupplierImportStatus;
  messages: string[];
  document_type: string | null;
  document_number: string | null;
  business_name: string | null;
  payment_term: string | null;
  credit_days: number | null;
  /** Código asignado (PROV-0001). */
  code: string | null;
}

export interface SupplierImportResult {
  summary: { total: number; new: number; update: number; existing: number; errors: number };
  can_import: boolean;
  rows: SupplierImportResultRow[];
}
