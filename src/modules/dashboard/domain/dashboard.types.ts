export type KpiKey = "income" | "expenses" | "receivables" | "payables";

export interface Kpi {
  key: KpiKey;
  label: string;
  value: number;
  /** Variación vs. mes anterior. `null` si aún no hay periodo comparable. */
  change: number | null;
}

export interface CashflowPoint {
  month: string;
  period: string;
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

export interface OnboardingStep {
  key: string;
  title: string;
  done: boolean;
  href: string | null;
}

export interface ExchangeRateSnapshot {
  currency: string;
  date: string;
  buy: string;
  sell: string;
  source: string;
}

export interface DashboardSummary {
  kpis: Kpi[];
  cashflow: CashflowPoint[];
  recentEntries: JournalEntrySummary[];
  onboarding: OnboardingStep[];
  exchangeRate: ExchangeRateSnapshot | null;
  hasFinancialActivity: boolean;
}
