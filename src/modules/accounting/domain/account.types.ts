export interface Account {
  id: string;
  company_id: string;
  code: string;
  name: string;
  parent_code: string | null;
  level: number;
  nature: string;
  nature_label: string | null;
  is_leaf: boolean;
  active: boolean;
  /** Asiento de destino (enlace por transferencia): cuenta destino al Debe, ej. 94x. */
  debit_destination_code?: string | null;
  /** Contracuenta al Haber, ej. 791. */
  credit_destination_code?: string | null;
  created_at: string | null;
}

export interface AccountFilters {
  search?: string;
  nature?: string;
  only_leaves?: boolean;
  only_active?: boolean;
  page: number;
  perPage: number;
}

export interface AccountInput {
  code: string;
  name: string;
  parentCode?: string;
  nature: string;
  isLeaf: boolean;
}

export interface AccountUpdateInput {
  name: string;
  active: boolean;
  debitDestinationCode?: string | null;
  creditDestinationCode?: string | null;
}

export interface NatureOption {
  value: string;
  label: string;
}
