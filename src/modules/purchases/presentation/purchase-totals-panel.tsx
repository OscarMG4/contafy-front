"use client";

import { Col, Row, Typography } from "antd";

import { formatMoney } from "@/shared/lib/format";

import type { PurchaseTotals } from "../domain/purchase.types";

function money(value?: string, currency = "PEN") {
  if (value == null) return "—";
  const n = Number(value);
  if (currency === "PEN") return formatMoney(n);
  return `${currency} ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

function Metric({ label, value, emphasis }: { label: string; value: string; emphasis?: boolean }) {
  return (
    <div>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
      <Typography.Text strong={emphasis} style={{ display: "block" }}>
        {value}
      </Typography.Text>
    </div>
  );
}

interface PurchaseTotalsPanelProps {
  totals: PurchaseTotals;
  currency: string;
  exchangeRate?: string;
}

export function PurchaseTotalsPanel({ totals, currency, exchangeRate }: PurchaseTotalsPanelProps) {
  return (
    <div
      style={{
        marginTop: 16,
        padding: 16,
        background: "var(--ant-color-fill-quaternary, #f5f5f5)",
        borderRadius: 4,
      }}
    >
      <Typography.Text strong>Totales calculados</Typography.Text>
      {exchangeRate && (
        <Typography.Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
          TC venta {exchangeRate}
        </Typography.Text>
      )}
      <Row gutter={[16, 8]}>
        <Col span={12}>
          <Metric label="Operaciones gravadas" value={money(totals.taxable_operations, currency)} />
        </Col>
        <Col span={12}>
          <Metric label="Inafectas" value={money(totals.unaffected_operations, currency)} />
        </Col>
        <Col span={12}>
          <Metric label="Exoneradas" value={money(totals.exonerated_operations, currency)} />
        </Col>
        <Col span={12}>
          <Metric label="Otros cargos" value={money(totals.other_charges, currency)} />
        </Col>
        <Col span={12}>
          <Metric label="ISC" value={money(totals.isc, currency)} />
        </Col>
        <Col span={12}>
          <Metric label="Descuento" value={money(totals.discount, currency)} />
        </Col>
        <Col span={12}>
          <Metric label="IGV crédito fiscal" value={money(totals.igv_credit, currency)} />
        </Col>
        <Col span={12}>
          <Metric label="IGV no deducible" value={money(totals.igv_non_deductible, currency)} />
        </Col>
        <Col span={12}>
          <Metric label="Detracción" value={money(totals.detraction, currency)} />
        </Col>
        <Col span={12}>
          <Metric label="Total" value={money(totals.total, currency)} emphasis />
        </Col>
        {currency !== "PEN" && (
          <Col span={12}>
            <Metric label="Total PEN" value={money(totals.total_pen, "PEN")} />
          </Col>
        )}
      </Row>
    </div>
  );
}
