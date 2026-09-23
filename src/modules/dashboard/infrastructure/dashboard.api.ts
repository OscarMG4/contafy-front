import type { DashboardSummary } from "../domain/dashboard.types";

/**
 * TODO: reemplazar por `apiClient.get<ApiResponse<DashboardSummary>>("/dashboard/summary")`
 * cuando exista el endpoint en contafy-back. Por ahora devuelve datos de ejemplo.
 */
export const dashboardApi = {
  async summary(): Promise<DashboardSummary> {
    await new Promise((resolve) => setTimeout(resolve, 400));

    return {
      kpis: [
        { key: "income", label: "Ingresos del mes", value: 184_250.4, change: 12.4 },
        { key: "expenses", label: "Gastos del mes", value: 96_310.75, change: -3.2 },
        { key: "receivables", label: "Cuentas por cobrar", value: 58_940.0, change: 5.1 },
        { key: "payables", label: "Cuentas por pagar", value: 31_205.3, change: -8.6 },
      ],
      cashflow: [
        { month: "Abr", income: 120_000, expenses: 82_000 },
        { month: "May", income: 138_000, expenses: 90_500 },
        { month: "Jun", income: 131_500, expenses: 88_200 },
        { month: "Jul", income: 152_300, expenses: 97_800 },
        { month: "Ago", income: 163_900, expenses: 99_400 },
        { month: "Sep", income: 184_250, expenses: 96_300 },
      ],
      recentEntries: [
        { id: "AS-00128", date: "2026-09-22", description: "Venta F001-000532", account: "1212 Facturas por cobrar", amount: 11_800, status: "posted" },
        { id: "AS-00127", date: "2026-09-21", description: "Pago a proveedor Inversiones Andinas", account: "4212 Facturas por pagar", amount: -4_350.5, status: "posted" },
        { id: "AS-00126", date: "2026-09-20", description: "Planilla septiembre", account: "6211 Sueldos y salarios", amount: -28_400, status: "draft" },
        { id: "AS-00125", date: "2026-09-19", description: "Cobranza cliente Grupo Nova", account: "1041 Cuentas corrientes", amount: 7_250, status: "posted" },
        { id: "AS-00124", date: "2026-09-18", description: "Servicios de internet", account: "6364 Telecomunicaciones", amount: -389.9, status: "posted" },
      ],
    };
  },
};
