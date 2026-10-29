"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { DeleteOutlined, SearchOutlined, SplitCellsOutlined } from "@ant-design/icons";
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
import { applyApiFieldErrors } from "@/shared/lib/form-errors";
import { useEnterToNextField, useHotkeys } from "@/shared/lib/use-keyboard-entry";

import { useCreateSupplierPayment, usePendingPayables } from "../application/use-treasury";
import {
  PAYMENT_METHOD_OPTIONS,
  type PayableDocument,
  type PaymentMethod,
  type SupplierPayment,
  type TreasuryAccount,
} from "../domain/treasury.types";
import { SupplierSelect } from "./supplier-select";
import { CURRENCY_NAMES, DATE_FORMAT, formatAmount, guardEscape, round2 } from "./ui-helpers";

interface SupplierPaymentModalProps {
  open: boolean;
  /** Cajas/cuentas activas (ya cargadas por la vista). */
  accounts: TreasuryAccount[];
  initialSupplierId?: string;
  /** Moneda preferida para elegir la caja por defecto (ej. desde "Antigüedad de deuda"). */
  preferredCurrency?: string;
  onClose: () => void;
  onSaved?: (payment: SupplierPayment) => void;
}

/** "Nuevo Pago" de SiempreSoft (Pago de CxP). */
export function SupplierPaymentModal({ open, onClose, ...props }: SupplierPaymentModalProps) {
  return (
    <Modal
      open={open}
      onCancel={onClose}
      title="Nuevo Pago"
      width={1080}
      footer={null}
      destroyOnHidden
      keyboard={false}
      mask={{ closable: false }}
      styles={{ body: { paddingTop: 8 } }}
    >
      {open && <SupplierPaymentForm onClose={onClose} {...props} />}
    </Modal>
  );
}

type HeaderValues = {
  treasuryAccountId?: string;
  supplierId?: string;
  method: PaymentMethod;
  paidAt: Dayjs;
  reference?: string;
  amount?: number | null;
  observations?: string;
};

type GridRow = PayableDocument & { abono: number };

const BACKEND_FIELDS: Record<string, keyof HeaderValues> = {
  supplier_id: "supplierId",
  treasury_account_id: "treasuryAccountId",
  method: "method",
  paid_at: "paidAt",
  reference: "reference",
  observations: "observations",
};

function methodFor(account: TreasuryAccount | undefined): PaymentMethod {
  return account?.type === "bank" ? "transfer" : "cash";
}

/** Reparte `amount` sobre las filas (ya ordenadas por vencimiento): las más antiguas primero. */
function distribute(rows: GridRow[], selected: Set<string>, amount: number): { rows: GridRow[]; leftover: number } {
  let remaining = round2(amount);
  const next = rows.map((row) => {
    if (!selected.has(row.purchase_id)) return { ...row, abono: 0 };
    const abono = round2(Math.min(remaining, Number(row.pending)));
    remaining = round2(remaining - abono);
    return { ...row, abono };
  });
  return { rows: next, leftover: remaining };
}

