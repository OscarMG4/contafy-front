import { Card, Flex, Segmented, Tooltip, Typography } from "antd";

import { palette } from "@/core/theme/palette";
import { formatMoney } from "@/shared/lib/format";

import type { CashflowPoint } from "../domain/dashboard.types";

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <Flex align="center" gap={6}>
      <span style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
    </Flex>
  );
}

export function CashflowCard({ data }: { data: CashflowPoint[] }) {
  const max = Math.max(...data.flatMap((point) => [point.income, point.expenses]));

  return (
    <Card
      variant="borderless"
      title="Flujo de caja"
      extra={<Segmented size="small" options={["6 meses", "12 meses"]} />}
      style={{ height: "100%" }}
    >
      <Flex gap={16} style={{ marginBottom: 20 }}>
        <Legend color={palette.purple[600]} label="Ingresos" />
        <Legend color={palette.purple[200]} label="Gastos" />
      </Flex>

      <Flex align="flex-end" justify="space-between" gap={12} style={{ height: 220 }}>
        {data.map((point) => (
          <Flex key={point.month} vertical align="center" gap={8} style={{ flex: 1, height: "100%" }}>
            <Flex align="flex-end" justify="center" gap={5} style={{ flex: 1, width: "100%" }}>
              <Tooltip title={`Ingresos: ${formatMoney(point.income)}`}>
                <div
                  style={{
                    width: "34%",
                    maxWidth: 22,
                    height: `${(point.income / max) * 100}%`,
                    borderRadius: "8px 8px 4px 4px",
                    background: `linear-gradient(180deg, ${palette.purple[500]}, ${palette.purple[700]})`,
                  }}
                />
              </Tooltip>
              <Tooltip title={`Gastos: ${formatMoney(point.expenses)}`}>
                <div
                  style={{
                    width: "34%",
                    maxWidth: 22,
                    height: `${(point.expenses / max) * 100}%`,
                    borderRadius: "8px 8px 4px 4px",
                    background: palette.purple[200],
                  }}
                />
              </Tooltip>
            </Flex>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {point.month}
            </Typography.Text>
          </Flex>
        ))}
      </Flex>
    </Card>
  );
}
