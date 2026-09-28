"use client";

import { useMemo, useState } from "react";
import { EyeOutlined, MoreOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import { App, Button, DatePicker, Dropdown, Empty, Select, Tag, Typography, type TableProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";
import { useRouter } from "next/navigation";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { formatMoney } from "@/shared/lib/format";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useAnnulPurchase, usePurchases } from "../application/use-purchases";
import {
  PAYMENT_STATUS_OPTIONS,
  PURCHASE_STATUS_OPTIONS,
  type PaymentStatus,
  type Purchase,
  type PurchaseFilters,
  type PurchaseStatus,
} from "../domain/purchase.types";
import { PurchaseDetailDrawer } from "./purchase-detail-drawer";
import { PurchaseFormDrawer } from "./purchase-form-drawer";
import { ExpensePurchaseFormDrawer } from "./expense-purchase-form-drawer";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);

function money(value: string | number, currency = "PEN") {
  const n = typeof value === "string" ? Number(value) : value;
  if (currency === "PEN") return formatMoney(n);
  return `${currency} ${n.toLocaleString("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function PurchasesView() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [filters, setFilters] = useState<PurchaseFilters>({
    page: 1,
    perPage: 15,
    period: dayjs().format("YYYY-MM"),
    status: "",
  });
  const [formOpen, setFormOpen] = useState(false);
  const [expenseFormOpen, setExpenseFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isFetching, isLoading } = usePurchases(filters);
  const annul = useAnnulPurchase();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const updateFilters = (patch: Partial<PurchaseFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));

  const periodValue = useMemo(() => (filters.period ? dayjs(filters.period, "YYYY-MM") : null), [filters.period]);

  const confirmAnnul = (purchase: Purchase) => {
    const kindLabel =
      purchase.kind === "expense" ? "gasto" : purchase.kind === "additional_cost" ? "costo adicional" : "compra";
    modal.confirm({
      title: `¿Anular ${kindLabel} ${purchase.series}-${purchase.number}?`,
      content:
        purchase.kind === "expense"
          ? `Se anulará el correlativo ${purchase.registration_code}. No afecta al kardex.`
          : `Se anulará el correlativo ${purchase.registration_code} y se recalculará el kardex desde la fecha de recepción.`,
      okText: "Anular",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: () =>
        annul.mutateAsync(purchase.id).then(
          () => message.success(`${kindLabel.charAt(0).toUpperCase()}${kindLabel.slice(1)} anulado`),
          (error: Error) => message.error(error.message),
        ),
    });
  };

  const columns: TableProps<Purchase>["columns"] = [
    {
      title: "Corr.",
      dataIndex: "registration_code",
      width: 80,
      render: (code: number | null) => code ?? "—",
    },
    {
      title: "Tipo",
      dataIndex: "kind",
      width: 110,
      render: (kind: string, row) =>
        row.kind_label ??
        (kind === "expense" ? "Gastos" : kind === "additional_cost" ? "Costo adicional" : "Mercadería"),
    },
    {
      title: "Documento",
      key: "document",
      width: 140,
      render: (_, row) => (
        <Typography.Text>
          {row.document_type} {row.series}-{row.number}
        </Typography.Text>
      ),
    },
    {
      title: "Proveedor",
      key: "supplier",
      ellipsis: true,
      render: (_, row) => (
        <div style={{ lineHeight: 1.3 }}>
          <Typography.Text strong>{row.supplier_business_name}</Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: "block" }}>
            {row.supplier_document_number}
          </Typography.Text>
        </div>
      ),
    },
    {
      title: "Emisión",
      dataIndex: "issue_date",
      width: 110,
      responsive: ["md"],
      render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Recepción",
      dataIndex: "reception_date",
      width: 110,
      responsive: ["lg"],
      render: (d: string | null, row) => (row.kind === "expense" ? "—" : d ? dayjs(d).format("DD/MM/YYYY") : "—"),
    },
    {
      title: "Total",
      key: "total",
      width: 130,
      align: "right",
      render: (_, row) => money(row.totals.total, row.currency),
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 110,
      render: (status: PurchaseStatus) => {
        const opt = PURCHASE_STATUS_OPTIONS.find((o) => o.value === status);
        return <Tag color={opt?.color}>{opt?.label ?? status}</Tag>;
      },
    },
    {
      title: "Estado pago",
      dataIndex: "payment_status",
      width: 110,
      render: (status: PaymentStatus | undefined) => {
        const opt = PAYMENT_STATUS_OPTIONS.find((o) => o.value === status);
        return <Tag color={opt?.color}>{opt?.label ?? status ?? "—"}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 56,
      render: (_, row) => (
        <Dropdown
          menu={{
            items: [
              {
                key: "view",
                icon: <EyeOutlined />,
                label: "Ver detalle",
                onClick: () => setDetailId(row.id),
              },
              ...(canWrite && row.status === "registered"
                ? [
                    {
                      key: "annul",
                      icon: <StopOutlined />,
                      label: "Anular",
                      danger: true,
                      onClick: () => confirmAnnul(row),
                    },
                  ]
                : []),
            ],
          }}
          trigger={["click"]}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Compras"
        title="Registro de compras"
        subtitle="Mercadería, gastos y costos adicionales con ajuste de kardex."
      />

      <DataTable<Purchase>
        search={{
          placeholder: "Buscar por serie, número o proveedor",
          value: filters.search,
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <>
            <DatePicker
              picker="month"
              value={periodValue}
              onChange={(value: Dayjs | null) => updateFilters({ period: value?.format("YYYY-MM") ?? undefined })}
              format="MMMM YYYY"
              allowClear
            />
            <Select
              allowClear
              placeholder="Estado"
              value={filters.status || undefined}
              options={PURCHASE_STATUS_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
              onChange={(status) => updateFilters({ status: (status as PurchaseStatus) ?? "" })}
            />
          </>
        }
        action={
          canWrite ? (
            <Dropdown
              menu={{
                items: [
                  {
                    key: "merchandise",
                    label: "Compra de mercadería",
                    onClick: () => setFormOpen(true),
                  },
                  {
                    key: "expense",
                    label: "Compra de gastos",
                    onClick: () => setExpenseFormOpen(true),
                  },
                  {
                    key: "additional_cost",
                    label: "Costo adicional",
                    onClick: () => router.push("/purchases/additional-costs/new"),
                  },
                ],
              }}
              trigger={["click"]}
            >
              <Button type="primary" icon={<PlusOutlined />} disabled={!company}>
                Nueva compra
              </Button>
            </Dropdown>
          ) : undefined
        }
        rowKey="id"
        columns={columns}
        dataSource={data?.items ?? []}
        loading={isLoading || isFetching}
        locale={{
          emptyText: <Empty description="Sin compras en el periodo" />,
        }}
        pagination={{
          current: filters.page,
          pageSize: filters.perPage,
          total: data?.meta.total ?? 0,
          showSizeChanger: true,
          onChange: (page, perPage) => setFilters((c) => ({ ...c, page, perPage })),
        }}
      />

      <PurchaseFormDrawer open={formOpen} onClose={() => setFormOpen(false)} />
      <ExpensePurchaseFormDrawer open={expenseFormOpen} onClose={() => setExpenseFormOpen(false)} />
      <PurchaseDetailDrawer
        purchaseId={detailId}
        open={Boolean(detailId)}
        onClose={() => setDetailId(null)}
        onAnnul={canWrite ? confirmAnnul : undefined}
      />
    </>
  );
}
