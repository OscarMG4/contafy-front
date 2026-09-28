"use client";

import { useEffect, useMemo } from "react";
import {
  BankOutlined,
  CalendarOutlined,
  DeleteOutlined,
  FileTextOutlined,
  LinkOutlined,
  PlusOutlined,
  ShopOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Table,
  Typography,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useRouter } from "next/navigation";

import { ApiError } from "@/core/http/api-error";
import { useAccounts } from "@/modules/accounting/application/use-accounts";
import { usePaymentTerms, useSuppliers } from "@/modules/suppliers/application/use-suppliers";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";
import { requiredField } from "@/shared/lib/form-config";
import { formatMoney } from "@/shared/lib/format";
import { DocumentFormLayout } from "@/shared/ui/document-form-layout";
import { FormSection } from "@/shared/ui/form-section";

import {
  useAllocationMethods,
  useCreateAdditionalCostPurchase,
  usePreviewAdditionalCostPurchase,
  usePurchaseOperationTypes,
  usePurchases,
} from "../application/use-purchases";
import {
  CURRENCY_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  type AdditionalCostPurchaseInput,
  type AdditionalCostPurchasePreview,
  type AllocationMethod,
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
  reception_date: "receptionDate",
  reception_number: "receptionNumber",
  payment_term: "paymentTerm",
  credit_days: "creditDays",
  currency: "currency",
  default_operation_type: "defaultOperationType",
  allocation_method: "allocationMethod",
  target_purchase_ids: "targetPurchaseIds",
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
  receptionDate: Dayjs;
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
  allocationMethod: AllocationMethod;
  targetPurchaseIds: string[];
  lines: {
    accountId: string;
    description: string;
    grossTotal: number;
    operationType: string;
  }[];
};

