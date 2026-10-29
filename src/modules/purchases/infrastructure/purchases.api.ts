import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type {
  AdditionalCostPurchaseInput,
  AdditionalCostPurchasePreview,
  AllocationMethodOption,
  CatalogEntry,
  ExpensePurchaseInput,
  ExpensePurchasePreview,
  OperationTypeOption,
  Purchase,
  PurchaseFilters,
  PurchaseGapFields,
  PurchaseInput,
  PurchasePreview,
  PurchaseExtraFields,
  PurchasePayment,
  RegisterPurchasePaymentInput,
} from "../domain/purchase.types";

function toMerchandiseLinePayload(line: PurchaseInput["lines"][number]) {
  return {
    product_id: line.productId,
    warehouse_id: line.warehouseId,
    quantity: line.quantity,
    unit_price: line.unitPrice,
    operation_type: line.operationType,
  };
}

function toExpenseLinePayload(line: ExpensePurchaseInput["lines"][number]) {
  return {
    account_id: line.accountId,
    description: line.description,
    unit_price: line.unitPrice,
    operation_type: line.operationType,
    cost_center_id: line.costCenterId || null,
  };
}

function toGapPayload(input: PurchaseGapFields) {
  return {
    reception_number: input.receptionNumber || null,
    reception_id: input.receptionId || null,
    beneficiary_name: input.beneficiaryName || null,
    beneficiary_document: input.beneficiaryDocument || null,
    isc_amount: input.iscAmount ?? 0,
    discount_amount: input.discountAmount ?? 0,
    detraction_code: input.detractionCode || null,
    detraction_percent: input.detractionPercent ?? null,
    modified_document_type: input.modifiedDocumentType || null,
    modified_series: input.modifiedSeries || null,
    modified_number: input.modifiedNumber || null,
    modified_issue_date: input.modifiedIssueDate || null,
  };
}

/** Precios, percepción y retención: afectan al cálculo (register y preview). */
function toPricingPayload(
  input: Pick<PurchaseExtraFields, "pricesIncludeTax" | "perceptionAmount" | "retentionPercent" | "igvRate">,
) {
  return {
    prices_include_tax: input.pricesIncludeTax,
    igv_rate: input.igvRate ?? 18,
    perception_amount: input.perceptionAmount ?? null,
    retention_percent: input.retentionPercent ?? null,
  };
}

/** Esquema contable, anexo, planilla de gasto y tipo de operación SUNAT. */
function toClassificationPayload(input: PurchaseExtraFields) {
  return {
    accounting_scheme_id: input.accountingSchemeId || null,
    annex_id: input.annexId || null,
    expense_sheet_id: input.expenseSheetId || null,
    sunat_operation_type: input.sunatOperationType || null,
  };
}

/** Cuotas (crédito) y pago automático desde caja / cta. cte. (contado). */
function toSettlementPayload(input: PurchaseExtraFields & { paymentTerm: string }) {
  const isCash = input.paymentTerm === "cash";
  return {
    installments: isCash
      ? []
      : (input.installments ?? []).map((row) => ({ due_date: row.dueDate, amount: row.amount })),
    treasury_account_id: isCash ? input.treasuryAccountId || null : null,
    payment_method: isCash && input.treasuryAccountId ? input.paymentMethod || null : null,
    payment_reference: isCash && input.treasuryAccountId ? input.paymentReference || null : null,
  };
}

function toMerchandisePayload(input: PurchaseInput) {
  return {
    document_type: input.documentType,
    series: input.series,
    number: input.number,
    supplier_id: input.supplierId,
    issue_date: input.issueDate,
    accounting_date: input.accountingDate,
    reception_date: input.receptionDate,
    payment_term: input.paymentTerm,
    credit_days: input.creditDays,
    currency: input.currency,
    default_warehouse_id: input.defaultWarehouseId || null,
    default_operation_type: input.defaultOperationType,
    accounting_category_code: input.accountingCategoryCode || null,
    goods_services_class: input.goodsServicesClass || null,
    observations: input.observations || null,
    purchase_order_id: input.purchaseOrderId || null,
    lines: input.lines.map(toMerchandiseLinePayload),
    ...toGapPayload(input),
    ...toPricingPayload(input),
    ...toSettlementPayload(input),
    ...toClassificationPayload(input),
  };
}

