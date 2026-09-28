export type PurchaseStatus = "draft" | "registered" | "annulled";
export type PaymentStatus = "pending" | "paid";
export type PurchaseKind = "merchandise" | "expense" | "additional_cost";
export type AllocationMethod = "by_quantity" | "by_value" | "manual";

export interface MerchandisePurchaseLine {
  line_kind: "item";
  line_number: number;
  product_id: string;
  warehouse_id: string;
  product_code: string;
  product_description: string;
  quantity: string;
  gross_total: string;
  operation_type: string;
  operation_type_label?: string;
  taxable_base: string;
  igv_amount: string;
  igv_credit: string;
  igv_non_deductible: string;
  unit_cost: string;
  kardex_value: string;
}

export interface ExpensePurchaseLine {
  line_kind: "account";
  line_number: number;
  account_id: string;
  account_code: string;
  account_name: string;
  description: string;
  gross_total: string;
  operation_type: string;
  taxable_base: string;
  igv_amount: string;
  igv_credit: string;
  igv_non_deductible: string;
  expense_amount: string;
  expense_amount_pen: string;
}

export type PurchaseLine = MerchandisePurchaseLine | ExpensePurchaseLine;

export interface CostAllocation {
  target_purchase_id: string;
  target_line_number: number;
  product_id: string;
  warehouse_id: string;
  allocated_amount_pen: string;
}

export interface PurchaseTotals {
  taxable_operations: string;
  unaffected_operations: string;
  exonerated_operations: string;
  non_taxable_operations: string;
  other_charges: string;
  isc: string;
  discount: string;
  igv_credit: string;
  igv_non_deductible: string;
  total: string;
  detraction: string;
  currency: string;
  taxable_operations_pen: string;
  unaffected_operations_pen: string;
  exonerated_operations_pen: string;
  non_taxable_operations_pen: string;
  other_charges_pen: string;
  isc_pen: string;
  discount_pen: string;
  igv_credit_pen: string;
  igv_non_deductible_pen: string;
  total_pen: string;
  detraction_pen: string;
}

export interface PurchaseDetraction {
  code: string;
  percent: string;
  amount: string;
  amount_pen: string;
}

export interface ModifiedDocument {
  document_type: string;
  series: string;
  number: string;
  issue_date: string;
}

export interface Purchase {
  id: string;
  company_id: string;
  registration_code: number | null;
  kind: PurchaseKind;
  kind_label?: string;
  status: PurchaseStatus;
  payment_status: PaymentStatus;
  payment_status_label?: string;
  document_type: string;
  series: string;
  number: string;
  supplier_id: string;
  supplier_document_type: string;
  supplier_document_number: string;
  supplier_business_name: string;
  issue_date: string;
  accounting_date: string;
  due_date: string;
  reception_date: string | null;
  reception_number: string | null;
  reception_id?: string | null;
  payment_term: string;
  credit_days: number;
  currency: string;
  exchange_rate: string;
  default_warehouse_id: string | null;
  default_operation_type: string;
  accounting_category_code: string | null;
  goods_services_class: string | null;
  observations: string | null;
  beneficiary_name?: string | null;
  beneficiary_document?: string | null;
  detraction: PurchaseDetraction | null;
  modified_document: ModifiedDocument | null;
  allocation_method?: AllocationMethod | null;
  allocation_method_label?: string | null;
  allocations?: CostAllocation[];
  lines: PurchaseLine[];
  totals: PurchaseTotals;
  created_at: string | null;
  annulled_at: string | null;
}

export interface PurchaseFilters {
  period?: string;
  supplierId?: string;
  status?: PurchaseStatus | "";
  kind?: PurchaseKind | "";
  search?: string;
  page: number;
  perPage: number;
}

export interface MerchandiseLineInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  grossTotal: number;
  operationType: string;
}

export interface ExpenseLineInput {
  accountId: string;
  description: string;
  grossTotal: number;
  operationType: string;
}

export interface ManualAllocationInput {
  targetPurchaseId: string;
  targetLineNumber: number;
  amountPen: number;
}

/** Campos opcionales compartidos (ISC, descuento, detracción, doc. modificado). */
export interface PurchaseGapFields {
  receptionNumber?: string | null;
  receptionId?: string | null;
  beneficiaryName?: string | null;
  beneficiaryDocument?: string | null;
  iscAmount?: number | null;
  discountAmount?: number | null;
  detractionCode?: string | null;
  detractionPercent?: number | null;
  modifiedDocumentType?: string | null;
  modifiedSeries?: string | null;
  modifiedNumber?: string | null;
  modifiedIssueDate?: string | null;
}

