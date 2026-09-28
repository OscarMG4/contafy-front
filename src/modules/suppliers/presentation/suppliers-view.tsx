"use client";

import { useState } from "react";
import { EditOutlined, InboxOutlined, MoreOutlined, PlusOutlined, RollbackOutlined } from "@ant-design/icons";
import { App, Button, Card, Dropdown, Empty, Select, Tag, Typography, type TableProps } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useChangeSupplierStatus, useSuppliers } from "../application/use-suppliers";
import { SUPPLIER_STATUS_OPTIONS, type Supplier, type SupplierFilters } from "../domain/supplier.types";
import { SupplierFormDrawer } from "./supplier-form-drawer";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);

export function SuppliersView() {
  const { message, modal } = App.useApp();
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [filters, setFilters] = useState<SupplierFilters>({
    page: 1,
    perPage: 10,
    status: "active",
  });
  const [drawer, setDrawer] = useState<{
    open: boolean;
    supplier: Supplier | null;
  }>({ open: false, supplier: null });
  const { data, isFetching, isLoading } = useSuppliers(filters);
  const changeStatus = useChangeSupplierStatus();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const updateFilters = (patch: Partial<SupplierFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  const openCreate = () => setDrawer({ open: true, supplier: null });

  const toggleStatus = (supplier: Supplier) => {
    const action = supplier.status === "active" ? "archive" : "restore";
    const run = () =>
      changeStatus.mutate(
        { id: supplier.id, action },
        {
          onSuccess: () => message.success(action === "archive" ? "Proveedor archivado" : "Proveedor restaurado"),
          onError: (error) => message.error(error.message),
        },
      );

    if (action === "restore") return run();

    modal.confirm({
      title: `¿Archivar ${supplier.business_name}?`,
      content: "Sus datos se conservan, pero no aparecerá en registros nuevos hasta que lo restaures.",
      okText: "Archivar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: run,
    });
  };

  const columns: TableProps<Supplier>["columns"] = [
    {
      title: "Código",
      dataIndex: "code",
      width: 100,
    },
    {
      title: "Proveedor",
      key: "supplier",
      render: (_, supplier) => (
        <div style={{ lineHeight: 1.3, minWidth: 0 }}>
          <Typography.Text strong>{supplier.business_name}</Typography.Text>
          {supplier.trade_name && (
            <Typography.Text type="secondary" style={{ fontSize: 12, display: "block" }}>
              {supplier.trade_name}
            </Typography.Text>
          )}
        </div>
      ),
    },
    {
      title: "Documento",
      key: "document",
      width: 160,
      render: (_, supplier) => (
        <Typography.Text>
          {supplier.document_type === "6" ? "RUC " : ""}
          {supplier.document_number}
        </Typography.Text>
      ),
    },
    {
      title: "Condición de pago",
      dataIndex: "payment_term_label",
      responsive: ["md"],
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 120,
      render: (status: Supplier["status"]) => {
        const option = SUPPLIER_STATUS_OPTIONS.find((item) => item.value === status);
        return (
          <Tag color={option?.color} variant="filled">
            {option?.label}
          </Tag>
        );
      },
    },
    {
      key: "actions",
      width: 56,
      align: "right",
      render: (_, supplier) => {
        const isActive = supplier.status === "active";
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
                ...(canWrite
                  ? [
                      { key: "edit", icon: <EditOutlined />, label: "Editar" },
                      { type: "divider" as const },
                      isActive
                        ? {
                            key: "toggle",
                            icon: <InboxOutlined />,
                            label: "Archivar",
                            danger: true,
                          }
                        : {
                            key: "toggle",
                            icon: <RollbackOutlined />,
                            label: "Restaurar",
                          },
                    ]
                  : []),
              ],
              onClick: ({ key }) => {
                if (key === "edit") setDrawer({ open: true, supplier });
                if (key === "toggle") toggleStatus(supplier);
              },
            }}
          >
            <Button type="text" icon={<MoreOutlined />} aria-label="Acciones" />
          </Dropdown>
        );
      },
    },
  ];

  if (!company) {
    return (
      <>
        <PageHeader eyebrow="Maestros" title="Proveedores" subtitle="Gestiona tus proveedores" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para ver proveedores" />
        </Card>
      </>
    );
  }

  const isEmpty = !isLoading && !filters.search && filters.status === "active" && data?.meta.total === 0;

  return (
    <>
      <PageHeader
        eyebrow="Maestros"
        title="Proveedores"
        subtitle="Proveedores del cliente para compras y cuentas por pagar."
      />

      <DataTable<Supplier>
        search={{
          placeholder: "Buscar por razón social, nombre comercial o documento",
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <Select
            allowClear
            placeholder="Estado"
            value={filters.status}
            options={SUPPLIER_STATUS_OPTIONS}
            onChange={(status) => updateFilters({ status })}
          />
        }
        action={
          canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nuevo proveedor
            </Button>
          )
        }
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        locale={{
          emptyText: isEmpty ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Aún no registras proveedores"
              style={{ paddingBlock: 24 }}
            >
              {canWrite && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Registrar el primer proveedor
                </Button>
              )}
            </Empty>
          ) : undefined,
        }}
        pagination={{
          current: filters.page,
          pageSize: filters.perPage,
          total: data?.meta.total,
          showSizeChanger: true,
          showTotal: (total) => `${total} proveedores`,
          onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
        }}
      />

      <SupplierFormDrawer
        open={drawer.open}
        supplier={drawer.supplier}
        onClose={() => setDrawer({ open: false, supplier: null })}
      />
    </>
  );
}
