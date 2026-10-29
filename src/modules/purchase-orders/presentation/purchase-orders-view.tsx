"use client";

import { useMemo, useState } from "react";
import { EyeOutlined, FileDoneOutlined, PlusOutlined, StopOutlined } from "@ant-design/icons";
import { App, Button, Empty, Flex, Progress, Select, Tag, Tooltip, Typography, type TableProps } from "antd";
import dayjs from "dayjs";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { ReceptionFromOrderModal } from "@/modules/receptions/presentation/reception-from-order-modal";
import { SupplierSelect } from "@/modules/treasury/presentation/supplier-select";
import { DATE_FORMAT, formatAmount } from "@/modules/treasury/presentation/ui-helpers";
import { useWarehouses } from "@/modules/warehouses/application/use-warehouses";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useCancelPurchaseOrder, usePurchaseOrders } from "../application/use-purchase-orders";
import {
  PURCHASE_ORDER_STATUS_OPTIONS,
  type PurchaseOrder,
  type PurchaseOrderFilters,
  type PurchaseOrderStatus,
} from "../domain/purchase-order.types";
import { PurchaseOrderDetailDrawer } from "./purchase-order-detail-drawer";
import { formatOrderNumber, hasReceptions, orderProgress } from "./purchase-order-format";
import { PurchaseOrderFormModal } from "./purchase-order-form-modal";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);

export function PurchaseOrdersView() {
  const { message, modal } = App.useApp();
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const [statuses, setStatuses] = useState<PurchaseOrderStatus[]>(["open", "partial"]);
  const [filters, setFilters] = useState<Omit<PurchaseOrderFilters, "status">>({ page: 1, perPage: 15 });
  const [formOpen, setFormOpen] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [receive, setReceive] = useState<{ open: boolean; orderId?: string }>({ open: false });

  const { data, isLoading, isFetching } = usePurchaseOrders({ ...filters, status: statuses.join(",") });
  const { data: warehousesPage, isLoading: loadingWarehouses } = useWarehouses({
    page: 1,
    perPage: 200,
    status: "active",
  });
  const warehouses = useMemo(() => warehousesPage?.items ?? [], [warehousesPage]);
  const cancel = useCancelPurchaseOrder();

  const updateFilters = (patch: Partial<PurchaseOrderFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));

  const openReceive = (orderId?: string) => {
    setDetailId(null);
    setReceive({ open: true, orderId });
  };

  const confirmCancel = (order: PurchaseOrder) =>
    modal.confirm({
      title: `¿Anular la orden ${formatOrderNumber(order.order_number)}?`,
      content: `${order.supplier_business_name} · ${order.currency} ${formatAmount(order.totals.total)}. Esta acción no se puede deshacer.`,
      okText: "Anular O/C",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: () =>
        cancel.mutateAsync(order.id).then(
          () => message.success(`Orden ${formatOrderNumber(order.order_number)} anulada`),
          (error: Error) => message.error(error.message),
        ),
    });

  const columns: TableProps<PurchaseOrder>["columns"] = [
    {
      title: "N° O/C",
      dataIndex: "order_number",
      width: 110,
      render: (n: number) => <Typography.Text strong>{formatOrderNumber(n)}</Typography.Text>,
    },
    {
      title: "Fecha",
      dataIndex: "issue_date",
      width: 100,
      render: (d: string) => dayjs(d).format(DATE_FORMAT),
    },
    { title: "Proveedor", dataIndex: "supplier_business_name", ellipsis: true },
    { title: "Moneda", dataIndex: "currency", width: 75 },
    {
      title: "Total",
      key: "total",
      width: 120,
      align: "right",
      render: (_, row) => formatAmount(row.totals.total),
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 140,
      render: (status: PurchaseOrderStatus, row) => (
        <Tag color={PURCHASE_ORDER_STATUS_OPTIONS.find((o) => o.value === status)?.color}>{row.status_label}</Tag>
      ),
    },
    {
      title: "% atendido",
      key: "progress",
      width: 130,
      render: (_, row) =>
        row.status === "cancelled" ? (
          <Typography.Text type="secondary">—</Typography.Text>
        ) : (
          <Progress percent={orderProgress(row)} size="small" />
        ),
    },
    {
      title: "",
      key: "actions",
      width: 120,
      fixed: "right",
      render: (_, row) => (
        <Flex gap={4}>
          <Tooltip title="Ver detalle">
            <Button size="small" type="text" icon={<EyeOutlined />} onClick={() => setDetailId(row.id)} />
          </Tooltip>
          {canWrite && (row.status === "open" || row.status === "partial") && (
            <Tooltip title="Recepcionar">
              <Button size="small" type="text" icon={<FileDoneOutlined />} onClick={() => openReceive(row.id)} />
            </Tooltip>
          )}
          {canWrite && row.status === "open" && !hasReceptions(row) && (
            <Tooltip title="Anular">
              <Button size="small" type="text" danger icon={<StopOutlined />} onClick={() => confirmCancel(row)} />
            </Tooltip>
          )}
        </Flex>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Compras"
        title="Órdenes de compra"
        subtitle="Pedidos a proveedores; se atienden con recepciones de mercadería y luego se facturan."
      />

      <DataTable<PurchaseOrder>
        search={{
          placeholder: "Buscar N° O/C, proveedor o referencia",
          value: filters.search,
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <>
            <Select<PurchaseOrderStatus[]>
              mode="multiple"
              allowClear
              maxTagCount="responsive"
              placeholder="Estado"
              style={{ minWidth: 220 }}
              value={statuses}
              options={PURCHASE_ORDER_STATUS_OPTIONS.map(({ value, label }) => ({ value, label }))}
              onChange={(value) => {
                setStatuses(value);
                updateFilters({});
              }}
            />
            <SupplierSelect
              allowClear
              placeholder="Proveedor"
              style={{ width: 240 }}
              value={filters.supplierId}
              onChange={(supplierId) => updateFilters({ supplierId })}
            />
          </>
        }
        action={
          canWrite ? (
            <>
              <Button icon={<FileDoneOutlined />} onClick={() => openReceive()}>
                Recepcionar
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                loading={loadingWarehouses}
                disabled={!company}
                onClick={() => setFormOpen(true)}
              >
                Nueva O/C
              </Button>
            </>
          ) : undefined
        }
        size="small"
        rowKey="id"
        loading={isLoading || isFetching}
        columns={columns}
        dataSource={data?.items}
        onRow={(row) => ({ onDoubleClick: () => setDetailId(row.id) })}
        locale={{
          emptyText: <Empty description={company ? "Sin órdenes de compra" : "Selecciona un cliente"} />,
        }}
        pagination={{
          current: data?.meta.page ?? filters.page,
          pageSize: data?.meta.per_page ?? filters.perPage,
          total: data?.meta.total ?? 0,
          showSizeChanger: true,
          onChange: (page, perPage) => setFilters((c) => ({ ...c, page, perPage })),
        }}
      />

      <PurchaseOrderFormModal
        open={formOpen}
        warehouses={warehouses}
        onClose={() => setFormOpen(false)}
        onSaved={(order) => setDetailId(order.id)}
      />

      <PurchaseOrderDetailDrawer
        orderId={detailId}
        onClose={() => setDetailId(null)}
        warehouseName={(id) => warehouses.find((w) => w.id === id)?.name}
        onReceive={canWrite ? openReceive : undefined}
      />

      <ReceptionFromOrderModal
        open={receive.open}
        initialOrderId={receive.orderId}
        onClose={() => setReceive({ open: false })}
      />
    </>
  );
}
