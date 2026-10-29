"use client";

import { useEffect, useMemo, useState } from "react";
import {
  CopyOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  ReloadOutlined,
  StarOutlined,
} from "@ant-design/icons";
import {
  App,
  Button,
  Card,
  Col,
  Descriptions,
  Drawer,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Tooltip,
  Typography,
  type TableProps,
} from "antd";

import { ApiError } from "@/core/http/api-error";
import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { useExistenceTypes } from "@/modules/products/application/use-products";
import { DOCUMENT_TYPE_OPTIONS } from "@/modules/purchases/domain/purchase.types";
import { PageHeader } from "@/shared/ui/page-header";

import {
  useAccountingLinks,
  useAccountingLinkTypes,
  useAccountingSchemes,
  useCopyAccountingLink,
  useCreateAccountingScheme,
  useDeleteAccountingLink,
  useSaveAccountingLink,
  useUpdateAccountingScheme,
} from "../application/use-accounting-links";
import { useCategories } from "../application/use-categories";
import type { AccountingLink, AccountingLinkInput } from "../domain/accounting-link.types";
import { AccountCodeSelect } from "./account-code-select";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);
const ALL = "(Todos)";

type LinkFormValues = Omit<AccountingLinkInput, "scheme_id">;

/** «Gestión de Enlaces Contables - Compras» como en SiempreSoft: por esquema, Enlace + criterios → cuenta. */
export function AccountingLinksView() {
  const { message } = App.useApp();
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const { data: schemes, isLoading: loadingSchemes } = useAccountingSchemes();
  const { data: types } = useAccountingLinkTypes();
  const { data: categories } = useCategories();
  const { data: existenceTypes } = useExistenceTypes();

  const [pickedSchemeId, setSchemeId] = useState<string>();
  // Mientras no se elija uno, se muestra el esquema predeterminado.
  const schemeId = pickedSchemeId ?? (schemes?.find((s) => s.is_default) ?? schemes?.[0])?.id;
  const [linkType, setLinkType] = useState<string>();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<{ open: boolean; link: AccountingLink | null; readOnly: boolean }>({
    open: false,
    link: null,
    readOnly: false,
  });
  const [schemeModal, setSchemeModal] = useState<{ open: boolean; copyFromId: string | null }>({
    open: false,
    copyFromId: null,
  });

  const { data: links, isFetching, refetch } = useAccountingLinks(schemeId, linkType);
  const copyLink = useCopyAccountingLink();
  const deleteLink = useDeleteAccountingLink();
  const updateScheme = useUpdateAccountingScheme();

  const scheme = schemes?.find((s) => s.id === schemeId);
  const selected = links?.find((link) => link.id === selectedId) ?? null;
  const typeOf = (value: string) => types?.find((type) => type.value === value);

  const labels = useMemo(
    () => ({
      document: (code: string | null) =>
        code ? (DOCUMENT_TYPE_OPTIONS.find((o) => o.value === code)?.label ?? code).toUpperCase() : ALL,
      product: (code: string | null) =>
        code ? (existenceTypes?.find((e) => e.code === code)?.description ?? code).toUpperCase() : ALL,
      partner: (code: string | null) =>
        code ? (categories?.find((c) => c.code === code)?.name ?? code).toUpperCase() : ALL,
    }),
    [existenceTypes, categories],
  );

  const criterionCell = (link: AccountingLink, key: "document_type" | "product_category" | "partner_category" | "concept") => {
    if (!typeOf(link.link_type)?.criteria.includes(key)) return "";
    const value = link[key];
    if (key === "document_type") return labels.document(value);
    if (key === "product_category") return labels.product(value);
    if (key === "partner_category") return labels.partner(value);
    return value ? value.toUpperCase() : ALL;
  };

  const columns: TableProps<AccountingLink>["columns"] = [
    { title: "Enlace", dataIndex: "link_type_label", width: 210, ellipsis: true },
    { title: "Tipo Documento", key: "document_type", width: 210, ellipsis: true, render: (_, l) => criterionCell(l, "document_type") },
    {
      title: "Categoría Artículo/Activo",
      key: "product_category",
      width: 190,
      ellipsis: true,
      render: (_, l) => criterionCell(l, "product_category"),
    },
    {
      title: "Categoría Cliente/Proveedor",
      key: "partner_category",
      width: 210,
      ellipsis: true,
      render: (_, l) => criterionCell(l, "partner_category"),
    },
    { title: "Concepto", key: "concept", width: 140, ellipsis: true, render: (_, l) => criterionCell(l, "concept") },
    { title: "Código Cuenta", dataIndex: "account_code", width: 120 },
    { title: "Descripción Cuenta", dataIndex: "account_name", ellipsis: true, render: (name: string | null) => name ?? "—" },
  ];

  const openForm = (link: AccountingLink | null, readOnly = false) => setForm({ open: true, link, readOnly });
  const run = async (promise: Promise<unknown>, success: string) => {
    try {
      await promise;
      message.success(success);
    } catch (error) {
      message.error(ApiError.from(error).message);
    }
  };

  if (!company) {
    return (
      <>
        <PageHeader eyebrow="Contabilidad" title="Enlaces contables" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para ver sus enlaces contables" />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Contabilidad"
        title="Gestión de Enlaces Contables - Compras"
        subtitle="Define qué cuenta usa cada parte del asiento automático según el tipo de documento, la categoría del artículo o la del proveedor."
      />

      <Card variant="borderless" style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="bottom">
          <Col xs={24} md={9}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Esquema
            </Typography.Text>
            <Flex gap={8}>
              <Select
                style={{ flex: 1 }}
                loading={loadingSchemes}
                value={schemeId}
                onChange={(value) => {
                  setSchemeId(value);
                  setSelectedId(null);
                }}
                options={schemes?.map((s) => ({
                  value: s.id,
                  label: `${s.name}${s.is_default ? " · predeterminado" : ""}${s.active ? "" : " (inactivo)"}`,
                }))}
              />
              <Tooltip title="Buscar">
                <Button icon={<ReloadOutlined />} onClick={() => refetch()} />
              </Tooltip>
            </Flex>
          </Col>
          <Col xs={24} md={7}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Enlace Contable
            </Typography.Text>
            <Select
              style={{ width: "100%" }}
              allowClear
              placeholder="(Todos)"
              value={linkType}
              onChange={(value) => {
                setLinkType(value);
                setSelectedId(null);
              }}
              options={types?.map((t) => ({ value: t.value, label: t.label }))}
            />
          </Col>
          <Col xs={24} md={8}>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Compañía
            </Typography.Text>
            <Input value={company.business_name} disabled />
          </Col>
        </Row>
        {canWrite && scheme && (
          <Flex gap={8} wrap style={{ marginTop: 14 }}>
            <Button onClick={() => setSchemeModal({ open: true, copyFromId: null })}>Nuevo esquema</Button>
            <Button icon={<CopyOutlined />} onClick={() => setSchemeModal({ open: true, copyFromId: scheme.id })}>
              Copiar esquema
            </Button>
            {!scheme.is_default && (
              <Button
                icon={<StarOutlined />}
                loading={updateScheme.isPending}
                onClick={() =>
                  run(
                    updateScheme.mutateAsync({ id: scheme.id, input: { name: scheme.name, active: true, is_default: true } }),
                    "Esquema predeterminado actualizado.",
                  )
                }
              >
                Usar como predeterminado
              </Button>
            )}
          </Flex>
        )}
      </Card>

      <Card variant="borderless" styles={{ body: { padding: 0 } }}>
        <Flex gap={8} wrap style={{ padding: "14px 18px" }}>
          {canWrite && (
            <>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => openForm(null)} disabled={!scheme}>
                Nuevo
              </Button>
              <Button icon={<EditOutlined />} disabled={!selected} onClick={() => selected && openForm(selected)}>
                Modificar
              </Button>
              <Popconfirm
                title="¿Eliminar el enlace?"
                okText="Eliminar"
                okButtonProps={{ danger: true }}
                disabled={!selected}
                onConfirm={() => selected && run(deleteLink.mutateAsync(selected.id), "Enlace eliminado.").then(() => setSelectedId(null))}
              >
                <Button danger icon={<DeleteOutlined />} disabled={!selected}>
                  Eliminar
                </Button>
              </Popconfirm>
            </>
          )}
          <Button icon={<EyeOutlined />} disabled={!selected} onClick={() => selected && openForm(selected, true)}>
            Ver Detalle
          </Button>
          {canWrite && (
            <Button
              icon={<CopyOutlined />}
              disabled={!selected}
              loading={copyLink.isPending}
              onClick={() => selected && run(copyLink.mutateAsync(selected.id), "Enlace copiado; modifícalo para cambiar sus criterios.")}
            >
              Copiar
            </Button>
          )}
          <Typography.Text type="secondary" style={{ marginInlineStart: "auto", alignSelf: "center", fontSize: 12 }}>
            {links ? `${links.length} enlaces` : ""} · doble clic para modificar
          </Typography.Text>
        </Flex>
        <Table<AccountingLink>
          size="small"
          rowKey="id"
          columns={columns}
          dataSource={links}
          loading={isFetching}
          pagination={false}
          scroll={{ x: 1280, y: 560 }}
          rowClassName={(row) => (row.id === selectedId ? "ant-table-row-selected" : "")}
          onRow={(row) => ({
            onClick: () => setSelectedId(row.id),
            onDoubleClick: () => canWrite && openForm(row),
          })}
          locale={{ emptyText: <Empty description="Este esquema no tiene enlaces" /> }}
        />
      </Card>

      <LinkFormDrawer
        open={form.open}
        link={form.link}
        readOnly={form.readOnly}
        schemeId={schemeId}
        onClose={() => setForm({ open: false, link: null, readOnly: false })}
      />
      <SchemeModal
        open={schemeModal.open}
        copyFromId={schemeModal.copyFromId}
        onClose={(createdId) => {
          setSchemeModal({ open: false, copyFromId: null });
          if (createdId) setSchemeId(createdId);
        }}
      />
    </>
  );
}

