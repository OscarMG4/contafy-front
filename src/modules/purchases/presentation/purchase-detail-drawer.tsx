"use client";

import { DollarOutlined, StopOutlined } from "@ant-design/icons";
import { App, Button, DatePicker, Descriptions, Drawer, Flex, Form, Input, InputNumber, Select, Spin, Table, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

import { formatMoney } from "@/shared/lib/format";

import {
  usePurchase,
  usePurchasePayments,
  useRegisterPurchasePayment,
} from "../application/use-purchases";
import {
  PAYMENT_STATUS_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
  type Purchase,
} from "../domain/purchase.types";

interface PurchaseDetailDrawerProps {
  purchaseId: string | null;
  open: boolean;
  onClose: () => void;
  onAnnul?: (purchase: Purchase) => void;
}

function money(value: string, currency = "PEN") {
  const n = Number(value);
  if (currency === "PEN") return formatMoney(n);
  return `${currency} ${n.toLocaleString("es-PE", { minimumFractionDigits: 2 })}`;
}

const METHOD_OPTIONS = [
  { value: "cash", label: "Efectivo" },
  { value: "transfer", label: "Transferencia" },
  { value: "check", label: "Cheque" },
  { value: "other", label: "Otro" },
];

export function PurchaseDetailDrawer({ purchaseId, open, onClose, onAnnul }: PurchaseDetailDrawerProps) {
  const { message } = App.useApp();
  const { data: purchase, isLoading } = usePurchase(purchaseId);
  const { data: payments } = usePurchasePayments(open ? purchaseId : null);
  const registerPayment = useRegisterPurchasePayment(purchaseId);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [form] = Form.useForm<{ paidAt: dayjs.Dayjs; amount?: number; method?: string; notes?: string }>();

  const status = PURCHASE_STATUS_OPTIONS.find((o) => o.value === purchase?.status);
  const paymentStatus = PAYMENT_STATUS_OPTIONS.find((o) => o.value === purchase?.payment_status);
  const isExpense = purchase?.kind === "expense";
  const isAdditionalCost = purchase?.kind === "additional_cost";
  const usesAccountLines = isExpense || isAdditionalCost;
  const titlePrefix = isExpense ? "Gasto" : isAdditionalCost ? "Costo adicional" : "Compra";
  const canPay = purchase?.status === "registered" && purchase.payment_status !== "paid";

  const submitPayment = (markFullyPaid: boolean) => {
    form.validateFields().then((values) => {
      registerPayment.mutate(
        {
          paidAt: values.paidAt.format("YYYY-MM-DD"),
          amount: markFullyPaid ? undefined : values.amount,
          method: values.method || null,
          notes: values.notes || null,
          markFullyPaid,
        },
        {
          onSuccess: () => {
            message.success(markFullyPaid ? "Compra marcada como pagada" : "Pago registrado");
            setPaymentFormOpen(false);
            form.resetFields();
          },
          onError: (error) => message.error(error.message),
        },
      );
    });
  };

  return (
    <Drawer
      title={purchase ? `${titlePrefix} ${purchase.series}-${purchase.number}` : "Detalle de compra"}
      open={open}
      onClose={onClose}
      size={720}
      extra={
        <Flex gap={8}>
          {canPay && (
            <Button
              icon={<DollarOutlined />}
              onClick={() => {
                form.setFieldsValue({ paidAt: dayjs(), amount: Number(purchase.totals.total) });
                setPaymentFormOpen(true);
              }}
            >
              Registrar pago
            </Button>
          )}
          {purchase?.status === "registered" && onAnnul ? (
            <Button danger icon={<StopOutlined />} onClick={() => onAnnul(purchase)}>
              Anular
            </Button>
          ) : null}
        </Flex>
      }
    >
      {isLoading || !purchase ? (
        <Flex justify="center" style={{ padding: 48 }}>
          <Spin />
        </Flex>
      ) : (
        <>
          <Flex gap={8} align="center" style={{ marginBottom: 16 }} wrap>
            <Tag color={status?.color}>{status?.label}</Tag>
            <Tag color={paymentStatus?.color}>{paymentStatus?.label ?? "Pago"}</Tag>
            <Tag>
              {purchase.kind_label ??
                (isExpense ? "Gastos" : isAdditionalCost ? "Costo adicional" : "Mercadería")}
            </Tag>
            <Typography.Text type="secondary">
              Correlativo {purchase.registration_code ?? "—"}
            </Typography.Text>
          </Flex>

          <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Proveedor" span={2}>
              {purchase.supplier_business_name}
              <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                RUC {purchase.supplier_document_number}
              </Typography.Text>
            </Descriptions.Item>
            {(purchase.beneficiary_name || purchase.beneficiary_document) && (
              <Descriptions.Item label="Beneficiario" span={2}>
                {purchase.beneficiary_name ?? "—"}
                {purchase.beneficiary_document ? (
                  <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                    Doc. {purchase.beneficiary_document}
                  </Typography.Text>
                ) : null}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Emisión">{dayjs(purchase.issue_date).format("DD/MM/YYYY")}</Descriptions.Item>
            <Descriptions.Item label="Contabilización">
              {dayjs(purchase.accounting_date).format("DD/MM/YYYY")}
            </Descriptions.Item>
            {!isExpense && (
              <Descriptions.Item label="Recepción">
                {purchase.reception_date ? dayjs(purchase.reception_date).format("DD/MM/YYYY") : "—"}
              </Descriptions.Item>
            )}
            {purchase.reception_number && (
              <Descriptions.Item label="Nº recepción">{purchase.reception_number}</Descriptions.Item>
            )}
            <Descriptions.Item label="Moneda">
              {purchase.currency} · TC {purchase.exchange_rate}
            </Descriptions.Item>
            <Descriptions.Item label="Gravadas">
              {money(purchase.totals.taxable_operations, purchase.currency)}
            </Descriptions.Item>
            <Descriptions.Item label="Inafectas">
              {money(purchase.totals.unaffected_operations, purchase.currency)}
            </Descriptions.Item>
            <Descriptions.Item label="Exoneradas">
              {money(purchase.totals.exonerated_operations, purchase.currency)}
            </Descriptions.Item>
            <Descriptions.Item label="Otros cargos">
              {money(purchase.totals.other_charges, purchase.currency)}
            </Descriptions.Item>
            <Descriptions.Item label="ISC">{money(purchase.totals.isc, purchase.currency)}</Descriptions.Item>
            <Descriptions.Item label="Descuento">
              {money(purchase.totals.discount, purchase.currency)}
            </Descriptions.Item>
            <Descriptions.Item label="Total">{money(purchase.totals.total, purchase.currency)}</Descriptions.Item>
            <Descriptions.Item label="IGV crédito">{money(purchase.totals.igv_credit, purchase.currency)}</Descriptions.Item>
            <Descriptions.Item label="IGV no deducible">
              {money(purchase.totals.igv_non_deductible, purchase.currency)}
            </Descriptions.Item>
            <Descriptions.Item label="Detracción">
              {purchase.detraction
                ? `${purchase.detraction.code} · ${purchase.detraction.percent}% · ${money(purchase.detraction.amount, purchase.currency)}`
                : money(purchase.totals.detraction, purchase.currency)}
            </Descriptions.Item>
            {purchase.modified_document && (
              <Descriptions.Item label="Doc. modificado" span={2}>
                {purchase.modified_document.document_type} {purchase.modified_document.series}-
                {purchase.modified_document.number} ·{" "}
                {dayjs(purchase.modified_document.issue_date).format("DD/MM/YYYY")}
              </Descriptions.Item>
            )}
            {isAdditionalCost && (
              <Descriptions.Item label="Método de reparto" span={2}>
                {purchase.allocation_method_label ?? purchase.allocation_method ?? "—"}
              </Descriptions.Item>
            )}
            {purchase.observations && (
              <Descriptions.Item label="Observaciones" span={2}>
                {purchase.observations}
              </Descriptions.Item>
            )}
          </Descriptions>

          <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
            Líneas
          </Typography.Text>
          {usesAccountLines ? (
            <Table
              size="small"
              rowKey="line_number"
              pagination={false}
              dataSource={purchase.lines.filter((l) => l.line_kind === "account")}
              columns={[
                { title: "#", dataIndex: "line_number", width: 40 },
                {
                  title: "Cuenta",
                  key: "account",
                  render: (_, line) =>
                    line.line_kind === "account" ? (
                      <div>
                        <Typography.Text>
                          {line.account_code} · {line.account_name}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                          {line.description}
                        </Typography.Text>
                      </div>
                    ) : null,
                },
                {
                  title: "Total",
                  dataIndex: "gross_total",
                  width: 110,
                  align: "right",
                  render: (v: string) => money(v, purchase.currency),
                },
                {
                  title: isAdditionalCost ? "A repartir" : "Gasto",
                  dataIndex: "expense_amount",
                  width: 110,
                  align: "right",
                  render: (v: string) => money(v, purchase.currency),
                },
              ]}
            />
          ) : (
            <Table
              size="small"
              rowKey="line_number"
              pagination={false}
              dataSource={purchase.lines.filter((l) => l.line_kind === "item")}
              columns={[
                { title: "#", dataIndex: "line_number", width: 40 },
                {
                  title: "Artículo",
                  key: "product",
                  render: (_, line) =>
                    line.line_kind === "item" ? (
                      <div>
                        <Typography.Text>{line.product_description}</Typography.Text>
                        <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                          {line.product_code}
                        </Typography.Text>
                      </div>
                    ) : null,
                },
                { title: "Cant.", dataIndex: "quantity", width: 80, align: "right" },
                {
                  title: "Total",
                  dataIndex: "gross_total",
                  width: 110,
                  align: "right",
                  render: (v: string) => money(v, purchase.currency),
                },
                {
                  title: "Costo unit. PEN",
                  dataIndex: "unit_cost",
                  width: 120,
                  align: "right",
                  render: (v: string) => Number(v).toFixed(4),
                },
              ]}
            />
          )}

          {isAdditionalCost && (purchase.allocations?.length ?? 0) > 0 && (
            <>
              <Typography.Text strong style={{ display: "block", margin: "16px 0 8px" }}>
                Reparto a mercadería
              </Typography.Text>
              <Table
                size="small"
                pagination={false}
                rowKey={(r) => `${r.target_purchase_id}-${r.target_line_number}`}
                dataSource={purchase.allocations}
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

          <Flex justify="space-between" align="center" style={{ margin: "16px 0 8px" }}>
            <Typography.Text strong>Pagos</Typography.Text>
            {canPay && (
              <Button
                size="small"
                type="link"
                loading={registerPayment.isPending}
                onClick={() =>
                  registerPayment.mutate(
                    {
                      paidAt: dayjs().format("YYYY-MM-DD"),
                      markFullyPaid: true,
                    },
                    {
                      onSuccess: () => message.success("Compra marcada como pagada"),
                      onError: (error) => message.error(error.message),
                    },
                  )
                }
              >
                Marcar pagado
              </Button>
            )}
          </Flex>
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            locale={{ emptyText: "Sin pagos registrados" }}
            dataSource={payments ?? []}
            columns={[
              {
                title: "Fecha",
                dataIndex: "paid_at",
                width: 110,
                render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
              },
              {
                title: "Monto",
                dataIndex: "amount",
                align: "right",
                render: (v: string) => money(v, purchase.currency),
              },
              {
                title: "PEN",
                dataIndex: "amount_pen",
                align: "right",
                width: 110,
                render: (v: string) => money(v),
              },
              {
                title: "Método",
                dataIndex: "method_label",
                width: 120,
                render: (v: string | null, row) => v ?? row.method ?? "—",
              },
            ]}
          />

          {paymentFormOpen && (
            <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
              <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                Nuevo pago
              </Typography.Text>
              <Flex gap={12} wrap>
                <Form.Item name="paidAt" label="Fecha" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                  <DatePicker format="DD/MM/YYYY" />
                </Form.Item>
                <Form.Item name="amount" label="Monto" rules={[{ required: true }]} style={{ marginBottom: 8 }}>
                  <InputNumber min={0.01} precision={2} style={{ width: 140 }} />
                </Form.Item>
                <Form.Item name="method" label="Método" style={{ marginBottom: 8 }}>
                  <Select allowClear options={METHOD_OPTIONS} style={{ width: 160 }} />
                </Form.Item>
              </Flex>
              <Form.Item name="notes" label="Notas">
                <Input.TextArea rows={2} maxLength={500} />
              </Form.Item>
              <Flex gap={8}>
                <Button type="primary" loading={registerPayment.isPending} onClick={() => submitPayment(false)}>
                  Guardar pago
                </Button>
                <Button onClick={() => setPaymentFormOpen(false)}>Cancelar</Button>
              </Flex>
            </Form>
          )}
        </>
      )}
    </Drawer>
  );
}
