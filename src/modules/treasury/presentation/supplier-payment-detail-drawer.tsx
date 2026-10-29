"use client";

import { Alert, Descriptions, Drawer, Skeleton, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";

import { useSupplierPayment } from "../application/use-treasury";
import type { SupplierPaymentApplication } from "../domain/treasury.types";
import { DATE_FORMAT, formatAmount, formatCurrency } from "./ui-helpers";

export function SupplierPaymentDetailDrawer({ paymentId, onClose }: { paymentId: string | null; onClose: () => void }) {
  const { data: payment, isLoading, error } = useSupplierPayment(paymentId);

  return (
    <Drawer
      open={Boolean(paymentId)}
      onClose={onClose}
      size={640}
      title={payment ? `Pago N° ${payment.payment_number}` : "Pago a proveedor"}
      destroyOnHidden
    >
      {isLoading && <Skeleton active />}
      {error && <Alert type="error" showIcon title={error.message} />}
      {payment && (
        <>
          {payment.status === "annulled" && (
            <Alert
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
              title={`Pago anulado${payment.annulled_at ? ` el ${dayjs(payment.annulled_at).format(DATE_FORMAT)}` : ""}`}
            />
          )}
          <Descriptions
            size="small"
            bordered
            column={2}
            items={[
              { key: "supplier", label: "Proveedor", span: 2, children: payment.supplier_business_name },
              { key: "date", label: "Fecha Abono", children: dayjs(payment.paid_at).format(DATE_FORMAT) },
              {
                key: "status",
                label: "Estado",
                children: (
                  <Tag color={payment.status === "annulled" ? "error" : "success"}>{payment.status_label}</Tag>
                ),
              },
              { key: "account", label: "Caja / Cta.Cte.", span: 2, children: payment.treasury_account_label ?? "—" },
              { key: "method", label: "Forma de Pago", children: payment.method_label ?? "—" },
              { key: "ref", label: "Nro. Operación", children: payment.reference ?? "—" },
              {
                key: "currency",
                label: "Moneda",
                children:
                  payment.currency === "PEN" ? "PEN" : `${payment.currency} · T.C. ${payment.exchange_rate}`,
              },
              {
                key: "total",
                label: "Total",
                children: <strong>{formatCurrency(payment.total_amount, payment.currency)}</strong>,
              },
              ...(payment.currency !== "PEN"
                ? [{ key: "pen", label: "Total PEN", span: 2, children: formatCurrency(payment.total_amount_pen, "PEN") }]
                : []),
              ...(payment.observations
                ? [{ key: "obs", label: "Observación", span: 2, children: payment.observations }]
                : []),
            ]}
          />

          <Typography.Title level={5} style={{ marginTop: 24 }}>
            Documentos pagados
          </Typography.Title>
          <Table<SupplierPaymentApplication>
            size="small"
            bordered
            rowKey="line_number"
            pagination={false}
            dataSource={payment.applications}
            columns={[
              { title: "Item", dataIndex: "line_number", width: 60 },
              { title: "Documento", dataIndex: "document_label" },
              {
                title: `Abono ${payment.currency}`,
                dataIndex: "amount",
                align: "right",
                render: (v: string) => formatAmount(v),
              },
              ...(payment.currency !== "PEN"
                ? [
                    {
                      title: "Abono PEN (T.C. doc.)",
                      dataIndex: "amount_pen",
                      align: "right" as const,
                      render: (v: string) => formatAmount(v),
                    },
                  ]
                : []),
            ]}
            summary={(rows) => (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={2}>
                  <strong>Total</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={2} align="right">
                  <strong>{formatAmount(rows.reduce((s, r) => s + Number(r.amount), 0))}</strong>
                </Table.Summary.Cell>
                {payment.currency !== "PEN" && (
                  <Table.Summary.Cell index={3} align="right">
                    {formatAmount(rows.reduce((s, r) => s + Number(r.amount_pen), 0))}
                  </Table.Summary.Cell>
                )}
              </Table.Summary.Row>
            )}
          />
        </>
      )}
    </Drawer>
  );
}
