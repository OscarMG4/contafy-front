"use client";

import { Card, Empty, Flex, Segmented, Typography } from "antd";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { palette } from "@/core/theme/palette";
import { useThemeMode } from "@/core/theme/theme-mode";
import { formatMoney } from "@/shared/lib/format";

import type { CashflowPoint } from "../domain/dashboard.types";

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Flex align="center" gap={8}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
    </Flex>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ dataKey?: string | number; value?: number }>;
  label?: string | number;
}) {
  if (!active || !payload?.length) return null;

  const income = payload.find((item) => item.dataKey === "income")?.value ?? 0;
  const expenses = payload.find((item) => item.dataKey === "expenses")?.value ?? 0;

  return (
    <div
      style={{
        background: "var(--cf-surface)",
        border: "1px solid var(--cf-border)",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "var(--cf-shadow-card)",
      }}
    >
      <Typography.Text strong style={{ display: "block", marginBottom: 6 }}>
        {label}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
        Ingresos: {formatMoney(income)}
      </Typography.Text>
      <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
        Gastos: {formatMoney(expenses)}
      </Typography.Text>
    </div>
  );
}

export function CashflowCard({ data, hasActivity }: { data: CashflowPoint[]; hasActivity: boolean }) {
  const { isDark } = useThemeMode();
  const incomeColor = isDark ? palette.purple[400] : palette.purple[600];
  const expenseColor = isDark ? "#3A4150" : palette.gray[200];
  const gridColor = isDark ? "#252A35" : palette.gray[100];
  const tickColor = isDark ? "#7D8595" : palette.gray[400];

  return (
    <Card
      variant="borderless"
      title="Resumen financiero"
      extra={<Segmented size="small" options={["6 meses"]} value="6 meses" />}
      style={{ height: "100%" }}
    >
      <Flex gap={20} style={{ marginBottom: 20 }}>
        <Legend color={incomeColor} label="Ingresos" />
        <Legend color={expenseColor} label="Gastos" />
      </Flex>

      {hasActivity ? (
        <div style={{ width: "100%", height: 260 }}>
          <ResponsiveContainer>
            <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={4} barCategoryGap="28%">
              <CartesianGrid vertical={false} stroke={gridColor} strokeDasharray="3 3" />
              <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: tickColor, fontSize: 12 }} />
              <YAxis
                axisLine={false}
                tickLine={false}
                width={56}
                tick={{ fill: tickColor, fontSize: 11 }}
                tickFormatter={(value: number) =>
                  new Intl.NumberFormat("es-PE", { notation: "compact", maximumFractionDigits: 1 }).format(value)
                }
              />
              <Tooltip cursor={{ fill: "var(--cf-accent-soft)" }} content={<ChartTooltip />} />
              <Bar dataKey="income" name="Ingresos" fill={incomeColor} radius={[4, 4, 0, 0]} maxBarSize={20} />
              <Bar dataKey="expenses" name="Gastos" fill={expenseColor} radius={[4, 4, 0, 0]} maxBarSize={20} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="Todavía no hay movimientos. El resumen se llenará al registrar compras y ventas."
          style={{ paddingBlock: 40 }}
        />
      )}
    </Card>
  );
}
