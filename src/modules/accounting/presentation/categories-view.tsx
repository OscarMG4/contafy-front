"use client";

import { useState } from "react";
import { EditOutlined, MoreOutlined } from "@ant-design/icons";
import { Button, Card, Dropdown, Empty, Tag, Typography, type TableProps } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useCategories } from "../application/use-categories";
import type { Category } from "../domain/category.types";
import { CategoryFormDrawer } from "./category-form-drawer";

const WRITE_ROLES = new Set(["owner", "admin"]);

export function CategoriesView() {
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [drawer, setDrawer] = useState<{
    open: boolean;
    category: Category | null;
  }>({ open: false, category: null });
  const { data, isFetching } = useCategories();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const columns: TableProps<Category>["columns"] = [
    {
      title: "Código",
      dataIndex: "code",
      width: 160,
      render: (code: string) => <Typography.Text type="secondary">{code}</Typography.Text>,
    },
    {
      title: "Categoría",
      dataIndex: "name",
      render: (name: string) => <Typography.Text strong>{name}</Typography.Text>,
    },
    {
      title: "Cuenta contable",
      dataIndex: "account_code",
      render: (code: string) => <Typography.Text>{code}</Typography.Text>,
    },
    {
      title: "Estado",
      dataIndex: "active",
      width: 100,
      render: (active: boolean) => <Tag color={active ? "success" : "default"}>{active ? "Activa" : "Inactiva"}</Tag>,
    },
    {
      key: "actions",
      width: 56,
      align: "right",
      render: (_, category) => {
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [...(canWrite ? [{ key: "edit", icon: <EditOutlined />, label: "Editar" }] : [])],
              onClick: ({ key }) => {
                if (key === "edit") setDrawer({ open: true, category });
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
        <PageHeader eyebrow="Contabilidad" title="Categorías contables" subtitle="Gestiona categorías contables" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para ver categorías contables" />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Contabilidad"
        title="Categorías contables"
        subtitle="Asocia categorías del sistema con cuentas contables."
      />

      <DataTable<Category>
        rowKey="id"
        columns={columns}
        dataSource={data}
        loading={isFetching}
        pagination={false}
      />

      <CategoryFormDrawer
        open={drawer.open}
        category={drawer.category}
        onClose={() => setDrawer({ open: false, category: null })}
      />
    </>
  );
}