export interface PurchaseInput extends PurchaseGapFields {
  documentType: string;
  series: string;
  number: string;
  supplierId: string;
  issueDate: string;
  accountingDate: string;
  receptionDate: string;
  paymentTerm: string;
  creditDays: number;
  currency: string;
  defaultWarehouseId?: string | null;
  defaultOperationType: string;
  accountingCategoryCode?: string | null;
  goodsServicesClass?: string | null;
  observations?: string | null;
  lines: MerchandiseLineInput[];
}

export interface ExpensePurchaseInput extends PurchaseGapFields {
  documentType: string;
  series: string;
  number: string;
  supplierId: string;
  issueDate: string;
  accountingDate: string;
  paymentTerm: string;
  creditDays: number;
  currency: string;
  defaultOperationType: string;
  accountingCategoryCode?: string | null;
  goodsServicesClass?: string | null;
  observations?: string | null;
  lines: ExpenseLineInput[];
}

export interface AdditionalCostPurchaseInput extends PurchaseGapFields {
  documentType: string;
  series: string;
  number: string;
  supplierId: string;
  issueDate: string;
  accountingDate: string;
  receptionDate: string;
  paymentTerm: string;
  creditDays: number;
  currency: string;
  defaultOperationType: string;
  accountingCategoryCode?: string | null;
  goodsServicesClass?: string | null;
  observations?: string | null;
  lines: ExpenseLineInput[];
  allocationMethod: AllocationMethod;
  targetPurchaseIds: string[];
  manualAllocations?: ManualAllocationInput[];
}

export interface PurchasePreview {
  lines: MerchandisePurchaseLine[];
  totals: PurchaseTotals;
  exchange_rate: string;
}

export interface ExpensePurchasePreview {
  lines: ExpensePurchaseLine[];
  totals: PurchaseTotals;
  exchange_rate: string;
}

export interface AdditionalCostPurchasePreview {
  lines: ExpensePurchaseLine[];
  totals: PurchaseTotals;
  exchange_rate: string;
  amount_to_allocate_pen: string;
  allocations: CostAllocation[];
}

export interface OperationTypeOption {
  value: string;
  label: string;
}

export interface AllocationMethodOption {
  value: AllocationMethod;
  label: string;
}

export interface CatalogEntry {
  code: string;
  description: string;
  meta?: Record<string, unknown>;
  active?: boolean;
}

export const PURCHASE_STATUS_OPTIONS: { value: PurchaseStatus; label: string; color: string }[] = [
  { value: "registered", label: "Registrado", color: "success" },
  { value: "annulled", label: "Anulado", color: "error" },
  { value: "draft", label: "Borrador", color: "default" },
];

export const PAYMENT_STATUS_OPTIONS: { value: PaymentStatus; label: string; color: string }[] = [
  { value: "pending", label: "Pendiente", color: "warning" },
  { value: "paid", label: "Pagado", color: "success" },
];

export interface PurchasePayment {
  id: string;
  company_id: string;
  purchase_id: string;
  paid_at: string;
  amount: string;
  amount_pen: string;
  method: string | null;
  method_label?: string | null;
  notes: string | null;
  created_at: string | null;
}

export interface RegisterPurchasePaymentInput {
  paidAt: string;
  amount?: number;
  amountPen?: number | null;
  method?: string | null;
  notes?: string | null;
  markFullyPaid?: boolean;
}

export const PURCHASE_KIND_OPTIONS: { value: PurchaseKind; label: string }[] = [
  { value: "merchandise", label: "Mercadería" },
  { value: "expense", label: "Gastos" },
  { value: "additional_cost", label: "Costo adicional" },
];

export const DOCUMENT_TYPE_OPTIONS = [
  { value: "01", label: "Factura" },
  { value: "03", label: "Boleta" },
  { value: "04", label: "Liquidación de compra" },
  { value: "07", label: "Nota de crédito" },
  { value: "08", label: "Nota de débito" },
  { value: "12", label: "Ticket / cinta" },
];

export const CURRENCY_OPTIONS = [
  { value: "PEN", label: "Soles (PEN)" },
  { value: "USD", label: "Dólares (USD)" },
];

export const MODIFIED_DOCUMENT_TYPE_OPTIONS = [
  { value: "01", label: "Factura" },
  { value: "03", label: "Boleta" },
  { value: "12", label: "Ticket / cinta" },
];

export function requiresModifiedDocument(documentType: string): boolean {
  return documentType === "07" || documentType === "08";
}
