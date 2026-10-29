"use client";

import { useState } from "react";
import { DeleteOutlined, PlusOutlined, ThunderboltOutlined } from "@ant-design/icons";
import {
  Alert,
  Button,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Row,
  Select,
  Space,
  Table,
  Typography,
  type FormInstance,
} from "antd";
import dayjs from "dayjs";

import type { TreasuryAccount } from "@/modules/treasury/domain/treasury.types";
import { PAYMENT_METHOD_OPTIONS } from "@/modules/treasury/domain/treasury.types";

import { computeDueDate, formatAmount, round2, type DocumentFormValues, type InstallmentValues } from "./document-model";

interface PaymentTabProps {
  form: FormInstance<DocumentFormValues>;
  /** Cajas / cuentas corrientes activas en la moneda del documento. */
  accounts: TreasuryAccount[];
  /** Neto a pagar (charges.payable) del último cálculo. */
  payable: number | null;
}

/** Pestaña "Pago": caja al contado o cuotas a crédito. */
export function PaymentTab({ form, accounts, payable }: PaymentTabProps) {
  const paymentTerm = Form.useWatch("paymentTerm", form);
  const currency = Form.useWatch("currency", form);

  if (paymentTerm === "cash") {
    return (
      <Row gutter={24}>
        <Col xs={24} lg={12}>
          <Form.Item
            name="treasuryAccountId"
            label="Caja / Cta.Cte."
            extra={
              accounts.length
                ? "Al aceptar se registra el pago desde esta caja / cuenta. Déjalo vacío para no generar movimiento."
                : `No hay cajas ni cuentas activas en ${currency}. La compra quedará pagada sin movimiento de caja.`
            }
          >
            <Select
              allowClear
              placeholder="Sin movimiento de caja"
              options={accounts.map((a) => ({ value: a.id, label: a.label }))}
              onChange={(id: string | undefined) => {
                const account = accounts.find((a) => a.id === id);
                if (account) form.setFieldValue("paymentMethod", account.type === "bank" ? "transfer" : "cash");
              }}
            />
          </Form.Item>
        </Col>
        <Col xs={24} lg={12}>
          <Form.Item name="paymentMethod" label="Forma de Pago">
            <Select options={PAYMENT_METHOD_OPTIONS} />
          </Form.Item>
          <Form.Item name="paymentReference" label="Nro. Operación">
            <Input maxLength={60} placeholder="Voucher, cheque, operación bancaria (opcional)" />
          </Form.Item>
        </Col>
      </Row>
    );
  }

  return <InstallmentsEditor form={form} payable={payable} />;
}

function InstallmentsEditor({ form, payable }: { form: FormInstance<DocumentFormValues>; payable: number | null }) {
  const installments = (Form.useWatch("installments", form) ?? []) as InstallmentValues[];
  const issueDate = Form.useWatch("issueDate", form);
  const creditDays = Form.useWatch("creditDays", form) ?? 0;
  const [count, setCount] = useState<number>(2);
  const [every, setEvery] = useState<number>(30);

  const sum = round2(installments.reduce((acc, row) => acc + (row?.amount ?? 0), 0));
  const diff = payable == null ? 0 : round2(payable - sum);
  const dueDate = computeDueDate({ issueDate, paymentTerm: "credit", creditDays, installments: [] });

  const generate = () => {
    if (payable == null || !issueDate || count < 1) return;
    const base = Math.floor((payable / count) * 100) / 100;
    const rows: InstallmentValues[] = Array.from({ length: count }, (_, i) => ({
      dueDate: dayjs(issueDate).add(every * (i + 1), "day"),
      amount: i === count - 1 ? round2(payable - base * (count - 1)) : base,
    }));
    form.setFieldValue("installments", rows);
    form.setFieldValue("creditDays", every * count);
  };

  return (
    <>
      <Flex gap={12} wrap align="center" style={{ marginBottom: 8 }}>
        <Typography.Text strong>Cuotas</Typography.Text>
        <Space.Compact>
          <InputNumber
            min={1}
            max={60}
            precision={0}
            value={count}
            onChange={(v) => setCount(v ?? 1)}
            style={{ width: 110 }}
            suffix="cuotas"
          />
          <InputNumber
            min={1}
            max={999}
            precision={0}
            value={every}
            onChange={(v) => setEvery(v ?? 30)}
            style={{ width: 130 }}
            prefix="cada"
            suffix="días"
          />
          <Button icon={<ThunderboltOutlined />} onClick={generate} disabled={payable == null}>
            Generar cuotas
          </Button>
        </Space.Compact>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          Neto a pagar: {payable == null ? "— (calcule primero, F9)" : formatAmount(payable)}
        </Typography.Text>
      </Flex>

      <Form.List name="installments">
        {(fields, { add, remove }) => (
          <>
            <Table
              size="small"
              bordered
              pagination={false}
              rowKey="key"
              dataSource={fields.map(({ key, name }) => ({ key, name }))}
              locale={{
                emptyText: `Sin cuotas: se crea una cuota única por el neto a pagar con vencimiento ${
                  dueDate ? dueDate.format("DD/MM/YYYY") : "—"
                }.`,
              }}
              columns={[
                { title: "Nº", key: "n", width: 50, render: (_, f) => f.name + 1 },
                {
                  title: "Vencimiento",
                  key: "dueDate",
                  width: 180,
                  render: (_, f) => (
                    <Form.Item name={[f.name, "dueDate"]} style={{ marginBottom: 0 }} rules={[{ required: true, message: "Fecha" }]}>
                      <DatePicker size="small" format="DD/MM/YYYY" style={{ width: "100%" }} />
                    </Form.Item>
                  ),
                },
                {
                  title: "Importe",
                  key: "amount",
                  width: 160,
                  render: (_, f) => (
                    <Form.Item name={[f.name, "amount"]} style={{ marginBottom: 0 }} rules={[{ required: true, message: "Importe" }]}>
                      <InputNumber size="small" min={0.01} precision={2} style={{ width: "100%" }} controls={false} />
                    </Form.Item>
                  ),
                },
                {
                  title: "",
                  key: "actions",
                  width: 44,
                  render: (_, f) => (
                    <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => remove(f.name)} />
                  ),
                },
              ]}
            />
            <Flex justify="space-between" align="center" style={{ marginTop: 8 }} gap={12} wrap>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => {
                  const last = installments[installments.length - 1]?.dueDate;
                  add({
                    dueDate: last ? dayjs(last).add(30, "day") : dayjs(issueDate).add(creditDays || 30, "day"),
                    amount: diff > 0 ? diff : undefined,
                  });
                }}
              >
                Agregar cuota
              </Button>
              {installments.length > 0 && payable != null && (
                <Alert
                  type={diff === 0 ? "success" : "warning"}
                  showIcon
                  style={{ padding: "2px 10px" }}
                  title={
                    diff === 0
                      ? `Las cuotas suman ${formatAmount(sum)} = Neto a pagar`
                      : `Las cuotas suman ${formatAmount(sum)}; el neto a pagar es ${formatAmount(payable)} (diferencia ${formatAmount(diff)})`
                  }
                />
              )}
            </Flex>
          </>
        )}
      </Form.List>
    </>
  );
}
