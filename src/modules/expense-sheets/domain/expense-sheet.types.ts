export type ExpenseSheetStatus = "open" | "closed";

export interface ExpenseSheet {
  id: string;
  number: number;
  /** Y-m-d */
  issue_date: string;
  responsible: string;
  concept: string;
  description: string | null;
  status: ExpenseSheetStatus;
  status_label: string;
  /** ISO 8601 */
  closed_at: string | null;
}

export interface ExpenseSheetInput {
  /** Y-m-d */
  issueDate: string;
  responsible: string;
  concept: string;
  description?: string | null;
}

export interface ExpenseSheetFilters {
  search?: string;
  status?: ExpenseSheetStatus;
  page: number;
  perPage: number;
}

export const EXPENSE_SHEET_STATUS_OPTIONS: { value: ExpenseSheetStatus; label: string }[] = [
  { value: "open", label: "Abierta" },
  { value: "closed", label: "Cerrada" },
];

export const expenseSheetLabel = (sheet: Pick<ExpenseSheet, "number" | "concept" | "responsible">) =>
  `N° ${sheet.number} · ${sheet.concept} · ${sheet.responsible}`;
