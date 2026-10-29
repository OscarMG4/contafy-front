"use client";

import { useState } from "react";
import { EditOutlined, LockOutlined, MoreOutlined, PlusOutlined, UnlockOutlined } from "@ant-design/icons";
import { App, Button, Card, Dropdown, Empty, Select, Tag, Typography, type MenuProps, type TableProps } from "antd";
import dayjs from "dayjs";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useChangeExpenseSheetStatus, useExpenseSheets } from "../application/use-expense-sheets";
import {
  EXPENSE_SHEET_STATUS_OPTIONS,
  type ExpenseSheet,
  type ExpenseSheetFilters,
  type ExpenseSheetStatus,
} from "../domain/expense-sheet.types";
import { ExpenseSheetFormDrawer } from "./expense-sheet-form-drawer";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);

export function ExpenseSheetsView() {
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const { message, modal } = App.useApp();
  const [filters, setFilters] = useState<ExpenseSheetFilters>({ page: 1, perPage: 20, status: "open" });
  const [drawer, setDrawer] = useState<{ open: boolean; sheet: ExpenseSheet | null }>({ open: false, sheet: null });
  const { data, isFetching, isLoading } = useExpenseSheets(filters);
  const changeStatus = useChangeExpenseSheetStatus();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const updateFilters = (patch: Partial<ExpenseSheetFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  const openCreate = () => setDrawer({ open: true, sheet: null });

  const toggleStatus = (sheet: ExpenseSheet) => {
    const action = sheet.status === "open" ? "close" : "reopen";
    const run = () =>
      changeStatus.mutateAsync({ id: sheet.id, action }).then(
        () => message.success(action === "close" ? `Planilla N° ${sheet.number} cerrada` : `Planilla N° ${sheet.number} reabierta`),
        (error: Error) => message.error(error.message),
      );

    modal.confirm({
      title: action === "close" ? `¿Cerrar la planilla N° ${sheet.number}?` : `¿Reabrir la planilla N° ${sheet.number}?`,
      content:
        action === "close"
          ? "Ya no podrás editarla ni asignarle gastos nuevos hasta que la reabras."
          : "Volverá a aceptar cambios y gastos nuevos.",
      okText: action === "close" ? "Cerrar planilla" : "Reabrir",
      cancelText: "Cancelar",
      onOk: run,
    });
  };

  const columns: TableProps<ExpenseSheet>["columns"] = [
    {
      title: "N°",
      dataIndex: "number",
      width: 90,
      render: (number: number) => <Typography.Text strong>{number}</Typography.Text>,
    },
    {
      title: "Fecha",
      dataIndex: "issue_date",
      width: 120,
      render: (date: string) => dayjs(date, "YYYY-MM-DD").format("DD/MM/YYYY"),
    },
    {
      title: "Concepto",
      dataIndex: "concept",
      render: (concept: string, sheet: ExpenseSheet) => (
        <>
          <Typography.Text>{concept}</Typography.Text>
          {sheet.description && (
            <Typography.Text type="secondary" ellipsis style={{ display: "block", maxWidth: 360, fontSize: 12 }}>
              {sheet.description}
            </Typography.Text>
          )}
        </>
      ),
    },
    {
      title: "Responsable",
      dataIndex: "responsible",
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 150,
      render: (status: ExpenseSheetStatus, sheet: ExpenseSheet) => (
        <>
          <Tag color={status === "open" ? "processing" : "default"} variant="filled">
            {sheet.status_label}
          </Tag>
          {sheet.closed_at && (
            <Typography.Text type="secondary" style={{ display: "block", fontSize: 12 }}>
              {dayjs(sheet.closed_at).format("DD/MM/YYYY HH:mm")}
            </Typography.Text>
          )}
        </>
      ),
    },
    {
      key: "actions",
      width: 56,
      align: "right",
      render: (_, sheet) => {
        if (!canWrite) return null;
        const isOpen = sheet.status === "open";
        const items: MenuProps["items"] = [
          ...(isOpen ? [{ key: "edit", icon: <EditOutlined />, label: "Editar" }] : []),
          isOpen
            ? { key: "toggle", icon: <LockOutlined />, label: "Cerrar planilla" }
            : { key: "toggle", icon: <UnlockOutlined />, label: "Reabrir planilla" },
        ];
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items,
              onClick: ({ key }) => {
                if (key === "edit") setDrawer({ open: true, sheet });
                if (key === "toggle") toggleStatus(sheet);
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
        <PageHeader eyebrow="Compras" title="Planillas de gasto" subtitle="Gestiona las rendiciones de cuenta" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para ver sus planillas de gasto" />
        </Card>
      </>
    );
  }

  const isEmpty = !isLoading && !filters.search && !filters.status && data?.meta.total === 0;

  return (
    <>
      <PageHeader
        eyebrow="Compras"
        title="Planillas de gasto"
        subtitle="Rendiciones de cuenta: caja chica, viáticos y entregas a rendir."
      />

      <DataTable<ExpenseSheet>
        search={{
          placeholder: "Buscar por número, responsable o concepto",
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <Select
            allowClear
            placeholder="Estado"
            value={filters.status}
            options={EXPENSE_SHEET_STATUS_OPTIONS}
            onChange={(status) => updateFilters({ status })}
            style={{ minWidth: 130 }}
          />
        }
        action={
          canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nueva planilla
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
              description="Aún no registras planillas de gasto"
              style={{ paddingBlock: 24 }}
            >
              {canWrite && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Registrar la primera planilla
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
          showTotal: (total) => `${total} planillas`,
          onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
        }}
      />

      <ExpenseSheetFormDrawer
        open={drawer.open}
        sheet={drawer.sheet}
        onClose={() => setDrawer({ open: false, sheet: null })}
      />
    </>
  );
}
