/** Campos de una fila del Excel de compras (una fila = un comprobante de gasto). */
export type PurchaseImportField =
  | "issue_date"
  | "document_type"
  | "series"
  | "number"
  | "supplier_document"
  | "supplier_name"
  | "currency"
  | "taxable_base"
  | "igv"
  | "non_taxed"
  | "total"
  | "account_code"
  | "description"
  | "payment_term"
  | "credit_days"
  | "due_date"
  | "accounting_date"
  | "retention_percent";

export type PurchaseImportInputRow = { line: number } & Partial<Record<PurchaseImportField, string>>;

export interface PurchaseImportResultRow {
  line: number;
  status: "ok" | "error";
  messages: string[];
  /** "01 F001-123" */
  document: string | null;
  supplier_document: string | null;
  supplier_name: string | null;
  new_supplier: boolean;
  issue_date: string | null;
  currency: string | null;
  account_code: string | null;
  taxable_base: string | null;
  igv: string | null;
  total: string | null;
  payable: string | null;
  registration_code: number | null;
}

export interface PurchaseImportResult {
  summary: { total: number; ok: number; errors: number; new_suppliers: number; total_pen: string };
  can_import: boolean;
  rows: PurchaseImportResultRow[];
}