function money(value?: string, currency = "PEN") {
  if (value == null) return "—";
  const n = Number(value);
  if (currency === "PEN") return formatMoney(n);
  return `${currency} ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

/** Document entry form (VendorBill-style): 17/7 + FormSection + sidebar sticky. */
export function AdditionalCostPurchaseForm() {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const router = useRouter();
  const create = useCreateAdditionalCostPurchase();
  const preview = usePreviewAdditionalCostPurchase();
  const { data: operationTypes } = usePurchaseOperationTypes();
  const { data: allocationMethods } = useAllocationMethods();
  const { data: paymentTerms } = usePaymentTerms();
  const { data: suppliersPage } = useSuppliers({ page: 1, perPage: 200, status: "active" });
  const { data: accountsPage } = useAccounts({
    page: 1,
    perPage: 200,
    only_leaves: true,
    only_active: true,
  });
  const { data: merchandisePage } = usePurchases({
    page: 1,
    perPage: 100,
    kind: "merchandise",
    status: "registered",
  });

  const paymentTerm = Form.useWatch("paymentTerm", form);
  const currency = Form.useWatch("currency", form) ?? "PEN";
  const targetPurchaseIds = Form.useWatch("targetPurchaseIds", form) ?? [];
  const allocationMethod = Form.useWatch("allocationMethod", form);

  useEffect(() => {
    const today = dayjs();
    form.setFieldsValue({
      documentType: "01",
      currency: "PEN",
      paymentTerm: "cash",
      creditDays: 0,
      issueDate: today,
      accountingDate: today,
      receptionDate: today,
      defaultOperationType: "taxed_taxed",
      allocationMethod: "by_quantity",
      targetPurchaseIds: [],
      lines: [{ operationType: "taxed_taxed" }],
    });
  }, [form]);

  useEffect(() => {
    if (paymentTerm === "cash") form.setFieldValue("creditDays", 0);
  }, [paymentTerm, form]);

  useEffect(() => {
    if (!targetPurchaseIds.length) return;
    const first = (merchandisePage?.items ?? []).find((p) => p.id === targetPurchaseIds[0]);
    if (first?.reception_date) {
      form.setFieldValue("receptionDate", dayjs(first.reception_date));
    }
  }, [targetPurchaseIds, merchandisePage, form]);

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

  const merchandiseOptions = useMemo(
    () =>
      (merchandisePage?.items ?? []).map((p) => ({
        value: p.id,
        label: `${p.registration_code} · ${p.series}-${p.number} · ${p.supplier_business_name}`,
      })),
    [merchandisePage],
  );

  const toInput = (values: FormValues): AdditionalCostPurchaseInput => ({
    documentType: values.documentType,
    series: values.series.trim().toUpperCase(),
    number: values.number.trim(),
    supplierId: values.supplierId,
    issueDate: values.issueDate.format("YYYY-MM-DD"),
    accountingDate: values.accountingDate.format("YYYY-MM-DD"),
    receptionDate: values.receptionDate.format("YYYY-MM-DD"),
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
    allocationMethod: values.allocationMethod,
    targetPurchaseIds: values.targetPurchaseIds,
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
        "allocationMethod",
        "targetPurchaseIds",
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
      if (!values.targetPurchaseIds?.length) {
        message.warning("Selecciona al menos una compra de mercadería");
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
        message.success(`Costo adicional registrado · correlativo ${purchase.registration_code}`);
        router.push("/purchases");
      },
      onError: (error) => applyApiFieldErrors(form, error, BACKEND_FIELDS),
    });
  };

  const previewData = preview.data as AdditionalCostPurchasePreview | undefined;
  const error = create.error instanceof ApiError ? create.error : null;

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <DocumentFormLayout
        title="Nuevo costo adicional"
        subtitle="Flete u otro servicio vinculado a mercadería · ajuste de kardex (0 uds)"
        backHref="/purchases"
        main={
          <>
            {error && <Alert type="error" showIcon message={error.message} />}

            <FormSection icon={<ShopOutlined />} title="Proveedor y documento">
              <Card size="small">
                <Row gutter={[16, 0]}>
                  <Col xs={24} sm={8} md={6}>
                    <Form.Item name="documentType" label="Tipo" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                      <Select options={DOCUMENT_TYPE_OPTIONS} />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={5}>
                    <Form.Item name="series" label="Serie" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                      <Input placeholder="F001" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} sm={8} md={5}>
                    <Form.Item name="number" label="Número" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                      <Input placeholder="000123" />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item name="supplierId" label="Proveedor" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                      <Select
                        showSearch
                        optionFilterProp="label"
                        options={supplierOptions}
                        placeholder="Buscar proveedor"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item
                      name="defaultOperationType"
                      label="Operación por defecto"
                      rules={[{ required: true }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select options={(operationTypes ?? []).map((o) => ({ value: o.value, label: o.label }))} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} md={8}>
                    <Form.Item name="currency" label="Moneda" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                      <Select options={CURRENCY_OPTIONS} />
                    </Form.Item>
                  </Col>
                </Row>
              </Card>
            </FormSection>

            <FormSection icon={<LinkOutlined />} title="Vinculación a mercadería">
              <Card size="small">
                <Row gutter={[16, 0]}>
                  <Col xs={24} md={16}>
                    <Form.Item
                      name="targetPurchaseIds"
                      label="Compras de mercadería"
                      rules={[requiredField("Compras de mercadería")]}
                      style={{ marginBottom: 12 }}
                    >
                      <Select
                        mode="multiple"
                        showSearch
                        optionFilterProp="label"
                        options={merchandiseOptions}
                        placeholder="Compras registradas a las que se imputa el costo"
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={24} md={8}>
                    <Form.Item
                      name="allocationMethod"
                      label="Método de reparto"
                      rules={[{ required: true }]}
                      style={{ marginBottom: 12 }}
                    >
                      <Select options={(allocationMethods ?? []).map((m) => ({ value: m.value, label: m.label }))} />
                    </Form.Item>
                  </Col>
                </Row>
                {allocationMethod === "manual" && (
                  <Alert
                    type="info"
                    showIcon
                    message="El reparto manual exige que la suma de montos PEN por línea coincida con el monto a repartir."
                  />
                )}
              </Card>
            </FormSection>

            <FormSection
              icon={<FileTextOutlined />}
              title="Líneas del servicio"
              extra={
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  Se reparte base + IGV no deducible (PEN)
                </Typography.Text>
              }
            >
              <Card size="small">
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
                              <Input placeholder="Descripción" />
                            </Form.Item>
                          </Col>
                          <Col xs={12} md={4}>
                            <Form.Item
                              {...field}
                              name={[field.name, "grossTotal"]}
                              rules={[requiredField("Importe")]}
                              style={{ marginBottom: 8 }}
                            >
                              <InputNumber min={0.01} step={0.01} style={{ width: "100%" }} placeholder="Total" />
                            </Form.Item>
                          </Col>
                          <Col xs={10} md={5}>
                            <Form.Item
                              {...field}
                              name={[field.name, "operationType"]}
                              rules={[requiredField("Tipo de operación")]}
                              style={{ marginBottom: 8 }}
                            >
                              <Select
                                options={(operationTypes ?? []).map((o) => ({ value: o.value, label: o.label }))}
                              />
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
                        onClick={() => add({ operationType: "taxed_taxed" })}
                        block
                      >
                        Agregar línea
                      </Button>
                    </>
                  )}
                </Form.List>
              </Card>
            </FormSection>

            <FormSection icon={<BankOutlined />} title="Resumen y reparto">
              <Card size="small">
                <Flex gap={8} wrap style={{ marginBottom: previewData ? 16 : 0 }}>
                  <Button onClick={runPreview} loading={preview.isPending}>
                    Calcular reparto
                  </Button>
                  <Button type="primary" htmlType="submit" loading={create.isPending}>
                    Registrar costo adicional
                  </Button>
                </Flex>

                {previewData && (
                  <>
                    <Flex justify="space-between" style={{ marginBottom: 12 }} wrap gap={8}>
                      <Typography.Text>
                        A repartir PEN: <strong>{money(previewData.amount_to_allocate_pen)}</strong>
                      </Typography.Text>
                      <Typography.Text type="secondary">
                        Total doc. {money(previewData.totals.total, currency)}
                        {previewData.exchange_rate !== "1.0000" && ` · TC ${previewData.exchange_rate}`}
                      </Typography.Text>
                    </Flex>
                    <Table
                      size="small"
                      pagination={false}
                      rowKey={(r) => `${r.target_purchase_id}-${r.target_line_number}`}
                      dataSource={previewData.allocations}
                      columns={[
                        { title: "Compra", dataIndex: "target_purchase_id", ellipsis: true },
                        { title: "Línea", dataIndex: "target_line_number", width: 70 },
                        {
                          title: "Monto PEN",
                          dataIndex: "allocated_amount_pen",
                          align: "right",
                          width: 120,
                          render: (v: string) => money(v),
                        },
                      ]}
                    />
                  </>
                )}
              </Card>
            </FormSection>
          </>
        }
        sidebar={
          <>
            <FormSection icon={<CalendarOutlined />} title="Fechas">
              <Card size="small">
                <Form.Item name="issueDate" label="Emisión" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item
                  name="accountingDate"
                  label="Contabilización"
                  rules={[{ required: true }]}
                  style={{ marginBottom: 12 }}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item
                  name="receptionDate"
                  label="Recepción (kardex)"
                  rules={[{ required: true }]}
                  extra="Se sugiere la de la mercadería vinculada"
                  style={{ marginBottom: 0 }}
                >
                  <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
                </Form.Item>
              </Card>
            </FormSection>

            <FormSection icon={<FileTextOutlined />} title="Pago">
              <Card size="small">
                <Form.Item name="paymentTerm" label="Condición" rules={[{ required: true }]} style={{ marginBottom: 12 }}>
                  <Select options={(paymentTerms ?? []).map((t) => ({ value: t.value, label: t.label }))} />
                </Form.Item>
                <Form.Item name="creditDays" label="Días crédito" rules={[{ required: true }]} style={{ marginBottom: 0 }}>
                  <InputNumber min={0} max={999} style={{ width: "100%" }} disabled={paymentTerm === "cash"} />
                </Form.Item>
              </Card>
            </FormSection>

            <FormSection icon={<FileTextOutlined />} title="Datos adicionales">
              <Card size="small">
                <PurchaseGapFieldsSection form={form} showReceptionNumber />
              </Card>
            </FormSection>

            {previewData && (
              <FormSection icon={<FileTextOutlined />} title="Totales">
                <PurchaseTotalsPanel
                  totals={previewData.totals}
                  currency={currency}
                  exchangeRate={previewData.exchange_rate}
                />
              </FormSection>
            )}

            <FormSection icon={<FileTextOutlined />} title="Observaciones">
              <Card size="small">
                <Form.Item name="observations" style={{ marginBottom: 0 }}>
                  <Input.TextArea rows={4} maxLength={1000} placeholder="Notas internas" />
                </Form.Item>
              </Card>
            </FormSection>
          </>
        }
      />
    </Form>
  );
}
