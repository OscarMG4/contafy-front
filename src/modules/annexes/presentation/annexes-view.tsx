"use client";

import { useState } from "react";
import { EditOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Dropdown, Empty, Select, Tag, Typography, type TableProps } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useAnnexes, useAnnexTypes } from "../application/use-annexes";
import type { Annex, AnnexFilters, AnnexType } from "../domain/annex.types";
import { AnnexFormDrawer } from "./annex-form-drawer";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);

const TYPE_COLORS: Record<AnnexType, string> = {
  worker: "blue",
  project: "purple",
  bank: "gold",
  other: "default",
};

export function AnnexesView() {
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [filters, setFilters] = useState<AnnexFilters>({ page: 1, perPage: 20, only_active: true });
  const [drawer, setDrawer] = useState<{ open: boolean; annex: Annex | null }>({ open: false, annex: null });
  const { data, isFetching, isLoading } = useAnnexes(filters);
  const { data: types } = useAnnexTypes();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const updateFilters = (patch: Partial<AnnexFilters>) => setFilters((current) => ({ ...current, page: 1, ...patch }));
  const openCreate = () => setDrawer({ open: true, annex: null });

  const columns: TableProps<Annex>["columns"] = [
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
      title: "Tipo",
      dataIndex: "type_label",
      width: 130,
      render: (label: string, annex: Annex) => (
        <Tag color={TYPE_COLORS[annex.type]} variant="filled">
          {label}
        </Tag>
      ),
    },
    {
      title: "N° documento",
      dataIndex: "document_number",
      width: 150,
      responsive: ["md"],
      render: (value: string | null) => value ?? <Typography.Text type="secondary">—</Typography.Text>,
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
      render: (_, annex) =>
        canWrite && (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [{ key: "edit", icon: <EditOutlined />, label: "Editar" }],
              onClick: ({ key }) => {
                if (key === "edit") setDrawer({ open: true, annex });
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
        <PageHeader eyebrow="Contabilidad" title="Anexos" subtitle="Gestiona los anexos de análisis" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para ver sus anexos" />
        </Card>
      </>
    );
  }

  const isEmpty = !isLoading && !filters.search && !filters.type && filters.only_active && data?.meta.total === 0;

  return (
    <>
      <PageHeader
        eyebrow="Contabilidad"
        title="Anexos"
        subtitle="Códigos auxiliares para analizar saldos y gastos por trabajador, proyecto o banco."
      />

      <DataTable<Annex>
        search={{
          placeholder: "Buscar por código, nombre o documento",
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <>
            <Select
              allowClear
              placeholder="Tipo"
              value={filters.type}
              options={types}
              onChange={(type) => updateFilters({ type })}
              style={{ minWidth: 140 }}
            />
            <Checkbox checked={filters.only_active} onChange={(e) => updateFilters({ only_active: e.target.checked })}>
              Solo activos
            </Checkbox>
          </>
        }
        action={
          canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nuevo anexo
            </Button>
          )
        }
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        locale={{
          emptyText: isEmpty ? (
            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="Aún no registras anexos" style={{ paddingBlock: 24 }}>
              {canWrite && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Registrar el primer anexo
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
          showTotal: (total) => `${total} anexos`,
          onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
        }}
      />

      <AnnexFormDrawer open={drawer.open} annex={drawer.annex} onClose={() => setDrawer({ open: false, annex: null })} />
    </>
  );
}
