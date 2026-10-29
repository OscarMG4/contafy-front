"use client";

import { useMemo, useState } from "react";
import { DollarOutlined } from "@ant-design/icons";
import { Button, DatePicker, Empty, Flex, Select, Table, Tabs, Tag, Typography, type TableProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { usePayablesAging, useSupplierStatement } from "../application/use-treasury";
import {
  AGING_BUCKET_LABELS,
  type AgingBucket,
  type AgingDocumentRow,
  type AgingSupplierRow,
  type StatementMovement,
} from "../domain/treasury.types";
import { SupplierSelect } from "./supplier-select";
import { CURRENCY_OPTIONS, DATE_FORMAT, formatAmount, TREASURY_WRITE_ROLES } from "./ui-helpers";

const BUCKETS: AgingBucket[] = ["current", "d1_15", "d16_30", "d31_90", "d90_plus"];

const BUCKET_COLUMN_TITLES: Record<AgingBucket, string> = {
  current: "Por vencer",
  d1_15: "1–15",
  d16_30: "16–30",
  d31_90: "31–90",
  d90_plus: "> 90",
};

const BUCKET_COLORS: Record<AgingBucket, string> = {
  current: "green",
  d1_15: "gold",
  d16_30: "orange",
  d31_90: "volcano",
  d90_plus: "red",
};

const MOVEMENT_LABELS: Record<StatementMovement["type"], string> = {
  purchase: "Compra",
  credit_note: "Nota de crédito",
  payment: "Pago",
};

const amountCell = (v: string | number) =>
  Number(v) === 0 ? <Typography.Text type="secondary">—</Typography.Text> : formatAmount(v);

export function PayablesView() {
  return (
    <>
      <PageHeader
        eyebrow="Tesorería"
        title="Cuentas por pagar"
        subtitle="Antigüedad de deuda por proveedor y estado de cuenta (Mayor de proveedores)."
      />
      <Tabs
        items={[
          { key: "aging", label: "Antigüedad de deuda", children: <AgingTab /> },
          { key: "statement", label: "Estado de cuenta (Mayor de proveedores)", children: <StatementTab /> },
        ]}
      />
    </>
  );
}

function AgingTab() {
  const router = useRouter();
  const { company } = useActiveCompany();
  const { data: user } = useCurrentUser();
  const canPay = TREASURY_WRITE_ROLES.has(user?.role ?? "");
  const [asOf, setAsOf] = useState<Dayjs>(dayjs());
  const [currency, setCurrency] = useState<string>("PEN");
  const [supplierId, setSupplierId] = useState<string | undefined>();

  const { data, isLoading, isFetching } = usePayablesAging({
    asOf: asOf.format("YYYY-MM-DD"),
    currency,
    supplierId,
  });

  const documentsBySupplier = useMemo(() => {
    const map = new Map<string, AgingDocumentRow[]>();
    for (const doc of data?.documents ?? []) {
      const key = `${doc.supplier_id}|${doc.currency}`;
      map.set(key, [...(map.get(key) ?? []), doc]);
    }
    return map;
  }, [data]);

  const totals = useMemo(() => {
    const sum = (key: AgingBucket | "total") =>
      (data?.suppliers ?? []).reduce((acc, row) => acc + Number(row[key]), 0);
    return { total: sum("total"), ...Object.fromEntries(BUCKETS.map((b) => [b, sum(b)])) } as Record<
      AgingBucket | "total",
      number
    >;
  }, [data]);

  const columns: TableProps<AgingSupplierRow>["columns"] = [
    {
      title: "Proveedor",
      key: "supplier",
      render: (_, row) => (
        <div style={{ lineHeight: 1.3 }}>
          <Typography.Text strong>{row.supplier_business_name}</Typography.Text>
          <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
            {row.supplier_document_number}
          </Typography.Text>
        </div>
      ),
    },
    { title: "Mon.", dataIndex: "currency", width: 60 },
    ...BUCKETS.map((bucket) => ({
      title: BUCKET_COLUMN_TITLES[bucket],
      dataIndex: bucket,
      width: 115,
      align: "right" as const,
      render: (v: string) =>
        Number(v) > 0 && bucket !== "current" ? (
          <Typography.Text type={bucket === "d1_15" ? "warning" : "danger"}>{formatAmount(v)}</Typography.Text>
        ) : (
          amountCell(v)
        ),
    })),
    {
      title: "Total",
      dataIndex: "total",
      width: 125,
      align: "right",
      render: (v: string) => <Typography.Text strong>{formatAmount(v)}</Typography.Text>,
    },
    {
      title: "",
      key: "actions",
      width: 90,
      render: (_, row) =>
        canPay ? (
          <Button
            size="small"
            icon={<DollarOutlined />}
            onClick={() =>
              router.push(`/treasury/payments?supplier_id=${row.supplier_id}&currency=${row.currency}`)
            }
          >
            Pagar
          </Button>
        ) : null,
    },
  ];

  const documentColumns: TableProps<AgingDocumentRow>["columns"] = [
    { title: "Documento", dataIndex: "document_label", render: (v: string, r) => `${r.document_type} ${v}` },
    {
      title: "Cuota",
      key: "installment",
      width: 70,
      render: (_, r) => `${r.installment_number}/${r.installments_count}`,
    },
    {
      title: "Fecha Doc.",
      dataIndex: "issue_date",
      width: 100,
      render: (d: string) => dayjs(d).format(DATE_FORMAT),
    },
    {
      title: "Vencimiento",
      dataIndex: "installment_due_date",
      width: 105,
      render: (d: string) => dayjs(d).format(DATE_FORMAT),
    },
    {
      title: "Días vencido",
      dataIndex: "days_overdue",
      width: 100,
      align: "right",
      render: (d: number) => (d > 0 ? <Typography.Text type="danger">{d}</Typography.Text> : "—"),
    },
    {
      title: "Pendiente",
      dataIndex: "installment_pending",
      width: 120,
      align: "right",
      render: (v: string) => formatAmount(v),
    },
    {
      title: "Tramo",
      dataIndex: "bucket",
      width: 150,
      render: (b: AgingBucket) => <Tag color={BUCKET_COLORS[b]}>{AGING_BUCKET_LABELS[b]}</Tag>,
    },
  ];

  return (
    <DataTable<AgingSupplierRow>
      filters={
        <>
          <Flex align="center" gap={6}>
            <Typography.Text type="secondary">Al</Typography.Text>
            <DatePicker
              value={asOf}
              format={DATE_FORMAT}
              allowClear={false}
              onChange={(v) => v && setAsOf(v)}
            />
          </Flex>
          <Select style={{ width: 150 }} value={currency} options={CURRENCY_OPTIONS} onChange={setCurrency} />
          <SupplierSelect
            allowClear
            placeholder="Todos los proveedores"
            style={{ width: 280 }}
            value={supplierId}
            onChange={setSupplierId}
          />
        </>
      }
      size="small"
      rowKey={(row) => `${row.supplier_id}|${row.currency}`}
      loading={isLoading || isFetching}
      columns={columns}
      dataSource={data?.suppliers ?? []}
      pagination={false}
      expandable={{
        expandRowByClick: true,
        expandedRowRender: (row) => (
          <Table<AgingDocumentRow>
            size="small"
            bordered
            pagination={false}
            rowKey={(r) => `${r.purchase_id}-${r.installment_number}`}
            columns={documentColumns}
            dataSource={documentsBySupplier.get(`${row.supplier_id}|${row.currency}`) ?? []}
          />
        ),
      }}
      locale={{
        emptyText: (
          <Empty description={company ? "Sin deudas pendientes con proveedores a la fecha" : "Selecciona un cliente"} />
        ),
      }}
      summary={() =>
        data?.suppliers.length ? (
          <Table.Summary fixed>
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}>
                <strong>Totales {currency}</strong>
              </Table.Summary.Cell>
              {BUCKETS.map((b, i) => (
                <Table.Summary.Cell key={b} index={i + 3} align="right">
                  <strong>{formatAmount(totals[b])}</strong>
                </Table.Summary.Cell>
              ))}
              <Table.Summary.Cell index={8} align="right">
                <strong>{formatAmount(totals.total)}</strong>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} />
            </Table.Summary.Row>
          </Table.Summary>
        ) : null
      }
    />
  );
}

