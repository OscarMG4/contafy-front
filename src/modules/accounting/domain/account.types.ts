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

/** Fila del archivo del cliente que se envía para importar el plan de cuentas. */
export interface ChartImportInputRow {
  line: number;
  code: string;
  name: string;
  parent_code?: string | null;
  nature?: string | null;
}

export type ChartImportStatus = "new" | "existing" | "rename" | "skipped" | "error";

export interface ChartImportRow {
  line: number;
  code: string;
  name: string;
  parent_code: string | null;
  level: number | null;
  nature: string | null;
  nature_label: string | null;
  is_leaf: boolean;
  status: ChartImportStatus;
  messages: string[];
}

export interface ChartImportPlan {
  summary: {
    total: number;
    new: number;
    existing: number;
    rename: number;
    skipped: number;
    errors: number;
    subdivided: number;
  };
  can_import: boolean;
  /** Cuentas de movimiento que pasan a tener subcuentas; fallback_code es la que usarán los asientos automáticos. */
  subdivided: { code: string; name: string; fallback_code: string | null; system: boolean }[];
  rows: ChartImportRow[];
}
