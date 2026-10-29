export type AnnexType = "worker" | "project" | "bank" | "other";

export interface Annex {
  id: string;
  code: string;
  name: string;
  type: AnnexType;
  type_label: string;
  document_number: string | null;
  active: boolean;
}

export interface AnnexInput {
  code: string;
  name: string;
  type: AnnexType;
  documentNumber?: string | null;
}

export interface AnnexUpdateInput {
  name: string;
  type: AnnexType;
  documentNumber?: string | null;
  active: boolean;
}

export interface AnnexFilters {
  search?: string;
  type?: AnnexType;
  only_active?: boolean;
  page: number;
  perPage: number;
}

export interface AnnexTypeOption {
  value: AnnexType;
  label: string;
}
