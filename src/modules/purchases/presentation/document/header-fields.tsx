"use client";

import { useMemo, useState } from "react";
import { EllipsisOutlined } from "@ant-design/icons";
import { Button, Checkbox, Col, DatePicker, Form, Input, InputNumber, Row, Select, Space, Tooltip, type FormInstance } from "antd";
import dayjs from "dayjs";

import { useAccountingSchemes } from "@/modules/accounting/application/use-accounting-links";
import { useProration } from "@/modules/accounting/application/use-proration";
import { AnnexSelect } from "@/modules/annexes/presentation/annex-select";
import { ExpenseSheetSelect } from "@/modules/expense-sheets/presentation/expense-sheet-select";
import type { Supplier } from "@/modules/suppliers/domain/supplier.types";
import { requiredField } from "@/shared/lib/form-config";

import { useDetractions, useGoodsServicesClassifications } from "../../application/use-purchases";
import {
  CURRENCY_OPTIONS,
  forcesNonTaxed,
  IGV_RATE_OPTIONS,
  paymentConditionOptions,
  paymentConditionValue,
  SIEMPRESOFT_OPERATION_OPTIONS,
  SUNAT_OPERATION_TYPE_OPTIONS,
  type PurchaseKind,
} from "../../domain/purchase.types";
import { computeDueDate, formatAmount, type DocumentFormValues } from "./document-model";
import { SupplierSelect } from "./supplier-select";

interface Option {
  value: string;
  label: string;
}

interface HeaderFieldsProps {
  form: FormInstance<DocumentFormValues>;
  kind: PurchaseKind;
  documentTypeOptions: Option[];
  warehouseOptions: Option[];
  categoryOptions: Option[];
  exchangeRate?: string;
  /** Detracción calculada por el back (para mostrar el importe junto al %). */
  detractionAmount?: string;
  onSupplierChange: (supplier: Supplier | null) => void;
}

const DATE_FORMAT = "DD/MM/YYYY";

/**
 * Pestaña «Información General» del comprobante, con la distribución y los rótulos de SiempreSoft
 * («Nuevo Comprobante Servicio/Gasto»): columna izquierda de identificación y clasificación,
 * columna derecha de numeración, fechas e impuestos.
 */
