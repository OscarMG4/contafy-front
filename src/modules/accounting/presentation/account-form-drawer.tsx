"use client";

import { useEffect } from "react";
import { BankOutlined, NumberOutlined } from "@ant-design/icons";
import { Alert, App, Button, Col, Divider, Drawer, Flex, Form, Input, Row, Select, Switch, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useCreateAccount, useNatures, useUpdateAccount } from "../application/use-accounts";
import type { Account, AccountInput, AccountUpdateInput } from "../domain/account.types";
import { AccountCodeSelect } from "./account-code-select";

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
  debit_destination_code: "debitDestinationCode",
  credit_destination_code: "creditDestinationCode",
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
        debitDestinationCode: account.debit_destination_code ?? null,
        creditDestinationCode: account.credit_destination_code ?? null,
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

        {isEdit && account?.is_leaf && (
          <>
            <Divider titlePlacement="start" style={{ margin: "8px 0 12px" }}>
              Asiento de destino
            </Divider>
            <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginTop: 0 }}>
              Enlace por transferencia: al usar esta cuenta se genera el asiento de destino. Ej. 63x → Debe 94x /
              Haber 791. Indica ambas cuentas o ninguna.
            </Typography.Paragraph>
            <Row gutter={12}>
              <Col span={12}>
                <Form.Item
                  label="Cuenta destino (Debe)"
                  name="debitDestinationCode"
                  dependencies={["creditDestinationCode"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator: (_, value) =>
                        !value && getFieldValue("creditDestinationCode")
                          ? Promise.reject(new Error("Indica también la cuenta destino"))
                          : Promise.resolve(),
                    }),
                  ]}
                >
                  <AccountCodeSelect placeholder="Ej. 941" />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item
                  label="Contracuenta (Haber)"
                  name="creditDestinationCode"
                  dependencies={["debitDestinationCode"]}
                  rules={[
                    ({ getFieldValue }) => ({
                      validator: (_, value) =>
                        !value && getFieldValue("debitDestinationCode")
                          ? Promise.reject(new Error("Indica también la contracuenta"))
                          : Promise.resolve(),
                    }),
                  ]}
                >
                  <AccountCodeSelect placeholder="Ej. 791" />
                </Form.Item>
              </Col>
            </Row>
          </>
        )}
      </Form>
    </Drawer>
  );
}
