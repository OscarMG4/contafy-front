import type { FormInstance } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { ApiError } from "@/core/http/api-error";

import type {
  AdditionalCostPurchaseInput,
  AllocationMethod,
  ExpensePurchaseInput,
  PurchaseExtraFields,
  PurchaseGapFields,
  PurchaseInput,
  PurchaseKind,
  PurchasePaymentMethod,
  PurchaseTotals,
} from "../../domain/purchase.types";
import { forcesNonTaxed, NON_TAXED_OPERATION } from "../../domain/purchase.types";
import type { PreviewGap } from "../../infrastructure/purchases.api";

/** Fila de la grilla de detalle. Los campos de mercadería y de cuenta conviven; se usan según el tipo. */
export interface DocumentLineValues {
  productId?: string;
  productCode?: string;
  productDescription?: string;
  unitOfMeasure?: string;
  warehouseId?: string;
  quantity?: number;
  accountId?: string;
  accountCode?: string;
  accountName?: string;
  description?: string;
  /** Mercadería: precio unitario. Gasto / costo adicional: importe de la línea. */
  unitPrice?: number;
  operationType?: string;
  /** Línea de la O/C de la que viene (solo informativo). */
  purchaseOrderLineNumber?: number;
}

export interface InstallmentValues {
  dueDate?: Dayjs;
  amount?: number;
}

export interface DocumentFormValues {
  documentType: string;
  series: string;
  number: string;
  supplierId: string;
  beneficiaryDocument?: string;
  beneficiaryName?: string;
  issueDate: Dayjs;
  accountingDate: Dayjs;
  receptionDate?: Dayjs;
  paymentTerm: string;
  creditDays: number;
  currency: string;
  defaultWarehouseId?: string;
  defaultOperationType: string;
  accountingCategoryCode?: string;
  goodsServicesClass?: string;
  pricesIncludeTax: boolean;
  observations?: string;
  receptionId?: string;
  receptionNumber?: string;
  purchaseOrderId?: string;
  iscAmount?: number;
  discountAmount?: number;
  detractionCode?: string;
  detractionPercent?: number;
  modifiedDocumentType?: string;
  modifiedSeries?: string;
  modifiedNumber?: string;
  modifiedIssueDate?: string;
  perceptionAmount?: number;
  retentionPercent?: number;
  treasuryAccountId?: string;
  paymentMethod?: PurchasePaymentMethod;
  paymentReference?: string;
  installments?: InstallmentValues[];
  allocationMethod?: AllocationMethod;
  targetPurchaseIds?: string[];
  /** Reparto manual: clave `${purchaseId}:${lineNumber}` → monto PEN. */
  manualAllocations?: Record<string, number | null | undefined>;
  lines: DocumentLineValues[];
}

export type DocumentTabKey = "general" | "reception" | "payment" | "perception";

export const usesItemLines = (kind: PurchaseKind) => kind === "merchandise";

export function isBlankLine(line: DocumentLineValues | undefined, kind: PurchaseKind): boolean {
  if (!line) return true;
  if (usesItemLines(kind)) return !line.productId && !line.unitPrice;
  return !line.accountId && !line.unitPrice && !line.description?.trim();
}

/** Índice en el formulario de cada línea enviada (las filas en blanco no se envían). */
export function lineIndexMap(values: Pick<DocumentFormValues, "lines">, kind: PurchaseKind): number[] {
  const map: number[] = [];
  (values.lines ?? []).forEach((line, i) => {
    if (!isBlankLine(line, kind)) map.push(i);
  });
  return map;
}

export function filledLines(values: Pick<DocumentFormValues, "lines">, kind: PurchaseKind) {
  return (values.lines ?? []).filter((line) => !isBlankLine(line, kind));
}

/** Devuelve el número (1-based) de la primera fila incompleta, o null si todas están completas. */
export function firstIncompleteLine(values: Pick<DocumentFormValues, "lines">, kind: PurchaseKind): number | null {
  const lines = values.lines ?? [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (isBlankLine(line, kind)) continue;
    const ok = usesItemLines(kind)
      ? Boolean(line.productId && line.quantity && line.unitPrice)
      : Boolean(line.accountId && line.description?.trim() && line.unitPrice);
    if (!ok) return i + 1;
  }
  return null;
}

export const round2 = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

export function lineAmount(line: DocumentLineValues | undefined, kind: PurchaseKind): number {
  if (!line) return 0;
  if (usesItemLines(kind)) return round2((line.quantity ?? 0) * (line.unitPrice ?? 0));
  return round2(line.unitPrice ?? 0);
}

