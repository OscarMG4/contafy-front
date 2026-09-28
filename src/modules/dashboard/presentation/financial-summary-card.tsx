"use client";

import dayjs from "dayjs";
import { DollarOutlined } from "@ant-design/icons";
import { Card, Col, Empty, Flex, Row, Skeleton, Typography } from "antd";

import { formatMoney } from "@/shared/lib/format";

import type { ExchangeRateSnapshot, Kpi } from "../domain/dashboard.types";

export function FinancialSummaryCard({
  kpis,
  exchangeRate,
  hasActivity,
  loading,
}: {
  kpis: Kpi[];
  exchangeRate: ExchangeRateSnapshot | null;
  hasActivity: boolean;
  loading?: boolean;
}) {
  const income = kpis.find((kpi) => kpi.key === "income")?.value ?? 0;
  const expenses = kpis.find((kpi) => kpi.key === "expenses")?.value ?? 0;
  const balance = income - expenses;

  return (
    <Card variant="borderless" title="Indicadores del mes">
      {loading ? (
        <Skeleton active paragraph={{ rows: 3 }} />
      ) : (
        <>
          <Row gutter={[24, 20]}>
            <Col xs={24} sm={8}>
              <Metric label="Ingresos" value={formatMoney(income)} />
            </Col>
            <Col xs={24} sm={8}>
              <Metric label="Gastos" value={formatMoney(expenses)} />
            </Col>
            <Col xs={24} sm={8}>
              <Metric label="Resultado" value={formatMoney(balance)} emphasis={!hasActivity ? undefined : balance >= 0 ? "positive" : "negative"} />
            </Col>
          </Row>

          {!hasActivity && (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Sin operaciones registradas en el periodo."
              style={{ marginTop: 8, marginBottom: 0 }}
            />
          )}

          {exchangeRate && (
            <Flex
              align="center"
              gap={14}
              style={{
                marginTop: 24,
                padding: "14px 16px",
                borderRadius: 10,
                background: "var(--cf-surface-muted)",
                border: "1px solid var(--cf-border)",
              }}
            >
              <DollarOutlined style={{ fontSize: 18, color: "var(--cf-accent)" }} />
              <div style={{ lineHeight: 1.35 }}>
                <Typography.Text strong>
                  USD venta {exchangeRate.sell} · compra {exchangeRate.buy}
                </Typography.Text>
                <br />
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  SBS del {dayjs(exchangeRate.date).format("DD/MM/YYYY")} · fuente {exchangeRate.source.toUpperCase()}
                </Typography.Text>
              </div>
            </Flex>
          )}
        </>
      )}
    </Card>
  );
}

function Metric({
  label,
  value,
  emphasis,
}: {
  label: string;
  value: string;
  emphasis?: "positive" | "negative";
}) {
  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      <div
        style={{
          fontSize: 20,
          fontWeight: 800,
          letterSpacing: "-0.03em",
          color: emphasis === "positive" ? "var(--cf-success, #16A34A)" : emphasis === "negative" ? "var(--cf-error, #E11D48)" : undefined,
        }}
      >
        {value}
      </div>
    </div>
  );
}
