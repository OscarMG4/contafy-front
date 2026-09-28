"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LockOutlined, MailOutlined, ShopOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, List, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useLogin } from "../application/use-auth";
import type { LoginInput, Tenant } from "../domain/auth.types";
import { isTenantSelection } from "../domain/auth.types";

type LoginFormValues = { email: string; password: string };

export function LoginForm() {
  const [form] = Form.useForm<LoginFormValues>();
  const login = useLogin();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";
  const [tenants, setTenants] = useState<Tenant[] | null>(null);
  const [pendingCreds, setPendingCreds] = useState<LoginFormValues | null>(null);

  const error = login.error instanceof ApiError ? login.error : null;

  const submit = (values: LoginFormValues, tenantId?: string) => {
    const input: LoginInput = { ...values, tenantId };
    login.mutate(input, {
      onSuccess: (result) => {
        if (isTenantSelection(result)) {
          setPendingCreds(values);
          setTenants(result.tenants);
          return;
        }
        setTenants(null);
        setPendingCreds(null);
      },
      onError: (err) => applyApiFieldErrors(form, err),
    });
  };

  const onFinish = (values: LoginFormValues) => {
    setTenants(null);
    submit(values);
  };

  const chooseTenant = (tenantId: string) => {
    if (!pendingCreds) return;
    submit(pendingCreds, tenantId);
  };

  if (tenants && tenants.length > 0) {
    return (
      <>
        <Typography.Title
          level={2}
          style={{
            marginBottom: 8,
            fontFamily: "var(--font-display), Georgia, serif",
            fontWeight: 600,
            letterSpacing: "-0.03em",
            fontSize: 28,
          }}
        >
          Elige tu estudio
        </Typography.Title>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 24 }}>
          Tu correo está en más de un estudio. Selecciona a cuál quieres entrar.
        </Typography.Paragraph>

        <List
          bordered
          dataSource={tenants}
          renderItem={(tenant) => (
            <List.Item
              actions={[
                <Button
                  key="enter"
                  type="primary"
                  loading={login.isPending}
                  onClick={() => chooseTenant(tenant.id)}
                >
                  Entrar
                </Button>,
              ]}
            >
              <List.Item.Meta
                avatar={<ShopOutlined style={{ fontSize: 20 }} />}
                title={tenant.name}
                description={tenant.plan}
              />
            </List.Item>
          )}
        />

        <Button type="link" block style={{ marginTop: 16 }} onClick={() => { setTenants(null); setPendingCreds(null); }}>
          Volver
        </Button>
      </>
    );
  }

  return (
    <>
      <Typography.Text
        type="secondary"
        style={{ display: "block", marginBottom: 8, fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase" }}
      >
        Acceso al estudio
      </Typography.Text>
      <Typography.Title
        level={2}
        style={{
          marginBottom: 8,
          fontFamily: "var(--font-display), Georgia, serif",
          fontWeight: 600,
          letterSpacing: "-0.03em",
          fontSize: 32,
        }}
      >
        Entra a Contafy
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 28, fontSize: 15, lineHeight: 1.55 }}>
        Usa el correo de tu cuenta. El estudio se resuelve automáticamente.
      </Typography.Paragraph>

      {sessionExpired && !error && (
        <Alert type="warning" showIcon title="Tu sesión expiró. Vuelve a iniciar sesión." style={{ marginBottom: 20 }} />
      )}
      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 20 }} />
      )}

      <Form form={form} layout="vertical" size="large" onFinish={onFinish}>
        <Form.Item
          label="Correo"
          name="email"
          rules={[
            { required: true },
            { type: "email", message: "Correo no válido" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="tu@estudio.com" autoComplete="email" />
        </Form.Item>

        <Form.Item label="Contraseña" name="password" rules={[{ required: true }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={login.isPending} style={{ marginTop: 8, height: 46 }}>
          Continuar
        </Button>
      </Form>
    </>
  );
}
