import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type {
  CashflowPoint,
  DashboardSummary,
  ExchangeRateSnapshot,
  JournalEntrySummary,
  Kpi,
  OnboardingStep,
} from "../domain/dashboard.types";

interface DashboardSummaryDto {
  kpis: Kpi[];
  cashflow: CashflowPoint[];
  recent_entries: JournalEntrySummary[];
  onboarding: OnboardingStep[];
  exchange_rate: ExchangeRateSnapshot | null;
  has_financial_activity: boolean;
}

function mapSummary(payload: DashboardSummaryDto): DashboardSummary {
  return {
    kpis: payload.kpis,
    cashflow: payload.cashflow,
    recentEntries: payload.recent_entries,
    onboarding: payload.onboarding,
    exchangeRate: payload.exchange_rate,
    hasFinancialActivity: payload.has_financial_activity,
  };
}

export const dashboardApi = {
  async summary(nocache = false): Promise<DashboardSummary> {
    const { data } = await apiClient.get<ApiResponse<DashboardSummaryDto>>("/dashboard/summary", {
      params: nocache ? { nocache: true } : undefined,
    });

    return mapSummary(data.data);
  },
};