export function HeaderFields({
  form,
  kind,
  documentTypeOptions,
  warehouseOptions,
  categoryOptions,
  exchangeRate,
  detractionAmount,
  onSupplierChange,
}: HeaderFieldsProps) {
  const documentType = Form.useWatch("documentType", form);
  const paymentTerm = Form.useWatch("paymentTerm", form);
  const currency = Form.useWatch("currency", form);
  const issueDate = Form.useWatch("issueDate", form);
  const accountingDate = Form.useWatch("accountingDate", form);
  const creditDays = Form.useWatch("creditDays", form);
  const installments = Form.useWatch("installments", form);
  const purchaseOrderId = Form.useWatch("purchaseOrderId", form);
  const operation = Form.useWatch("defaultOperationType", form);
  const [manualDueDate, setManualDueDate] = useState(false);
  const [detractionPickerOpen, setDetractionPickerOpen] = useState(false);

  const { data: schemes } = useAccountingSchemes();
  const { data: detractions } = useDetractions();
  const { data: classifications } = useGoodsServicesClassifications();
  const period = accountingDate ? accountingDate.format("YYYY-MM") : "";
  const { data: proration } = useProration(operation === "taxed_mixed" ? period : "");

  const dueDate = computeDueDate({ issueDate, paymentTerm, creditDays, installments });
  const operationLocked = forcesNonTaxed(documentType);
  const fromOrder = Boolean(purchaseOrderId);
  const isMerchandise = kind === "merchandise";

  const detractionOptions = useMemo(
    () =>
      (detractions ?? []).map((entry) => ({
        value: entry.code,
        label: `${entry.code} · ${entry.description}`,
        percent: Number(entry.meta?.percentage ?? 0),
      })),
    [detractions],
  );

  const setCondition = (value: string) => {
    if (value === "cash") {
      form.setFieldsValue({ paymentTerm: "cash", creditDays: 0 });
    } else {
      form.setFieldsValue({ paymentTerm: "credit", creditDays: Number(value.split(":")[1]) });
    }
    setManualDueDate(false);
  };

  const setDueDate = (date: dayjs.Dayjs | null) => {
    if (!date || !issueDate) return;
    const days = Math.max(0, date.startOf("day").diff(issueDate.startOf("day"), "day"));
    form.setFieldsValue(days > 0 ? { paymentTerm: "credit", creditDays: days } : { paymentTerm: "cash", creditDays: 0 });
  };

  return (
    <Row gutter={32}>
      {/* —— Columna izquierda —— */}
      <Col xs={24} lg={12}>
        <Form.Item label="ID Documento">
          <Input readOnly tabIndex={-1} placeholder="Se asigna al aceptar" style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="documentType" label="Tipo Comprobante" rules={[{ required: true }]}>
          <Select options={documentTypeOptions} showSearch={{ optionFilterProp: "label" }} />
        </Form.Item>
        <Form.Item
          name="defaultWarehouseId"
          label="Almacén"
          rules={isMerchandise ? [{ required: true, message: "Elige el almacén" }] : undefined}
        >
          <Select options={warehouseOptions} disabled={fromOrder} allowClear={!isMerchandise} placeholder="(Ninguno)" />
        </Form.Item>
        <Form.Item name="supplierId" label="Proveedor" rules={[{ required: true }]}>
          <SupplierSelect onSupplierChange={onSupplierChange} disabled={fromOrder} />
        </Form.Item>
        <Form.Item label="Condición Pago" required>
          <Select
            showSearch={{ optionFilterProp: "label" }}
            value={paymentConditionValue(paymentTerm, creditDays)}
            options={paymentConditionOptions(creditDays)}
            onChange={setCondition}
          />
        </Form.Item>
        <Form.Item name="paymentTerm" hidden rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="creditDays" hidden>
          <InputNumber />
        </Form.Item>
        <Form.Item name="currency" label="Moneda" rules={[{ required: true }]}>
          <Select options={CURRENCY_OPTIONS} />
        </Form.Item>
        <Form.Item name="accountingDate" label="Fecha Contable" rules={[{ required: true }]}>
          <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item
          name="defaultOperationType"
          label="Operación"
          rules={[{ required: true }]}
          tooltip={operationLocked ? "Boleta y recibo por honorarios: adquisiciones no gravadas" : undefined}
        >
          <Select options={SIEMPRESOFT_OPERATION_OPTIONS} disabled={operationLocked} popupMatchSelectWidth={false} />
        </Form.Item>
        <Form.Item name="accountingSchemeId" label="Esquema">
          <Select
            allowClear
            placeholder={schemes?.find((s) => s.is_default)?.name ?? "Esquema predeterminado"}
            options={schemes?.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))}
          />
        </Form.Item>
        <Form.Item name="annexId" label="Anexo">
          <AnnexSelect allowClear placeholder="(Ninguno)" />
        </Form.Item>
        <Form.Item name="goodsServicesClass" label="Clasif. Bien/Servicio">
          <Select
            allowClear
            placeholder="Tabla 30 SUNAT"
            options={(classifications ?? []).map((c) => ({ value: c.code, label: `${c.code} · ${c.description}` }))}
            popupMatchSelectWidth={false}
          />
        </Form.Item>
        <Form.Item name="sunatOperationType" label="Tipo de Operación">
          <Select allowClear placeholder="02 - COMPRA" options={SUNAT_OPERATION_TYPE_OPTIONS} />
        </Form.Item>
        <Form.Item name="expenseSheetId" label="Planilla Gasto">
          <ExpenseSheetSelect
            allowClear
            placeholder="(Ninguna)"
            onSelectExpenseSheet={() => {
              if (!form.getFieldValue("accountingCategoryCode") || form.getFieldValue("accountingCategoryCode") === "invoices_payable") {
                form.setFieldValue("accountingCategoryCode", "expense_reports");
              }
            }}
          />
        </Form.Item>
      </Col>

      {/* —— Columna derecha —— */}
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
        <Form.Item name="issueDate" label="Fecha Emisión" rules={[{ required: true }]}>
          <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
        </Form.Item>
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
        <Form.Item label="Tipo Cambio">
          <Input
            readOnly
            tabIndex={-1}
            value={currency === "PEN" ? "1.0000" : (exchangeRate ?? "")}
            placeholder="Se obtiene al calcular"
          />
        </Form.Item>
        <Form.Item label="Fecha Vencimiento">
          <Space.Compact block>
            <Tooltip title="Marcar para fijar la fecha a mano">
              <Checkbox
                checked={manualDueDate}
                onChange={(e) => setManualDueDate(e.target.checked)}
                style={{ padding: "0 8px", alignSelf: "center" }}
              />
            </Tooltip>
            <DatePicker
              format={DATE_FORMAT}
              style={{ width: "100%" }}
              value={dueDate ? dayjs(dueDate) : null}
              disabled={!manualDueDate}
              onChange={setDueDate}
            />
          </Space.Compact>
        </Form.Item>
        <Form.Item name="accountingCategoryCode" label="Categoría Contable">
          <Select options={categoryOptions} allowClear placeholder="Facturas por pagar" />
        </Form.Item>
        <Form.Item label="Factor Crédito Fiscal" tooltip="Prorrata del IGV del periodo; aplica a «Gravada destinada a gravadas y no gravadas».">
          <Input
            readOnly
            tabIndex={-1}
            value={operation === "taxed_mixed" ? (proration ? `${proration.percentage.toFixed(2)} %` : "Sin prorrata del periodo") : ""}
          />
        </Form.Item>
        <Form.Item label="Detracción (%)">
          <Space.Compact block>
            <Form.Item name="detractionPercent" noStyle>
              <InputNumber min={0} max={100} precision={2} style={{ width: 110 }} disabled />
            </Form.Item>
            <Tooltip title="Elegir el tipo de detracción">
              <Button icon={<EllipsisOutlined />} onClick={() => setDetractionPickerOpen((open) => !open)} />
            </Tooltip>
            <Input readOnly tabIndex={-1} value={detractionAmount && Number(detractionAmount) > 0 ? formatAmount(detractionAmount) : "0.00"} style={{ textAlign: "right" }} />
          </Space.Compact>
        </Form.Item>
        <Form.Item name="detractionCode" label=" " hidden={!detractionPickerOpen && !form.getFieldValue("detractionCode")}>
          <Select
            allowClear
            showSearch={{ optionFilterProp: "label" }}
            placeholder="Sin detracción"
            options={detractionOptions}
            popupMatchSelectWidth={false}
            onChange={(code) => {
              const option = detractionOptions.find((o) => o.value === code);
              form.setFieldValue("detractionPercent", option?.percent ?? null);
              if (!code) setDetractionPickerOpen(false);
            }}
          />
        </Form.Item>
        <Form.Item name="igvRate" label="Tasa IGV">
          <Select options={IGV_RATE_OPTIONS} disabled={operationLocked} />
        </Form.Item>
      </Col>
    </Row>
  );
}
