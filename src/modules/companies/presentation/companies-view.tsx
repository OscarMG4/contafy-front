"use client";

import { useState } from "react";
import {
  CheckCircleFilled,
  EditOutlined,
  InboxOutlined,
  LoginOutlined,
  MoreOutlined,
  PlusOutlined,
  RollbackOutlined,
} from "@ant-design/icons";
import { App, Button, Dropdown, Empty, Flex, Select, Tag, Typography, type TableProps } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useActiveCompany } from "../application/active-company";
import { useChangeCompanyStatus, useCompanies } from "../application/use-companies";
import { COMPANY_STATUS_OPTIONS, type Company, type CompanyFilters } from "../domain/company.types";
import { CompanyAvatar } from "./company-avatar";
import { CompanyFormDrawer } from "./company-form-drawer";

const MANAGER_ROLES = new Set(["owner", "admin"]);

export function CompaniesView() {
  const { message, modal } = App.useApp();
  const { data: user } = useCurrentUser();
  const { selectedId, select } = useActiveCompany();
  const [filters, setFilters] = useState<CompanyFilters>({
    page: 1,
    perPage: 10,
    status: "active",
  });
  const [drawer, setDrawer] = useState<{
    open: boolean;
    company: Company | null;
  }>({ open: false, company: null });
  const { data, isFetching, isLoading } = useCompanies(filters);
  const changeStatus = useChangeCompanyStatus();
  const canManage = MANAGER_ROLES.has(user?.role ?? "");

  const updateFilters = (patch: Partial<CompanyFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));
  const openCreate = () => setDrawer({ open: true, company: null });

  const restoreCompany = (company: Company, successText = "Empresa restaurada") => {
    changeStatus.mutate(
      { id: company.id, action: "restore" },
      {
        onSuccess: () => message.success(successText),
        onError: (error) => message.error(error.message),
      },
    );
  };

  const archiveWithUndo = (company: Company) => {
    const toastKey = `archive-${company.id}`;

    changeStatus.mutate(
      { id: company.id, action: "archive" },
      {
        onSuccess: () => {
          message.open({
            key: toastKey,
            type: "success",
            duration: 4,
            content: (
              <Flex align="center" gap={12} style={{ display: "inline-flex" }}>
                <span>{company.business_name} archivada</span>
                <Button
                  type="link"
                  size="small"
                  style={{ padding: 0, height: "auto" }}
                  onClick={() => {
                    message.destroy(toastKey);
                    restoreCompany(company, "Archivado deshecho");
                  }}
                >
                  Deshacer
                </Button>
              </Flex>
            ),
          });
        },
        onError: (error) => message.error(error.message),
      },
    );
  };

  const toggleStatus = (company: Company) => {
    if (company.status !== "active") {
      restoreCompany(company);
      return;
    }

    modal.confirm({
      title: `¿Archivar ${company.business_name}?`,
      content: "Sus datos se conservan, pero nadie podrá registrar operaciones hasta que la restaures.",
      okText: "Archivar",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: () => archiveWithUndo(company),
    });
  };

  const columns: TableProps<Company>["columns"] = [
    {
      title: "Empresa",
      key: "company",
      render: (_, company) => (
        <Flex align="center" gap={12}>
          <CompanyAvatar id={company.id} name={company.business_name} />
          <div style={{ lineHeight: 1.3, minWidth: 0 }}>
            <Flex align="center" gap={6}>
              <Typography.Text strong>{company.business_name}</Typography.Text>
            </Flex>
            {company.trade_name && (
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {company.trade_name}
              </Typography.Text>
            )}
          </div>
        </Flex>
      ),
    },
    {
      title: "RUC",
      dataIndex: "ruc",
      width: 140,
      render: (ruc: string) => <Typography.Text copyable={{ text: ruc }}>{ruc}</Typography.Text>,
    },
    { title: "Régimen", dataIndex: "tax_regime_label", responsive: ["md"] },
    {
      title: "Estado",
      dataIndex: "status",
      width: 120,
      render: (status: Company["status"]) => {
        const option = COMPANY_STATUS_OPTIONS.find((item) => item.value === status);
        return (
          <Tag color={option?.color} variant="filled">
            {option?.label}
          </Tag>
        );
      },
    },
    {
      title: "",
      key: "use",
      width: 128,
      align: "right",
      render: (_, company) => {
        const isInUse = selectedId === company.id;
        const isActive = company.status === "active";

        if (isInUse) {
          return (
            <Tag color="purple" icon={<CheckCircleFilled />} style={{ marginInlineEnd: 0 }}>
              En uso
            </Tag>
          );
        }

        return (
          <Button
            type="primary"
            size="small"
            icon={<LoginOutlined />}
            disabled={!isActive}
            onClick={() => {
              select(company.id, company);
              message.success(`Ahora trabajas con ${company.business_name}`);
            }}
          >
            Usar
          </Button>
        );
      },
    },
    {
      key: "actions",
      width: 48,
      align: "right",
      render: (_, company) => {
        if (!canManage) return null;
        const isActive = company.status === "active";
        return (
          <Dropdown
            trigger={["click"]}
            menu={{
              items: [
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
              ],
              onClick: ({ key }) => {
                if (key === "edit") setDrawer({ open: true, company });
                if (key === "toggle") toggleStatus(company);
              },
            }}
          >
            <Button type="text" icon={<MoreOutlined />} aria-label="Más acciones" />
          </Dropdown>
        );
      },
    },
  ];

  const isEmptyStudio = !isLoading && !filters.search && filters.status === "active" && data?.meta.total === 0;

  return (
    <>
      <PageHeader
        eyebrow="Maestros"
        title="Clientes"
        subtitle="Elige con cuál cliente operas. El resto de módulos usa el que esté «En uso»."
      />

      <DataTable<Company>
        search={{
          placeholder: "Buscar por razón social, nombre comercial o RUC",
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <Select
            allowClear
            placeholder="Estado"
            value={filters.status}
            options={COMPANY_STATUS_OPTIONS}
            onChange={(status) => updateFilters({ status })}
          />
        }
        action={
          canManage && (
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              Nueva empresa
            </Button>
          )
        }
        rowKey="id"
        columns={columns}
        dataSource={data?.items}
        loading={isFetching}
        locale={{
          emptyText: isEmptyStudio ? (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="Aún no registras empresas"
              style={{ paddingBlock: 24 }}
            >
              {canManage && (
                <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
                  Registrar la primera empresa
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
          showTotal: (total) => `${total} empresas`,
          onChange: (page, perPage) => setFilters((current) => ({ ...current, page, perPage })),
        }}
      />

      <CompanyFormDrawer
        open={drawer.open}
        company={drawer.company}
        onClose={() => setDrawer({ open: false, company: null })}
        onSaved={(saved) => {
          if (!selectedId) select(saved.id, saved);
        }}
      />
    </>
  );
}
