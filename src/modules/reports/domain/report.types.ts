export type PurchaseRegisterRow = {
  period: string;
  registration_code: number;
  issue_date: string;
  due_date: string;
  accounting_date: string;
  document_type: string;
  series: string;
  number: string;
  supplier_document_type: string;
  supplier_document_number: string;
  supplier_business_name: string;
  taxable_base: string;
  non_taxable_base: string;
  igv_credit: string;
  igv_non_deductible: string;
  total_amount: string;
  currency: string;
  exchange_rate: string;
  taxable_base_pen: string;
  non_taxable_base_pen: string;
  igv_credit_pen: string;
  igv_non_deductible_pen: string;
  total_amount_pen: string;
  goods_services_class: string | null;
  status: string;
  kind: string;
  purchase_id: string;
};

export type PurchaseRegisterTotals = {
  count: number;
  taxable_base_pen: string;
  non_taxable_base_pen: string;
  igv_credit_pen: string;
  igv_non_deductible_pen: string;
  total_amount_pen: string;
};

export type PurchaseRegisterReport = {
  period: string;
  items: PurchaseRegisterRow[];
  totals: PurchaseRegisterTotals;
};

export type PurchaseRegisterFilters = {
  period: string;
  includeAnnulled?: boolean;
};