function toExpensePayload(input: ExpensePurchaseInput) {
  return {
    document_type: input.documentType,
    series: input.series,
    number: input.number,
    supplier_id: input.supplierId,
    issue_date: input.issueDate,
    accounting_date: input.accountingDate,
    payment_term: input.paymentTerm,
    credit_days: input.creditDays,
    currency: input.currency,
    default_operation_type: input.defaultOperationType,
    accounting_category_code: input.accountingCategoryCode || null,
    goods_services_class: input.goodsServicesClass || null,
    observations: input.observations || null,
    lines: input.lines.map(toExpenseLinePayload),
    ...toGapPayload(input),
    ...toPricingPayload(input),
    ...toSettlementPayload(input),
    ...toClassificationPayload(input),
  };
}

function toAdditionalCostPayload(input: AdditionalCostPurchaseInput) {
  return {
    ...toExpensePayload(input),
    reception_date: input.receptionDate,
    allocation_method: input.allocationMethod,
    target_purchase_ids: input.targetPurchaseIds,
    manual_allocations: (input.manualAllocations ?? []).map((row) => ({
      target_purchase_id: row.targetPurchaseId,
      target_line_number: row.targetLineNumber,
      amount_pen: row.amountPen,
    })),
  };
}

export type PreviewGap = Pick<
  PurchaseGapFields,
  "iscAmount" | "discountAmount" | "detractionCode" | "detractionPercent"
> &
  Pick<PurchaseExtraFields, "pricesIncludeTax" | "perceptionAmount" | "retentionPercent" | "igvRate"> & {
    documentType?: string;
  };

function toPreviewGapPayload(input: PreviewGap) {
  return {
    document_type: input.documentType || null,
    isc_amount: input.iscAmount ?? 0,
    discount_amount: input.discountAmount ?? 0,
    detraction_code: input.detractionCode || null,
    detraction_percent: input.detractionPercent ?? null,
    ...toPricingPayload(input),
  };
}

