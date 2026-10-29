"use client";

import { useRef } from "react";
import { Alert, App, Button, Drawer, Flex, Form, Input, Radio, Select, Switch } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";
import { useEnterToNextField, useHotkeys } from "@/shared/lib/use-keyboard-entry";

import { useSaveTreasuryAccount, useTreasuryAccountTypes } from "../application/use-treasury";
import type { TreasuryAccount, TreasuryAccountInput, TreasuryAccountType } from "../domain/treasury.types";
import { CURRENCY_OPTIONS, guardEscape } from "./ui-helpers";

const FALLBACK_DEFAULT_CODES: Record<TreasuryAccountType, string> = { cash: "101", bank: "1041" };

const BACKEND_FIELDS: Record<string, keyof TreasuryAccountInput> = {
  account_code: "accountCode",
  bank_name: "bankName",
  account_number: "accountNumber",
};

interface TreasuryAccountDrawerProps {
  open: boolean;
  account: TreasuryAccount | null;
  onClose: () => void;
}

export function TreasuryAccountDrawer({ open, account, onClose }: TreasuryAccountDrawerProps) {
  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={account ? `Editar ${account.code} - ${account.name}` : "Nueva caja / cuenta bancaria"}
      size={480}
      destroyOnHidden
      keyboard={false}
    >
      {open && <TreasuryAccountForm key={account?.id ?? "new"} account={account} onClose={onClose} />}
    </Drawer>
  );
}

function TreasuryAccountForm({ account, onClose }: { account: TreasuryAccount | null; onClose: () => void }) {
  const { message } = App.useApp();
  const [form] = Form.useForm<TreasuryAccountInput>();
  const containerRef = useRef<HTMLDivElement>(null);
  const { data: types } = useTreasuryAccountTypes();
  const save = useSaveTreasuryAccount();
  const type = Form.useWatch("type", form) ?? account?.type ?? "cash";

  const defaultCode = (t: TreasuryAccountType) =>
    types?.find((o) => o.value === t)?.default_account_code ?? FALLBACK_DEFAULT_CODES[t];

  useEnterToNextField(containerRef);
  useHotkeys({ F10: () => form.submit(), CtrlEnter: () => form.submit(), Escape: guardEscape(onClose) });

  const onValuesChange = (changed: Partial<TreasuryAccountInput>, all: TreasuryAccountInput) => {
    if (!changed.type) return;
    const previous: TreasuryAccountType = changed.type === "cash" ? "bank" : "cash";
    // Solo autocompleta si el usuario no personalizó la cuenta.
    if (!all.accountCode || all.accountCode === defaultCode(previous)) {
      form.setFieldValue("accountCode", defaultCode(changed.type));
    }
  };

  const onFinish = (values: TreasuryAccountInput) => {
    const input: TreasuryAccountInput = {
      ...values,
      bankName: values.type === "bank" ? values.bankName : null,
      accountNumber: values.type === "bank" ? values.accountNumber : null,
      active: account ? values.active : undefined,
    };
    save.mutate(
      { id: account?.id, input },
      {
        onSuccess: (saved) => {
          message.success(account ? "Caja / cuenta actualizada" : `${saved.label} registrada`);
          onClose();
        },
        onError: (error) => applyApiFieldErrors(form, error, BACKEND_FIELDS),
      },
    );
  };

  return (
    <div ref={containerRef}>
      {save.error instanceof ApiError && (
        <Alert type="error" showIcon title={save.error.message} style={{ marginBottom: 16 }} />
      )}
      <Form<TreasuryAccountInput>
        form={form}
        layout="vertical"
        onFinish={onFinish}
        onValuesChange={onValuesChange}
        initialValues={
          account
            ? {
                name: account.name,
                type: account.type,
                currency: account.currency,
                accountCode: account.account_code,
                bankName: account.bank_name,
                accountNumber: account.account_number,
                active: account.active,
              }
            : { type: "cash", currency: "PEN", accountCode: defaultCode("cash"), active: true }
        }
      >
        <Form.Item name="type" label="Tipo" rules={[{ required: true }]}>
          <Radio.Group
            optionType="button"
            buttonStyle="solid"
            options={(types ?? [
              { value: "cash", label: "Caja" },
              { value: "bank", label: "Cuenta corriente" },
            ]).map((t) => ({ value: t.value, label: t.label }))}
          />
        </Form.Item>
        <Form.Item name="name" label="Nombre" rules={[{ required: true, whitespace: true }, { max: 120 }]}>
          <Input autoFocus placeholder={type === "bank" ? "BCP SOLES" : "CAJA 01 - EFECTIVO"} maxLength={120} />
        </Form.Item>
        <Flex gap={12}>
          <Form.Item name="currency" label="Moneda" rules={[{ required: true }]} style={{ flex: 1 }}>
            <Select options={CURRENCY_OPTIONS} />
          </Form.Item>
          <Form.Item
            name="accountCode"
            label="Cuenta contable"
            style={{ flex: 1 }}
            tooltip="Cuenta del elemento 10 (101 Caja, 1041 Cuentas corrientes operativas)."
            rules={[
              { required: true, whitespace: true },
              { pattern: /^10\d*$/, message: "La cuenta contable debe empezar con 10" },
            ]}
          >
            <Input maxLength={20} />
          </Form.Item>
        </Flex>
        {type === "bank" && (
          <>
            <Form.Item name="bankName" label="Banco" rules={[{ required: true, whitespace: true }]}>
              <Input placeholder="BCP, BBVA, Interbank, Scotiabank…" maxLength={80} />
            </Form.Item>
            <Form.Item name="accountNumber" label="N° cuenta">
              <Input placeholder="191-0000000-0-00" maxLength={40} />
            </Form.Item>
          </>
        )}
        {account && (
          <Form.Item name="active" label="Activo" valuePropName="checked">
            <Switch />
          </Form.Item>
        )}
        <Flex justify="flex-end" gap={8} style={{ marginTop: 8 }}>
          <Button onClick={onClose}>Cancelar (Esc)</Button>
          <Button type="primary" htmlType="submit" loading={save.isPending}>
            Aceptar (F10)
          </Button>
        </Flex>
      </Form>
    </div>
  );
}
