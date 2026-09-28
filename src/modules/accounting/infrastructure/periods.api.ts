import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type { ClosedPeriod } from "../domain/period.types";

export const periodsApi = {
  async listClosed(): Promise<ClosedPeriod[]> {
    const { data } = await apiClient.get<ApiResponse<ClosedPeriod[]>>("/accounting/periods/closed");
    return data.data;
  },

  async close(period: string): Promise<void> {
    await apiClient.post(`/accounting/periods/${period}/close`);
  },

  async reopen(period: string): Promise<void> {
    await apiClient.post(`/accounting/periods/${period}/reopen`);
  },
};
