"use client";

import { useMemo, useRef, useState } from "react";
import {
  Alert,
  App,
  Button,
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
import { useOpenPurchaseOrders, usePurchaseOrder } from "@/modules/purchase-orders/application/use-purchase-orders";
import type { PurchaseOrderLine } from "@/modules/purchase-orders/domain/purchase-order.types";
import { formatOrderNumber } from "@/modules/purchase-orders/presentation/purchase-order-format";
import { DATE_FORMAT, formatAmount, guardEscape, round2 } from "@/modules/treasury/presentation/ui-helpers";
import { useWarehouses } from "@/modules/warehouses/application/use-warehouses";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";
import { useEnterToNextField, useHotkeys } from "@/shared/lib/use-keyboard-entry";

import { useCreateReception } from "../application/use-receptions";
import type { GoodsReception } from "../domain/reception.types";

interface ReceptionFromOrderModalProps {
  open: boolean;
  /** O/C preseleccionada (desde "Órdenes de compra › Recepcionar"). */
  initialOrderId?: string | null;
  onClose: () => void;
  onSaved?: (reception: GoodsReception) => void;
}

/** "Nueva Recepción Desde Orden de Compra" de SiempreSoft. */
export function ReceptionFromOrderModal({ open, onClose, ...props }: ReceptionFromOrderModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Nueva Recepción Desde Orden de Compra"
      width={1000}
      footer={null}
      destroyOnHidden
      keyboard={false}
      mask={{ closable: false }}
      styles={{ body: { paddingTop: 8 } }}
    >
      {open && <ReceptionFromOrderForm onClose={onClose} {...props} />}
    </Modal>
  );
}

type HeaderValues = {
  orderId?: string;
  receptionDate: Dayjs;
  guideSeries?: string;
  guideNumber?: string;
  receptionNumber?: string;
  observations?: string;
};

const BACKEND_FIELDS: Record<string, keyof HeaderValues> = {
  purchase_order_id: "orderId",
  reception_date: "receptionDate",
  guide_series: "guideSeries",
  guide_number: "guideNumber",
  reception_number: "receptionNumber",
  observations: "observations",
};

const qty = (v: string | number) => Number(v).toLocaleString("es-PE", { maximumFractionDigits: 5 });

