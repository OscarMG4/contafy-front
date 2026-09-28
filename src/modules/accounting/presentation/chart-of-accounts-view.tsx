"use client";

import { useState } from "react";
import { EditOutlined, MoreOutlined, PlusOutlined } from "@ant-design/icons";
import { Button, Card, Checkbox, Dropdown, Empty, Select, Tag, Typography, type TableProps } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useAccounts, useNatures } from "../application/use-accounts";
import type { Account, AccountFilters } from "../domain/account.types";
import { AccountFormDrawer } from "./account-form-drawer";

const WRITE_ROLES = new Set(["owner", "admin"]);

export function ChartOfAccountsView() {
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [filters, setFilters] = useState<AccountFilters>({
    page: 1,
    perPage: 20,
    only_active: true,
  });
  const [drawer, setDrawer] = useState<{
    open: boolean;
    account: Account | null;
  }>({ open: false, account: null });
  const { data, isFetching, isLoading } = useAccounts(filters);
  const { data: natures } = useNatures();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const updateFilters = (patch: Partial<AccountFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  const openCreate = () => setDrawer({ open: true, account: null });

  const columns: TableProps<Account>["columns"] = [
    {
      title: "Código",
      dataIndex: "code",
      width: 120,
      render: (code: string, account: Account) => {
        const indent = (account.level - 1) * 20;
        return (
          <div style={{ paddingLeft: indent }}>
            <Typography.Text strong={account.is_leaf}>{code}</Typography.Text>
          </div>
        );
      },
    },
    {
      title: "Nombre",
      dataIndex: "name",
      render: (name: string, account: Account) => <Typography.Text strong={account.is_leaf}>{name}</Typography.Text>,
    },
    {
      title: "Naturaleza",
      dataIndex: "nature_label",
      width: 120,
      responsive: ["md"],
    },
    {
      title: "Estado",
      dataIndex: "active",
      width: 100,
      render: (active: boolean) => (
        <Tag color={active ? "success" : "default"} variant="filled">
          {active ? "Activa" : "Inactiva"}
        </Tag>
      ),
    },
    {
      key: "actions",
      width: 56,
      align: "right",
      render: (_, account) => {
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [...(canWrite ? [{ key: "edit", icon: <EditOutlined />, label: "Editar" }] : [])],
              onClick: ({ key }) => {
                if (key === "edit") setDrawer({ open: true, account });
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
        <PageHeader eyebrow="Contabilidad" title="Plan de cuentas" subtitle="Gestiona el plan de cuentas" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para ver el plan de cuentas" />
        </Card>
      </>
    );
  }

  const isEmpty = !isLoading && !filters.search && filters.only_active && data?.meta.total === 0;

  return (
    <>
      <PageHeader
        eyebrow="Contabilidad"
        title="Plan de cuentas"
        subtitle="Plan contable del cliente según normas SUNAT."
      />

      <DataTable<Account>
        search={{
          placeholder: "Buscar por código o nombre",
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <>
            <Select
              allowClear
              placeholder="Naturaleza"
              value={filters.nature}
              options={natures}
              onChange={(nature) => updateFilters({ nature })}
            />
            <Checkbox checked={filters.only_leaves} onChange={(e) => updateFilters({ only_leaves: e.target.checked })}>
              Solo movimiento
            </Checkbox>
            <Checkbox checked={filters.only_active} onChange={(e) => updateFilters({ only_active: e.target.checked })}>
              Solo activas
            </Checkbox>
          </>
        }
        action={
          canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nueva cuenta
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
              description="Aún no registras cuentas"
              style={{ paddingBlock: 24 }}
            >
              {canWrite && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Registrar la primera cuenta
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
          showTotal: (total) => `${total} cuentas`,
          onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
        }}
      />

      <AccountFormDrawer
        open={drawer.open}
        account={drawer.account}
        onClose={() => setDrawer({ open: false, account: null })}
      />
    </>
  );
}
