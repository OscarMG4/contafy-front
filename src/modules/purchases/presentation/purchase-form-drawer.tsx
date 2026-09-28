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
import { usePaymentTerms, useSuppliers } from "@/modules/suppliers/application/use-suppliers";
import { useProducts } from "@/modules/products/application/use-products";
import { useWarehouses } from "@/modules/warehouses/application/use-warehouses";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";
import { requiredField } from "@/shared/lib/form-config";

import {
  useCreatePurchase,
  usePreviewPurchase,
  usePurchaseOperationTypes,
} from "../application/use-purchases";
import {
  CURRENCY_OPTIONS,
  DOCUMENT_TYPE_OPTIONS,
  type PurchaseInput,
  type PurchasePreview,
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
  reception_id: "receptionId",
  beneficiary_name: "beneficiaryName",
  beneficiary_document: "beneficiaryDocument",
  payment_term: "paymentTerm",
  credit_days: "creditDays",
  currency: "currency",
  default_warehouse_id: "defaultWarehouseId",
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
  receptionDate: Dayjs;
  paymentTerm: string;
  creditDays: number;
  currency: string;
  defaultWarehouseId?: string;
  defaultOperationType: string;
  observations?: string;
  receptionNumber?: string;
  receptionId?: string;
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
    productId: string;
    warehouseId: string;
    quantity: number;
    grossTotal: number;
    operationType: string;
  }[];
};

interface PurchaseFormDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function PurchaseFormDrawer({ open, onClose }: PurchaseFormDrawerProps) {
  const [form] = Form.useForm<FormValues>();
  const { message } = App.useApp();
  const create = useCreatePurchase();
  const preview = usePreviewPurchase();
  const { data: operationTypes } = usePurchaseOperationTypes();
  const { data: paymentTerms } = usePaymentTerms();
  const { data: suppliersPage } = useSuppliers({ page: 1, perPage: 200, status: "active" });
  const { data: productsPage } = useProducts({ page: 1, perPage: 200, status: "active" });
  const { data: warehousesPage } = useWarehouses({ page: 1, perPage: 200, status: "active" });

  const paymentTerm = Form.useWatch("paymentTerm", form);
  const defaultWarehouseId = Form.useWatch("defaultWarehouseId", form);
  const defaultOperationType = Form.useWatch("defaultOperationType", form);
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
      receptionDate: today,
      defaultOperationType: "taxed_taxed",
      lines: [{ quantity: 1, operationType: "taxed_taxed" }],
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

  const productOptions = useMemo(
    () =>
      (productsPage?.items ?? []).map((p) => ({
        value: p.id,
        label: `${p.code} · ${p.description}`,
        operationType: p.default_operation_type,
      })),
    [productsPage],
  );

  const warehouseOptions = useMemo(
    () => (warehousesPage?.items ?? []).map((w) => ({ value: w.id, label: w.name })),
    [warehousesPage],
  );

  const close = () => {
    form.resetFields();
    preview.reset();
    create.reset();
    onClose();
  };

