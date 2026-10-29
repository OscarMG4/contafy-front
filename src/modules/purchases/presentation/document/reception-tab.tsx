"use client";

import { useMemo } from "react";
import { Col, DatePicker, Form, Input, Row, Select, Typography, type FormInstance } from "antd";
import dayjs from "dayjs";

import { useOpenPurchaseOrders } from "@/modules/purchase-orders/application/use-purchase-orders";
import type { PurchaseOrder } from "@/modules/purchase-orders/domain/purchase-order.types";
import { useOpenReceptions } from "@/modules/receptions/application/use-receptions";

import { formatAmount, type DocumentFormValues } from "./document-model";

interface ReceptionTabProps {
  form: FormInstance<DocumentFormValues>;
  /** Se eligió (o quitó) una O/C en "Traer de O/C". */
  onPickOrder: (order: PurchaseOrder | null) => void;
}

/** Pestaña "Recepción" de la compra de mercadería. */
export function ReceptionTab({ form, onPickOrder }: ReceptionTabProps) {
  const supplierId = Form.useWatch("supplierId", form);
  const { data: openReceptions } = useOpenReceptions();
  const { data: openOrders, isFetching: loadingOrders } = useOpenPurchaseOrders(supplierId || undefined);

  const receptionOptions = useMemo(
    () =>
      (openReceptions?.items ?? []).map((r) => ({
        value: r.id,
        label: `${r.reception_number} · ${dayjs(r.reception_date).format("DD/MM/YYYY")}`,
        number: r.reception_number,
      })),
    [openReceptions],
  );

  const orders = useMemo(() => (supplierId ? (openOrders?.items ?? []) : []), [openOrders, supplierId]);

  return (
    <Row gutter={24}>
      <Col xs={24} lg={12}>
        <Form.Item
          name="receptionDate"
          label="Fecha de recepción"
          rules={[{ required: true }]}
          extra="Fecha con la que la mercadería entra al kardex."
        >
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>
        <Form.Item name="receptionId" label="Recepción abierta">
          <Select
            allowClear
            showSearch={{ optionFilterProp: "label" }}
            placeholder="Opcional · recepciones abiertas"
            options={receptionOptions}
            onChange={(id) => {
              const option = receptionOptions.find((o) => o.value === id);
              form.setFieldValue("receptionNumber", option?.number ?? undefined);
            }}
          />
        </Form.Item>
        <Form.Item name="receptionNumber" label="Nro. Recepción">
          <Input placeholder="Opcional" maxLength={40} />
        </Form.Item>
      </Col>
      <Col xs={24} lg={12}>
        <Form.Item
          name="purchaseOrderId"
          label="Traer de O/C"
          extra={
            supplierId
              ? "Llena almacén, moneda, condición de pago y líneas con lo pendiente (o lo ya recibido) de la orden."
              : "Elige primero el proveedor para ver sus órdenes de compra pendientes."
          }
        >
          <Select
            allowClear
            disabled={!supplierId}
            loading={loadingOrders}
            placeholder="Orden de compra pendiente del proveedor"
            showSearch={{ optionFilterProp: "label" }}
            options={orders.map((o) => ({
              value: o.id,
              label: `O/C ${o.order_number} · ${dayjs(o.issue_date).format("DD/MM/YYYY")} · ${o.currency} ${formatAmount(o.totals.total)} · ${o.status_label}`,
            }))}
            onChange={(id: string | undefined) => onPickOrder(orders.find((o) => o.id === id) ?? null)}
          />
        </Form.Item>
        {supplierId && !loadingOrders && orders.length === 0 && (
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            El proveedor no tiene órdenes de compra pendientes.
          </Typography.Text>
        )}
      </Col>
    </Row>
  );
}