export const purchasesApi = {
  async list(filters: PurchaseFilters): Promise<Paginated<Purchase>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<Purchase>>>("/purchases", {
      params: {
        period: filters.period || undefined,
        supplier_id: filters.supplierId || undefined,
        status: filters.status || undefined,
        kind: filters.kind || undefined,
        payment_status: filters.paymentStatus || undefined,
        search: filters.search || undefined,
        page: filters.page,
        per_page: filters.perPage,
      },
    });
    return data.data;
  },

  async operationTypes(): Promise<OperationTypeOption[]> {
    const { data } = await apiClient.get<ApiResponse<OperationTypeOption[]>>("/purchases/operation-types");
    return data.data;
  },

  async allocationMethods(): Promise<AllocationMethodOption[]> {
    const { data } = await apiClient.get<ApiResponse<AllocationMethodOption[]>>("/purchases/allocation-methods");
    return data.data;
  },

  async detractions(): Promise<CatalogEntry[]> {
    const { data } = await apiClient.get<ApiResponse<CatalogEntry[]>>("/catalogs/detractions");
    return data.data;
  },

  async goodsServicesClassifications(): Promise<CatalogEntry[]> {
    const { data } = await apiClient.get<ApiResponse<CatalogEntry[]>>("/catalogs/goods_services_classifications");
    return data.data;
  },

  async get(id: string): Promise<Purchase> {
    const { data } = await apiClient.get<ApiResponse<Purchase>>(`/purchases/${id}`);
    return data.data;
  },

  async preview(
    input: Pick<PurchaseInput, "currency" | "issueDate" | "lines"> & PreviewGap,
  ): Promise<PurchasePreview> {
    const { data } = await apiClient.post<ApiResponse<PurchasePreview>>("/purchases/preview", {
      currency: input.currency,
      issue_date: input.issueDate,
      lines: input.lines.map(toMerchandiseLinePayload),
      ...toPreviewGapPayload(input),
    });
    return data.data;
  },

  async previewExpense(
    input: Pick<ExpensePurchaseInput, "currency" | "issueDate" | "lines"> & PreviewGap,
  ): Promise<ExpensePurchasePreview> {
    const { data } = await apiClient.post<ApiResponse<ExpensePurchasePreview>>("/purchases/preview-expense", {
      currency: input.currency,
      issue_date: input.issueDate,
      lines: input.lines.map(toExpenseLinePayload),
      ...toPreviewGapPayload(input),
    });
    return data.data;
  },

  async previewAdditionalCost(
    input: Pick<
      AdditionalCostPurchaseInput,
      "currency" | "issueDate" | "lines" | "allocationMethod" | "targetPurchaseIds" | "manualAllocations"
    > &
      PreviewGap,
  ): Promise<AdditionalCostPurchasePreview> {
    const { data } = await apiClient.post<ApiResponse<AdditionalCostPurchasePreview>>(
      "/purchases/preview-additional-cost",
      {
        currency: input.currency,
        issue_date: input.issueDate,
        lines: input.lines.map(toExpenseLinePayload),
        allocation_method: input.allocationMethod,
        target_purchase_ids: input.targetPurchaseIds,
        manual_allocations: (input.manualAllocations ?? []).map((row) => ({
          target_purchase_id: row.targetPurchaseId,
          target_line_number: row.targetLineNumber,
          amount_pen: row.amountPen,
        })),
        ...toPreviewGapPayload(input),
      },
    );
    return data.data;
  },

  async create(input: PurchaseInput): Promise<Purchase> {
    const { data } = await apiClient.post<ApiResponse<Purchase>>("/purchases", toMerchandisePayload(input));
    return data.data;
  },

  async createExpense(input: ExpensePurchaseInput): Promise<Purchase> {
    const { data } = await apiClient.post<ApiResponse<Purchase>>("/purchases/expenses", toExpensePayload(input));
    return data.data;
  },

  async createAdditionalCost(input: AdditionalCostPurchaseInput): Promise<Purchase> {
    const { data } = await apiClient.post<ApiResponse<Purchase>>(
      "/purchases/additional-costs",
      toAdditionalCostPayload(input),
    );
    return data.data;
  },

  async annul(id: string): Promise<void> {
    await apiClient.post(`/purchases/${id}/annul`);
  },

  async listPayments(purchaseId: string): Promise<PurchasePayment[]> {
    const { data } = await apiClient.get<ApiResponse<PurchasePayment[]>>(`/purchases/${purchaseId}/payments`);
    return data.data;
  },

  async registerPayment(purchaseId: string, input: RegisterPurchasePaymentInput): Promise<PurchasePayment> {
    const { data } = await apiClient.post<ApiResponse<PurchasePayment>>(`/purchases/${purchaseId}/payments`, {
      paid_at: input.paidAt,
      amount: input.amount,
      amount_pen: input.amountPen ?? null,
      method: input.method || null,
      notes: input.notes || null,
      mark_fully_paid: input.markFullyPaid ?? false,
      treasury_account_id: input.treasuryAccountId || null,
      reference: input.reference || null,
    });
    return data.data;
  },
};

export interface KardexMovement {
  id: string;
  movement_date: string;
  type: string;
  quantity: string;
  unit_cost: string;
  total_value: string;
  balance_quantity: string;
  balance_unit_cost: string;
  balance_value: string;
  source_type: string;
  source_id: string;
  source_line: number | null;
  created_at: string;
}

export const kardexApi = {
  async list(params: {
    productId: string;
    warehouseId: string;
    from?: string;
    to?: string;
  }): Promise<KardexMovement[]> {
    const { data } = await apiClient.get<ApiResponse<KardexMovement[]>>("/inventory/kardex", {
      params: {
        product_id: params.productId,
        warehouse_id: params.warehouseId,
        from: params.from || undefined,
        to: params.to || undefined,
      },
    });
    return data.data;
  },
};
