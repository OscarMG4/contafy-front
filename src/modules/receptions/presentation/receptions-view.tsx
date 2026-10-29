"use client";

import { useMemo, useState } from "react";
import { FileDoneOutlined, PlusOutlined } from "@ant-design/icons";
import { App, Button, DatePicker, Drawer, Empty, Flex, Form, Input, InputNumber, Select, Tag, Typography, type TableProps } from "antd";
import dayjs from "dayjs";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { useProducts } from "@/modules/products/application/use-products";
import { formatOrderNumber } from "@/modules/purchase-orders/presentation/purchase-order-format";
import { SupplierSelect } from "@/modules/treasury/presentation/supplier-select";
import { useWarehouses } from "@/modules/warehouses/application/use-warehouses";
import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";
import { requiredField } from "@/shared/lib/form-config";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useCloseReception, useCreateReception, useReceptions } from "../application/use-receptions";
import {
  RECEPTION_STATUS_OPTIONS,
  type GoodsReception,
  type GoodsReceptionFilters,
  type GoodsReceptionInput,
  type GoodsReceptionStatus,
} from "../domain/reception.types";
import { ReceptionFromOrderModal } from "./reception-from-order-modal";

const WRITE_ROLES = new Set(["owner", "admin", "accountant"]);

type FormValues = {
  receptionDate: dayjs.Dayjs;
  warehouseId: string;
  supplierId?: string;
  guideSeries?: string;
  guideNumber?: string;
  receptionNumber?: string;
  observations?: string;
  lines: { productId: string; quantity: number }[];
};

