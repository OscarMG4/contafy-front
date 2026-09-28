"use client";

import { useState } from "react";
import { EditOutlined, InboxOutlined, MoreOutlined, PlusOutlined, RollbackOutlined } from "@ant-design/icons";
import { App, Button, Card, Dropdown, Empty, Select, Tag, Typography, type TableProps } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useChangeProductStatus, useProducts } from "../application/use-products";
import { PRODUCT_STATUS_OPTIONS, type Product, type ProductFilters } from "../domain/product.types";
import { ProductFormDrawer } from "./product-form-drawer";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);

export function ProductsView() {
  const { message, modal } = App.useApp();
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [filters, setFilters] = useState<ProductFilters>({
    page: 1,
    perPage: 10,
    status: "active",
  });
  const [drawer, setDrawer] = useState<{
    open: boolean;
    product: Product | null;
  }>({ open: false, product: null });
  const { data, isFetching, isLoading } = useProducts(filters);
  const changeStatus = useChangeProductStatus();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const updateFilters = (patch: Partial<ProductFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  const openCreate = () => setDrawer({ open: true, product: null });

  const toggleStatus = (product: Product) => {
    const action = product.status === "active" ? "archive" : "restore";
    const run = () =>
      changeStatus.mutate(
        { id: product.id, action },
        {
          onSuccess: () => message.success(action === "archive" ? "Artículo archivado" : "Artículo restaurado"),
          onError: (error) => message.error(error.message),
        },
      );

    if (action === "restore") return run();

    modal.confirm({
      title: `¿Archivar ${product.description}?`,
      content: "Sus datos se conservan, pero no aparecerá en registros nuevos hasta que lo restaures.",
      okText: "Archivar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: run,
    });
  };

  const columns: TableProps<Product>["columns"] = [
    {
      title: "Código",
      dataIndex: "code",
      width: 100,
    },
    {
      title: "Descripción",
      dataIndex: "description",
      render: (description: string) => <Typography.Text strong>{description}</Typography.Text>,
    },
    {
      title: "UM",
      dataIndex: "unit_of_measure",
      width: 80,
      responsive: ["md"],
    },
    {
      title: "Tipo existencia",
      dataIndex: "existence_type",
      width: 140,
      responsive: ["lg"],
    },
    {
      title: "Operación",
      dataIndex: "default_operation_type_label",
      responsive: ["lg"],
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 120,
      render: (status: Product["status"]) => {
        const option = PRODUCT_STATUS_OPTIONS.find((item) => item.value === status);
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
      render: (_, product) => {
        const isActive = product.status === "active";
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
                if (key === "edit") setDrawer({ open: true, product });
                if (key === "toggle") toggleStatus(product);
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
        <PageHeader eyebrow="Inventario" title="Artículos" subtitle="Gestiona tus artículos" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para ver artículos" />
        </Card>
      </>
    );
  }

  const isEmpty = !isLoading && !filters.search && filters.status === "active" && data?.meta.total === 0;

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Artículos"
        subtitle="Artículos del cliente para gestión de inventarios y ventas."
      />

      <DataTable<Product>
        search={{
          placeholder: "Buscar por descripción o código",
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <Select
            allowClear
            placeholder="Estado"
            value={filters.status}
            options={PRODUCT_STATUS_OPTIONS}
            onChange={(status) => updateFilters({ status })}
          />
        }
        action={
          canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nuevo artículo
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
              description="Aún no registras artículos"
              style={{ paddingBlock: 24 }}
            >
              {canWrite && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Registrar el primer artículo
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
          showTotal: (total) => `${total} artículos`,
          onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
        }}
      />

      <ProductFormDrawer
        open={drawer.open}
        product={drawer.product}
        onClose={() => setDrawer({ open: false, product: null })}
      />
    </>
  );
}
