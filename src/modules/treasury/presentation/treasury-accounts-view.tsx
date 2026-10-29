"use client";

import { useState } from "react";
import { BankOutlined, EditOutlined, PlusOutlined, WalletOutlined } from "@ant-design/icons";
import { Button, Empty, Flex, Tag, Typography, type TableProps } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useTreasuryAccounts } from "../application/use-treasury";
import type { TreasuryAccount } from "../domain/treasury.types";
import { TreasuryAccountDrawer } from "./treasury-account-drawer";
import { TREASURY_ADMIN_ROLES } from "./ui-helpers";

export function TreasuryAccountsView() {
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const { data, isLoading, isFetching } = useTreasuryAccounts(false);
  const [drawer, setDrawer] = useState<{ open: boolean; account: TreasuryAccount | null }>({
    open: false,
    account: null,
  });
  const canWrite = TREASURY_ADMIN_ROLES.has(user?.role ?? "");

  const openCreate = () => setDrawer({ open: true, account: null });

  const columns: TableProps<TreasuryAccount>["columns"] = [
    { title: "Código", dataIndex: "code", width: 80 },
    {
      title: "Nombre",
      dataIndex: "name",
      render: (name: string, row) => (
        <Flex align="center" gap={8}>
          {row.type === "bank" ? <BankOutlined /> : <WalletOutlined />}
          <Typography.Text strong>{name}</Typography.Text>
        </Flex>
      ),
    },
    { title: "Tipo", dataIndex: "type_label", width: 150 },
    { title: "Moneda", dataIndex: "currency", width: 90 },
    { title: "Cuenta contable", dataIndex: "account_code", width: 140 },
    {
      title: "Banco / N° cuenta",
      key: "bank",
      render: (_, row) =>
        row.type === "bank" ? (
          <span>
            {row.bank_name ?? "—"}
            {row.account_number && (
              <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
                {row.account_number}
              </Typography.Text>
            )}
          </span>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: "Estado",
      dataIndex: "active",
      width: 100,
      render: (active: boolean) => <Tag color={active ? "success" : "default"}>{active ? "Activo" : "Inactivo"}</Tag>,
    },
    {
      title: "",
      key: "actions",
      width: 60,
      render: (_, row) =>
        canWrite ? (
          <Button
            size="small"
            type="text"
            icon={<EditOutlined />}
            aria-label="Editar"
            onClick={() => setDrawer({ open: true, account: row })}
          />
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        eyebrow="Tesorería"
        title="Cajas y bancos"
        subtitle="Cajas de efectivo y cuentas corrientes desde donde se pagan las compras."
      />

      <DataTable<TreasuryAccount>
        action={
          canWrite ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nueva caja / cuenta
            </Button>
          ) : undefined
        }
        rowKey="id"
        size="small"
        loading={isLoading || isFetching}
        columns={columns}
        dataSource={data ?? []}
        pagination={false}
        locale={{
          emptyText: company ? (
            <Empty
              description={
                <span>
                  Aún no hay cajas ni cuentas bancarias.
                  <br />
                  Para registrar pagos a proveedores necesitas al menos una caja o cuenta activa.
                </span>
              }
            >
              {canWrite && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Crear caja
                </Button>
              )}
            </Empty>
          ) : (
            <Empty description="Selecciona un cliente" />
          ),
        }}
      />

      <TreasuryAccountDrawer
        open={drawer.open}
        account={drawer.account}
        onClose={() => setDrawer({ open: false, account: null })}
      />
    </>
  );
}