export function ReceptionsView() {
  const { message } = App.useApp();
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [filters, setFilters] = useState<GoodsReceptionFilters>({
    page: 1,
    perPage: 15,
    status: "open",
  });
  const [open, setOpen] = useState(false);
  const [fromOrderOpen, setFromOrderOpen] = useState(false);
  const [form] = Form.useForm<FormValues>();
  const { data, isFetching, isLoading } = useReceptions(filters);
  const create = useCreateReception();
  const closeReception = useCloseReception();
  const { data: warehousesPage } = useWarehouses({ page: 1, perPage: 200, status: "active" });
  const { data: productsPage } = useProducts({ page: 1, perPage: 200, status: "active" });
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const warehouseNames = useMemo(
    () => new Map((warehousesPage?.items ?? []).map((w) => [w.id, w.name])),
    [warehousesPage],
  );

  const updateFilters = (patch: Partial<GoodsReceptionFilters>) =>
    setFilters((current) => ({ ...current, page: 1, ...patch }));

  const warehouseOptions = useMemo(
    () => (warehousesPage?.items ?? []).map((w) => ({ value: w.id, label: w.name })),
    [warehousesPage],
  );
  const productOptions = useMemo(
    () =>
      (productsPage?.items ?? []).map((p) => ({
        value: p.id,
        label: `${p.code} · ${p.description}`,
      })),
    [productsPage],
  );

  const columns: TableProps<GoodsReception>["columns"] = [
    { title: "Número", dataIndex: "reception_number", width: 120 },
    {
      title: "Fecha",
      dataIndex: "reception_date",
      width: 120,
      render: (d: string) => dayjs(d).format("DD/MM/YYYY"),
    },
    {
      title: "Proveedor",
      dataIndex: "supplier_business_name",
      ellipsis: true,
      render: (name: string | null | undefined) => name ?? "—",
    },
    {
      title: "Almacén",
      dataIndex: "warehouse_id",
      width: 160,
      ellipsis: true,
      render: (id: string) => warehouseNames.get(id) ?? "—",
    },
    {
      title: "O/C N°",
      dataIndex: "purchase_order_number",
      width: 110,
      render: (n: number | null | undefined) => (n ? formatOrderNumber(n) : "—"),
    },
    {
      title: "Guía",
      key: "guide",
      width: 130,
      render: (_, row) =>
        row.guide_series || row.guide_number ? [row.guide_series, row.guide_number].filter(Boolean).join("-") : "—",
    },
    {
      title: "Líneas",
      key: "lines",
      width: 80,
      render: (_, row) => row.lines.length,
    },
    {
      title: "Estado",
      dataIndex: "status",
      width: 110,
      render: (status: GoodsReceptionStatus) => {
        const opt = RECEPTION_STATUS_OPTIONS.find((o) => o.value === status);
        return <Tag color={opt?.color}>{opt?.label ?? status}</Tag>;
      },
    },
    {
      title: "",
      key: "actions",
      width: 120,
      render: (_, row) =>
        canWrite && row.status === "open" ? (
          <Button
            size="small"
            onClick={() =>
              closeReception.mutate(row.id, {
                onSuccess: () => message.success("Recepción cerrada"),
                onError: (e) => message.error(e.message),
              })
            }
          >
            Cerrar
          </Button>
        ) : null,
    },
  ];

  const onFinish = (values: FormValues) => {
    const input: GoodsReceptionInput = {
      receptionDate: values.receptionDate.format("YYYY-MM-DD"),
      warehouseId: values.warehouseId,
      supplierId: values.supplierId || null,
      guideSeries: values.guideSeries || null,
      guideNumber: values.guideNumber || null,
      receptionNumber: values.receptionNumber || null,
      observations: values.observations || null,
      lines: values.lines.map((l) => ({ productId: l.productId, quantity: l.quantity })),
    };
    create.mutate(input, {
      onSuccess: (saved) => {
        message.success(`Recepción ${saved.reception_number} registrada`);
        form.resetFields();
        setOpen(false);
      },
      onError: (error) => applyApiFieldErrors(form, error, {
        reception_date: "receptionDate",
        warehouse_id: "warehouseId",
        supplier_id: "supplierId",
        guide_series: "guideSeries",
        guide_number: "guideNumber",
        reception_number: "receptionNumber",
        lines: "lines",
      }),
    });
  };

  return (
    <>
      <PageHeader
        eyebrow="Inventario"
        title="Recepciones de mercadería"
        subtitle="Registra ingresos físicos antes o junto a la factura de compra."
      />

      <DataTable<GoodsReception>
        search={{
          placeholder: "Buscar por número",
          value: filters.search,
          onChange: (search) => updateFilters({ search }),
        }}
        filters={
          <Select
            allowClear
            placeholder="Estado"
            style={{ width: 160 }}
            value={filters.status || undefined}
            options={RECEPTION_STATUS_OPTIONS.map((o) => ({ value: o.value, label: o.label }))}
            onChange={(status) => updateFilters({ status: status ?? "" })}
          />
        }
        action={
          canWrite ? (
            <>
              <Button icon={<FileDoneOutlined />} onClick={() => setFromOrderOpen(true)}>
                Nueva recepción desde O/C
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  form.setFieldsValue({
                    receptionDate: dayjs(),
                    warehouseId: (warehousesPage?.items.find((w) => w.type === "main") ?? warehousesPage?.items[0])?.id,
                    lines: [{ quantity: 1 }],
                  });
                  setOpen(true);
                }}
              >
                Nueva recepción
              </Button>
            </>
          ) : undefined
        }
        loading={isLoading || isFetching}
        columns={columns}
        dataSource={data?.items}
        rowKey="id"
        locale={{
          emptyText: company ? (
            <Empty description="Sin recepciones" />
          ) : (
            <Empty description="Selecciona un cliente" />
          ),
        }}
        pagination={{
          current: data?.meta.page ?? filters.page,
          pageSize: data?.meta.per_page ?? filters.perPage,
          total: data?.meta.total ?? 0,
          onChange: (page, perPage) => setFilters((c) => ({ ...c, page, perPage })),
        }}
      />

      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Nueva recepción"
        size={560}
        destroyOnHidden
        footer={
          <Flex justify="flex-end" gap={12}>
            <Button onClick={() => setOpen(false)}>Cancelar</Button>
            <Button type="primary" loading={create.isPending} onClick={() => form.submit()}>
              Registrar
            </Button>
          </Flex>
        }
      >
        {create.error instanceof ApiError && (
          <Typography.Text type="danger" style={{ display: "block", marginBottom: 12 }}>
            {create.error.message}
          </Typography.Text>
        )}
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="receptionDate" label="Fecha" rules={[{ required: true }]}>
            <DatePicker style={{ width: "100%" }} format="DD/MM/YYYY" />
          </Form.Item>
          <Form.Item name="warehouseId" label="Almacén" rules={[{ required: true }]}>
            <Select showSearch optionFilterProp="label" options={warehouseOptions} />
          </Form.Item>
          <Form.Item name="supplierId" label="Proveedor">
            <SupplierSelect allowClear placeholder="RUC o razón social (opcional)" />
          </Form.Item>
          <Form.Item label="Guía de remisión" style={{ marginBottom: 0 }}>
            <Flex gap={8}>
              <Form.Item name="guideSeries" style={{ width: 100 }}>
                <Input placeholder="Serie" maxLength={4} />
              </Form.Item>
              <Form.Item name="guideNumber" style={{ flex: 1 }}>
                <Input placeholder="Número" maxLength={10} />
              </Form.Item>
            </Flex>
          </Form.Item>
          <Form.Item name="receptionNumber" label="Número (opcional)">
            <Input placeholder="Auto: R-000001" maxLength={20} />
          </Form.Item>
          <Form.Item name="observations" label="Observaciones">
            <Input.TextArea rows={2} maxLength={1000} />
          </Form.Item>
          <Form.List name="lines">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, ...field }) => (
                  <Flex key={key} gap={8} align="start">
                    <Form.Item
                      {...field}
                      name={[field.name, "productId"]}
                      label={field.name === 0 ? "Producto" : undefined}
                      rules={[requiredField("Producto")]}
                      style={{ flex: 1 }}
                    >
                      <Select showSearch optionFilterProp="label" options={productOptions} />
                    </Form.Item>
                    <Form.Item
                      {...field}
                      name={[field.name, "quantity"]}
                      label={field.name === 0 ? "Cant." : undefined}
                      rules={[requiredField("Cantidad")]}
                      style={{ width: 100 }}
                    >
                      <InputNumber min={0.00001} style={{ width: "100%" }} />
                    </Form.Item>
                    {fields.length > 1 && (
                      <Button type="link" danger onClick={() => remove(field.name)} style={{ marginTop: field.name === 0 ? 30 : 0 }}>
                        Quitar
                      </Button>
                    )}
                  </Flex>
                ))}
                <Button type="dashed" onClick={() => add({ quantity: 1 })} block icon={<PlusOutlined />}>
                  Agregar línea
                </Button>
              </>
            )}
          </Form.List>
        </Form>
      </Drawer>

      <ReceptionFromOrderModal open={fromOrderOpen} onClose={() => setFromOrderOpen(false)} />
    </>
  );
}
