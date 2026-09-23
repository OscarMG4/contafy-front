import type { ReactNode } from "react";
import { ArrowDownOutlined, ArrowUpOutlined } from "@ant-design/icons";
import { Card, Flex, Tag, Typography } from "antd";

import { formatMoney, formatPercent } from "@/shared/lib/format";

import type { Kpi } from "../domain/dashboard.types";

interface KpiCardProps {
  kpi: Kpi;
  icon: ReactNode;
  /** true cuando una variación positiva es mala (p. ej. gastos). */
  inverse?: boolean;
  highlighted?: boolean;
}

export function KpiCard({ kpi, icon, inverse = false, highlighted = false }: KpiCardProps) {
  const isGood = inverse ? kpi.change <= 0 : kpi.change >= 0;

  return (
    <Card
      variant="borderless"
      style={
        highlighted
          ? { background: "var(--cf-gradient)", color: "#fff", boxShadow: "0 18px 40px -18px rgba(109,40,217,.7)" }
          : undefined
      }
    >
      <Flex justify="space-between" align="flex-start">
        <Typography.Text style={{ color: highlighted ? "rgba(255,255,255,.8)" : undefined }} type={highlighted ? undefined : "secondary"}>
          {kpi.label}
        </Typography.Text>
        <span
          style={{
            display: "grid",
            placeItems: "center",
            width: 38,
            height: 38,
            borderRadius: 12,
            fontSize: 17,
            color: highlighted ? "#fff" : "var(--cf-purple-600)",
            background: highlighted ? "rgba(255,255,255,.16)" : "color-mix(in srgb, var(--cf-purple-600) 10%, transparent)",
          }}
        >
          {icon}
        </span>
      </Flex>

      <div style={{ fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: "10px 0 8px", color: highlighted ? "#fff" : undefined }}>
        {formatMoney(kpi.value)}
      </div>

      <Flex align="center" gap={6}>
        <Tag
          variant="filled"
          color={highlighted ? undefined : isGood ? "success" : "error"}
          style={highlighted ? { background: "rgba(255,255,255,.18)", color: "#fff" } : undefined}
          icon={kpi.change >= 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        >
          {formatPercent(kpi.change)}
        </Tag>
        <Typography.Text style={{ fontSize: 12, color: highlighted ? "rgba(255,255,255,.7)" : undefined }} type={highlighted ? undefined : "secondary"}>
          vs. mes anterior
        </Typography.Text>
      </Flex>
    </Card>
  );
}