function LinkFormDrawer({
  open,
  link,
  readOnly,
  schemeId,
  onClose,
}: {
  open: boolean;
  link: AccountingLink | null;
  readOnly: boolean;
  schemeId?: string;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<LinkFormValues>();
  const { data: types } = useAccountingLinkTypes();
  const { data: categories } = useCategories();
  const { data: existenceTypes } = useExistenceTypes();
  const save = useSaveAccountingLink();
  const linkType = Form.useWatch("link_type", form);
  const criteria = types?.find((t) => t.value === linkType)?.criteria ?? [];

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      link
        ? {
            link_type: link.link_type,
            document_type: link.document_type,
            product_category: link.product_category,
            partner_category: link.partner_category,
            concept: link.concept,
            account_code: link.account_code,
          }
        : { link_type: undefined, document_type: null, product_category: null, partner_category: null, concept: null, account_code: "" },
    );
  }, [open, link, form]);

  const submit = async (values: LinkFormValues) => {
    if (!schemeId) return;
    try {
      await save.mutateAsync({ id: link?.id, input: { ...values, scheme_id: schemeId } });
      message.success(link ? "Enlace actualizado." : "Enlace creado.");
      onClose();
    } catch (error) {
      message.error(ApiError.from(error).message);
    }
  };

  const title = readOnly ? "Detalle del enlace" : link ? "Modificar enlace" : "Nuevo enlace";
  const all = { label: ALL, value: null as unknown as string };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={title}
      size="large"
      destroyOnHidden
      footer={
        !readOnly && (
          <Space style={{ float: "right" }}>
            <Button onClick={onClose}>Cancelar</Button>
            <Button type="primary" loading={save.isPending} onClick={() => form.submit()}>
              Aceptar
            </Button>
          </Space>
        )
      }
    >
      {readOnly && link ? (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Enlace">{link.link_type_label}</Descriptions.Item>
          <Descriptions.Item label="Descripción">{types?.find((t) => t.value === link.link_type)?.description}</Descriptions.Item>
          <Descriptions.Item label="Tipo Documento">{link.document_type ?? ALL}</Descriptions.Item>
          <Descriptions.Item label="Categoría Artículo">{link.product_category ?? ALL}</Descriptions.Item>
          <Descriptions.Item label="Categoría Proveedor">{link.partner_category ?? ALL}</Descriptions.Item>
          <Descriptions.Item label="Concepto">{link.concept ?? ALL}</Descriptions.Item>
          <Descriptions.Item label="Cuenta">
            <Tag variant="filled">{link.account_code}</Tag> {link.account_name}
          </Descriptions.Item>
        </Descriptions>
      ) : (
        <Form form={form} layout="vertical" onFinish={submit} requiredMark="optional">
          <Form.Item name="link_type" label="Enlace contable" rules={[{ required: true, message: "Elige el enlace" }]}>
            <Select
              placeholder="Elige el enlace"
              options={types?.map((t) => ({ value: t.value, label: t.label }))}
              disabled={Boolean(link)}
            />
          </Form.Item>
          {linkType && (
            <Typography.Paragraph type="secondary" style={{ marginTop: -12 }}>
              {types?.find((t) => t.value === linkType)?.description} Deja un criterio en «(Todos)» para que aplique a cualquier
              valor; si varias reglas aplican, gana la más específica.
            </Typography.Paragraph>
          )}
          {criteria.includes("document_type") && (
            <Form.Item name="document_type" label="Tipo Documento">
              <Select
                allowClear
                placeholder={ALL}
                options={[all, ...DOCUMENT_TYPE_OPTIONS.map((o) => ({ value: o.value, label: `${o.value} - ${o.label}` }))]}
              />
            </Form.Item>
          )}
          {criteria.includes("product_category") && (
            <Form.Item name="product_category" label="Categoría Artículo/Activo" extra="Tipo de existencia SUNAT del artículo.">
              <Select
                allowClear
                placeholder={ALL}
                options={[all, ...(existenceTypes ?? []).map((e) => ({ value: e.code, label: `${e.code} - ${e.description}` }))]}
              />
            </Form.Item>
          )}
          {criteria.includes("partner_category") && (
            <Form.Item name="partner_category" label="Categoría Cliente/Proveedor" extra="Categoría contable del comprobante.">
              <Select
                allowClear
                placeholder={ALL}
                options={[all, ...(categories ?? []).map((c) => ({ value: c.code, label: `${c.name} (${c.account_code})` }))]}
              />
            </Form.Item>
          )}
          {criteria.includes("concept") && (
            <Form.Item name="concept" label="Concepto" extra="Concepto de la planilla de gasto (ej. Planilla Movilidad).">
              <Input placeholder={ALL} maxLength={150} allowClear />
            </Form.Item>
          )}
          <Form.Item name="account_code" label="Código Cuenta" rules={[{ required: true, message: "Elige la cuenta" }]}>
            <AccountCodeSelect placeholder="Busca por código o nombre" />
          </Form.Item>
        </Form>
      )}
    </Drawer>
  );
}

