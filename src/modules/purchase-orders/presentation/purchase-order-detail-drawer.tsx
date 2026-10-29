"use client";

import { Alert, Button, Descriptions, Drawer, Flex, Skeleton, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";

import { DATE_FORMAT, formatAmount } from "@/modules/treasury/presentation/ui-helpers";

import { usePurchaseOrder } from "../application/use-purchase-orders";
import { PURCHASE_ORDER_STATUS_OPTIONS, type PurchaseOrderLine } from "../domain/purchase-order.types";
import { formatOrderNumber } from "./purchase-order-format";

const qty = (v: string) => Number(v).toLocaleString("es-PE", { maximumFractionDigits: 5 });

interface Props {
  orderId: string | null;
  warehouseName?: (id: string) => string | undefined;
  onClose: () => void;
  onReceive?: (orderId: string) => void;
}

export function PurchaseOrderDetailDrawer({ orderId, warehouseName, onClose, onReceive }: Props) {
  const { data: order, isLoading, error } = usePurchaseOrder(orderId);
  const status = PURCHASE_ORDER_STATUS_OPTIONS.find((o) => o.value === order?.status);
  const receivable = order && (order.status === "open" || order.status === "partial");

  return (
    <Drawer
      open={Boolean(orderId)}
      onClose={onClose}
      size={820}
      destroyOnHidden
      title={order ? `Orden de compra ${formatOrderNumber(order.order_number)}` : "Orden de compra"}
      extra={
        receivable && onReceive ? (
          <Button type="primary" onClick={() => onReceive(order.id)}>
            Recepcionar
          </Button>
        ) : null
      }
    >
      {isLoading && <Skeleton active />}
      {error && <Alert type="error" showIcon title={error.message} />}
      {order && (
        <>
          <Descriptions
            size="small"
            bordered
            column={2}
            items={[
              { key: "supplier", label: "Proveedor", span: 2, children: order.supplier_business_name },
              { key: "date", label: "Fecha", children: dayjs(order.issue_date).format(DATE_FORMAT) },
              {
                key: "expected",
                label: "Fecha entrega",
                children: order.expected_date ? dayjs(order.expected_date).format(DATE_FORMAT) : "—",
              },
              { key: "warehouse", label: "Almacén", children: warehouseName?.(order.warehouse_id) ?? "—" },
              {
                key: "term",
                label: "Condición Pago",
                children: order.payment_term === "credit" ? `Crédito ${order.credit_days} días` : "Contado",
              },
              { key: "currency", label: "Moneda", children: order.currency },
              { key: "status", label: "Estado", children: <Tag color={status?.color}>{order.status_label}</Tag> },
              { key: "ref", label: "Doc. Referencia", children: order.reference ?? "—" },
              {
                key: "tax",
                label: "Precios Incluyen Impuestos",
                children: order.prices_include_tax ? "Sí" : "No",
              },
              ...(order.observations
                ? [{ key: "obs", label: "Observaciones", span: 2, children: order.observations }]
                : []),
            ]}
          />

          <Table<PurchaseOrderLine>
            style={{ marginTop: 20 }}
            size="small"
            bordered
            rowKey="line_number"
            pagination={false}
            dataSource={order.lines}
            columns={[
              { title: "Código", dataIndex: "product_code", width: 100 },
              { title: "Descripción", dataIndex: "product_description" },
              { title: "UM", dataIndex: "unit_of_measure", width: 55 },
              { title: "Pedido", dataIndex: "quantity", width: 85, align: "right", render: qty },
              { title: "Recibido", dataIndex: "received_quantity", width: 85, align: "right", render: qty },
              {
                title: "Pendiente",
                dataIndex: "pending_quantity",
                width: 90,
                align: "right",
                render: (v: string) =>
                  Number(v) > 0 ? <Typography.Text type="warning">{qty(v)}</Typography.Text> : qty(v),
              },
              {
                title: "Precio",
                dataIndex: "unit_price",
                width: 95,
                align: "right",
                render: (v: string) => Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
              },
              { title: "Importe", dataIndex: "line_total", width: 100, align: "right", render: formatAmount },
            ]}
          />

          <Flex vertical align="flex-end" gap={4} style={{ marginTop: 12 }}>
            <span>
              Afecto a IGV: <strong>{formatAmount(order.totals.taxable_base)}</strong>
            </span>
            <span>
              IGV: <strong>{formatAmount(order.totals.igv)}</strong>
            </span>
            <Typography.Text style={{ fontSize: 15 }}>
              Importe Compra {order.currency}: <strong>{formatAmount(order.totals.total)}</strong>
            </Typography.Text>
          </Flex>
        </>
      )}
    </Drawer>
  );
}