  const toInput = (values: FormValues): PurchaseInput => ({
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
    defaultWarehouseId: values.defaultWarehouseId || null,
    defaultOperationType: values.defaultOperationType,
    observations: values.observations || null,
    receptionNumber: values.receptionNumber || null,
    receptionId: values.receptionId || null,
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
      productId: line.productId,
      warehouseId: line.warehouseId || values.defaultWarehouseId!,
      quantity: line.quantity,
      grossTotal: line.grossTotal,
      operationType: line.operationType || values.defaultOperationType,
    })),
  });

  const runPreview = async () => {
    try {
      const values = await form.validateFields([
        "currency",
        "issueDate",
        "defaultWarehouseId",
        "defaultOperationType",
        "lines",
        "iscAmount",
        "discountAmount",
        "detractionCode",
        "detractionPercent",
      ]);
      const incomplete = values.lines.some(
        (l) => !l.productId || !(l.warehouseId || values.defaultWarehouseId) || !l.quantity || !l.grossTotal,
      );
      if (incomplete) {
        message.warning("Completa producto, almacén, cantidad e importe en cada línea");
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
        message.success(`Compra registrada · correlativo ${purchase.registration_code}`);
        close();
      },
      onError: (error) => applyApiFieldErrors(form, error, BACKEND_FIELDS),
    });
  };

  const previewData = preview.data as PurchasePreview | undefined;
  const error = create.error instanceof ApiError ? create.error : null;

  return (
    <Drawer
      title="Nueva compra de mercadería"
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
        {error && (
          <Alert type="error" showIcon style={{ marginBottom: 16 }} message={error.message} />
        )}

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
              <Select
                showSearch
                optionFilterProp="label"
                options={supplierOptions}
                placeholder="Buscar proveedor"
              />
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
            <Form.Item name="receptionDate" label="Recepción (kardex)" rules={[{ required: true }]}>
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
        </Row>

        <Typography.Text type="secondary">Defaults de inventario</Typography.Text>
        <Row gutter={12} style={{ marginTop: 8 }}>
          <Col xs={24} sm={12}>
            <Form.Item name="defaultWarehouseId" label="Almacén por defecto" rules={[{ required: true }]}>
              <Select options={warehouseOptions} placeholder="Almacén" />
            </Form.Item>
          </Col>
          <Col xs={24} sm={12}>
            <Form.Item name="defaultOperationType" label="Tipo de operación" rules={[{ required: true }]}>
              <Select options={operationTypes ?? []} />
            </Form.Item>
          </Col>
        </Row>

        <Divider style={{ margin: "8px 0 16px" }} />
        <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
          <Typography.Text strong>Líneas (importe total con IGV)</Typography.Text>
        </Flex>

        <Form.List name="lines">
          {(fields, { add, remove }) => (
            <>
              {fields.map(({ key, ...field }) => (
                <Row key={key} gutter={8} align="top" style={{ marginBottom: 4 }}>
                  <Col xs={24} md={7}>
                    <Form.Item
                      {...field}
                      name={[field.name, "productId"]}
                      rules={[requiredField("Producto")]}
                      style={{ marginBottom: 8 }}
                    >
                      <Select
                        showSearch
                        optionFilterProp="label"
                        placeholder="Producto"
                        options={productOptions}
                        onChange={(productId) => {
                          const product = productOptions.find((p) => p.value === productId);
                          if (product?.operationType) {
                            form.setFieldValue(["lines", field.name, "operationType"], product.operationType);
                          }
                          if (defaultWarehouseId) {
                            form.setFieldValue(["lines", field.name, "warehouseId"], defaultWarehouseId);
                          }
                        }}
                      />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={5}>
                    <Form.Item
                      {...field}
                      name={[field.name, "warehouseId"]}
                      rules={[requiredField("Almacén")]}
                      style={{ marginBottom: 8 }}
                      initialValue={defaultWarehouseId}
                    >
                      <Select options={warehouseOptions} placeholder="Almacén" />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={3}>
                    <Form.Item
                      {...field}
                      name={[field.name, "quantity"]}
                      rules={[requiredField("Cantidad")]}
                      style={{ marginBottom: 8 }}
                    >
                      <InputNumber min={0.00001} style={{ width: "100%" }} placeholder="Cant." />
                    </Form.Item>
                  </Col>
                  <Col xs={12} md={4}>
                    <Form.Item
                      {...field}
                      name={[field.name, "grossTotal"]}
                      rules={[requiredField("Total")]}
                      style={{ marginBottom: 8 }}
                    >
                      <InputNumber min={0.01} precision={2} style={{ width: "100%" }} placeholder="Total" />
                    </Form.Item>
                  </Col>
                  <Col xs={10} md={4}>
                    <Form.Item
                      {...field}
                      name={[field.name, "operationType"]}
                      rules={[requiredField("Tipo de operación")]}
                      style={{ marginBottom: 8 }}
                      initialValue={defaultOperationType}
                    >
                      <Select options={operationTypes ?? []} placeholder="Operación" />
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
                    warehouseId: defaultWarehouseId,
                    quantity: 1,
                    operationType: defaultOperationType ?? "taxed_taxed",
                  })
                }
                block
              >
                Agregar línea
              </Button>
            </>
          )}
        </Form.List>

        <Form.Item name="observations" label="Observaciones" style={{ marginTop: 16 }}>
          <Input.TextArea rows={2} maxLength={1000} showCount />
        </Form.Item>

        <Divider style={{ margin: "8px 0 16px" }} />
        <PurchaseGapFieldsSection form={form} showReceptionNumber showReceptionSelect />

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