function SupplierPaymentForm({
  accounts,
  initialSupplierId,
  preferredCurrency,
  onClose,
  onSaved,
}: Omit<SupplierPaymentModalProps, "open">) {
  const { message } = App.useApp();
  const [form] = Form.useForm<HeaderValues>();
  const containerRef = useRef<HTMLDivElement>(null);
  const create = useCreateSupplierPayment();
  const today = dayjs().format("YYYY-MM-DD");

  const defaultAccount = useMemo(
    () => (preferredCurrency && accounts.find((a) => a.currency === preferredCurrency)) || accounts[0],
    [accounts, preferredCurrency],
  );

  const [rows, setRows] = useState<GridRow[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeRow, setActiveRow] = useState<string | null>(null);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);

  const accountId = Form.useWatch("treasuryAccountId", form) ?? defaultAccount?.id;
  const supplierId = Form.useWatch("supplierId", form);
  const amount = Form.useWatch("amount", form);
  const account = accounts.find((a) => a.id === accountId);
  const currency = account?.currency;

  const pending = usePendingPayables(supplierId, currency, false);

  const total = useMemo(
    () => round2(rows.filter((r) => selected.has(r.purchase_id)).reduce((sum, r) => sum + r.abono, 0)),
    [rows, selected],
  );
  const currentKey = `${supplierId ?? ""}|${currency ?? ""}`;
  const stale = loadedFor !== null && loadedFor !== currentKey;

  const clearGrid = () => {
    setRows([]);
    setSelected(new Set());
    setActiveRow(null);
    setLoadedFor(null);
  };

  const searchPending = async () => {
    if (!account) {
      message.warning("Seleccione la Caja / Cta.Cte.");
      return;
    }
    if (!supplierId) {
      message.warning("Seleccione el proveedor");
      form.getFieldInstance("supplierId")?.focus?.();
      return;
    }
    const result = await pending.refetch();
    if (result.error) {
      message.error(result.error.message);
      return;
    }
    const docs = result.data ?? [];
    const all = new Set(docs.map((d) => d.purchase_id));
    const base: GridRow[] = docs.map((d) => ({ ...d, abono: Number(d.pending) }));
    const typed = Number(amount ?? 0);
    setRows(typed > 0 ? distribute(base, all, typed).rows : base);
    setSelected(all);
    setActiveRow(null);
    setLoadedFor(currentKey);
    if (docs.length === 0) message.info(`El proveedor no tiene documentos pendientes en ${currency}`);
  };

  const spread = () => {
    const typed = Number(amount ?? 0);
    if (!(typed > 0)) {
      message.warning("Ingrese el Importe a repartir");
      form.getFieldInstance("amount")?.focus?.();
      return;
    }
    if (selected.size === 0) {
      message.warning("Seleccione los documentos a pagar");
      return;
    }
    const { rows: next, leftover } = distribute(rows, selected, typed);
    setRows(next);
    if (leftover > 0) {
      message.warning(`El importe excede lo pendiente seleccionado; sobran ${formatAmount(leftover)}`);
    }
  };

  const removeItem = () => {
    if (!activeRow) return;
    setRows((current) => current.filter((r) => r.purchase_id !== activeRow));
    setSelected((current) => {
      const next = new Set(current);
      next.delete(activeRow);
      return next;
    });
    setActiveRow(null);
  };

  const setAbono = (purchaseId: string, value: number | null) => {
    const abono = round2(Number(value ?? 0));
    setRows((current) => current.map((r) => (r.purchase_id === purchaseId ? { ...r, abono } : r)));
    if (abono > 0) setSelected((current) => new Set(current).add(purchaseId));
  };

  const submit = async () => {
    let values: HeaderValues;
    try {
      values = await form.validateFields();
    } catch {
      return;
    }
    if (!account) {
      message.error("Seleccione la Caja / Cta.Cte.");
      return;
    }
    const applications = rows
      .filter((r) => selected.has(r.purchase_id) && r.abono > 0)
      .map((r) => ({ purchaseId: r.purchase_id, amount: r.abono }));
    if (stale || applications.length === 0) {
      message.error("Cargue los documentos con «Buscar Pendientes (F3)» e indique el abono");
      return;
    }
    const typed = Number(values.amount ?? 0);
    if (typed > 0 && Math.abs(typed - total) > 0.005) {
      message.error(
        `El Importe (${formatAmount(typed)}) no coincide con el Total de abonos (${formatAmount(total)}). Use «Repartir Abono» o corrija los abonos.`,
      );
      return;
    }

    create.mutate(
      {
        supplierId: values.supplierId ?? (supplierId as string),
        treasuryAccountId: account.id,
        method: values.method,
        currency: account.currency,
        paidAt: values.paidAt.format("YYYY-MM-DD"),
        reference: values.reference,
        observations: values.observations,
        applications,
      },
      {
        onSuccess: (payment) => {
          message.success(`Pago N° ${payment.payment_number} registrado por ${formatAmount(payment.total_amount)}`);
          onSaved?.(payment);
          onClose();
        },
        onError: (error) => applyApiFieldErrors(form, error, BACKEND_FIELDS),
      },
    );
  };

  useEnterToNextField(containerRef);
  useHotkeys({
    F3: () => void searchPending(),
    F10: () => void submit(),
    CtrlEnter: () => void submit(),
    Escape: guardEscape(onClose),
  });

  const columns: TableProps<GridRow>["columns"] = [
    {
      title: "Proveedor",
      dataIndex: "supplier_business_name",
      ellipsis: true,
      render: (name: string, row) => (
        <Tooltip title={`${row.supplier_document_number} · ${name}`}>
          <span>{name}</span>
        </Tooltip>
      ),
    },
    { title: "Tipo Doc.", dataIndex: "document_type", width: 80 },
    { title: "Nro. Comprobante", dataIndex: "document_label", width: 150 },
    {
      title: "Fecha Doc.",
      dataIndex: "issue_date",
      width: 100,
      render: (d: string) => dayjs(d).format(DATE_FORMAT),
    },
    {
      title: "Vence",
      dataIndex: "due_date",
      width: 110,
      render: (d: string, row) => {
        const overdue = d < today;
        const content = (
          <Typography.Text type={overdue ? "danger" : undefined} strong={overdue}>
            {dayjs(d).format(DATE_FORMAT)}
            {row.installments.length > 1 && ` (${row.installments.length} c.)`}
          </Typography.Text>
        );
        return row.installments.length > 1 ? (
          <Tooltip
            title={row.installments.map((i) => (
              <div key={i.number}>
                Cuota {i.number}: {dayjs(i.due_date).format(DATE_FORMAT)} · {formatAmount(i.amount)}
              </div>
            ))}
          >
            {content}
          </Tooltip>
        ) : (
          content
        );
      },
    },
    {
      title: "Pendiente",
      dataIndex: "pending",
      width: 120,
      align: "right",
      render: (v: string, row) => (
        <Typography.Text type={row.due_date < today ? "danger" : undefined}>{formatAmount(v)}</Typography.Text>
      ),
    },
    {
      title: "Abono",
      key: "abono",
      width: 140,
      align: "right",
      render: (_, row) => (
        <InputNumber
          size="small"
          min={0}
          max={Number(row.pending)}
          precision={2}
          value={row.abono}
          onChange={(v) => setAbono(row.purchase_id, v)}
          onFocus={() => setActiveRow(row.purchase_id)}
          style={{ width: "100%" }}
          styles={{ input: { textAlign: "right" } }}
        />
      ),
    },
  ];

  return (
    <div ref={containerRef}>
      {accounts.length === 0 && (
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          title="No hay cajas ni cuentas bancarias activas"
          description={
            <span>
              Cree al menos una en <Link href="/treasury/accounts">Tesorería › Cajas y bancos</Link> para registrar pagos.
            </span>
          }
        />
      )}
      {create.error instanceof ApiError && (
        <Alert type="error" showIcon title={create.error.message} style={{ marginBottom: 12 }} />
      )}

      <Form<HeaderValues>
        form={form}
        layout="horizontal"
        size="small"
        labelCol={{ flex: "130px" }}
        labelAlign="right"
        colon={false}
        initialValues={{
          treasuryAccountId: defaultAccount?.id,
          supplierId: initialSupplierId,
          method: methodFor(defaultAccount),
          paidAt: dayjs(),
        }}
        onValuesChange={(changed: Partial<HeaderValues>) => {
          if ("treasuryAccountId" in changed) {
            form.setFieldValue("method", methodFor(accounts.find((a) => a.id === changed.treasuryAccountId)));
          }
        }}
      >
        <Row gutter={24}>
          <Col xs={24} md={12}>
            <Form.Item name="treasuryAccountId" label="Caja / Cta.Cte." rules={[{ required: true }]}>
              <Select
                autoFocus={!initialSupplierId}
                options={accounts.map((a) => ({ value: a.id, label: a.label }))}
              />
            </Form.Item>
            <Form.Item label="Moneda">
              <Input readOnly tabIndex={-1} value={currency ? `${currency} - ${CURRENCY_NAMES[currency] ?? currency}` : ""} />
            </Form.Item>
            <Form.Item name="supplierId" label="Proveedor" rules={[{ required: true, message: "Seleccione el proveedor" }]}>
              <SupplierSelect autoFocus={Boolean(initialSupplierId)} />
            </Form.Item>
            <Form.Item name="method" label="Forma de Pago" rules={[{ required: true }]}>
              <Select options={PAYMENT_METHOD_OPTIONS} />
            </Form.Item>
            <Form.Item label={<strong>Importe</strong>}>
              <Flex gap={8}>
                <Form.Item name="amount" noStyle>
                  <InputNumber
                    min={0}
                    precision={2}
                    placeholder="0.00"
                    style={{ flex: 1 }}
                    styles={{ input: { textAlign: "right", fontWeight: 600 } }}
                  />
                </Form.Item>
                <Tooltip title="Distribuye el importe entre los documentos marcados, del más antiguo al más reciente">
                  <Button icon={<SplitCellsOutlined />} onClick={spread} disabled={rows.length === 0}>
                    Repartir Abono
                  </Button>
                </Tooltip>
              </Flex>
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item label="Tipo Operación">
              <Input readOnly tabIndex={-1} value="PAGO A PROVEEDOR" />
            </Form.Item>
            <Form.Item name="reference" label="Nro. Documento / Operación">
              <Input maxLength={60} placeholder="N° operación, cheque…" />
            </Form.Item>
            <Form.Item name="paidAt" label="Fecha Abono" rules={[{ required: true }]}>
              <DatePicker format={DATE_FORMAT} allowClear={false} style={{ width: "100%" }} />
            </Form.Item>
            {account?.type === "bank" && (
              <Form.Item label="Banco">
                <Input
                  readOnly
                  tabIndex={-1}
                  value={[account.bank_name, account.account_number].filter(Boolean).join(" · ")}
                />
              </Form.Item>
            )}
          </Col>
          <Col span={24}>
            <Form.Item name="observations" label="Observación">
              <Input maxLength={500} />
            </Form.Item>
          </Col>
        </Row>
      </Form>

      {stale && (
        <Alert
          type="info"
          showIcon
          style={{ margin: "4px 0 8px" }}
          title="Cambió el proveedor o la caja: vuelva a «Buscar Pendientes (F3)»."
        />
      )}

      <Table<GridRow>
        size="small"
        bordered
        rowKey="purchase_id"
        columns={columns}
        dataSource={rows}
        pagination={false}
        loading={pending.isFetching}
        scroll={{ y: 260, x: "max-content" }}
        rowSelection={{
          selectedRowKeys: Array.from(selected),
          onChange: (keys) => {
            const next = new Set(keys as string[]);
            setSelected(next);
            setRows((current) =>
              current.map((r) => {
                if (!next.has(r.purchase_id)) return { ...r, abono: 0 };
                if (!selected.has(r.purchase_id) && r.abono === 0) return { ...r, abono: Number(r.pending) };
                return r;
              }),
            );
          },
        }}
        onRow={(row) => ({
          onClick: () => setActiveRow(row.purchase_id),
          style: row.purchase_id === activeRow ? { background: "var(--cf-accent-soft)" } : undefined,
        })}
        locale={{
          emptyText: (
            <Typography.Text type="secondary">
              Seleccione proveedor y presione «Buscar Pendientes (F3)»
            </Typography.Text>
          ),
        }}
      />

      <Flex justify="space-between" align="center" wrap gap={12} style={{ marginTop: 12 }}>
        <Flex gap={8}>
          <Tooltip title="F3">
            <Button icon={<SearchOutlined />} onClick={() => void searchPending()} loading={pending.isFetching}>
              Buscar Pendientes (F3)
            </Button>
          </Tooltip>
          <Button icon={<DeleteOutlined />} onClick={removeItem} disabled={!activeRow}>
            Eliminar Item
          </Button>
          {rows.length > 0 && (
            <Button type="link" onClick={clearGrid}>
              Limpiar
            </Button>
          )}
        </Flex>
        <Flex align="center" gap={12}>
          <Typography.Text strong>Total</Typography.Text>
          <Input
            readOnly
            tabIndex={-1}
            value={formatAmount(total)}
            style={{ width: 160, textAlign: "right", fontWeight: 700 }}
            prefix={currency}
          />
        </Flex>
      </Flex>

      <Flex justify="flex-end" gap={8} style={{ marginTop: 16 }}>
        <Tooltip title="F10 o Ctrl+Enter">
          <Button type="primary" onClick={() => void submit()} loading={create.isPending} disabled={!account}>
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
