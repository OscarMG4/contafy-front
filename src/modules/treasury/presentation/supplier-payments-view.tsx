"use client";

import { useState } from "react";
import { EyeOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import { App, Button, DatePicker, Empty, Flex, Select, Tag, Tooltip, Typography, type TableProps } from "antd";
import dayjs from "dayjs";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useHydrated } from "@/shared/lib/use-hydrated";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useAnnulSupplierPayment, useSupplierPayments, useTreasuryAccounts } from "../application/use-treasury";
import type { SupplierPayment, SupplierPaymentFilters, SupplierPaymentStatus } from "../domain/treasury.types";
import { SupplierPaymentDetailDrawer } from "./supplier-payment-detail-drawer";
import { SupplierPaymentModal } from "./supplier-payment-modal";
import { SupplierSelect } from "./supplier-select";
import { DATE_FORMAT, formatAmount, TREASURY_WRITE_ROLES } from "./ui-helpers";

const STATUS_OPTIONS: { value: SupplierPaymentStatus; label: string; color: string }[] = [
  { value: "registered", label: "Registrado", color: "success" },
  { value: "annulled", label: "Anulado", color: "error" },
];

export function SupplierPaymentsView() {
  const { message, modal } = App.useApp();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const urlSupplierId = searchParams.get("supplier_id") ?? undefined;
  const urlCurrency = searchParams.get("currency") ?? undefined;

  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  // El rol sale del perfil en localStorage y el modal puede abrirse desde la URL:
  // ambos se evalúan recién en el cliente para no romper la hidratación.
  const hydrated = useHydrated();
  const canWrite = hydrated && TREASURY_WRITE_ROLES.has(user?.role ?? "");

  const [filters, setFilters] = useState<SupplierPaymentFilters>({
    page: 1,
    perPage: 15,
    supplierId: urlSupplierId,
  });
  const [modalState, setModalState] = useState<{ open: boolean; supplierId?: string; currency?: string }>({
    open: Boolean(urlSupplierId),
    supplierId: urlSupplierId,
    currency: urlCurrency,
  });
  const [detailId, setDetailId] = useState<string | null>(null);

  const { data, isLoading, isFetching } = useSupplierPayments(filters);
  const { data: accounts, isLoading: loadingAccounts } = useTreasuryAccounts(true);
  const annul = useAnnulSupplierPayment();

  const updateFilters = (patch: Partial<SupplierPaymentFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));

  const closeModal = () => {
    setModalState({ open: false });
    if (urlSupplierId) router.replace(pathname);
  };

  const confirmAnnul = (payment: SupplierPayment) =>
    modal.confirm({
      title: `¿Anular el pago N° ${payment.payment_number}?`,
      content: `Se revertirá el asiento y los ${payment.applications.length} documento(s) volverán a quedar pendientes por ${formatAmount(payment.total_amount)} ${payment.currency}.`,
      okText: "Anular pago",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: () =>
        annul.mutateAsync(payment.id).then(
          () => message.success(`Pago N° ${payment.payment_number} anulado`),
          (error: Error) => message.error(error.message),
        ),
    });

  const columns: TableProps<SupplierPayment>["columns"] = [
    { title: "N° pago", dataIndex: "payment_number", width: 80 },
    {
      title: "Fecha",
      dataIndex: "paid_at",
      width: 100,
      render: (d: string) => dayjs(d).format(DATE_FORMAT),
    },
    { title: "Proveedor", dataIndex: "supplier_business_name", ellipsis: true },
    { title: "Caja / Cta.", dataIndex: "treasury_account_label", width: 200, ellipsis: true, render: (v) => v ?? "—" },
    { title: "Forma de pago", dataIndex: "method_label", width: 120, render: (v) => v ?? "—" },
    { title: "Nro. operación", dataIndex: "reference", width: 130, render: (v) => v ?? "—" },
    { title: "Moneda", dataIndex: "currency", width: 75 },
    {
      title: "Total",
      dataIndex: "total_amount",
      width: 120,
      align: "right",
      render: (v: string, row) => (
        <Typography.Text strong delete={row.status === "annulled"}>
          {formatAmount(v)}
        </Typography.Text>
      ),
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 105,
      render: (status: SupplierPaymentStatus, row) => (
        <Tag color={STATUS_OPTIONS.find((o) => o.value === status)?.color}>{row.status_label}</Tag>
      ),
    },
    {
      title: "Documentos",
      key: "documents",
      width: 220,
      render: (_, row) => {
        const shown = row.applications.slice(0, 2);
        const rest = row.applications.length - shown.length;
        return (
          <Flex gap={4} wrap>
            {shown.map((a) => (
              <Tag key={a.line_number}>{a.document_label}</Tag>
            ))}
            {rest > 0 && (
              <Tooltip title={row.applications.slice(2).map((a) => a.document_label).join(", ")}>
                <Tag>+{rest}</Tag>
              </Tooltip>
            )}
          </Flex>
        );
      },
    },
    {
      title: "",
      key: "actions",
      width: 90,
      fixed: "right",
      render: (_, row) => (
        <Flex gap={4}>
          <Tooltip title="Ver">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setDetailId(row.id)} />
          </Tooltip>
          {canWrite && row.status === "registered" && (
            <Tooltip title="Anular">
              <Button size="small" type="text" danger icon={<StopOutlined />} onClick={() => confirmAnnul(row)} />
            </Tooltip>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Tesorería"
        title="Pagos a proveedores"
        subtitle="Cancela facturas, letras y recibos pendientes desde una caja o cuenta bancaria."
      />

      <DataTable<SupplierPayment>
        filters={
          <>
            <SupplierSelect
              allowClear
              placeholder="Proveedor"
              style={{ width: 260 }}
              value={filters.supplierId}
              onChange={(supplierId) => updateFilters({ supplierId })}
            />
            <DatePicker.RangePicker
              format={DATE_FORMAT}
              value={filters.from && filters.to ? [dayjs(filters.from), dayjs(filters.to)] : null}
              onChange={(range) =>
                updateFilters({
                  from: range?.[0]?.format("YYYY-MM-DD"),
                  to: range?.[1]?.format("YYYY-MM-DD"),
                })
              }
            />
            <Select
              allowClear
              placeholder="Estado"
              style={{ width: 140 }}
              value={filters.status || undefined}
              options={STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
              onChange={(status) => updateFilters({ status: status ?? "" })}
            />
          </>
        }
        action={
          canWrite ? (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              loading={loadingAccounts}
              disabled={!company}
              onClick={() => setModalState({ open: true, supplierId: filters.supplierId })}
            >
              Nuevo Pago
            </Button>
          ) : undefined
        }
        size="small"
        rowKey="id"
        loading={isLoading || isFetching}
        columns={columns}
        dataSource={data?.items}
        onRow={(row) => ({ onDoubleClick: () => setDetailId(row.id) })}
        locale={{
          emptyText: <Empty description={company ? "Sin pagos registrados" : "Selecciona un cliente"} />,
        }}
        pagination={{
          current: data?.meta.page ?? filters.page,
          pageSize: data?.meta.per_page ?? filters.perPage,
          total: data?.meta.total ?? 0,
          showSizeChanger: true,
          onChange: (page, perPage) => setFilters((c) => ({ ...c, page, perPage })),
        }}
      />

      {!loadingAccounts && (
        <SupplierPaymentModal
          open={hydrated && modalState.open}
          accounts={accounts ?? []}
          initialSupplierId={modalState.supplierId}
          preferredCurrency={modalState.currency}
          onClose={closeModal}
        />
      )}

      <SupplierPaymentDetailDrawer paymentId={detailId} onClose={() => setDetailId(null)} />
    </>
  );
}
