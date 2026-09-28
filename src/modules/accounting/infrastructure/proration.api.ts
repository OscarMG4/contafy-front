import { apiClient, type ApiResponse } from "@/core/http/api-client";

import type { ProrationCoefficient, ProrationInput } from "../domain/proration.types";

interface ProrationDto {
  period: string;
  percentage: string | number;
}

function map(dto: ProrationDto): ProrationCoefficient {
  return { period: dto.period, percentage: Number(dto.percentage) };
}

export const prorationApi = {
  async get(period: string): Promise<ProrationCoefficient> {
    const { data } = await apiClient.get<ApiResponse<ProrationDto>>(`/accounting/proration-coefficients/${period}`);
    return map(data.data);
  },

  async update(period: string, input: ProrationInput): Promise<ProrationCoefficient> {
    const { data } = await apiClient.put<ApiResponse<ProrationDto>>(`/accounting/proration-coefficients/${period}`, {
      percentage: String(input.percentage),
    });
    return map(data.data);
  },
};
