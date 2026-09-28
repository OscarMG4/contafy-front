"use client";

import { useEffect } from "react";
import { BankOutlined, NumberOutlined } from "@ant-design/icons";
import { Alert, App, Button, Drawer, Flex, Form, Input, Select, Switch, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useCreateAccount, useNatures, useUpdateAccount } from "../application/use-accounts";
import type { Account, AccountInput, AccountUpdateInput } from "../domain/account.types";

const CREATE_BACKEND_FIELDS: Record<string, keyof AccountInput> = {
  code: "code",
  name: "name",
  parent_code: "parentCode",
  nature: "nature",
  is_leaf: "isLeaf",
};

const UPDATE_BACKEND_FIELDS: Record<string, keyof AccountUpdateInput> = {
  name: "name",
  active: "active",
};

interface AccountFormDrawerProps {
  open: boolean;
  account?: Account | null;
  onClose: () => void;
  onSaved?: (account: Account) => void;
}

export function AccountFormDrawer({ open, account, onClose, onSaved }: AccountFormDrawerProps) {
  const [form] = Form.useForm<AccountInput | AccountUpdateInput>();
  const { message } = App.useApp();
  const { data: natures, isLoading: loadingNatures } = useNatures();
  const create = useCreateAccount();
  const update = useUpdateAccount();
  const isEdit = Boolean(account);
  const mutation = isEdit ? update : create;

  useEffect(() => {
    if (!open) return;
    if (account) {
      form.setFieldsValue({
        name: account.name,
        active: account.active,
      } as AccountUpdateInput);
    } else {
      form.setFieldsValue({
        isLeaf: true,
      } as AccountInput);
    }
  }, [open, account, form]);

  const close = () => {
    form.resetFields();
    create.reset();
    update.reset();
    onClose();
  };

  const onFinish = (values: AccountInput | AccountUpdateInput) => {
    const onSuccess = (saved: Account) => {
      message.success(isEdit ? "Cuenta actualizada" : `Cuenta ${saved.code} registrada`);
      onSaved?.(saved);
      close();
    };
    const onError = (error: unknown) =>
      applyApiFieldErrors(form, error, isEdit ? UPDATE_BACKEND_FIELDS : CREATE_BACKEND_FIELDS);

    if (account) update.mutate({ id: account.id, input: values as AccountUpdateInput }, { onSuccess, onError });
    else create.mutate(values as AccountInput, { onSuccess, onError });
  };

  const error = mutation.error instanceof ApiError ? mutation.error : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={isEdit ? "Editar cuenta" : "Nueva cuenta"}
      size={500}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={12}>
          <Button onClick={close}>Cancelar</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {isEdit ? "Guardar cambios" : "Registrar cuenta"}
          </Button>
        </Flex>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
        {isEdit
          ? "Actualiza el nombre o activa/desactiva la cuenta."
          : "Registra una nueva cuenta en el plan contable."}
      </Typography.Paragraph>

      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        {!isEdit && (
          <>
            <Form.Item label="Código" name="code" rules={[{ required: true }]}>
              <Input prefix={<NumberOutlined />} placeholder="10101" maxLength={20} />
            </Form.Item>

            <Form.Item label="Cuenta padre (opcional)" name="parentCode">
              <Input prefix={<NumberOutlined />} placeholder="Código de la cuenta padre" maxLength={20} />
            </Form.Item>
          </>
        )}

        <Form.Item label="Nombre" name="name" rules={[{ required: true }]}>
          <Input prefix={<BankOutlined />} placeholder="Caja" maxLength={200} />
        </Form.Item>

        {!isEdit && (
          <>
            <Form.Item label="Naturaleza" name="nature" rules={[{ required: true }]}>
              <Select loading={loadingNatures} options={natures} placeholder="Selecciona la naturaleza" />
            </Form.Item>

            <Form.Item label="Es cuenta de movimiento" name="isLeaf" valuePropName="checked">
              <Switch />
            </Form.Item>
          </>
        )}

        {isEdit && (
          <Form.Item label="Activa" name="active" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
      </Form>
    </Drawer>
  );
}