const ymd = (d?: Dayjs | null) => (d ? d.format("YYYY-MM-DD") : "");

function lineOperation(line: DocumentLineValues, values: DocumentFormValues) {
  if (forcesNonTaxed(values.documentType)) return NON_TAXED_OPERATION;
  return line.operationType || values.defaultOperationType;
}

function gapFields(values: DocumentFormValues): PurchaseGapFields {
  return {
    receptionNumber: values.receptionNumber || null,
    receptionId: values.receptionId || null,
    beneficiaryName: values.beneficiaryName || null,
    beneficiaryDocument: values.beneficiaryDocument || null,
    iscAmount: values.iscAmount ?? 0,
    discountAmount: values.discountAmount ?? 0,
    detractionCode: values.detractionCode || null,
    detractionPercent: values.detractionPercent ?? null,
    modifiedDocumentType: values.modifiedDocumentType || null,
    modifiedSeries: values.modifiedSeries || null,
    modifiedNumber: values.modifiedNumber || null,
    modifiedIssueDate: values.modifiedIssueDate || null,
  };
}

function extraFields(values: DocumentFormValues, kind: PurchaseKind): PurchaseExtraFields {
  const isFee = values.documentType === "02";
  return {
    pricesIncludeTax: values.pricesIncludeTax ?? true,
    perceptionAmount: isFee ? null : values.perceptionAmount || null,
    retentionPercent: kind === "expense" && isFee ? (values.retentionPercent ?? 0) : null,
    installments: (values.installments ?? [])
      .filter((row) => row?.dueDate && row.amount)
      .map((row) => ({ dueDate: ymd(row.dueDate), amount: row.amount ?? 0 })),
    treasuryAccountId: values.treasuryAccountId || null,
    paymentMethod: values.paymentMethod || null,
    paymentReference: values.paymentReference?.trim() || null,
  };
}

function previewGap(values: DocumentFormValues, kind: PurchaseKind): PreviewGap {
  const extras = extraFields(values, kind);
  return {
    documentType: values.documentType,
    iscAmount: values.iscAmount ?? 0,
    discountAmount: values.discountAmount ?? 0,
    detractionCode: values.detractionCode || null,
    detractionPercent: values.detractionPercent ?? null,
    pricesIncludeTax: extras.pricesIncludeTax,
    perceptionAmount: extras.perceptionAmount,
    retentionPercent: extras.retentionPercent,
  };
}

function itemLines(values: DocumentFormValues) {
  return filledLines(values, "merchandise").map((line) => ({
    productId: line.productId!,
    warehouseId: line.warehouseId || values.defaultWarehouseId || "",
    quantity: line.quantity ?? 0,
    unitPrice: line.unitPrice ?? 0,
    operationType: lineOperation(line, values),
  }));
}

function accountLines(values: DocumentFormValues, kind: PurchaseKind) {
  return filledLines(values, kind).map((line) => ({
    accountId: line.accountId!,
    description: (line.description ?? "").trim(),
    unitPrice: line.unitPrice ?? 0,
    operationType: lineOperation(line, values),
  }));
}

export function manualAllocationsFrom(values: Pick<DocumentFormValues, "manualAllocations" | "targetPurchaseIds">) {
  const targets = new Set(values.targetPurchaseIds ?? []);
  return Object.entries(values.manualAllocations ?? {})
    .filter(([, amount]) => Number(amount) > 0)
    .map(([key, amount]) => {
      const [targetPurchaseId, line] = key.split(":");
      return { targetPurchaseId, targetLineNumber: Number(line), amountPen: Number(amount) };
    })
    .filter((row) => targets.has(row.targetPurchaseId));
}

function header(values: DocumentFormValues) {
  return {
    documentType: values.documentType,
    series: (values.series ?? "").trim().toUpperCase(),
    number: (values.number ?? "").trim(),
    supplierId: values.supplierId,
    issueDate: ymd(values.issueDate),
    accountingDate: ymd(values.accountingDate),
    paymentTerm: values.paymentTerm,
    creditDays: values.paymentTerm === "cash" ? 0 : (values.creditDays ?? 0),
    currency: values.currency,
    defaultOperationType: forcesNonTaxed(values.documentType) ? NON_TAXED_OPERATION : values.defaultOperationType,
    accountingCategoryCode: values.accountingCategoryCode || null,
    goodsServicesClass: values.goodsServicesClass || null,
    observations: values.observations?.trim() || null,
  };
}

