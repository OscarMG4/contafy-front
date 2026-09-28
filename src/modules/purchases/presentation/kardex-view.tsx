"use client";

import { useMemo, useState } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { App, Button, DatePicker, Empty, Select, Table, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { useActiveCompany } from "@/modules/companies/application/active-company";
import { useProducts } from "@/modules/products/application/use-products";
import { reportsApi } from "@/modules/reports/infrastructure/reports.api";
import { useWarehouses } from "@/modules/warehouses/application/use-warehouses";
import { formatMoney } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useKardex } from "../application/use-purchases";
import type { KardexMovement } from "../infrastructure/purchases.api";

const TYPE_LABELS: Record<string, string> = {
  purchase_entry: "Ingreso compra",
  purchase_reversal: "Reverso compra",
  cost_adjustment: "Ajuste de costo",
  cost_of_sales_adjustment: "Ajuste CMV",
};

export function KardexView() {
  const { message } = App.useApp();
  const { company } = useActiveCompany();
  const [productId, setProductId] = useState<string>();
  const [warehouseId, setWarehouseId] = useState<string>();
  const [range, setRange] = useState<[Dayjs | null, Dayjs | null] | null>(null);
  const [exporting, setExporting] = useState(false);

  const { data: productsPage } = useProducts({
    page: 1,
    perPage: 200,
    status: "active",
  });
  const { data: warehousesPage } = useWarehouses({
    page: 1,
    perPage: 200,
    status: "active",
  });

  const from = range?.[0]?.format("YYYY-MM-DD");
  const to = range?.[1]?.format("YYYY-MM-DD");

  const { data, isFetching, isLoading } = useKardex({
    productId,
    warehouseId,
    from,
    to,
  });

  const productOptions = useMemo(
    () =>
      (productsPage?.items ?? []).map((p) => ({
        value: p.id,
        label: `${p.code} · ${p.description}`,
      })),
    [productsPage],
  );
  const warehouseOptions = useMemo(
    () =>
      (warehousesPage?.items ?? []).map((w) => ({
        value: w.id,
        label: w.name,
      })),
    [warehousesPage],
  );

  const exportCsv = async () => {
    if (!productId || !warehouseId) return;
    setExporting(true);
    try {
      await reportsApi.exportKardex({ productId, warehouseId, from, to });
      message.success("Kardex exportado");
    } catch (error) {
      message.error(error instanceof Error ? error.message : "No se pudo exportar");
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Kardex"
        subtitle="Movimientos de inventario con costo promedio ponderado."
      />

      <DataTable<KardexMovement>
        filters={
          <>
            <Select
              showSearch
              optionFilterProp="label"
              placeholder="Artículo"
              style={{ minWidth: 300 }}
              options={productOptions}
              value={productId}
              onChange={setProductId}
              disabled={!company}
            />
            <Select
              placeholder="Almacén"
              style={{ minWidth: 200 }}
              options={warehouseOptions}
              value={warehouseId}
              onChange={setWarehouseId}
              disabled={!company}
            />
            <DatePicker.RangePicker
              value={range}
              onChange={(value) => setRange(value)}
              format="DD/MM/YYYY"
              allowClear
            />
          </>
        }
        action={
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            loading={exporting}
            disabled={!productId || !warehouseId || !(data?.length)}
            onClick={exportCsv}
          >
            Exportar CSV
          </Button>
        }
        rowKey="id"
        loading={isLoading || isFetching}
        dataSource={data ?? []}
        locale={{
          emptyText: (
            <Empty description={productId && warehouseId ? "Sin movimientos" : "Selecciona artículo y almacén"} />
          ),
        }}
        pagination={{ pageSize: 50 }}
        columns={[
          {
            title: "Fecha",
            dataIndex: "movement_date",
            width: 110,
            render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
          },
          {
            title: "Tipo",
            dataIndex: "type",
            width: 140,
            render: (t: string) => TYPE_LABELS[t] ?? t,
          },
          {
            title: "Cantidad",
            dataIndex: "quantity",
            align: "right",
            width: 100,
            render: (v: string) => Number(v).toLocaleString("es-PE"),
          },
          {
            title: "Costo unit.",
            dataIndex: "unit_cost",
            align: "right",
            width: 110,
            render: (v: string) => Number(v).toFixed(4),
          },
          {
            title: "Valor",
            dataIndex: "total_value",
            align: "right",
            width: 110,
            render: (v: string) => formatMoney(Number(v)),
          },
          {
            title: "Saldo cant.",
            dataIndex: "balance_quantity",
            align: "right",
            width: 110,
            render: (v: string) => Number(v).toLocaleString("es-PE"),
          },
          {
            title: "Costo prom.",
            dataIndex: "balance_unit_cost",
            align: "right",
            width: 110,
            render: (v: string) => Number(v).toFixed(4),
          },
          {
            title: "Saldo valor",
            dataIndex: "balance_value",
            align: "right",
            width: 120,
            render: (v: string) => formatMoney(Number(v)),
          },
        ]}
        summary={(rows) => {
          if (!rows.length) return null;
          const last = rows[rows.length - 1];
          return (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={5}>
                <Typography.Text strong>Saldo actual</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={5} align="right">
                <Typography.Text strong>{Number(last.balance_quantity).toLocaleString("es-PE")}</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={6} align="right">
                <Typography.Text strong>{Number(last.balance_unit_cost).toFixed(4)}</Typography.Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={7} align="right">
                <Typography.Text strong>{formatMoney(Number(last.balance_value))}</Typography.Text>
              </Table.Summary.Cell>
            </Table.Summary.Row>
          );
        }}
      />
    </>
  );
}
