"use client";

import { useState } from "react";
import { DatePicker, Empty, Table, Tag, Typography, type TableProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { useActiveCompany } from "@/modules/companies/application/active-company";
import { formatMoney } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useFeeReceipts } from "../application/use-reports";
import type { FeeReceiptRow } from "../domain/report.types";

const amount = (v: string | number) =>
  Number(v).toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PAYMENT_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "warning" },
  partial: { label: "Pago parcial", color: "processing" },
  paid: { label: "Pagado", color: "success" },
};

export function FeeReceiptsView() {
  const { company } = useActiveCompany();
  const [period, setPeriod] = useState<Dayjs>(dayjs().startOf("month"));
  const { data, isLoading, isFetching } = useFeeReceipts(period.format("YYYY-MM"));

  const columns: TableProps<FeeReceiptRow>["columns"] = [
    {
      title: "Fecha",
      dataIndex: "issue_date",
      width: 100,
      render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Recibo",
      key: "receipt",
      width: 130,
      render: (_, row) => `${row.series}-${row.number}`,
    },
    { title: "RUC", dataIndex: "supplier_document_number", width: 120 },
    { title: "Prestador", dataIndex: "supplier_business_name", ellipsis: true },
    { title: "Moneda", dataIndex: "currency", width: 75 },
    {
      title: "Bruto",
      dataIndex: "gross_amount",
      width: 115,
      align: "right",
      render: (v: string) => amount(v),
    },
    {
      title: "% Ret.",
      dataIndex: "retention_percent",
      width: 75,
      align: "right",
      render: (v: string | null) => (v && Number(v) > 0 ? `${Number(v).toFixed(2)}%` : "—"),
    },
    {
      title: "Retención",
      dataIndex: "retention_amount",
      width: 115,
      align: "right",
      render: (v: string) => amount(v),
    },
    {
      title: "Neto",
      dataIndex: "net_amount",
      width: 115,
      align: "right",
      render: (v: string) => <Typography.Text strong>{amount(v)}</Typography.Text>,
    },
    {
      title: "Estado de pago",
      dataIndex: "payment_status",
      width: 125,
      render: (s: string) => <Tag color={PAYMENT_STATUS[s]?.color}>{PAYMENT_STATUS[s]?.label ?? s}</Tag>,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Reportes"
        title="Libro de retenciones 4ta categoría"
        subtitle="Recibos por honorarios (doc. 02) del periodo, con la retención de renta de 4ta categoría."
      />

      <DataTable<FeeReceiptRow>
        filters={
          <DatePicker
            picker="month"
            value={period}
            onChange={(value) => value && setPeriod(value.startOf("month"))}
            format="MMMM YYYY"
            allowClear={false}
          />
        }
        size="small"
        rowKey="purchase_id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading || isFetching}
        pagination={false}
        locale={{
          emptyText: (
            <Empty
              description={company ? "Sin recibos por honorarios en el periodo" : "Selecciona un cliente para ver el reporte"}
            />
          ),
        }}
        summary={() => {
          if (!data?.items.length) return null;
          const t = data.totals;
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <Typography.Text strong>Totales en PEN ({data.items.length} recibos)</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Typography.Text strong>{formatMoney(Number(t.gross_amount_pen))}</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} />
              <Table.Summary.Cell index={7} align="right">
                <Typography.Text strong>{formatMoney(Number(t.retention_amount_pen))}</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} align="right">
                <Typography.Text strong>{formatMoney(Number(t.net_amount_pen))}</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={9} />
            </Table.Summary.Row>
          );
        }}
      />
    </>
  );
}
