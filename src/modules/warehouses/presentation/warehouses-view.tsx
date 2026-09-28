"use client";

import { useState } from "react";
import { EditOutlined, InboxOutlined, MoreOutlined, PlusOutlined, RollbackOutlined } from "@ant-design/icons";
import { App, Button, Card, Dropdown, Empty, Select, Tag, Typography, type TableProps } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useChangeWarehouseStatus, useWarehouses } from "../application/use-warehouses";
import { WAREHOUSE_STATUS_OPTIONS, type Warehouse, type WarehouseFilters } from "../domain/warehouse.types";
import { WarehouseFormDrawer } from "./warehouse-form-drawer";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);

export function WarehousesView() {
  const { message, modal } = App.useApp();
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [filters, setFilters] = useState<WarehouseFilters>({
    page: 1,
    perPage: 10,
    status: "active",
  });
  const [drawer, setDrawer] = useState<{
    open: boolean;
    warehouse: Warehouse | null;
  }>({ open: false, warehouse: null });
  const { data, isFetching, isLoading } = useWarehouses(filters);
  const changeStatus = useChangeWarehouseStatus();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const updateFilters = (patch: Partial<WarehouseFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  const openCreate = () => setDrawer({ open: true, warehouse: null });

  const toggleStatus = (warehouse: Warehouse) => {
    const action = warehouse.status === "active" ? "archive" : "restore";
    const run = () =>
      changeStatus.mutate(
        { id: warehouse.id, action },
        {
          onSuccess: () => message.success(action === "archive" ? "Almacén archivado" : "Almacén restaurado"),
          onError: (error) => message.error(error.message),
        },
      );

    if (action === "restore") return run();

    modal.confirm({
      title: `¿Archivar ${warehouse.name}?`,
      content: "Sus datos se conservan, pero no aparecerá en registros nuevos hasta que lo restaures.",
      okText: "Archivar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: run,
    });
  };

  const columns: TableProps<Warehouse>["columns"] = [
    {
      title: "Código",
      dataIndex: "code",
      width: 100,
    },
    {
      title: "Almacén",
      dataIndex: "name",
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: "Tipo",
      dataIndex: "type_label",
      responsive: ["md"],
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 120,
      render: (status: Warehouse["status"]) => {
        const option = WAREHOUSE_STATUS_OPTIONS.find((item) => item.value === status);
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
      render: (_, warehouse) => {
        const isActive = warehouse.status === "active";
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
                if (key === "edit") setDrawer({ open: true, warehouse });
                if (key === "toggle") toggleStatus(warehouse);
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
        <PageHeader eyebrow="Inventario" title="Almacenes" subtitle="Gestiona tus almacenes" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para ver almacenes" />
        </Card>
      </>
    );
  }

  const isEmpty = !isLoading && !filters.search && filters.status === "active" && data?.meta.total === 0;

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Almacenes"
        subtitle="Almacenes del cliente para gestión de inventarios."
      />

      <DataTable<Warehouse>
        search={{
          placeholder: "Buscar por nombre o código",
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <Select
            allowClear
            placeholder="Estado"
            value={filters.status}
            options={WAREHOUSE_STATUS_OPTIONS}
            onChange={(status) => updateFilters({ status })}
          />
        }
        action={
          canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nuevo almacén
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
              description="Aún no registras almacenes"
              style={{ paddingBlock: 24 }}
            >
              {canWrite && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Registrar el primer almacén
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
          showTotal: (total) => `${total} almacenes`,
          onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
        }}
      />

      <WarehouseFormDrawer
        open={drawer.open}
        warehouse={drawer.warehouse}
        onClose={() => setDrawer({ open: false, warehouse: null })}
      />
    </>
  );
}
