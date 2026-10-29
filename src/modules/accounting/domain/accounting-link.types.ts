export type AccountingLinkCriterion = "document_type" | "product_category" | "partner_category" | "concept";

export interface AccountingLinkTypeOption {
  value: string;
  label: string;
  description: string;
  criteria: AccountingLinkCriterion[];
}

export interface AccountingScheme {
  id: string;
  name: string;
  is_default: boolean;
  active: boolean;
  links_count?: number;
}

export interface AccountingLink {
  id: string;
  scheme_id: string;
  link_type: string;
  link_type_label: string;
  document_type: string | null;
  product_category: string | null;
  partner_category: string | null;
  concept: string | null;
  account_code: string;
  account_name: string | null;
}

export interface AccountingLinkInput {
  scheme_id: string;
  link_type: string;
  document_type?: string | null;
  product_category?: string | null;
  partner_category?: string | null;
  concept?: string | null;
  account_code: string;
}

export interface ResolvedLinkAccount {
  account_code: string;
  account_id: string | null;
  account_name: string | null;
  is_leaf: boolean;
}
