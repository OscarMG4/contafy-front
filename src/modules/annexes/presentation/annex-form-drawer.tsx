"use client";

import { useEffect } from "react";
import { Alert, App, Button, Drawer, Flex, Form, Input, Select, Switch, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useAnnexTypes, useCreateAnnex, useUpdateAnnex } from "../application/use-annexes";
import type { Annex, AnnexType } from "../domain/annex.types";

interface AnnexFormValues {
  code: string;
  name: string;
  type: AnnexType;
  documentNumber?: string | null;
  active: boolean;
}

const BACKEND_FIELDS: Record<string, keyof AnnexFormValues> = {
  code: "code",
  name: "name",
  type: "type",
  document_number: "documentNumber",
  active: "active",
};

interface AnnexFormDrawerProps {
  open: boolean;
  annex?: Annex | null;
  onClose: () => void;
  onSaved?: (annex: Annex) => void;
}

export function AnnexFormDrawer({ open, annex, onClose, onSaved }: AnnexFormDrawerProps) {
  const [form] = Form.useForm<AnnexFormValues>();
  const { message } = App.useApp();
  const { data: types, isLoading: loadingTypes } = useAnnexTypes();
  const create = useCreateAnnex();
  const update = useUpdateAnnex();
  const isEdit = Boolean(annex);
  const mutation = isEdit ? update : create;

  useEffect(() => {
    if (!open) return;
    if (annex) {
      form.setFieldsValue({
        code: annex.code,
        name: annex.name,
        type: annex.type,
        documentNumber: annex.document_number,
        active: annex.active,
      });
    } else {
      form.setFieldsValue({ type: "worker", active: true });
    }
  }, [open, annex, form]);

  const close = () => {
    form.resetFields();
    create.reset();
    update.reset();
    onClose();
  };

  const onFinish = (values: AnnexFormValues) => {
    const onSuccess = (saved: Annex) => {
      message.success(isEdit ? "Anexo actualizado" : `Anexo ${saved.code} registrado`);
      onSaved?.(saved);
      close();
    };
    const onError = (error: unknown) => applyApiFieldErrors(form, error, BACKEND_FIELDS);
    const documentNumber = values.documentNumber?.trim() || null;

    if (annex) {
      update.mutate(
        { id: annex.id, input: { name: values.name, type: values.type, documentNumber, active: values.active ?? true } },
        { onSuccess, onError },
      );
    } else {
      create.mutate(
        { code: values.code.trim().toUpperCase(), name: values.name, type: values.type, documentNumber },
        { onSuccess, onError },
      );
    }
  };

  const error = mutation.error instanceof ApiError ? mutation.error : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={isEdit ? "Editar anexo" : "Nuevo anexo"}
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
        Código auxiliar para analizar saldos y gastos por trabajador, proyecto, banco u otro concepto.
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
          <Input placeholder="Ej. TR001" maxLength={20} disabled={isEdit} style={{ textTransform: "uppercase" }} />
        </Form.Item>

        <Form.Item label="Nombre" name="name" rules={[{ required: true, whitespace: true, message: "Ingresa el nombre" }]}>
          <Input placeholder="Ej. Juan Pérez Rojas" maxLength={200} />
        </Form.Item>

        <Form.Item label="Tipo" name="type" rules={[{ required: true, message: "Selecciona el tipo" }]}>
          <Select options={types} loading={loadingTypes} placeholder="Selecciona el tipo" />
        </Form.Item>

        <Form.Item
          label="N° de documento"
          name="documentNumber"
          rules={[{ pattern: /^[A-Za-z0-9-]*$/, message: "Solo letras, números y guiones" }]}
        >
          <Input placeholder="DNI, RUC u otro (opcional)" maxLength={20} />
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
