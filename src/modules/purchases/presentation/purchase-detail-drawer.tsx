"use client";

import { useMemo, useState } from "react";
import { DollarOutlined, StopOutlined, WalletOutlined } from "@ant-design/icons";
import {
  App,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Drawer,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Spin,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import Link from "next/link";

import { useTreasuryAccounts } from "@/modules/treasury/application/use-treasury";
import { PAYMENT_METHOD_OPTIONS, type PaymentMethod } from "@/modules/treasury/domain/treasury.types";

import {
  usePurchase,
  usePurchasePayments,
  usePurchasesDetails,
  useRegisterPurchasePayment,
} from "../application/use-purchases";
import {
  documentTypeLabel,
  PAYMENT_STATUS_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
  type ExpensePurchaseLine,
  type MerchandisePurchaseLine,
  type Purchase,
  type PurchaseInstallment,
} from "../domain/purchase.types";
import { formatAmount, formatCurrency, round2 } from "./document/document-model";

interface PurchaseDetailDrawerProps {
  purchaseId: string | null;
  open: boolean;
  onClose: () => void;
  onAnnul?: (purchase: Purchase) => void;
}

interface PaymentFormValues {
  paidAt: dayjs.Dayjs;
  amount?: number;
  treasuryAccountId?: string;
  method?: PaymentMethod;
  reference?: string;
  notes?: string;
}

interface InstallmentRow extends PurchaseInstallment {
  paid: number;
  pending: number;
}

/** Reparte lo pagado sobre las cuotas, de la más antigua a la más nueva. */
function applyPaidToInstallments(installments: PurchaseInstallment[], paid: number): InstallmentRow[] {
  let remaining = paid;
  return [...installments]
    .sort((a, b) => a.due_date.localeCompare(b.due_date) || a.number - b.number)
    .map((inst) => {
      const amount = Number(inst.amount);
      const applied = round2(Math.min(Math.max(remaining, 0), amount));
      remaining = round2(remaining - applied);
      return { ...inst, paid: applied, pending: round2(amount - applied) };
    });
}

const date = (d?: string | null) => (d ? dayjs(d).format("DD/MM/YYYY") : "—");

export function PurchaseDetailDrawer({ purchaseId, open, onClose, onAnnul }: PurchaseDetailDrawerProps) {
  const { message } = App.useApp();
  const { data: purchase, isLoading } = usePurchase(purchaseId);
  const { data: payments } = usePurchasePayments(open ? purchaseId : null);
  const { data: treasuryAccounts } = useTreasuryAccounts(true);
  const registerPayment = useRegisterPurchasePayment(purchaseId);
  const [paymentFormOpen, setPaymentFormOpen] = useState(false);
  const [form] = Form.useForm<PaymentFormValues>();

  const allocationTargets = useMemo(
    () => Array.from(new Set((purchase?.allocations ?? []).map((a) => a.target_purchase_id))),
    [purchase],
  );
  const targetQueries = usePurchasesDetails(purchase?.kind === "additional_cost" ? allocationTargets : []);
  const targetById = new Map(targetQueries.map((q) => q.data).filter((p): p is Purchase => Boolean(p)).map((p) => [p.id, p]));

  const status = PURCHASE_STATUS_OPTIONS.find((o) => o.value === purchase?.status);
  const paymentStatus = PAYMENT_STATUS_OPTIONS.find((o) => o.value === purchase?.payment_status);
  const isExpense = purchase?.kind === "expense";
  const isAdditionalCost = purchase?.kind === "additional_cost";
  const usesAccountLines = isExpense || isAdditionalCost;
  const titlePrefix = isExpense ? "Gasto" : isAdditionalCost ? "Costo adicional" : "Compra";
  const currency = purchase?.currency ?? "PEN";
  const canPay = purchase?.status === "registered" && purchase.payment_status !== "paid";

  const payable = Number(purchase?.charges?.payable ?? purchase?.totals.total ?? 0);
  const paid = round2((payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0));
  const pending = round2(payable - paid);
  const installments = applyPaidToInstallments(purchase?.installments ?? [], paid);
  const accountsInCurrency = (treasuryAccounts ?? []).filter((a) => a.active && a.currency === currency);

  const openPaymentForm = () => {
    const first = accountsInCurrency[0];
    form.setFieldsValue({
      paidAt: dayjs(),
      amount: pending > 0 ? pending : undefined,
      treasuryAccountId: first?.id,
      method: first ? (first.type === "bank" ? "transfer" : "cash") : "cash",
      reference: undefined,
      notes: undefined,
    });
    setPaymentFormOpen(true);
  };

  const submitPayment = () => {
    form.validateFields().then((values) => {
      registerPayment.mutate(
        {
          paidAt: values.paidAt.format("YYYY-MM-DD"),
          amount: values.amount,
          method: values.method || null,
          notes: values.notes || null,
          treasuryAccountId: values.treasuryAccountId || null,
          reference: values.reference?.trim() || null,
        },
        {
          onSuccess: () => {
            message.success("Pago registrado");
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
      onClose={() => {
        setPaymentFormOpen(false);
        onClose();
      }}
      size={860}
      extra={
        <Flex gap={8}>
          {canPay && (
            <Button icon={<DollarOutlined />} onClick={openPaymentForm}>
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
            <Tag color={paymentStatus?.color}>{paymentStatus?.label ?? purchase.payment_status_label ?? "Pago"}</Tag>
            <Tag>{purchase.kind_label ?? titlePrefix}</Tag>
            <Typography.Text type="secondary">Correlativo {purchase.registration_code ?? "—"}</Typography.Text>
          </Flex>

          <Descriptions size="small" column={2} bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="Proveedor" span={2}>
              {purchase.supplier_business_name}
              <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                RUC {purchase.supplier_document_number}
              </Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label="Tipo Comprobante">
              {purchase.document_type} · {documentTypeLabel(purchase.document_type)}
            </Descriptions.Item>
            <Descriptions.Item label="Nro. Comprobante">
              {purchase.series}-{purchase.number}
            </Descriptions.Item>
            {(purchase.beneficiary_name || purchase.beneficiary_document) && (
              <Descriptions.Item label="Beneficiario" span={2}>
                {purchase.beneficiary_name ?? "—"}
                {purchase.beneficiary_document ? ` · Doc. ${purchase.beneficiary_document}` : ""}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Fecha Doc.">{date(purchase.issue_date)}</Descriptions.Item>
            <Descriptions.Item label="Fecha Contable">{date(purchase.accounting_date)}</Descriptions.Item>
            <Descriptions.Item label="Condición Pago">
              {purchase.payment_term === "cash" ? "Contado" : `Crédito ${purchase.credit_days} días`}
            </Descriptions.Item>
            <Descriptions.Item label="Fecha Vencimiento">{date(purchase.due_date)}</Descriptions.Item>
            {!isExpense && (
              <Descriptions.Item label="Recepción">
                {date(purchase.reception_date)}
                {purchase.reception_number ? ` · Nº ${purchase.reception_number}` : ""}
              </Descriptions.Item>
            )}
            <Descriptions.Item label="Moneda">
              {purchase.currency} · TC {purchase.exchange_rate}
            </Descriptions.Item>
            <Descriptions.Item label="Precios">
              {purchase.prices_include_tax === false ? "Sin impuestos" : "Incluyen impuestos"}
            </Descriptions.Item>
            {purchase.purchase_order_id && <Descriptions.Item label="Origen">Orden de compra</Descriptions.Item>}
            {purchase.detraction && (
              <Descriptions.Item label="Detracción">
                {purchase.detraction.code} · {purchase.detraction.percent}% ·{" "}
                {formatCurrency(purchase.detraction.amount, currency)}
              </Descriptions.Item>
            )}
            {purchase.modified_document && (
              <Descriptions.Item label="Doc. modificado" span={2}>
                {purchase.modified_document.document_type} {purchase.modified_document.series}-
                {purchase.modified_document.number} · {date(purchase.modified_document.issue_date)}
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
            Detalle
          </Typography.Text>
          {usesAccountLines ? (
            <Table<ExpensePurchaseLine>
              size="small"
              rowKey="line_number"
              pagination={false}
              dataSource={purchase.lines.filter((l): l is ExpensePurchaseLine => l.line_kind === "account")}
              columns={[
                { title: "#", dataIndex: "line_number", width: 40 },
                {
                  title: "Cuenta",
                  key: "account",
                  render: (_, line) => (
                    <div>
                      <Typography.Text>
                        {line.account_code} · {line.account_name}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        {line.description}
                      </Typography.Text>
                    </div>
                  ),
                },
                {
                  title: "Importe",
                  dataIndex: "unit_price",
                  width: 110,
                  align: "right",
                  render: (v: string | null, line) => formatAmount(v ?? line.gross_total),
                },
                {
                  title: "Total c/IGV",
                  dataIndex: "gross_total",
                  width: 110,
                  align: "right",
                  render: (v: string) => formatAmount(v),
                },
                {
                  title: isAdditionalCost ? "A repartir" : "Gasto",
                  dataIndex: "expense_amount",
                  width: 110,
                  align: "right",
                  render: (v: string) => formatAmount(v),
                },
              ]}
            />
          ) : (
            <Table<MerchandisePurchaseLine>
              size="small"
              rowKey="line_number"
              pagination={false}
              dataSource={purchase.lines.filter((l): l is MerchandisePurchaseLine => l.line_kind === "item")}
              columns={[
                { title: "#", dataIndex: "line_number", width: 40 },
                {
                  title: "Artículo",
                  key: "product",
                  render: (_, line) => (
                    <div>
                      <Typography.Text>{line.product_description}</Typography.Text>
                      <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                        {line.product_code}
                      </Typography.Text>
                    </div>
                  ),
                },
                {
                  title: "Cantidad",
                  dataIndex: "quantity",
                  width: 90,
                  align: "right",
                  render: (v: string) => Number(v).toLocaleString("es-PE", { maximumFractionDigits: 5 }),
                },
                {
                  title: "Precio unit.",
                  dataIndex: "unit_price",
                  width: 100,
                  align: "right",
                  render: (v: string | null) =>
                    v == null ? "—" : Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 6 }),
                },
                {
                  title: "Total c/IGV",
                  dataIndex: "gross_total",
                  width: 110,
                  align: "right",
                  render: (v: string) => formatAmount(v),
                },
                {
                  title: "Costo unit. PEN",
                  dataIndex: "unit_cost",
                  width: 110,
                  align: "right",
                  render: (v: string) => Number(v).toFixed(4),
                },
              ]}
            />
          )}

          <Row gutter={16} style={{ marginTop: 12 }}>
            <Col xs={24} md={12}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Valor Compra">
                  {formatAmount(
                    Number(purchase.totals.taxable_operations) +
                      Number(purchase.totals.unaffected_operations) +
                      Number(purchase.totals.exonerated_operations) +
                      Number(purchase.totals.other_charges),
                  )}
                </Descriptions.Item>
                <Descriptions.Item label="IGV">
                  {formatAmount(Number(purchase.totals.igv_credit) + Number(purchase.totals.igv_non_deductible))}
                </Descriptions.Item>
                {Number(purchase.totals.isc) > 0 && (
                  <Descriptions.Item label="ISC">{formatAmount(purchase.totals.isc)}</Descriptions.Item>
                )}
                {Number(purchase.totals.discount) > 0 && (
                  <Descriptions.Item label="Descuento">{formatAmount(purchase.totals.discount)}</Descriptions.Item>
                )}
                <Descriptions.Item label="Precio Compra">
                  <strong>{formatCurrency(purchase.totals.total, currency)}</strong>
                </Descriptions.Item>
              </Descriptions>
            </Col>
            <Col xs={24} md={12}>
              <Descriptions size="small" column={1} bordered>
                <Descriptions.Item label="Percepción">{formatAmount(purchase.charges?.perception ?? 0)}</Descriptions.Item>
                {purchase.charges?.retention_percent != null && (
                  <Descriptions.Item label={`Retención 4ta (${Number(purchase.charges.retention_percent)}%)`}>
                    {formatAmount(purchase.charges.retention)}
                  </Descriptions.Item>
                )}
                <Descriptions.Item label="Neto a pagar">
                  <strong>{formatCurrency(payable, currency)}</strong>
                  {currency !== "PEN" && purchase.charges ? ` · S/ ${formatAmount(purchase.charges.payable_pen)}` : ""}
                </Descriptions.Item>
                <Descriptions.Item label="Pagado">{formatAmount(paid)}</Descriptions.Item>
                <Descriptions.Item label="Saldo pendiente">
                  <Typography.Text type={pending > 0 ? "warning" : "success"} strong>
                    {formatCurrency(pending, currency)}
                  </Typography.Text>
                </Descriptions.Item>
              </Descriptions>
            </Col>
          </Row>

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
                  {
                    title: "Compra",
                    key: "purchase",
                    width: 130,
                    render: (_, r) => {
                      const target = targetById.get(r.target_purchase_id);
                      return target ? `${target.series}-${target.number}` : "…";
                    },
                  },
                  {
                    title: "Artículo",
                    key: "product",
                    ellipsis: true,
                    render: (_, r) => {
                      const line = targetById
                        .get(r.target_purchase_id)
                        ?.lines.find((l) => l.line_number === r.target_line_number);
                      return line && line.line_kind === "item" ? `${line.product_code} · ${line.product_description}` : "…";
                    },
                  },
                  { title: "Línea", dataIndex: "target_line_number", width: 60 },
                  {
                    title: "Monto PEN",
                    dataIndex: "allocated_amount_pen",
                    align: "right",
                    width: 120,
                    render: (v: string) => formatAmount(v),
                  },
                ]}
              />
            </>
          )}

          {installments.length > 0 && purchase.payment_term !== "cash" && (
            <>
              <Typography.Text strong style={{ display: "block", margin: "16px 0 8px" }}>
                Cuotas
              </Typography.Text>
              <Table<InstallmentRow>
                size="small"
                pagination={false}
                rowKey="number"
                dataSource={installments}
                columns={[
                  { title: "Nº", dataIndex: "number", width: 50 },
                  {
                    title: "Vencimiento",
                    dataIndex: "due_date",
                    width: 120,
                    render: (d: string, row) => (
                      <Typography.Text type={row.pending > 0 && dayjs(d).isBefore(dayjs(), "day") ? "danger" : undefined}>
                        {date(d)}
                      </Typography.Text>
                    ),
                  },
                  { title: "Importe", dataIndex: "amount", align: "right", render: (v: string) => formatAmount(v) },
                  { title: "Pagado", dataIndex: "paid", align: "right", render: (v: number) => formatAmount(v) },
                  {
                    title: "Pendiente",
                    dataIndex: "pending",
                    align: "right",
                    render: (v: number) =>
                      v > 0 ? formatAmount(v) : <Tag color="success" style={{ marginInlineEnd: 0 }}>Pagada</Tag>,
                  },
                ]}
              />
            </>
          )}

          <Flex justify="space-between" align="center" style={{ margin: "16px 0 8px" }} wrap gap={8}>
            <Typography.Text strong>Pagos</Typography.Text>
            <Link href={`/treasury/payments?supplier_id=${purchase.supplier_id}`}>
              <Button size="small" type="link" icon={<WalletOutlined />}>
                Ir a Pagos a proveedores
              </Button>
            </Link>
          </Flex>
          <Table
            size="small"
            pagination={false}
            rowKey="id"
            locale={{ emptyText: "Sin pagos registrados" }}
            dataSource={payments ?? []}
            columns={[
              { title: "Nro pago", dataIndex: "payment_number", width: 80, render: (v: number | null) => v ?? "—" },
              { title: "Fecha", dataIndex: "paid_at", width: 100, render: (d: string) => date(d) },
              {
                title: "Caja / Cta.",
                dataIndex: "treasury_account_label",
                ellipsis: true,
                render: (v: string | null) => v ?? "—",
              },
              {
                title: "Forma",
                dataIndex: "method_label",
                width: 110,
                render: (v: string | null, row) => v ?? row.method ?? "—",
              },
              { title: "Nro operación", dataIndex: "reference", width: 120, render: (v: string | null) => v || "—" },
              {
                title: "Abono",
                dataIndex: "amount",
                align: "right",
                width: 110,
                render: (v: string) => formatAmount(v),
              },
              ...(currency !== "PEN"
                ? [
                    {
                      title: "Abono S/",
                      dataIndex: "amount_pen",
                      align: "right" as const,
                      width: 110,
                      render: (v: string) => formatAmount(v),
                    },
                  ]
                : []),
            ]}
          />

          {paymentFormOpen && (
            <Form form={form} layout="vertical" style={{ marginTop: 16 }} size="small">
              <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
                Registrar pago · saldo {formatCurrency(pending, currency)}
              </Typography.Text>
              <Row gutter={12}>
                <Col xs={12} md={6}>
                  <Form.Item name="paidAt" label="Fecha" rules={[{ required: true }]}>
                    <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item
                    name="amount"
                    label={`Abono (${currency})`}
                    rules={[
                      { required: true },
                      {
                        validator: (_, v) =>
                          v == null || v <= pending + 0.001
                            ? Promise.resolve()
                            : Promise.reject(new Error("No puede superar el saldo pendiente")),
                      },
                    ]}
                  >
                    <InputNumber min={0.01} precision={2} style={{ width: "100%" }} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item
                    name="treasuryAccountId"
                    label="Caja / Cta.Cte."
                    rules={[{ required: accountsInCurrency.length > 0, message: "Elige la caja o cuenta" }]}
                    extra={accountsInCurrency.length ? undefined : `No hay cajas activas en ${currency}`}
                  >
                    <Select
                      options={accountsInCurrency.map((a) => ({ value: a.id, label: a.label }))}
                      onChange={(id: string) => {
                        const account = accountsInCurrency.find((a) => a.id === id);
                        if (account) form.setFieldValue("method", account.type === "bank" ? "transfer" : "cash");
                      }}
                    />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="method" label="Forma de Pago">
                    <Select options={PAYMENT_METHOD_OPTIONS} />
                  </Form.Item>
                </Col>
                <Col xs={12} md={6}>
                  <Form.Item name="reference" label="Nro. Operación">
                    <Input maxLength={60} />
                  </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                  <Form.Item name="notes" label="Notas">
                    <Input maxLength={500} />
                  </Form.Item>
                </Col>
              </Row>
              <Flex gap={8}>
                <Button type="primary" loading={registerPayment.isPending} onClick={submitPayment}>
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
