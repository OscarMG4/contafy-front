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
  PurchasePayment,
  RegisterPurchasePaymentInput,
} from "../domain/purchase.types";

function toMerchandiseLinePayload(line: PurchaseInput["lines"][number]) {
  return {
    product_id: line.productId,
    warehouse_id: line.warehouseId,
    quantity: line.quantity,
    gross_total: line.grossTotal,
    operation_type: line.operationType,
  };
}

function toExpenseLinePayload(line: ExpensePurchaseInput["lines"][number]) {
  return {
    account_id: line.accountId,
    description: line.description,
    gross_total: line.grossTotal,
    operation_type: line.operationType,
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
    lines: input.lines.map(toMerchandiseLinePayload),
    ...toGapPayload(input),
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

type PreviewGap = Pick<
  PurchaseGapFields,
  "iscAmount" | "discountAmount" | "detractionCode" | "detractionPercent"
>;

function toPreviewGapPayload(input: PreviewGap) {
  return {
    isc_amount: input.iscAmount ?? 0,
    discount_amount: input.discountAmount ?? 0,
    detraction_code: input.detractionCode || null,
    detraction_percent: input.detractionPercent ?? null,
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
