"use client";

import { useMemo } from "react";
import { Col, DatePicker, Form, Input, InputNumber, Row, Select, Typography } from "antd";
import type { FormInstance } from "antd/es/form";
import dayjs from "dayjs";

import { useOpenReceptions } from "@/modules/receptions/application/use-receptions";

import { useDetractions } from "../application/use-purchases";
import {
  MODIFIED_DOCUMENT_TYPE_OPTIONS,
  requiresModifiedDocument,
  type CatalogEntry,
} from "../domain/purchase.types";

interface PurchaseGapFieldsSectionProps {
  form: FormInstance;
  showReceptionNumber?: boolean;
  showReceptionSelect?: boolean;
}

export function PurchaseGapFieldsSection({
  form,
  showReceptionNumber = true,
  showReceptionSelect = false,
}: PurchaseGapFieldsSectionProps) {
  const { data: detractions } = useDetractions();
  const { data: openReceptions } = useOpenReceptions();
  const documentType = Form.useWatch("documentType", form);
  const needsModified = requiresModifiedDocument(documentType ?? "");

  const detractionOptions = useMemo(
    () =>
      (detractions ?? []).map((entry: CatalogEntry) => ({
        value: entry.code,
        label: `${entry.code} · ${entry.description}`,
        percent: Number(entry.meta?.percentage ?? 0),
      })),
    [detractions],
  );

  const receptionOptions = useMemo(
    () =>
      (openReceptions?.items ?? []).map((r) => ({
        value: r.id,
        label: `${r.reception_number} · ${dayjs(r.reception_date).format("DD/MM/YYYY")}`,
        number: r.reception_number,
      })),
    [openReceptions],
  );

  return (
    <>
      <Typography.Text type="secondary">Datos adicionales</Typography.Text>
      <Row gutter={12} style={{ marginTop: 8 }}>
        {showReceptionSelect && (
          <Col xs={24} sm={12}>
            <Form.Item name="receptionId" label="Recepción de mercadería">
              <Select
                allowClear
                showSearch
                optionFilterProp="label"
                placeholder="Opcional · recepciones abiertas"
                options={receptionOptions}
                onChange={(id) => {
                  const option = receptionOptions.find((o) => o.value === id);
                  form.setFieldValue("receptionNumber", option?.number ?? undefined);
                }}
              />
            </Form.Item>
          </Col>
        )}
        {showReceptionNumber && (
          <Col xs={24} sm={showReceptionSelect ? 12 : 8}>
            <Form.Item name="receptionNumber" label="Nº recepción">
              <Input placeholder="Opcional" maxLength={40} />
            </Form.Item>
          </Col>
        )}
        <Col xs={24} sm={12}>
          <Form.Item name="beneficiaryName" label="Beneficiario">
            <Input placeholder="Nombre o razón social" maxLength={200} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={12}>
          <Form.Item name="beneficiaryDocument" label="Doc. beneficiario">
            <Input placeholder="Opcional" maxLength={20} />
          </Form.Item>
        </Col>
        <Col xs={12} sm={8}>
          <Form.Item name="iscAmount" label="ISC" initialValue={0}>
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={12} sm={8}>
          <Form.Item name="discountAmount" label="Descuento" initialValue={0}>
            <InputNumber min={0} precision={2} style={{ width: "100%" }} />
          </Form.Item>
        </Col>
        <Col xs={24} sm={16}>
          <Form.Item name="detractionCode" label="Detracción">
            <Select
              allowClear
              showSearch
              optionFilterProp="label"
              placeholder="Sin detracción"
              options={detractionOptions}
              onChange={(code) => {
                const option = detractionOptions.find((o) => o.value === code);
                form.setFieldValue("detractionPercent", option?.percent ?? null);
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} sm={8}>
          <Form.Item name="detractionPercent" label="% detracción">
            <InputNumber min={0} max={100} precision={4} style={{ width: "100%" }} disabled />
          </Form.Item>
        </Col>
      </Row>

      {needsModified && (
        <>
          <Typography.Text type="secondary">Documento modificado</Typography.Text>
          <Row gutter={12} style={{ marginTop: 8 }}>
            <Col xs={24} sm={8}>
              <Form.Item
                name="modifiedDocumentType"
                label="Tipo"
                rules={[{ required: true }]}
              >
                <Select options={MODIFIED_DOCUMENT_TYPE_OPTIONS} />
              </Form.Item>
            </Col>
            <Col xs={12} sm={5}>
              <Form.Item
                name="modifiedSeries"
                label="Serie"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={12} sm={5}>
              <Form.Item
                name="modifiedNumber"
                label="Número"
                rules={[{ required: true }]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col xs={24} sm={6}>
              <Form.Item
                name="modifiedIssueDate"
                label="Fecha"
                rules={[{ required: true }]}
                getValueProps={(v) => ({ value: v ? dayjs(v) : null })}
                getValueFromEvent={(d) => (d ? d.format("YYYY-MM-DD") : null)}
              >
                <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </>
      )}
    </>
  );
}
