"use client";

import { useEffect } from "react";
import { Alert, App, Button, Drawer, Flex, Form, Input, Switch, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useCreateCostCenter, useUpdateCostCenter } from "../application/use-cost-centers";
import type { CostCenter } from "../domain/cost-center.types";

interface CostCenterFormValues {
  code: string;
  name: string;
  active: boolean;
}

interface CostCenterFormDrawerProps {
  open: boolean;
  costCenter?: CostCenter | null;
  onClose: () => void;
  onSaved?: (costCenter: CostCenter) => void;
}

export function CostCenterFormDrawer({ open, costCenter, onClose, onSaved }: CostCenterFormDrawerProps) {
  const [form] = Form.useForm<CostCenterFormValues>();
  const { message } = App.useApp();
  const create = useCreateCostCenter();
  const update = useUpdateCostCenter();
  const isEdit = Boolean(costCenter);
  const mutation = isEdit ? update : create;

  useEffect(() => {
    if (!open) return;
    if (costCenter) form.setFieldsValue({ code: costCenter.code, name: costCenter.name, active: costCenter.active });
    else form.setFieldsValue({ active: true });
  }, [open, costCenter, form]);

  const close = () => {
    form.resetFields();
    create.reset();
    update.reset();
    onClose();
  };

  const onFinish = (values: CostCenterFormValues) => {
    const onSuccess = (saved: CostCenter) => {
      message.success(isEdit ? "Centro de costo actualizado" : `Centro de costo ${saved.code} registrado`);
      onSaved?.(saved);
      close();
    };
    const onError = (error: unknown) => applyApiFieldErrors(form, error);

    if (costCenter) {
      update.mutate(
        { id: costCenter.id, input: { name: values.name, active: values.active ?? true } },
        { onSuccess, onError },
      );
    } else {
      create.mutate({ code: values.code.trim().toUpperCase(), name: values.name }, { onSuccess, onError });
    }
  };

  const error = mutation.error instanceof ApiError ? mutation.error : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={isEdit ? "Editar centro de costo" : "Nuevo centro de costo"}
      size={480}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={12}>
          <Button onClick={close}>Cancelar</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {isEdit ? "Guardar cambios" : "Registrar"}
          </Button>
        </Flex>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
        Distribuye gastos por área, sede o proyecto. El código no se puede cambiar después de registrarlo.
      </Typography.Paragraph>

      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
        <Form.Item
          label="Código"
          name="code"
          rules={[
            { required: true, message: "Ingresa el código" },
            { max: 20, message: "Máximo 20 caracteres" },
            { pattern: /^\S+$/, message: "El código no puede contener espacios" },
          ]}
        >
          <Input placeholder="Ej. ADM01" maxLength={20} disabled={isEdit} style={{ textTransform: "uppercase" }} />
        </Form.Item>

        <Form.Item
          label="Nombre"
          name="name"
          rules={[{ required: true, whitespace: true, message: "Ingresa el nombre" }]}
        >
          <Input placeholder="Ej. Administración" maxLength={150} />
        </Form.Item>

        {isEdit && (
          <Form.Item label="Activo" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
