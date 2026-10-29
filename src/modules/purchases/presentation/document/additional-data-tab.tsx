"use client";

import { Checkbox, Col, DatePicker, Divider, Form, Input, Row, Select, Space, type FormInstance } from "antd";
import dayjs from "dayjs";

import { requiredField } from "@/shared/lib/form-config";

import {
  forcesNonTaxed,
  MODIFIED_DOCUMENT_TYPE_OPTIONS,
  requiresModifiedDocument,
  type PurchaseKind,
} from "../../domain/purchase.types";
import type { DocumentFormValues } from "./document-model";
import { PerceptionTab } from "./perception-tab";
import type { DocumentPreview } from "./use-document-preview";

const DATE_FORMAT = "DD/MM/YYYY";

interface AdditionalDataTabProps {
  form: FormInstance<DocumentFormValues>;
  kind: PurchaseKind;
  preview: DocumentPreview | null;
  onRetentionTouched: () => void;
}

/** «Datos Adicionales»: documento modificado (NC/ND), precios con impuestos, percepción y retención. */
export function AdditionalDataTab({ form, kind, preview, onRetentionTouched }: AdditionalDataTabProps) {
  const documentType = Form.useWatch("documentType", form);
  const needsModified = requiresModifiedDocument(documentType ?? "");

  return (
    <Row gutter={32}>
      <Col xs={24} lg={12}>
        <Form.Item label="Doc. Modificado" required={needsModified}>
          <Space.Compact block>
            <Form.Item name="modifiedDocumentType" noStyle rules={needsModified ? [requiredField("Tipo del documento modificado")] : []}>
              <Select options={MODIFIED_DOCUMENT_TYPE_OPTIONS} placeholder="Tipo" style={{ width: 150 }} disabled={!needsModified} />
            </Form.Item>
            <Form.Item name="modifiedSeries" noStyle rules={needsModified ? [requiredField("Serie del documento modificado")] : []}>
              <Input placeholder="Serie" style={{ width: 90 }} maxLength={10} disabled={!needsModified} />
            </Form.Item>
            <Form.Item name="modifiedNumber" noStyle rules={needsModified ? [requiredField("Número del documento modificado")] : []}>
              <Input placeholder="Número" maxLength={20} disabled={!needsModified} />
            </Form.Item>
          </Space.Compact>
        </Form.Item>
        <Form.Item
          name="modifiedIssueDate"
          label="Fecha Doc. Modificado"
          rules={needsModified ? [requiredField("Fecha del documento modificado")] : []}
          getValueProps={(v) => ({ value: v ? dayjs(v) : null })}
          getValueFromEvent={(d) => (d ? d.format("YYYY-MM-DD") : null)}
        >
          <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} disabled={!needsModified} />
        </Form.Item>
        <Form.Item name="pricesIncludeTax" valuePropName="checked" label="Precios">
          <Checkbox disabled={forcesNonTaxed(documentType)}>Precios Incluyen Impuestos</Checkbox>
        </Form.Item>
      </Col>
      <Col xs={24} lg={12}>
        <Divider titlePlacement="start" plain style={{ marginTop: 0 }}>
          {kind === "expense" ? "Percepción / Retención" : "Percepción"}
        </Divider>
        <PerceptionTab form={form} kind={kind} preview={preview} onRetentionTouched={onRetentionTouched} />
      </Col>
    </Row>
  );
}
