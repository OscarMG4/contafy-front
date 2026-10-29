export type TreasuryAccountType = "cash" | "bank";
export type PaymentMethod = "cash" | "transfer" | "check" | "other";
export type SupplierPaymentStatus = "registered" | "annulled";

export interface TreasuryAccount {
  id: string;
  code: string;
  name: string;
  type: TreasuryAccountType;
  type_label: string;
  currency: string;
  account_code: string;
  bank_name: string | null;
  account_number: string | null;
  active: boolean;
  /** "01 - CAJA 01 - EFECTIVO (PEN)" */
  label: string;
}

export interface TreasuryAccountTypeOption {
  value: TreasuryAccountType;
  label: string;
  default_account_code: string;
}

export interface TreasuryAccountInput {
  name: string;
  type: TreasuryAccountType;
  currency: string;
  accountCode?: string | null;
  bankName?: string | null;
  accountNumber?: string | null;
  active?: boolean;
}

export interface PayableInstallment {
  number: number;
  due_date: string;
  amount: string;
}

/** Documento por pagar con saldo ("Buscar Pendientes"). */
export interface PayableDocument {
  purchase_id: string;
  registration_code: number | null;
  supplier_id: string;
  supplier_document_number: string;
  supplier_business_name: string;
  document_type: string;
  series: string;
  number: string;
  document_label: string;
  issue_date: string;
  due_date: string;
  currency: string;
  exchange_rate: string;
  payment_term: string;
  payable: string;
  paid: string;
  pending: string;
  installments: PayableInstallment[];
}

export type AgingBucket = "current" | "d1_15" | "d16_30" | "d31_90" | "d90_plus";

export interface AgingSupplierRow extends Record<AgingBucket, string> {
  supplier_id: string;
  supplier_document_number: string;
  supplier_business_name: string;
  currency: string;
  total: string;
}

export interface AgingDocumentRow extends PayableDocument {
  installment_number: number;
  installments_count: number;
  installment_due_date: string;
  installment_pending: string;
  days_overdue: number;
  bucket: AgingBucket;
}

export interface PayablesAging {
  as_of: string;
  buckets: { key: AgingBucket; label: string }[];
  suppliers: AgingSupplierRow[];
  documents: AgingDocumentRow[];
}

export interface StatementMovement {
  date: string;
  type: "purchase" | "credit_note" | "payment";
  reference: string;
  description: string;
  /** Abono (pago). */
  debit: string;
  /** Cargo (deuda). */
  credit: string;
  balance: string;
  source_id: string;
}

export interface SupplierStatement {
  supplier_id: string;
  currency: string;
  from: string | null;
  to: string | null;
  opening_balance: string;
  closing_balance: string;
  movements: StatementMovement[];
}

export interface SupplierPaymentApplication {
  line_number: number;
  purchase_id: string;
  document_label: string;
  amount: string;
  amount_pen: string;
}

export interface SupplierPayment {
  id: string;
  payment_number: number;
  supplier_id: string;
  supplier_business_name: string;
  treasury_account_id: string | null;
  treasury_account_label: string | null;
  method: PaymentMethod | null;
  method_label: string | null;
  currency: string;
  exchange_rate: string;
  paid_at: string;
  reference: string | null;
  observations: string | null;
  total_amount: string;
  total_amount_pen: string;
  status: SupplierPaymentStatus;
  status_label: string;
  annulled_at: string | null;
  created_at: string | null;
  applications: SupplierPaymentApplication[];
}

export interface SupplierPaymentFilters {
  supplierId?: string;
  from?: string;
  to?: string;
  status?: SupplierPaymentStatus | "";
  page: number;
  perPage: number;
}

export interface SupplierPaymentInput {
  supplierId: string;
  treasuryAccountId: string;
  method: PaymentMethod;
  currency: string;
  paidAt: string;
  reference?: string | null;
  observations?: string | null;
  applications: { purchaseId: string; amount: number }[];
}

export const PAYMENT_METHOD_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "check", label: "Cheque" },
  { value: "other", label: "Otro" },
];

export const AGING_BUCKET_LABELS: Record<AgingBucket, string> = {
  current: "Por vencer",
  d1_15: "Vencido 1–15 días",
  d16_30: "Vencido 16–30 días",
  d31_90: "Vencido 31–90 días",
  d90_plus: "Más de 90 días",
};
