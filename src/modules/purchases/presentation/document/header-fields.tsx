"use client";

import { Checkbox, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, type FormInstance } from "antd";
import dayjs from "dayjs";

import type { Supplier } from "@/modules/suppliers/domain/supplier.types";
import { requiredField } from "@/shared/lib/form-config";

import {
  CURRENCY_OPTIONS,
  forcesNonTaxed,
  MODIFIED_DOCUMENT_TYPE_OPTIONS,
  requiresModifiedDocument,
  type PurchaseKind,
} from "../../domain/purchase.types";
import { computeDueDate, type DocumentFormValues } from "./document-model";
import { SupplierSelect } from "./supplier-select";

interface Option {
  value: string;
  label: string;
}

interface HeaderFieldsProps {
  form: FormInstance<DocumentFormValues>;
  kind: PurchaseKind;
  documentTypeOptions: Option[];
  operationOptions: Option[];
  warehouseOptions: Option[];
  paymentTermOptions: Option[];
  categoryOptions: Option[];
  exchangeRate?: string;
  onSupplierChange: (supplier: Supplier | null) => void;
}

const DATE_FORMAT = "DD/MM/YYYY";

/** Pestaña "Información General": cabecera en 2 columnas con los nombres de SiempreSoft. */
export function HeaderFields({
  form,
  kind,
  documentTypeOptions,
  operationOptions,
  warehouseOptions,
  paymentTermOptions,
  categoryOptions,
  exchangeRate,
  onSupplierChange,
}: HeaderFieldsProps) {
  const documentType = Form.useWatch("documentType", form);
  const paymentTerm = Form.useWatch("paymentTerm", form);
  const currency = Form.useWatch("currency", form);
  const issueDate = Form.useWatch("issueDate", form);
  const creditDays = Form.useWatch("creditDays", form);
  const installments = Form.useWatch("installments", form);
  const purchaseOrderId = Form.useWatch("purchaseOrderId", form);

  const dueDate = computeDueDate({ issueDate, paymentTerm, creditDays, installments });
  const operationLocked = forcesNonTaxed(documentType);
  const needsModified = requiresModifiedDocument(documentType ?? "");
  const fromOrder = Boolean(purchaseOrderId);

  return (
    <Row gutter={24}>
      <Col xs={24} lg={12}>
        <Form.Item name="documentType" label="Tipo Comprobante" rules={[{ required: true }]}>
          <Select options={documentTypeOptions} showSearch={{ optionFilterProp: "label" }} />
        </Form.Item>
      </Col>
      <Col xs={24} lg={12}>
        <Form.Item label="Nro. Comprobante" required>
          <Space.Compact block>
            <Form.Item name="series" noStyle rules={[requiredField("Serie")]}>
              <Input placeholder="Serie" maxLength={10} style={{ width: 100, textTransform: "uppercase" }} />
            </Form.Item>
            <Form.Item name="number" noStyle rules={[requiredField("Número")]}>
              <Input placeholder="Número" maxLength={20} />
            </Form.Item>
          </Space.Compact>
        </Form.Item>
      </Col>

      {kind === "merchandise" ? (
        <Col xs={24} lg={12}>
          <Form.Item name="defaultWarehouseId" label="Almacén" rules={[{ required: true }]}>
            <Select options={warehouseOptions} disabled={fromOrder} />
          </Form.Item>
        </Col>
      ) : (
        <Col xs={0} lg={12} />
      )}
      <Col xs={24} lg={12}>
        <Form.Item name="issueDate" label="Fecha Doc." rules={[{ required: true }]}>
          <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
        </Form.Item>
      </Col>

      <Col xs={24} lg={12}>
        <Form.Item name="supplierId" label="Proveedor" rules={[{ required: true }]}>
          <SupplierSelect onSupplierChange={onSupplierChange} disabled={fromOrder} />
        </Form.Item>
      </Col>
      <Col xs={24} lg={12}>
        <Form.Item label="Beneficiario">
          <Space.Compact block>
            <Form.Item name="beneficiaryDocument" noStyle>
              <Input placeholder="Doc." maxLength={20} style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="beneficiaryName" noStyle>
              <Input placeholder="Nombre o razón social (opcional)" maxLength={200} />
            </Form.Item>
          </Space.Compact>
        </Form.Item>
      </Col>

      <Col xs={24} lg={12}>
        <Form.Item label="Condición Pago" required>
          <Space.Compact block>
            <Form.Item name="paymentTerm" noStyle rules={[{ required: true }]}>
              <Select options={paymentTermOptions} style={{ width: "60%" }} />
            </Form.Item>
            <Form.Item name="creditDays" noStyle>
              <InputNumber
                min={0}
                max={999}
                precision={0}
                disabled={paymentTerm === "cash"}
                style={{ width: "40%" }}
                suffix="días"
              />
            </Form.Item>
          </Space.Compact>
        </Form.Item>
      </Col>
      <Col xs={24} lg={12}>
        <Form.Item label="Tasa Cambio">
          <Input
            readOnly
            tabIndex={-1}
            value={currency === "PEN" ? "1.0000" : (exchangeRate ?? "")}
            placeholder="Se obtiene al calcular"
          />
        </Form.Item>
      </Col>

      <Col xs={24} lg={12}>
        <Form.Item name="currency" label="Moneda" rules={[{ required: true }]}>
          <Select options={CURRENCY_OPTIONS} />
        </Form.Item>
      </Col>
      <Col xs={24} lg={12}>
        <Form.Item label="Fecha Vencimiento">
          <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} value={dueDate ? dayjs(dueDate) : null} disabled />
        </Form.Item>
      </Col>

      <Col xs={24} lg={12}>
        <Form.Item name="accountingDate" label="Fecha Contable" rules={[{ required: true }]}>
          <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
        </Form.Item>
      </Col>
      <Col xs={24} lg={12}>
        <Form.Item name="accountingCategoryCode" label="Categoría Contable">
          <Select options={categoryOptions} allowClear placeholder="Facturas por pagar" />
        </Form.Item>
      </Col>

      <Col xs={24} lg={12}>
        <Form.Item
          name="defaultOperationType"
          label="Operación"
          rules={[{ required: true }]}
          tooltip={operationLocked ? "Boleta y recibo por honorarios: todas las líneas van No gravadas" : undefined}
        >
          <Select options={operationOptions} disabled={operationLocked} popupMatchSelectWidth={false} />
        </Form.Item>
      </Col>
      <Col xs={24} lg={12}>
        <Form.Item name="pricesIncludeTax" valuePropName="checked" label=" " colon={false}>
          <Checkbox disabled={operationLocked}>Precios Incluyen Impuestos</Checkbox>
        </Form.Item>
      </Col>

      {needsModified && (
        <Col span={24}>
          <Form.Item label="Doc. Modificado" required>
            <Space.Compact block>
              <Form.Item name="modifiedDocumentType" noStyle rules={[requiredField("Tipo del documento modificado")]}>
                <Select options={MODIFIED_DOCUMENT_TYPE_OPTIONS} placeholder="Tipo" style={{ width: 160 }} />
              </Form.Item>
              <Form.Item name="modifiedSeries" noStyle rules={[requiredField("Serie del documento modificado")]}>
                <Input placeholder="Serie" style={{ width: 100 }} maxLength={10} />
              </Form.Item>
              <Form.Item name="modifiedNumber" noStyle rules={[requiredField("Número del documento modificado")]}>
                <Input placeholder="Número" style={{ width: 140 }} maxLength={20} />
              </Form.Item>
              <Form.Item
                name="modifiedIssueDate"
                noStyle
                rules={[requiredField("Fecha del documento modificado")]}
                getValueProps={(v) => ({ value: v ? dayjs(v) : null })}
                getValueFromEvent={(d) => (d ? d.format("YYYY-MM-DD") : null)}
              >
                <DatePicker format={DATE_FORMAT} placeholder="Fecha" style={{ width: 150 }} />
              </Form.Item>
            </Space.Compact>
          </Form.Item>
        </Col>
      )}
    </Row>
  );
}