type StatementRow = StatementMovement & { key: string; kind: "opening" | "movement" | "closing" };

function StatementTab() {
  const { company } = useActiveCompany();
  const [supplierId, setSupplierId] = useState<string | undefined>();
  const [currency, setCurrency] = useState("PEN");
  const [range, setRange] = useState<[Dayjs, Dayjs] | null>([dayjs().startOf("year"), dayjs()]);

  const { data, isLoading, isFetching } = useSupplierStatement({
    supplierId,
    currency,
    from: range?.[0].format("YYYY-MM-DD"),
    to: range?.[1].format("YYYY-MM-DD"),
  });

  const rows = useMemo<StatementRow[]>(() => {
    if (!data) return [];
    const blank = { type: "purchase" as const, reference: "", debit: "0", credit: "0", source_id: "" };
    return [
      {
        ...blank,
        key: "opening",
        kind: "opening",
        date: data.from ?? "",
        description: "Saldo inicial",
        balance: data.opening_balance,
      },
      ...data.movements.map((m, i) => ({ ...m, key: `${m.source_id}-${i}`, kind: "movement" as const })),
    ];
  }, [data]);

  const columns: TableProps<StatementRow>["columns"] = [
    {
      title: "Fecha",
      dataIndex: "date",
      width: 100,
      render: (d: string) => (d ? dayjs(d).format(DATE_FORMAT) : ""),
    },
    {
      title: "Tipo",
      dataIndex: "type",
      width: 130,
      render: (t: StatementMovement["type"], row) =>
        row.kind === "movement" ? (
          <Tag color={t === "payment" ? "green" : t === "credit_note" ? "blue" : "default"}>{MOVEMENT_LABELS[t]}</Tag>
        ) : null,
    },
    { title: "Referencia", dataIndex: "reference", width: 150 },
    {
      title: "Descripción",
      dataIndex: "description",
      render: (d: string, row) => (row.kind === "movement" ? d : <strong>{d}</strong>),
    },
    {
      title: "Cargo",
      dataIndex: "credit",
      width: 120,
      align: "right",
      render: (v: string, row) => (row.kind === "movement" ? amountCell(v) : null),
    },
    {
      title: "Abono",
      dataIndex: "debit",
      width: 120,
      align: "right",
      render: (v: string, row) => (row.kind === "movement" ? amountCell(v) : null),
    },
    {
      title: "Saldo",
      dataIndex: "balance",
      width: 130,
      align: "right",
      render: (v: string, row) =>
        row.kind === "movement" ? formatAmount(v) : <strong>{formatAmount(v)}</strong>,
    },
  ];

  const sumOf = (key: "credit" | "debit") => (data?.movements ?? []).reduce((acc, m) => acc + Number(m[key]), 0);

  return (
    <DataTable<StatementRow>
      filters={
        <>
          <SupplierSelect
            placeholder="Seleccione proveedor"
            style={{ width: 300 }}
            value={supplierId}
            onChange={setSupplierId}
          />
          <Select style={{ width: 150 }} value={currency} options={CURRENCY_OPTIONS} onChange={setCurrency} />
          <DatePicker.RangePicker
            format={DATE_FORMAT}
            value={range}
            onChange={(v) => setRange(v && v[0] && v[1] ? [v[0], v[1]] : null)}
          />
        </>
      }
      size="small"
      rowKey="key"
      loading={Boolean(supplierId) && (isLoading || isFetching)}
      columns={columns}
      dataSource={rows}
      pagination={false}
      locale={{
        emptyText: (
          <Empty
            description={
              !company
                ? "Selecciona un cliente"
                : supplierId
                  ? "Sin movimientos en el periodo"
                  : "Seleccione un proveedor para ver su estado de cuenta"
            }
          />
        ),
      }}
      summary={() =>
        data ? (
          <Table.Summary.Row>
            <Table.Summary.Cell index={0} colSpan={4}>
              <strong>Saldo final {data.currency}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={4} align="right">
              <strong>{formatAmount(sumOf("credit"))}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={5} align="right">
              <strong>{formatAmount(sumOf("debit"))}</strong>
            </Table.Summary.Cell>
            <Table.Summary.Cell index={6} align="right">
              <Typography.Text strong type={Number(data.closing_balance) > 0 ? "danger" : undefined}>
                {formatAmount(data.closing_balance)}
              </Typography.Text>
            </Table.Summary.Cell>
          </Table.Summary.Row>
        ) : null
      }
    />
  );
}
