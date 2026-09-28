"use client";

import { useEffect, useState } from "react";
import { BankOutlined } from "@ant-design/icons";
import { Alert, App, Button, Drawer, Flex, Form, Input, Select, Switch, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useAccounts } from "../application/use-accounts";
import { useUpdateCategory } from "../application/use-categories";
import type { Category, CategoryInput } from "../domain/category.types";

const BACKEND_FIELDS: Record<string, keyof CategoryInput> = {
  name: "name",
  account_code: "accountCode",
};

interface CategoryFormDrawerProps {
  open: boolean;
  category: Category | null;
  onClose: () => void;
  onSaved?: () => void;
}

export function CategoryFormDrawer({ open, category, onClose, onSaved }: CategoryFormDrawerProps) {
  const [form] = Form.useForm<CategoryInput>();
  const { message } = App.useApp();
  const [searchAccount, setSearchAccount] = useState("");
  const { data: accountsData, isFetching: loadingAccounts } = useAccounts({
    search: searchAccount,
    only_leaves: true,
    only_active: true,
    page: 1,
    perPage: 50,
  });
  const update = useUpdateCategory();

  useEffect(() => {
    if (!open || !category) return;
    form.setFieldsValue({
      name: category.name,
      accountCode: category.account_code,
      active: category.active,
    });
  }, [open, category, form]);

  const close = () => {
    form.resetFields();
    update.reset();
    setSearchAccount("");
    onClose();
  };

  const onFinish = (values: CategoryInput) => {
    if (!category) return;

    const onSuccess = () => {
      message.success("Categoría actualizada");
      onSaved?.();
      close();
    };
    const onError = (error: unknown) => applyApiFieldErrors(form, error, BACKEND_FIELDS);

    update.mutate(
      {
        id: category.id,
        input: {
          name: values.name || category.name,
          accountCode: values.accountCode,
          active: values.active ?? true,
        },
      },
      { onSuccess, onError },
    );
  };

  const error = update.error instanceof ApiError ? update.error : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      title="Editar categoría contable"
      size={500}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={12}>
          <Button onClick={close}>Cancelar</Button>
          <Button type="primary" loading={update.isPending} onClick={() => form.submit()}>
            Guardar cambios
          </Button>
        </Flex>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
        Asocia la categoría a una cuenta contable del plan de cuentas.
      </Typography.Paragraph>

      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Nombre" name="name" rules={[{ required: true }]}>
          <Input placeholder={category?.name} maxLength={150} />
        </Form.Item>

        <Form.Item
          label="Cuenta contable"
          name="accountCode"
          rules={[{ required: true }]}
        >
          <Select
            showSearch
            loading={loadingAccounts}
            placeholder="Selecciona una cuenta de movimiento"
            filterOption={false}
            onSearch={setSearchAccount}
            options={accountsData?.items.map((a) => ({ value: a.code, label: `${a.code} - ${a.name}` }))}
          />
        </Form.Item>

        <Form.Item label="Activa" name="active" valuePropName="checked">
          <Switch />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