export function toMerchandiseInput(values: DocumentFormValues): PurchaseInput {
  return {
    ...header(values),
    ...gapFields(values),
    ...extraFields(values, "merchandise"),
    receptionDate: ymd(values.receptionDate ?? values.issueDate),
    defaultWarehouseId: values.defaultWarehouseId || null,
    purchaseOrderId: values.purchaseOrderId || null,
    lines: itemLines(values),
  };
}

export function toExpenseInput(values: DocumentFormValues): ExpensePurchaseInput {
  return {
    ...header(values),
    ...gapFields(values),
    receptionNumber: null,
    receptionId: null,
    ...extraFields(values, "expense"),
    lines: accountLines(values, "expense"),
  };
}

export function toAdditionalCostInput(values: DocumentFormValues): AdditionalCostPurchaseInput {
  const method = values.allocationMethod ?? "by_quantity";
  return {
    ...header(values),
    ...gapFields(values),
    receptionId: null,
    ...extraFields(values, "additional_cost"),
    receptionDate: ymd(values.receptionDate ?? values.issueDate),
    lines: accountLines(values, "additional_cost"),
    allocationMethod: method,
    targetPurchaseIds: values.targetPurchaseIds ?? [],
    manualAllocations: method === "manual" ? manualAllocationsFrom(values) : [],
  };
}

/** Entradas del preview (sin cabecera de registro). `null` si aún no hay nada que calcular. */
export function toPreviewInput(values: DocumentFormValues, kind: PurchaseKind, manualMatches: boolean) {
  if (!values.currency || !values.issueDate) return null;
  const base = { currency: values.currency, issueDate: ymd(values.issueDate), ...previewGap(values, kind) };

  if (kind === "merchandise") {
    const lines = itemLines(values).filter((l) => l.productId && l.warehouseId && l.quantity > 0 && l.unitPrice > 0);
    return lines.length ? { kind, input: { ...base, lines } } : null;
  }

  const lines = accountLines(values, kind).filter((l) => l.accountId && l.description && l.unitPrice > 0);
  if (!lines.length) return null;
  if (kind === "expense") return { kind, input: { ...base, lines } };

  const targetPurchaseIds = values.targetPurchaseIds ?? [];
  if (!targetPurchaseIds.length) return null;
  const method = values.allocationMethod ?? "by_quantity";
  // El reparto manual solo se puede previsualizar cuando cuadra; mientras tanto se calcula por cantidad
  // para obtener los totales y el monto a repartir.
  const useManual = method === "manual" && manualMatches;
  return {
    kind,
    input: {
      ...base,
      lines,
      targetPurchaseIds,
      allocationMethod: (method === "manual" && !useManual ? "by_quantity" : method) as AllocationMethod,
      manualAllocations: useManual ? manualAllocationsFrom(values) : [],
    },
  };
}

/** Totales al estilo SiempreSoft a partir de los totales del back. */
export function siempreSoftTotals(totals: PurchaseTotals) {
  const n = (v: string) => Number(v || 0);
  const igv = n(totals.igv_credit) + n(totals.igv_non_deductible);
  const total = n(totals.total);
  const isc = n(totals.isc);
  const discount = n(totals.discount);
  const valorCompra = n(totals.taxable_operations) + n(totals.unaffected_operations) + n(totals.exonerated_operations) + n(totals.other_charges);
  return {
    importeAfecto: round2(n(totals.taxable_operations) + igv),
    descuento: discount,
    isc,
    importeBruto: round2(valorCompra + igv),
    valorCompra: round2(valorCompra),
    igv: round2(igv),
    precioCompra: total,
  };
}