function ReceptionFromOrderForm({ initialOrderId, onClose, onSaved }: Omit<ReceptionFromOrderModalProps, "open">) {
  const { message } = App.useApp();
  const [form] = Form.useForm<HeaderValues>();
  const containerRef = useRef<HTMLDivElement>(null);
  const create = useCreateReception();
  const { data: openOrders, isLoading: loadingOrders } = useOpenPurchaseOrders();
  const { data: warehousesPage } = useWarehouses({ page: 1, perPage: 200, status: "active" });
  const orderId = Form.useWatch("orderId", form) ?? initialOrderId ?? undefined;
  const { data: order, isFetching: loadingOrder } = usePurchaseOrder(orderId);
  /** Cantidades editadas por el usuario; las demás usan el pendiente. */
  const [overrides, setOverrides] = useState<Record<number, number>>({});

  const orderOptions = useMemo(
    () =>
      (openOrders?.items ?? []).map((o) => ({
        value: o.id,
        label: `${formatOrderNumber(o.order_number)} · ${o.supplier_business_name} · ${dayjs(o.issue_date).format(DATE_FORMAT)}`,
      })),
    [openOrders],
  );

  const pendingLines = useMemo(
    () => (order?.lines ?? []).filter((l) => Number(l.pending_quantity) > 0),
    [order],
  );
  const toReceive = (l: PurchaseOrderLine) => overrides[l.line_number] ?? Number(l.pending_quantity);
  const receivable = order?.status === "open" || order?.status === "partial";
  const warehouse = warehousesPage?.items.find((w) => w.id === order?.warehouse_id);
  const total = round2(pendingLines.reduce((acc, l) => acc + toReceive(l) * Number(l.unit_price), 0));

  const submit = async () => {
    let values: HeaderValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (!order) {
      message.error("Seleccione la orden de compra");
      return;
    }
    const lines = pendingLines
      .filter((l) => toReceive(l) > 0)
      .map((l) => ({
        productId: l.product_id,
        quantity: toReceive(l),
        purchaseOrderLineNumber: l.line_number,
        unitPrice: Number(l.unit_price),
      }));
    if (lines.length === 0) {
      message.error("Indique la cantidad a recibir de al menos un artículo");
      return;
    }
    create.mutate(
      {
        purchaseOrderId: order.id,
        receptionDate: values.receptionDate.format("YYYY-MM-DD"),
        warehouseId: order.warehouse_id,
        supplierId: order.supplier_id,
        receptionNumber: values.receptionNumber,
        guideSeries: values.guideSeries,
        guideNumber: values.guideNumber,
        observations: values.observations,
        lines,
      },
      {
        onSuccess: (saved) => {
          message.success(`Recepción ${saved.reception_number} registrada desde ${formatOrderNumber(order.order_number)}`);
          onSaved?.(saved);
          onClose();
        },
        onError: (error) => applyApiFieldErrors(form, error, BACKEND_FIELDS),
      },
    );
  };

  useEnterToNextField(containerRef);
  useHotkeys({ F10: () => void submit(), CtrlEnter: () => void submit(), Escape: guardEscape(onClose) });

  const columns: TableProps<PurchaseOrderLine>["columns"] = [
    { title: "Código", dataIndex: "product_code", width: 100 },
    { title: "Descripción", dataIndex: "product_description", ellipsis: true },
    { title: "UM", dataIndex: "unit_of_measure", width: 55 },
    { title: "Pedido", dataIndex: "quantity", width: 85, align: "right", render: qty },
    { title: "Recibido", dataIndex: "received_quantity", width: 85, align: "right", render: qty },
    { title: "Pendiente", dataIndex: "pending_quantity", width: 90, align: "right", render: qty },
    {
      title: "Cantidad a recibir",
      key: "receive",
      width: 140,
      render: (_, l) => (
        <InputNumber
          size="small"
          min={0}
          max={Number(l.pending_quantity)}
          precision={5}
          value={toReceive(l)}
          onFocus={(e) => e.target.select()}
          onChange={(v) => setOverrides((c) => ({ ...c, [l.line_number]: Number(v ?? 0) }))}
          style={{ width: "100%" }}
          styles={{ input: { textAlign: "right" } }}
        />
      ),
    },
    {
      title: "Precio",
      dataIndex: "unit_price",
      width: 95,
      align: "right",
      render: (v: string) => Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
    },
    {
      title: "Importe",
      key: "amount",
      width: 100,
      align: "right",
      render: (_, l) => formatAmount(round2(toReceive(l) * Number(l.unit_price))),
    },
  ];

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
        initialValues={{ orderId: initialOrderId ?? undefined, receptionDate: dayjs() }}
        onValuesChange={(changed: Partial<HeaderValues>) => {
          if ("orderId" in changed) setOverrides({});
        }}
      >
        <Row gutter={24}>
          <Col xs={24} md={13}>
            <Form.Item label="Nro. Recepción" name="receptionNumber">
              <Input placeholder="Automático" maxLength={20} />
            </Form.Item>
            <Form.Item label="Almacén">
              <Input readOnly tabIndex={-1} value={warehouse ? `${warehouse.code} · ${warehouse.name}` : ""} />
            </Form.Item>
            <Form.Item label="Proveedor">
              <Input readOnly tabIndex={-1} value={order?.supplier_business_name ?? ""} />
            </Form.Item>
            <Form.Item label="Condición Pago">
              <Input
                readOnly
                tabIndex={-1}
                value={order ? (order.payment_term === "credit" ? `CRÉDITO ${order.credit_days} DÍAS` : "CONTADO") : ""}
              />
            </Form.Item>
            <Form.Item label="Moneda">
              <Input readOnly tabIndex={-1} value={order?.currency ?? ""} />
            </Form.Item>
            <Form.Item label="Guía Remisión">
              <Flex gap={8}>
                <Form.Item name="guideSeries" noStyle>
                  <Input placeholder="Serie" maxLength={4} style={{ width: 90 }} />
                </Form.Item>
                <Form.Item name="guideNumber" noStyle>
                  <Input placeholder="Número" maxLength={10} style={{ flex: 1 }} />
                </Form.Item>
              </Flex>
            </Form.Item>
          </Col>
          <Col xs={24} md={11}>
            <Form.Item
              name="orderId"
              label="Nro. Orden Compra"
              rules={[{ required: true, message: "Seleccione la orden de compra" }]}
            >
              <Select
                autoFocus={!initialOrderId}
                showSearch={{ optionFilterProp: "label" }}
                loading={loadingOrders}
                placeholder="O/C pendiente de atender"
                options={
                  order && !orderOptions.some((o) => o.value === order.id)
                    ? [...orderOptions, { value: order.id, label: formatOrderNumber(order.order_number) }]
                    : orderOptions
                }
                popupMatchSelectWidth={false}
                notFoundContent="No hay órdenes de compra pendientes"
              />
            </Form.Item>
            <Form.Item name="receptionDate" label="Fecha" rules={[{ required: true }]}>
              <DatePicker format={DATE_FORMAT} allowClear={false} style={{ width: "100%" }} autoFocus={Boolean(initialOrderId)} />
            </Form.Item>
            <Form.Item label="Doc. Referencia">
              <Input readOnly tabIndex={-1} value={order?.reference ?? ""} />
            </Form.Item>
            <Form.Item name="observations" label="Observaciones">
              <Input.TextArea maxLength={1000} autoSize={{ minRows: 1, maxRows: 3 }} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {order && !receivable && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 8 }}
          title={`La orden ${formatOrderNumber(order.order_number)} está ${order.status_label.toLowerCase()} y no tiene pendientes por recibir.`}
        />
      )}

      <Table<PurchaseOrderLine>
        size="small"
        bordered
        rowKey="line_number"
        loading={loadingOrder}
        columns={columns}
        dataSource={receivable ? pendingLines : []}
        pagination={false}
        scroll={{ y: 260, x: "max-content" }}
        locale={{ emptyText: orderId ? "Sin artículos pendientes" : "Seleccione la orden de compra" }}
      />
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        Cantidad 0 = no se recibe ese artículo en esta guía. No puede exceder lo pendiente.
      </Typography.Text>

      <Flex justify="space-between" align="center" style={{ marginTop: 12 }} wrap gap={12}>
        <span />
        <Flex align="center" gap={8}>
          <Typography.Text strong>Importe recibido{order ? ` ${order.currency}` : ""}</Typography.Text>
          <Input readOnly tabIndex={-1} size="small" value={formatAmount(total)} style={{ width: 140, textAlign: "right", fontWeight: 700 }} />
        </Flex>
      </Flex>

      <Flex justify="flex-end" gap={8} style={{ marginTop: 16 }}>
        <Tooltip title="F10 o Ctrl+Enter">
          <Button type="primary" onClick={() => void submit()} loading={create.isPending} disabled={!receivable}>
            Aceptar (F10)
          </Button>
        </Tooltip>
        <Tooltip title="Esc">
          <Button onClick={onClose}>Cancelar (Esc)</Button>
        </Tooltip>
      </Flex>
    </div>
  );
}
