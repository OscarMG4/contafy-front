"use client";

import { useState } from "react";
import { EditOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Dropdown, Empty, Tag, Typography, type TableProps } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useCostCenters } from "../application/use-cost-centers";
import type { CostCenter, CostCenterFilters } from "../domain/cost-center.types";
import { CostCenterFormDrawer } from "./cost-center-form-drawer";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);

export function CostCentersView() {
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [filters, setFilters] = useState<CostCenterFilters>({ page: 1, perPage: 20, only_active: true });
  const [drawer, setDrawer] = useState<{ open: boolean; costCenter: CostCenter | null }>({
    open: false,
    costCenter: null,
  });
  const { data, isFetching, isLoading } = useCostCenters(filters);
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const updateFilters = (patch: Partial<CostCenterFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  const openCreate = () => setDrawer({ open: true, costCenter: null });

  const columns: TableProps<CostCenter>["columns"] = [
    {
      title: "Código",
      dataIndex: "code",
      width: 140,
      render: (code: string) => <Typography.Text strong>{code}</Typography.Text>,
    },
    {
      title: "Nombre",
      dataIndex: "name",
    },
    {
      title: "Estado",
      dataIndex: "active",
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"} variant="filled">
          {active ? "Activo" : "Inactivo"}
        </Tag>
      ),
    },
    {
      key: "actions",
      width: 56,
      align: "right",
      render: (_, costCenter) =>
        canWrite && (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [{ key: "edit", icon: <EditOutlined />, label: "Editar" }],
              onClick: ({ key }) => {
                if (key === "edit") setDrawer({ open: true, costCenter });
              },
            }}
          >
            <Button type="text" icon={<MoreOutlined />} aria-label="Acciones" />
          </Dropdown>
        ),
    },
  ];

  if (!company) {
    return (
      <>
        <PageHeader eyebrow="Contabilidad" title="Centros de costo" subtitle="Gestiona los centros de costo" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para ver sus centros de costo" />
        </Card>
      </>
    );
  }

  const isEmpty = !isLoading && !filters.search && filters.only_active && data?.meta.total === 0;

  return (
    <>
      <PageHeader
        eyebrow="Contabilidad"
        title="Centros de costo"
        subtitle="Distribuye gastos y compras por área, sede o proyecto."
      />

      <DataTable<CostCenter>
        search={{
          placeholder: "Buscar por código o nombre",
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <Checkbox checked={filters.only_active} onChange={(e) => updateFilters({ only_active: e.target.checked })}>
            Solo activos
          </Checkbox>
        }
        action={
          canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nuevo centro de costo
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
              description="Aún no registras centros de costo"
              style={{ paddingBlock: 24 }}
            >
              {canWrite && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Registrar el primer centro de costo
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
          pageSizeOptions: [20, 50, 100, 200],
          showTotal: (total) => `${total} centros de costo`,
          onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
        }}
      />

      <CostCenterFormDrawer
        open={drawer.open}
        costCenter={drawer.costCenter}
        onClose={() => setDrawer({ open: false, costCenter: null })}
      />
    </>
  );
}
