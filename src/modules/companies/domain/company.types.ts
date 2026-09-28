export type TaxRegime = "general" | "mype" | "special" | "rus";
export type CompanyStatus = "active" | "archived";

export interface Company {
  id: string;
  ruc: string;
  business_name: string;
  trade_name: string | null;
  address: string | null;
  tax_regime: TaxRegime;
  tax_regime_label: string;
  status: CompanyStatus;
  created_at: string | null;
}

export interface CompanyFilters {
  search?: string;
  status?: CompanyStatus;
  page: number;
  perPage: number;
}

export interface CompanyInput {
  ruc: string;
  businessName: string;
  tradeName?: string;
  address?: string;
  taxRegime: TaxRegime;
}

export interface TaxRegimeOption {
  value: TaxRegime;
  label: string;
}

export const COMPANY_STATUS_OPTIONS: { value: CompanyStatus; label: string; color: string }[] = [
  { value: "active", label: "Activa", color: "success" },
  { value: "archived", label: "Archivada", color: "default" },
];
