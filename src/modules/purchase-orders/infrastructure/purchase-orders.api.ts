import { apiClient, type ApiResponse, type Paginated } from "@/core/http/api-client";

import type { PurchaseOrder, PurchaseOrderFilters, PurchaseOrderInput } from "../domain/purchase-order.types";

export const purchaseOrdersApi = {
  async list(filters: PurchaseOrderFilters): Promise<Paginated<PurchaseOrder>> {
    const { data } = await apiClient.get<ApiResponse<Paginated<PurchaseOrder>>>("/purchase-orders", {
      params: {
        supplier_id: filters.supplierId || undefined,
        status: filters.status || undefined,
        search: filters.search || undefined,
        page: filters.page,
        per_page: filters.perPage,
      },
    });
    return data.data;
  },

  async get(id: string): Promise<PurchaseOrder> {
    const { data } = await apiClient.get<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}`);
    return data.data;
  },

  async create(input: PurchaseOrderInput): Promise<PurchaseOrder> {
    const { data } = await apiClient.post<ApiResponse<PurchaseOrder>>("/purchase-orders", {
      issue_date: input.issueDate,
      expected_date: input.expectedDate || null,
      supplier_id: input.supplierId,
      warehouse_id: input.warehouseId,
      payment_term: input.paymentTerm,
      credit_days: input.paymentTerm === "cash" ? 0 : (input.creditDays ?? 0),
      currency: input.currency,
      prices_include_tax: input.pricesIncludeTax,
      reference: input.reference || null,
      observations: input.observations || null,
      lines: input.lines.map((l) => ({ product_id: l.productId, quantity: l.quantity, unit_price: l.unitPrice })),
    });
    return data.data;
  },

  async cancel(id: string): Promise<PurchaseOrder> {
    const { data } = await apiClient.post<ApiResponse<PurchaseOrder>>(`/purchase-orders/${id}/cancel`);
    return data.data;
  },
};
