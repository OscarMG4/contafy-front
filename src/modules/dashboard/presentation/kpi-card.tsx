import type { CSSProperties, ReactNode } from "react";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Card, Flex, Tag, Typography } from "antd";

import { formatMoney, formatPercent } from "@/shared/lib/format";

import type { Kpi } from "../domain/dashboard.types";
import styles from "./kpi-card.module.css";

/** Color propio de cada indicador; los no listados usan el acento de marca. */
const KPI_TONES: Record<string, string> = {
  income: "#6C25F2",
  expenses: "#F43F5E",
  receivables: "#0EA5E9",
  payables: "#F59E0B",
};

interface KpiCardProps {
  kpi: Kpi;
  icon: ReactNode;
  /** true cuando una variación positiva es mala (p. ej. gastos). */
  inverse?: boolean;
  highlighted?: boolean;
  /** Índice para stagger de entrada (0…n). */
  index?: number;
}

export function KpiCard({ kpi, icon, inverse = false, highlighted = false, index = 0 }: KpiCardProps) {
  const hasChange = kpi.change !== null;
  const isGood = hasChange ? (inverse ? kpi.change! <= 0 : kpi.change! >= 0) : true;

  return (
    <Card
      variant="borderless"
      className={styles.card}
      style={
        {
          ["--cf-stagger" as string]: String(index),
          ["--kpi-tone" as string]: KPI_TONES[kpi.key] ?? "var(--cf-accent)",
        } as CSSProperties
      }
    >
      <Flex justify="space-between" align="center" gap={16}>
        <Typography.Text type="secondary" style={{ fontSize: 13, fontWeight: 500 }}>
          {kpi.label}
        </Typography.Text>
        <span className={styles.icon} data-highlighted={highlighted || undefined}>
          {icon}
        </span>
      </Flex>

      <div className={styles.value}>{formatMoney(kpi.value)}</div>

      <Flex align="center" gap={10} wrap>
        {hasChange ? (
          <>
            <Tag
              variant="filled"
              color={isGood ? "success" : "error"}
              icon={kpi.change! >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
              style={{ marginInlineEnd: 0 }}
            >
              {formatPercent(kpi.change!)}
            </Tag>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              vs. mes anterior
            </Typography.Text>
          </>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Sin movimiento este mes
          </Typography.Text>
        )}
      </Flex>
    </Card>
  );
}
