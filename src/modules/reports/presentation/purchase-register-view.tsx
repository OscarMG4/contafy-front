"use client";

import { useMemo, useState } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { App, Button, Checkbox, DatePicker, Empty, Table, Tag, Typography, type TableProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { useActiveCompany } from "@/modules/companies/application/active-company";
import { formatMoney } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { usePurchaseRegister } from "../application/use-reports";
import { reportsApi } from "../infrastructure/reports.api";
import type { PurchaseRegisterRow } from "../domain/report.types";

const KIND_LABELS: Record<string, string> = {
  merchandise: "Mercadería",
  expense: "Gasto",
  additional_cost: "Costo adicional",
};

export function PurchaseRegisterView() {
  const { message } = App.useApp();
  const { company } = useActiveCompany();
  const [period, setPeriod] = useState<Dayjs>(dayjs().startOf("month"));
  const [includeAnnulled, setIncludeAnnulled] = useState(false);
  const [exporting, setExporting] = useState<"csv" | "txt" | null>(null);

  const filters = useMemo(
    () => ({
      period: period.format("YYYY-MM"),
      includeAnnulled,
    }),
    [period, includeAnnulled],
  );

  const { data, isFetching, isLoading } = usePurchaseRegister(filters, Boolean(company));

  const exportFile = async (format: "csv" | "txt") => {
    setExporting(format);
    try {
      await reportsApi.exportPurchaseRegister(filters, format);
      message.success(format === "txt" ? "TXT 8.1 descargado" : "CSV descargado");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo exportar");
    } finally {
      setExporting(null);
    }
  };

  const columns: TableProps<PurchaseRegisterRow>["columns"] = [
    {
      title: "Corr.",
      dataIndex: "registration_code",
      width: 72,
      render: (code: number) => <Typography.Text type="secondary">{code}</Typography.Text>,
    },
    {
      title: "Emisión",
      dataIndex: "issue_date",
      width: 110,
      render: (date: string) => dayjs(date).format("DD/MM/YYYY"),
    },
    {
      title: "Comprobante",
      key: "document",
      width: 160,
      render: (_, row) => (
        <Typography.Text>
          {row.document_type} {row.series}-{row.number}
        </Typography.Text>
      ),
    },
    {
      title: "Proveedor",
      key: "supplier",
      render: (_, row) => (
        <div style={{ lineHeight: 1.3 }}>
          <Typography.Text strong>{row.supplier_business_name}</Typography.Text>
          <br />
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {row.supplier_document_type} {row.supplier_document_number}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Tipo",
      dataIndex: "kind",
      width: 120,
      responsive: ["lg"],
      render: (kind: string) => KIND_LABELS[kind] ?? kind,
    },
    {
      title: "Base grav. PEN",
      dataIndex: "taxable_base_pen",
      align: "right",
      width: 130,
      render: (v: string) => formatMoney(Number(v)),
    },
    {
      title: "IGV crédito",
      dataIndex: "igv_credit_pen",
      align: "right",
      width: 120,
      render: (v: string) => formatMoney(Number(v)),
    },
    {
      title: "Total PEN",
      dataIndex: "total_amount_pen",
      align: "right",
      width: 120,
      render: (v: string) => (
        <Typography.Text strong>{formatMoney(Number(v))}</Typography.Text>
      ),
    },
    {
      title: "Moneda",
      dataIndex: "currency",
      width: 80,
      responsive: ["xl"],
      render: (currency: string, row) =>
        currency === "PEN" ? (
          currency
        ) : (
          <Tag>
            {currency} · {row.exchange_rate}
          </Tag>
        ),
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 110,
      render: (status: string) => (
        <Tag color={status === "annulled" ? "error" : "success"} variant="filled">
          {status === "annulled" ? "Anulado" : "Registrado"}
        </Tag>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Reportes"
        title="Registro de Compras 8.1"
        subtitle="Compras del periodo contable para declaración SUNAT (vista 8.1 / SIRE)."
      />

      <DataTable<PurchaseRegisterRow>
        filters={
          <>
            <DatePicker
              picker="month"
              value={period}
              onChange={(value) => value && setPeriod(value.startOf("month"))}
              format="MMMM YYYY"
              allowClear={false}
            />
            <Checkbox checked={includeAnnulled} onChange={(e) => setIncludeAnnulled(e.target.checked)}>
              Incluir anulados
            </Checkbox>
          </>
        }
        action={
          <>
            <Button
              icon={<DownloadOutlined />}
              loading={exporting === "csv"}
              disabled={!company || !data?.items.length}
              onClick={() => exportFile("csv")}
            >
              CSV
            </Button>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              loading={exporting === "txt"}
              disabled={!company || !data?.items.length}
              onClick={() => exportFile("txt")}
            >
              TXT 8.1
            </Button>
          </>
        }
        rowKey="purchase_id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading || isFetching}
        locale={{
          emptyText: (
            <Empty
              description={
                company ? "Sin compras registradas en el periodo" : "Selecciona un cliente para ver el reporte"
              }
            />
          ),
        }}
        pagination={false}
        summary={() => {
          if (!data?.items.length) return null;
          const t = data.totals;
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <Typography.Text strong>Totales ({t.count} comprobantes)</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Typography.Text strong>{formatMoney(Number(t.taxable_base_pen))}</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <Typography.Text strong>{formatMoney(Number(t.igv_credit_pen))}</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                <Typography.Text strong>{formatMoney(Number(t.total_amount_pen))}</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={8} colSpan={2} />
            </Table.Summary.Row>
          );
        }}
      />
    </>
  );
}
