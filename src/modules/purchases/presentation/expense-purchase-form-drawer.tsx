"use client";

import { useEffect, useMemo } from "react";
import { DeleteOutlined, PlusOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Col,
  DatePicker,
  Divider,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { ApiError } from "@/core/http/api-error";
import { useAccounts } from "@/modules/accounting/application/use-accounts";
import { usePaymentTerms, useSuppliers } from "@/modules/suppliers/application/use-suppliers";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";
import { requiredField } from "@/shared/lib/form-config";

import {
  useCreateExpensePurchase,
  usePreviewExpensePurchase,
  usePurchaseOperationTypes,
} from "../application/use-purchases";
import {
  CURRENCY_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  type ExpensePurchaseInput,
  type ExpensePurchasePreview,
} from "../domain/purchase.types";
import { PurchaseGapFieldsSection } from "./purchase-gap-fields-section";
import { PurchaseTotalsPanel } from "./purchase-totals-panel";

const BACKEND_FIELDS: Record<string, string> = {
  document_type: "documentType",
  series: "series",
  number: "number",
  supplier_id: "supplierId",
  issue_date: "issueDate",
  accounting_date: "accountingDate",
  payment_term: "paymentTerm",
  credit_days: "creditDays",
  currency: "currency",
  default_operation_type: "defaultOperationType",
  isc_amount: "iscAmount",
  discount_amount: "discountAmount",
  detraction_code: "detractionCode",
  detraction_percent: "detractionPercent",
  modified_document_type: "modifiedDocumentType",
  modified_series: "modifiedSeries",
  modified_number: "modifiedNumber",
  modified_issue_date: "modifiedIssueDate",
  lines: "lines",
};

type FormValues = {
  documentType: string;
  series: string;
  number: string;
  supplierId: string;
  issueDate: Dayjs;
  accountingDate: Dayjs;
  paymentTerm: string;
  creditDays: number;
  currency: string;
  defaultOperationType: string;
  observations?: string;
  receptionNumber?: string;
  beneficiaryName?: string;
  beneficiaryDocument?: string;
  iscAmount?: number;
  discountAmount?: number;
  detractionCode?: string;
  detractionPercent?: number;
  modifiedDocumentType?: string;
  modifiedSeries?: string;
  modifiedNumber?: string;
  modifiedIssueDate?: string;
  lines: {
    accountId: string;
    description: string;
    grossTotal: number;
    operationType: string;
  }[];
};

interface ExpensePurchaseFormDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function ExpensePurchaseFormDrawer({ open, onClose }: ExpensePurchaseFormDrawerProps) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const create = useCreateExpensePurchase();
  const preview = usePreviewExpensePurchase();
  const { data: operationTypes } = usePurchaseOperationTypes();
  const { data: paymentTerms } = usePaymentTerms();
  const { data: suppliersPage } = useSuppliers({ page: 1, perPage: 200, status: "active" });
  const { data: accountsPage } = useAccounts({
    page: 1,
    perPage: 200,
    only_leaves: true,
    only_active: true,
  });

  const paymentTerm = Form.useWatch("paymentTerm", form);
  const currency = Form.useWatch("currency", form) ?? "PEN";

  useEffect(() => {
    if (!open) return;
    const today = dayjs();
    form.setFieldsValue({
      documentType: "01",
      currency: "PEN",
      paymentTerm: "cash",
      creditDays: 0,
      issueDate: today,
      accountingDate: today,
      defaultOperationType: "taxed_taxed",
      lines: [{ operationType: "taxed_taxed" }],
    });
    preview.reset();
    create.reset();
  }, [open, form]);

  useEffect(() => {
    if (paymentTerm === "cash") form.setFieldValue("creditDays", 0);
  }, [paymentTerm, form]);

  const supplierOptions = useMemo(
    () =>
      (suppliersPage?.items ?? []).map((s) => ({
        value: s.id,
        label: `${s.business_name} · ${s.document_number}`,
      })),
    [suppliersPage],
  );

  const accountOptions = useMemo(
    () =>
      (accountsPage?.items ?? []).map((a) => ({
        value: a.id,
        label: `${a.code} · ${a.name}`,
        name: a.name,
      })),
    [accountsPage],
  );

  const close = () => {
    form.resetFields();
    preview.reset();
    create.reset();
    onClose();
  };

  const toInput = (values: FormValues): ExpensePurchaseInput => ({
    documentType: values.documentType,
    series: values.series.trim().toUpperCase(),
    number: values.number.trim(),
    supplierId: values.supplierId,
    issueDate: values.issueDate.format("YYYY-MM-DD"),
    accountingDate: values.accountingDate.format("YYYY-MM-DD"),
    paymentTerm: values.paymentTerm,
    creditDays: values.creditDays ?? 0,
    currency: values.currency,
    defaultOperationType: values.defaultOperationType,
    observations: values.observations || null,
    receptionNumber: values.receptionNumber || null,
    beneficiaryName: values.beneficiaryName || null,
    beneficiaryDocument: values.beneficiaryDocument || null,
    iscAmount: values.iscAmount ?? 0,
    discountAmount: values.discountAmount ?? 0,
    detractionCode: values.detractionCode || null,
    detractionPercent: values.detractionPercent ?? null,
    modifiedDocumentType: values.modifiedDocumentType || null,
    modifiedSeries: values.modifiedSeries || null,
    modifiedNumber: values.modifiedNumber || null,
    modifiedIssueDate: values.modifiedIssueDate || null,
    lines: values.lines.map((line) => ({
      accountId: line.accountId,
      description: line.description.trim(),
      grossTotal: line.grossTotal,
      operationType: line.operationType || values.defaultOperationType,
    })),
  });

  const runPreview = async () => {
    try {
      const values = await form.validateFields([
        "currency",
        "issueDate",
        "defaultOperationType",
        "lines",
        "iscAmount",
        "discountAmount",
        "detractionCode",
        "detractionPercent",
      ]);
      const incomplete = values.lines.some((l) => !l.accountId || !l.description?.trim() || !l.grossTotal);
      if (incomplete) {
        message.warning("Completa cuenta, descripción e importe en cada línea");
        return;
      }
      await preview.mutateAsync(toInput(values as FormValues));
    } catch {
      /* validation */
    }
  };

  const onFinish = (values: FormValues) => {
    create.mutate(toInput(values), {
      onSuccess: (purchase) => {
        message.success(`Gasto registrado · correlativo ${purchase.registration_code}`);
        close();
      },
      onError: (error) => applyApiFieldErrors(form, error, BACKEND_FIELDS),
    });
  };

  const previewData = preview.data as ExpensePurchasePreview | undefined;
  const error = create.error instanceof ApiError ? create.error : null;

  return (
    <Drawer
      title="Nueva compra de gastos"
      open={open}
      onClose={close}
      size={920}
      destroyOnHidden
      extra={
        <Space size={12}>
          <Button onClick={runPreview} loading={preview.isPending}>
            Calcular totales
          </Button>
          <Button type="primary" onClick={() => form.submit()} loading={create.isPending}>
            Registrar
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        {error && <Alert type="error" showIcon style={{ marginBottom: 16 }} message={error.message} />}

        <Typography.Text type="secondary">Documento y proveedor</Typography.Text>
        <Row gutter={12} style={{ marginTop: 8 }}>
          <Col xs={24} sm={8}>
            <Form.Item name="documentType" label="Tipo" rules={[{ required: true }]}>
              <Select options={DOCUMENT_TYPE_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item name="series" label="Serie" rules={[{ required: true }]}>
              <Input placeholder="F001" />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item name="number" label="Número" rules={[{ required: true }]}>
              <Input placeholder="000123" />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item name="supplierId" label="Proveedor" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" options={supplierOptions} placeholder="Buscar proveedor" />
            </Form.Item>
          </Col>
        </Row>

        <Typography.Text type="secondary">Fechas y pago</Typography.Text>
        <Row gutter={12} style={{ marginTop: 8 }}>
          <Col xs={24} sm={8}>
            <Form.Item name="issueDate" label="Emisión" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="accountingDate" label="Contabilización" rules={[{ required: true }]}>
              <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="paymentTerm" label="Condición" rules={[{ required: true }]}>
              <Select options={(paymentTerms ?? []).map((t) => ({ value: t.value, label: t.label }))} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item name="creditDays" label="Días crédito" rules={[{ required: true }]}>
              <InputNumber min={0} max={999} style={{ width: "100%" }} disabled={paymentTerm === "cash"} />
            </Form.Item>
          </Col>
          <Col xs={12} sm={8}>
            <Form.Item name="currency" label="Moneda" rules={[{ required: true }]}>
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} sm={8}>
            <Form.Item name="defaultOperationType" label="Operación por defecto" rules={[{ required: true }]}>
              <Select options={(operationTypes ?? []).map((o) => ({ value: o.value, label: o.label }))} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item name="observations" label="Observaciones">
          <Input.TextArea rows={2} maxLength={1000} />
        </Form.Item>

        <Divider style={{ margin: "8px 0 16px" }} />

        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
          <Typography.Text strong>Líneas a cuenta contable</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            El IGV no deducible se suma al gasto
          </Typography.Text>
        </Flex>

        <Form.List name="lines">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, ...field }) => (
                <Row key={key} gutter={8} align="top" style={{ marginBottom: 8 }}>
                  <Col xs={24} md={8}>
                    <Form.Item
                      {...field}
                      name={[field.name, "accountId"]}
                      rules={[requiredField("Cuenta")]}
                      style={{ marginBottom: 8 }}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        options={accountOptions}
                        placeholder="Cuenta de movimiento"
                        onChange={(accountId) => {
                          const account = accountOptions.find((o) => o.value === accountId);
                          const desc = form.getFieldValue(["lines", field.name, "description"]);
                          if (account && !desc) {
                            form.setFieldValue(["lines", field.name, "description"], account.name);
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={6}>
                    <Form.Item
                      {...field}
                      name={[field.name, "description"]}
                      rules={[requiredField("Descripción")]}
                      style={{ marginBottom: 8 }}
                    >
                      <Input placeholder="Descripción del gasto" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Item
                      {...field}
                      name={[field.name, "grossTotal"]}
                      rules={[requiredField("Importe")]}
                      style={{ marginBottom: 8 }}
                    >
                      <InputNumber min={0.01} precision={2} style={{ width: "100%" }} placeholder="Total" />
                    </Form.Item>
                  </Col>
                  <Col xs={10} md={5}>
                    <Form.Item
                      {...field}
                      name={[field.name, "operationType"]}
                      rules={[requiredField("Tipo de operación")]}
                      style={{ marginBottom: 8 }}
                    >
                      <Select options={(operationTypes ?? []).map((o) => ({ value: o.value, label: o.label }))} />
                    </Form.Item>
                  </Col>
                  <Col xs={2} md={1}>
                    <Button
                      type="text"
                      danger
                      icon={<DeleteOutlined />}
                      disabled={fields.length === 1}
                      onClick={() => remove(field.name)}
                    />
                  </Col>
                </Row>
              ))}
              <Button
                type="dashed"
                icon={<PlusOutlined />}
                onClick={() =>
                  add({
                    operationType: form.getFieldValue("defaultOperationType") || "taxed_taxed",
                  })
                }
                block
              >
                Agregar línea
              </Button>
            </>
          )}
        </Form.List>

        <Divider style={{ margin: "16px 0" }} />
        <PurchaseGapFieldsSection form={form} showReceptionNumber={false} />

        {previewData && (
          <PurchaseTotalsPanel
            totals={previewData.totals}
            currency={currency}
            exchangeRate={previewData.exchange_rate}
          />
        )}
      </Form>
    </Drawer>
  );
}

