"use client";

import { useEffect } from "react";
import { HomeOutlined } from "@ant-design/icons";
import { Alert, App, Button, Drawer, Flex, Form, Input, Select, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useCreateWarehouse, useUpdateWarehouse, useWarehouseTypes } from "../application/use-warehouses";
import type { Warehouse, WarehouseInput } from "../domain/warehouse.types";

const BACKEND_FIELDS: Record<string, keyof WarehouseInput> = {
  name: "name",
  type: "type",
};

interface WarehouseFormDrawerProps {
  open: boolean;
  warehouse?: Warehouse | null;
  onClose: () => void;
  onSaved?: (warehouse: Warehouse) => void;
}

export function WarehouseFormDrawer({ open, warehouse, onClose, onSaved }: WarehouseFormDrawerProps) {
  const [form] = Form.useForm<WarehouseInput>();
  const { message } = App.useApp();
  const { data: warehouseTypes, isLoading: loadingTypes } = useWarehouseTypes();
  const create = useCreateWarehouse();
  const update = useUpdateWarehouse();
  const isEdit = Boolean(warehouse);
  const mutation = isEdit ? update : create;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      warehouse
        ? {
            name: warehouse.name,
            type: warehouse.type,
          }
        : {},
    );
  }, [open, warehouse, form]);

  const close = () => {
    form.resetFields();
    create.reset();
    update.reset();
    onClose();
  };

  const onFinish = (values: WarehouseInput) => {
    const onSuccess = (saved: Warehouse) => {
      message.success(isEdit ? "Almacén actualizado" : `Almacén ${saved.name} registrado`);
      onSaved?.(saved);
      close();
    };
    const onError = (error: unknown) => applyApiFieldErrors(form, error, BACKEND_FIELDS);

    if (warehouse) update.mutate({ id: warehouse.id, input: values }, { onSuccess, onError });
    else create.mutate(values, { onSuccess, onError });
  };

  const error = mutation.error instanceof ApiError ? mutation.error : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={isEdit ? "Editar almacén" : "Nuevo almacén"}
      size={500}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={12}>
          <Button onClick={close}>Cancelar</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {isEdit ? "Guardar cambios" : "Registrar almacén"}
          </Button>
        </Flex>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
        {isEdit ? "Actualiza la información del almacén." : "Registra un nuevo almacén para gestionar inventarios."}
      </Typography.Paragraph>

      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Nombre" name="name" rules={[{ required: true }]}>
          <Input prefix={<HomeOutlined />} placeholder="Almacén Central" maxLength={100} />
        </Form.Item>

        <Form.Item label="Tipo de almacén" name="type" rules={[{ required: true }]}>
          <Select loading={loadingTypes} options={warehouseTypes} placeholder="Selecciona el tipo" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