function SchemeModal({
  open,
  copyFromId,
  onClose,
}: {
  open: boolean;
  copyFromId: string | null;
  onClose: (createdId?: string) => void;
}) {
  const { message } = App.useApp();
  const [form] = Form.useForm<{ name: string }>();
  const create = useCreateAccountingScheme();

  const submit = async ({ name }: { name: string }) => {
    try {
      const scheme = await create.mutateAsync({ name, copy_from_id: copyFromId });
      message.success(copyFromId ? "Esquema copiado con todos sus enlaces." : "Esquema creado.");
      form.resetFields();
      onClose(scheme.id);
    } catch (error) {
      message.error(ApiError.from(error).message);
    }
  };

  return (
    <Modal
      open={open}
      title={copyFromId ? "Copiar esquema" : "Nuevo esquema"}
      okText="Aceptar"
      cancelText="Cancelar"
      confirmLoading={create.isPending}
      onOk={() => form.submit()}
      onCancel={() => onClose()}
      destroyOnHidden
    >
      <Form form={form} layout="vertical" onFinish={submit}>
        <Form.Item name="name" label="Nombre" rules={[{ required: true, message: "Escribe el nombre" }]}>
          <Input placeholder={`Esquema Contable ${new Date().getFullYear()}`} maxLength={100} />
        </Form.Item>
        {!copyFromId && (
          <Typography.Text type="secondary">El esquema nuevo empieza vacío; los asientos usan las cuentas base hasta que agregues enlaces.</Typography.Text>
        )}
      </Form>
    </Modal>
  );
}
