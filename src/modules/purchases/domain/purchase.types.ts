export type PurchaseStatus = "draft" | "registered" | "annulled";
export type PaymentStatus = "pending" | "partial" | "paid";
export type PurchaseKind = "merchandise" | "expense" | "additional_cost";
export type AllocationMethod = "by_quantity" | "by_value" | "by_weight" | "manual";
export type PurchasePaymentMethod = "cash" | "transfer" | "check" | "other";

export interface MerchandisePurchaseLine {
  line_kind: "item";
  line_number: number;
  product_id: string;
  warehouse_id: string;
  product_code: string;
  product_description: string;
  quantity: string;
  gross_total: string;
  unit_price?: string | null;
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
  unit_price?: string | null;
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

/** Percepción, retención 4ta y neto a pagar (charges.payable). */
export interface PurchaseCharges {
  perception: string;
  perception_pen: string;
  retention_percent: string | null;
  retention: string;
  retention_pen: string;
  payable: string;
  payable_pen: string;
}

export interface PurchaseInstallment {
  number: number;
  due_date: string;
  amount: string;
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
  prices_include_tax?: boolean;
  purchase_order_id?: string | null;
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
  charges?: PurchaseCharges;
  installments?: PurchaseInstallment[];
  created_at: string | null;
  annulled_at: string | null;
}

export interface PurchaseFilters {
  period?: string;
  supplierId?: string;
  status?: PurchaseStatus | "";
  kind?: PurchaseKind | "";
  paymentStatus?: PaymentStatus | "";
  search?: string;
  page: number;
  perPage: number;
}

export interface MerchandiseLineInput {
  productId: string;
  warehouseId: string;
  quantity: number;
  /** Precio unitario (con o sin IGV según pricesIncludeTax). */
  unitPrice: number;
  operationType: string;
}

export interface ExpenseLineInput {
  accountId: string;
  description: string;
  /** Importe de la línea (cantidad 1). */
  unitPrice: number;
  operationType: string;
  costCenterId?: string | null;
}

export interface InstallmentInput {
  dueDate: string;
  amount: number;
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

/** Campos de captura estilo SiempreSoft (precios, percepción, retención, cuotas, pago al contado). */
export interface PurchaseExtraFields {
  pricesIncludeTax: boolean;
  /** Tasa IGV: 18 (general) o 10 (MYPE restaurantes / hoteles, Ley 31556). */
  igvRate?: number;
  accountingSchemeId?: string | null;
  annexId?: string | null;
  expenseSheetId?: string | null;
  /** Tipo de operación SUNAT (tabla 12). */
  sunatOperationType?: string | null;
  perceptionAmount?: number | null;
  retentionPercent?: number | null;
  installments?: InstallmentInput[];
  treasuryAccountId?: string | null;
  paymentMethod?: PurchasePaymentMethod | null;
  paymentReference?: string | null;
}

export interface PurchaseInput extends PurchaseGapFields, PurchaseExtraFields {
  purchaseOrderId?: string | null;
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

export interface ExpensePurchaseInput extends PurchaseGapFields, PurchaseExtraFields {
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

export interface AdditionalCostPurchaseInput extends PurchaseGapFields, PurchaseExtraFields {
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
  charges: PurchaseCharges;
}

export interface ExpensePurchasePreview {
  lines: ExpensePurchaseLine[];
  totals: PurchaseTotals;
  exchange_rate: string;
  charges: PurchaseCharges;
}

export interface AdditionalCostPurchasePreview {
  lines: ExpensePurchaseLine[];
  totals: PurchaseTotals;
  exchange_rate: string;
  charges: PurchaseCharges;
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
  { value: "partial", label: "Pago parcial", color: "processing" },
  { value: "paid", label: "Pagado", color: "success" },
];

export interface PurchasePayment {
  id: string;
  payment_number?: number | null;
  purchase_id: string;
  paid_at: string;
  amount: string;
  amount_pen: string;
  method: string | null;
  method_label?: string | null;
  treasury_account_label?: string | null;
  reference?: string | null;
  notes: string | null;
  documents_count?: number;
  created_at: string | null;
}

export interface RegisterPurchasePaymentInput {
  paidAt: string;
  amount?: number;
  amountPen?: number | null;
  method?: string | null;
  notes?: string | null;
  markFullyPaid?: boolean;
  treasuryAccountId?: string | null;
  reference?: string | null;
}

export const PURCHASE_KIND_OPTIONS: { value: PurchaseKind; label: string }[] = [
  { value: "merchandise", label: "Mercadería" },
  { value: "expense", label: "Gastos" },
  { value: "additional_cost", label: "Costo adicional" },
];

export const DOCUMENT_TYPE_OPTIONS = [
  { value: "01", label: "Factura" },
  { value: "02", label: "Recibo por honorarios" },
  { value: "03", label: "Boleta de venta" },
  { value: "04", label: "Liquidación de compra" },
  { value: "07", label: "Nota de crédito" },
  { value: "08", label: "Nota de débito" },
  { value: "12", label: "Ticket / cinta" },
  { value: "14", label: "Servicios públicos" },
  { value: "50", label: "DUA (Declaración Única de Aduanas)" },
];

/** Tipos de comprobante permitidos por tipo de compra (validado también en el back). */
export const DOCUMENT_TYPES_BY_KIND: Record<PurchaseKind, string[]> = {
  merchandise: ["01", "03", "04", "07", "08", "12", "50"],
  expense: ["01", "02", "03", "04", "07", "08", "12", "14"],
  additional_cost: ["01", "03", "04", "07", "08", "12"],
};

export function documentTypeOptionsFor(kind: PurchaseKind) {
  const allowed = DOCUMENT_TYPES_BY_KIND[kind];
  return DOCUMENT_TYPE_OPTIONS.filter((o) => allowed.includes(o.value)).map((o) => ({
    value: o.value,
    label: `${o.value} - ${o.label}`,
  }));
}

export function documentTypeLabel(code: string): string {
  return DOCUMENT_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? code;
}

/** Boleta (03) y recibo por honorarios (02) no dan crédito fiscal: todas las líneas van No gravadas. */
export function forcesNonTaxed(documentType: string | undefined): boolean {
  return documentType === "02" || documentType === "03";
}

export const NON_TAXED_OPERATION = "non_taxed";
export const FEE_RECEIPT_DOCUMENT = "02";
/** Umbral (PEN) desde el cual se retiene 4ta categoría (8 %) en recibos por honorarios. */
export const FEE_RETENTION_THRESHOLD_PEN = 1500;
export const FEE_RETENTION_DEFAULT_PERCENT = 8;

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

/** Opciones de «Operación» con los textos de SiempreSoft (el back también acepta "exonerated"). */
export const SIEMPRESOFT_OPERATION_OPTIONS = [
  { value: "taxed_taxed", label: "A.GRAV. DEST. A OPER. GRAV." },
  { value: "taxed_mixed", label: "A.GRAV. DEST. A OPER. GRAV. Y NO GRAV." },
  { value: "taxed_non_taxed", label: "A.GRAV. DEST. A OPER. NO GRAV." },
  { value: "non_taxed", label: "ADQUISICIONES NO GRAVADAS" },
  { value: "other_charges", label: "OTROS CARGOS" },
];

/** «Tipo de Operación» (SUNAT tabla 12) aplicable a compras. */
export const SUNAT_OPERATION_TYPE_OPTIONS = [
  { value: "02", label: "02 - COMPRA" },
  { value: "03", label: "03 - CONSIGNACIÓN RECIBIDA" },
  { value: "05", label: "05 - DEVOLUCIÓN RECIBIDA" },
  { value: "18", label: "18 - IMPORTACIÓN" },
  { value: "99", label: "99 - OTROS" },
];

export const IGV_RATE_OPTIONS = [
  { value: 18, label: "IGV 18%" },
  { value: 10, label: "IGV 10% (MYPE restaurantes / hoteles)" },
];

/** «Condición Pago» como en SiempreSoft: CONTADO o CRED N DIAS. */
export const PAYMENT_CONDITION_DAYS = [7, 15, 30, 45, 60, 90];

export function paymentConditionValue(term?: string, days?: number) {
  return term === "credit" ? `credit:${days ?? 0}` : "cash";
}

export function paymentConditionOptions(currentDays?: number) {
  const days = new Set(PAYMENT_CONDITION_DAYS);
  if (currentDays && currentDays > 0) days.add(currentDays);
  return [
    { value: "cash", label: "CONTADO" },
    ...[...days].sort((a, b) => a - b).map((d) => ({ value: `credit:${d}`, label: `CRED ${d} DIAS` })),
  ];
}
