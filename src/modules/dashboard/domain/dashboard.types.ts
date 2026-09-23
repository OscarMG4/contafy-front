export type KpiKey = "income" | "expenses" | "receivables" | "payables";

export interface Kpi {
  key: KpiKey;
  label: string;
  value: number;
  /** Variación porcentual respecto al periodo anterior. */
  change: number;
}

export interface CashflowPoint {
  month: string;
  income: number;
  expenses: number;
}

export interface JournalEntrySummary {
  id: string;
  date: string;
  description: string;
  account: string;
  amount: number;
  status: "posted" | "draft";
}

export interface DashboardSummary {
  kpis: Kpi[];
  cashflow: CashflowPoint[];
  recentEntries: JournalEntrySummary[];
}
