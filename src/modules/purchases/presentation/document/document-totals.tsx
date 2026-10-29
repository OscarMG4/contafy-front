"use client";

import { Col, Row, Spin, Typography } from "antd";

import { formatAmount, siempreSoftTotals } from "./document-model";
import styles from "./document.module.css";
import type { DocumentPreview } from "./use-document-preview";

function TotalRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={styles.totalRow}>
      <Typography.Text strong={strong}>{label}</Typography.Text>
      <span className={styles.totalValue} style={strong ? { fontWeight: 600 } : undefined}>
        {value}
      </span>
    </div>
  );
}

interface DocumentTotalsProps {
  preview: DocumentPreview | null;
  /** Suma de importes de la grilla (mientras no hay preview). */
  linesTotal: number;
  currency: string;
  loading: boolean;
  error: string | null;
  showRetention: boolean;
}

/** Bloque de totales con los nombres de SiempreSoft. */
export function DocumentTotals({ preview, linesTotal, currency, loading, error, showRetention }: DocumentTotalsProps) {
  const t = preview ? siempreSoftTotals(preview.totals) : null;
  const c = preview?.charges;
  const v = (n: number | string | undefined) => (n == null ? "—" : formatAmount(n));
  const foreign = currency !== "PEN";

  return (
    <div className={styles.totalsBox}>
      <Row gutter={[24, 2]}>
        <Col xs={24} md={8}>
          <TotalRow label="Importe Afecto" value={v(t?.importeAfecto)} />
          <TotalRow label="Descuento" value={v(t?.descuento)} />
          <TotalRow label="ISC" value={v(t?.isc)} />
          <TotalRow label="Importe Bruto" value={t ? v(t.importeBruto) : formatAmount(linesTotal)} />
        </Col>
        <Col xs={24} md={8}>
          <TotalRow label="Valor Compra" value={v(t?.valorCompra)} />
          <TotalRow label="IGV" value={v(t?.igv)} />
          <TotalRow label="Precio Compra" value={v(t?.precioCompra)} strong />
          {foreign && <TotalRow label="Precio Compra S/" value={v(preview?.totals.total_pen)} />}
        </Col>
        <Col xs={24} md={8}>
          <TotalRow label="Percepción" value={v(c?.perception)} />
          {showRetention && (
            <TotalRow
              label={`Retención 4ta${c?.retention_percent ? ` (${Number(c.retention_percent)}%)` : ""}`}
              value={v(c?.retention)}
            />
          )}
          <TotalRow label={`Neto a pagar ${currency === "PEN" ? "S/" : currency}`} value={v(c?.payable)} strong />
          {foreign && <TotalRow label="Neto a pagar S/" value={v(c?.payable_pen)} />}
        </Col>
      </Row>
      <div style={{ minHeight: 20, marginTop: 4 }}>
        {loading ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            <Spin size="small" /> Calculando…
          </Typography.Text>
        ) : error ? (
          <Typography.Text type="danger" style={{ fontSize: 12 }}>
            No se pudo calcular: {error}
          </Typography.Text>
        ) : preview ? (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {foreign ? `Tasa de cambio ${preview.exchangeRate} · ` : ""}IGV crédito fiscal {formatAmount(preview.totals.igv_credit)}
            {Number(preview.totals.igv_non_deductible) > 0
              ? ` · IGV no deducible ${formatAmount(preview.totals.igv_non_deductible)}`
              : ""}
            {Number(preview.totals.detraction) > 0 ? ` · Detracción ${formatAmount(preview.totals.detraction)}` : ""}
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            Los totales se calculan al completar las líneas (o con Calcular F9).
          </Typography.Text>
        )}
      </div>
    </div>
  );
}
