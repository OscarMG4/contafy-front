"use client";

import { Col, Form, InputNumber, Row, Typography, type FormInstance } from "antd";

import { FEE_RECEIPT_DOCUMENT, FEE_RETENTION_THRESHOLD_PEN, type PurchaseKind } from "../../domain/purchase.types";
import { formatAmount, type DocumentFormValues } from "./document-model";
import type { DocumentPreview } from "./use-document-preview";

interface PerceptionTabProps {
  form: FormInstance<DocumentFormValues>;
  kind: PurchaseKind;
  preview: DocumentPreview | null;
  /** El usuario cambió a mano el % de retención (deja de sugerirse). */
  onRetentionTouched: () => void;
}

/** Pestaña "Percepción / Retención". */
export function PerceptionTab({ form, kind, preview, onRetentionTouched }: PerceptionTabProps) {
  const documentType = Form.useWatch("documentType", form);
  const isFeeReceipt = kind === "expense" && documentType === FEE_RECEIPT_DOCUMENT;
  const charges = preview?.charges;

  return (
    <Row gutter={24}>
      <Col xs={24} lg={12}>
        <Form.Item
          name="perceptionAmount"
          label="Importe percepción"
          extra={isFeeReceipt ? "El recibo por honorarios no lleva percepción." : "Percepción del IGV consignada en el comprobante."}
        >
          <InputNumber min={0} precision={2} style={{ width: "100%" }} disabled={isFeeReceipt} placeholder="0.00" />
        </Form.Item>
      </Col>
      <Col xs={24} lg={12}>
        {isFeeReceipt ? (
          <Form.Item
            name="retentionPercent"
            label="% Retención 4ta"
            extra={`Sugerido: 8 % si el total supera S/ ${formatAmount(FEE_RETENTION_THRESHOLD_PEN)}; 0 si no.${
              charges ? ` Retención: ${formatAmount(charges.retention)} · Neto a pagar: ${formatAmount(charges.payable)}` : ""
            }`}
          >
            <InputNumber min={0} max={100} precision={2} style={{ width: "100%" }} suffix="%" onChange={onRetentionTouched} />
          </Form.Item>
        ) : (
          <Typography.Paragraph type="secondary" style={{ marginTop: 6 }}>
            La retención de 4ta categoría solo aplica a recibos por honorarios (02) en compras de gastos.
          </Typography.Paragraph>
        )}
      </Col>
    </Row>
  );
}
