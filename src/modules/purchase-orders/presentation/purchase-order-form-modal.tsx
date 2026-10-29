"use client";

import { useMemo, useRef, useState } from "react";
import { DeleteOutlined, SearchOutlined } from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Checkbox,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Table,
  Tooltip,
  Typography,
  type TableProps,
} from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { ApiError } from "@/core/http/api-error";
import type { Product } from "@/modules/products/domain/product.types";
import { usePaymentTerms } from "@/modules/suppliers/application/use-suppliers";
import { SupplierSelect } from "@/modules/treasury/presentation/supplier-select";
import { CURRENCY_OPTIONS, DATE_FORMAT, formatAmount, guardEscape, round2 } from "@/modules/treasury/presentation/ui-helpers";
import type { Warehouse } from "@/modules/warehouses/domain/warehouse.types";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";
import { useEnterToNextField, useHotkeys } from "@/shared/lib/use-keyboard-entry";

import { useCreatePurchaseOrder } from "../application/use-purchase-orders";
import type { PurchaseOrder } from "../domain/purchase-order.types";
import { ProductSearchModal } from "./product-search-modal";

const IGV_RATE = 0.18;

/** Mismo cálculo que el backend: IGV sobre el total del documento. */
export function computeOrderTotals(lineTotals: number[], pricesIncludeTax: boolean) {
  const sum = round2(lineTotals.reduce((acc, v) => acc + v, 0));
  if (pricesIncludeTax) {
    const base = round2(sum / (1 + IGV_RATE));
    return { taxableBase: base, igv: round2(sum - base), total: sum };
  }
  const igv = round2(sum * IGV_RATE);
  return { taxableBase: sum, igv, total: round2(sum + igv) };
}

interface PurchaseOrderFormModalProps {
  open: boolean;
  warehouses: Warehouse[];
  onClose: () => void;
  onSaved?: (order: PurchaseOrder) => void;
}

export function PurchaseOrderFormModal({ open, onClose, ...props }: PurchaseOrderFormModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Nueva Orden de Compra"
      width={1040}
      footer={null}
      destroyOnHidden
      keyboard={false}
      mask={{ closable: false }}
      styles={{ body: { paddingTop: 8 } }}
    >
      {open && <PurchaseOrderForm onClose={onClose} {...props} />}
    </Modal>
  );
}

type HeaderValues = {
  issueDate: Dayjs;
  expectedDate?: Dayjs | null;
  warehouseId: string;
  supplierId?: string;
  paymentTerm: "cash" | "credit";
  creditDays?: number;
  currency: string;
  reference?: string;
  pricesIncludeTax: boolean;
  observations?: string;
};

type LineRow = {
  key: string;
  productId: string;
  code: string;
  description: string;
  unit: string;
  quantity: number;
  price: number;
};

const BACKEND_FIELDS: Record<string, keyof HeaderValues> = {
  issue_date: "issueDate",
  expected_date: "expectedDate",
  warehouse_id: "warehouseId",
  supplier_id: "supplierId",
  payment_term: "paymentTerm",
  credit_days: "creditDays",
  currency: "currency",
  reference: "reference",
  observations: "observations",
};

let lineSeq = 0;