export function formatAmount(value: number | string | null | undefined, decimals = 2): string {
  const n = Number(value ?? 0);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("es-PE", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

export function currencySymbol(currency: string | undefined): string {
  if (!currency || currency === "PEN") return "S/";
  if (currency === "USD") return "US$";
  return currency;
}

export function formatCurrency(value: number | string | null | undefined, currency = "PEN"): string {
  return `${currencySymbol(currency)} ${formatAmount(value)}`;
}

/** Fecha de vencimiento: última cuota o fecha doc. + días de crédito. */
export function computeDueDate(values: Pick<DocumentFormValues, "issueDate" | "paymentTerm" | "creditDays" | "installments">) {
  if (!values.issueDate) return null;
  if (values.paymentTerm === "cash") return values.issueDate;
  const dates = (values.installments ?? []).map((i) => i?.dueDate).filter((d): d is Dayjs => Boolean(d));
  if (dates.length) return dates.reduce((max, d) => (d.isAfter(max) ? d : max));
  return dayjs(values.issueDate).add(values.creditDays ?? 0, "day");
}

// ---------------------------------------------------------------------------------------------
// Errores 422 del back → campos del formulario (incluye rutas anidadas lines.N.campo).

const FIELD_MAP: Record<string, string> = {
  document_type: "documentType",
  series: "series",
  number: "number",
  supplier_id: "supplierId",
  issue_date: "issueDate",
  accounting_date: "accountingDate",
  reception_date: "receptionDate",
  reception_number: "receptionNumber",
  reception_id: "receptionId",
  beneficiary_name: "beneficiaryName",
  beneficiary_document: "beneficiaryDocument",
  payment_term: "paymentTerm",
  credit_days: "creditDays",
  currency: "currency",
  default_warehouse_id: "defaultWarehouseId",
  default_operation_type: "defaultOperationType",
  accounting_category_code: "accountingCategoryCode",
  goods_services_class: "goodsServicesClass",
  observations: "observations",
  isc_amount: "iscAmount",
  discount_amount: "discountAmount",
  detraction_code: "detractionCode",
  detraction_percent: "detractionPercent",
  modified_document_type: "modifiedDocumentType",
  modified_series: "modifiedSeries",
  modified_number: "modifiedNumber",
  modified_issue_date: "modifiedIssueDate",
  prices_include_tax: "pricesIncludeTax",
  perception_amount: "perceptionAmount",
  retention_percent: "retentionPercent",
  installments: "installments",
  treasury_account_id: "treasuryAccountId",
  payment_method: "paymentMethod",
  payment_reference: "paymentReference",
  purchase_order_id: "purchaseOrderId",
  allocation_method: "allocationMethod",
  target_purchase_ids: "targetPurchaseIds",
  manual_allocations: "allocationMethod",
  lines: "lines",
};

const LINE_FIELD_MAP: Record<string, string> = {
  product_id: "productCode",
  account_id: "accountCode",
  warehouse_id: "warehouseId",
  quantity: "quantity",
  unit_price: "unitPrice",
  gross_total: "unitPrice",
  description: "description",
  operation_type: "operationType",
};

const INSTALLMENT_FIELD_MAP: Record<string, string> = { due_date: "dueDate", amount: "amount" };

/** Pestaña en la que vive cada campo (para saltar a ella cuando hay error). */
const FIELD_TAB: Record<string, DocumentTabKey | "options"> = {
  receptionDate: "reception",
  receptionNumber: "reception",
  receptionId: "reception",
  purchaseOrderId: "reception",
  allocationMethod: "reception",
  targetPurchaseIds: "reception",
  installments: "payment",
  treasuryAccountId: "payment",
  paymentMethod: "payment",
  paymentReference: "payment",
  perceptionAmount: "perception",
  retentionPercent: "perception",
  iscAmount: "options",
  discountAmount: "options",
  detractionCode: "options",
  detractionPercent: "options",
  goodsServicesClass: "options",
};

export function tabOfField(name: string | number | (string | number)[]): DocumentTabKey | "options" {
  const first = Array.isArray(name) ? String(name[0]) : String(name);
  return FIELD_TAB[first] ?? "general";
}

/**
 * Pinta los errores del back en los campos. Devuelve los mensajes que no se pudieron ubicar
 * y la pestaña del primer campo con error.
 */
export function applyPurchaseFieldErrors(form: FormInstance, error: unknown, lineIndexMap: number[] = []) {
  if (!(error instanceof ApiError)) return { unmapped: [] as string[], tab: null as DocumentTabKey | "options" | null };
  const unmapped: string[] = [];
  const fields: { name: (string | number)[]; errors: string[] }[] = [];

  for (const [key, errors] of Object.entries(error.fieldErrors)) {
    const parts = key.split(".");
    const root = FIELD_MAP[parts[0]];
    if (!root) {
      unmapped.push(...errors);
      continue;
    }
    if (parts.length === 3 && /^\d+$/.test(parts[1])) {
      const sub = parts[0] === "lines" ? LINE_FIELD_MAP[parts[2]] : parts[0] === "installments" ? INSTALLMENT_FIELD_MAP[parts[2]] : undefined;
      if (sub) {
        const index = Number(parts[1]);
        const formIndex = root === "lines" ? (lineIndexMap[index] ?? index) : index;
        fields.push({ name: [root, formIndex, sub], errors });
        continue;
      }
    }
    if (root === "lines" || root === "installments") {
      unmapped.push(...errors);
      continue;
    }
    fields.push({ name: [root], errors });
  }

  form.setFields(fields);
  const tab = fields.length ? tabOfField(fields[0].name) : null;
  return { unmapped, tab };
}
