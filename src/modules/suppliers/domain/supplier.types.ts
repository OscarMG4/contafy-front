export type SupplierStatus = "active" | "archived";

export interface Supplier {
  id: string;
  company_id: string;
  code: string;
  document_type: string;
  document_number: string;
  business_name: string;
  trade_name: string | null;
  address: string | null;
  email: string | null;
  phone: string | null;
  payment_term: string;
  payment_term_label: string;
  credit_days: number;
  status: SupplierStatus;
  created_at: string | null;
}

export interface SupplierFilters {
  search?: string;
  status?: SupplierStatus;
  page: number;
  perPage: number;
}

export interface SupplierInput {
  documentType: string;
  documentNumber: string;
  businessName: string;
  tradeName?: string;
  address?: string;
  email?: string;
  phone?: string;
  paymentTerm: string;
  creditDays: number;
}

export interface PaymentTermOption {
  value: string;
  label: string;
}

export interface IdentityDocumentTypeOption {
  code: string;
  description: string;
}

export const SUPPLIER_STATUS_OPTIONS: { value: SupplierStatus; label: string; color: string }[] = [
  { value: "active", label: "Activo", color: "success" },
  { value: "archived", label: "Archivado", color: "default" },
];