function PurchaseOrderForm({ warehouses, onClose, onSaved }: Omit<PurchaseOrderFormModalProps, "open">) {
  const { message } = App.useApp();
  const [form] = Form.useForm<HeaderValues>();
  const containerRef = useRef<HTMLDivElement>(null);
  const create = useCreatePurchaseOrder();
  const { data: paymentTerms } = usePaymentTerms();
  const [lines, setLines] = useState<LineRow[]>([]);
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [focusLine, setFocusLine] = useState<{ key: string; nonce: number } | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);

  const defaultWarehouse = warehouses.find((w) => w.type === "main") ?? warehouses[0];
  const paymentTerm = Form.useWatch("paymentTerm", form);
  const pricesIncludeTax = Form.useWatch("pricesIncludeTax", form) ?? true;
  const currency = Form.useWatch("currency", form) ?? "PEN";

  const lineTotal = (l: LineRow) => round2(l.quantity * l.price);
  const totals = useMemo(
    () => computeOrderTotals(lines.map((l) => round2(l.quantity * l.price)), pricesIncludeTax),
    [lines, pricesIncludeTax],
  );

  const addProduct = (product: Product) => {
    const existing = lines.find((l) => l.productId === product.id);
    setSearchOpen(false);
    if (existing) {
      message.info(`${product.code} ya está en el detalle; ajuste la cantidad`);
      setFocusLine({ key: existing.key, nonce: ++lineSeq });
      setActiveLine(existing.key);
      return;
    }
    const key = `l${++lineSeq}`;
    setLines((current) => [
      ...current,
      {
        key,
        productId: product.id,
        code: product.code,
        description: product.description,
        unit: product.unit_of_measure,
        quantity: 1,
        price: 0,
      },
    ]);
    setActiveLine(key);
    setFocusLine({ key, nonce: lineSeq });
  };

  const updateLine = (key: string, patch: Partial<LineRow>) =>
    setLines((current) => current.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const removeLine = () => {
    if (!activeLine) return;
    setLines((current) => current.filter((l) => l.key !== activeLine));
    setActiveLine(null);
  };

  const submit = async () => {
    let values: HeaderValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (lines.length === 0) {
      message.error("Agregue al menos un artículo con «Buscar Artículos (F2)»");
      return;
    }
    const invalid = lines.find((l) => !(l.quantity > 0) || !(l.price > 0));
    if (invalid) {
      message.error(`Indique cantidad y precio mayores a cero para ${invalid.code}`);
      setActiveLine(invalid.key);
      return;
    }
    create.mutate(
      {
        issueDate: values.issueDate.format("YYYY-MM-DD"),
        expectedDate: values.expectedDate ? values.expectedDate.format("YYYY-MM-DD") : null,
        supplierId: values.supplierId as string,
        warehouseId: values.warehouseId,
        paymentTerm: values.paymentTerm,
        creditDays: values.creditDays ?? 0,
        currency: values.currency,
        pricesIncludeTax: values.pricesIncludeTax,
        reference: values.reference,
        observations: values.observations,
        lines: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, unitPrice: l.price })),
      },
      {
        onSuccess: (order) => {
          message.success(`Orden de compra N° ${order.order_number} registrada`);
          onSaved?.(order);
          onClose();
        },
        onError: (error) => applyApiFieldErrors(form, error, BACKEND_FIELDS),
      },
    );
  };

  useEnterToNextField(containerRef, !searchOpen);
  useHotkeys(
    {
      F2: () => setSearchOpen(true),
      F10: () => void submit(),
      CtrlEnter: () => void submit(),
      Escape: guardEscape(onClose),
    },
    !searchOpen,
  );

  const columns: TableProps<LineRow>["columns"] = [
    { title: "Código", dataIndex: "code", width: 110 },
    { title: "Descripción", dataIndex: "description", ellipsis: true },
    { title: "UM", dataIndex: "unit", width: 60 },
    {
      title: "Cantidad",
      key: "quantity",
      width: 120,
      render: (_, l) => (
        <InputNumber
          key={focusLine?.key === l.key ? `${l.key}-${focusLine.nonce}` : l.key}
          size="small"
          min={0}
          precision={5}
          autoFocus={focusLine?.key === l.key}
          value={l.quantity}
          onFocus={(e) => {
            setActiveLine(l.key);
            e.target.select();
          }}
          onChange={(v) => updateLine(l.key, { quantity: Number(v ?? 0) })}
          style={{ width: "100%" }}
          styles={{ input: { textAlign: "right" } }}
        />
      ),
    },
    {
      title: "Precio",
      key: "price",
      width: 130,
      render: (_, l) => (
        <InputNumber
          size="small"
          min={0}
          precision={6}
          value={l.price}
          onFocus={(e) => {
            setActiveLine(l.key);
            e.target.select();
          }}
          onChange={(v) => updateLine(l.key, { price: Number(v ?? 0) })}
          style={{ width: "100%" }}
          styles={{ input: { textAlign: "right" } }}
        />
      ),
    },
    {
      title: "Importe",
      key: "total",
      width: 120,
      align: "right",
      render: (_, l) => formatAmount(lineTotal(l)),
    },
  ];

  const totalBox = (label: string, value: number, strong = false) => (
    <Flex align="center" justify="flex-end" gap={8}>
      <Typography.Text strong={strong}>{label}</Typography.Text>
      <Input
        readOnly
        tabIndex={-1}
        size="small"
        value={formatAmount(value)}
        style={{ width: 140, textAlign: "right", fontWeight: strong ? 700 : 400 }}
      />
    </Flex>
  );

  return (
    <div ref={containerRef}>
      {create.error instanceof ApiError && (
        <Alert type="error" showIcon title={create.error.message} style={{ marginBottom: 12 }} />
      )}
      <Form<HeaderValues>
        form={form}
        size="small"
        layout="horizontal"
        labelCol={{ flex: "130px" }}
        labelAlign="right"
        colon={false}
        initialValues={{
          issueDate: dayjs(),
          warehouseId: defaultWarehouse?.id,
          paymentTerm: "cash",
          creditDays: 0,
          currency: "PEN",
          pricesIncludeTax: true,
        }}
      >
        <Row gutter={24}>
          <Col xs={24} md={13}>
            <Form.Item label="Nro. O/C">
              <Input readOnly tabIndex={-1} placeholder="Automático" />
            </Form.Item>
            <Form.Item name="warehouseId" label="Almacén" rules={[{ required: true }]}>
              <Select options={warehouses.map((w) => ({ value: w.id, label: `${w.code} · ${w.name}` }))} />
            </Form.Item>
            <Form.Item name="supplierId" label="Proveedor" rules={[{ required: true, message: "Seleccione el proveedor" }]}>
              <SupplierSelect
                autoFocus
                onChange={(_id, supplier) => {
                  if (supplier) {
                    form.setFieldsValue({
                      paymentTerm: supplier.payment_term === "credit" ? "credit" : "cash",
                      creditDays: supplier.credit_days,
                    });
                  }
                }}
              />
            </Form.Item>
            <Form.Item label="Condición Pago" required>
              <Flex gap={8}>
                <Form.Item name="paymentTerm" noStyle rules={[{ required: true }]}>
                  <Select
                    style={{ flex: 1 }}
                    options={paymentTerms ?? [
                      { value: "cash", label: "Contado" },
                      { value: "credit", label: "Crédito" },
                    ]}
                  />
                </Form.Item>
                {paymentTerm === "credit" && (
                  <Form.Item name="creditDays" noStyle rules={[{ required: true }]}>
                    <InputNumber min={0} max={365} precision={0} suffix="días" style={{ width: 110 }} />
                  </Form.Item>
                )}
              </Flex>
            </Form.Item>
            <Form.Item name="currency" label="Moneda" rules={[{ required: true }]}>
              <Select options={CURRENCY_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={11}>
            <Form.Item name="issueDate" label="Fecha" rules={[{ required: true }]}>
              <DatePicker format={DATE_FORMAT} allowClear={false} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="expectedDate" label="Fecha entrega">
              <DatePicker format={DATE_FORMAT} style={{ width: "100%" }} />
            </Form.Item>
            <Form.Item name="reference" label="Doc. Referencia">
              <Input maxLength={60} />
            </Form.Item>
            <Form.Item name="pricesIncludeTax" valuePropName="checked" wrapperCol={{ offset: 0 }} label=" ">
              <Checkbox>Precios Incluyen Impuestos</Checkbox>
            </Form.Item>
            <Form.Item name="observations" label="Observaciones">
              <Input.TextArea rows={1} maxLength={1000} autoSize={{ minRows: 1, maxRows: 3 }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Detalle
      </Typography.Text>
      <Table<LineRow>
        size="small"
        bordered
        rowKey="key"
        columns={columns}
        dataSource={lines}
        pagination={false}
        scroll={{ y: 240 }}
        onRow={(l) => ({
          onClick: () => setActiveLine(l.key),
          style: l.key === activeLine ? { background: "var(--cf-accent-soft)" } : undefined,
        })}
        locale={{ emptyText: "Presione F2 para buscar artículos" }}
      />

      <Row gutter={24} style={{ marginTop: 12 }} align="top">
        <Col xs={24} md={10}>
          <Flex gap={8}>
            <Tooltip title="F2">
              <Button icon={<SearchOutlined />} onClick={() => setSearchOpen(true)}>
                &lt;&lt;Buscar Artículos... (F2)
              </Button>
            </Tooltip>
            <Button icon={<DeleteOutlined />} onClick={removeLine} disabled={!activeLine}>
              Eliminar
            </Button>
          </Flex>
        </Col>
        <Col xs={24} md={14}>
          <Flex vertical gap={6}>
            {totalBox("Afecto a IGV", totals.taxableBase)}
            {totalBox("IGV", totals.igv)}
            {totalBox(`Importe Compra ${currency}`, totals.total, true)}
          </Flex>
        </Col>
      </Row>

      <Flex justify="flex-end" gap={8} style={{ marginTop: 16 }}>
        <Tooltip title="F10 o Ctrl+Enter">
          <Button type="primary" onClick={() => void submit()} loading={create.isPending}>
            Aceptar (F10)
          </Button>
        </Tooltip>
        <Tooltip title="Esc">
          <Button onClick={onClose}>Cancelar (Esc)</Button>
        </Tooltip>
      </Flex>

      <ProductSearchModal open={searchOpen} onClose={() => setSearchOpen(false)} onPick={addProduct} />
    </div>
  );
}
