"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { LockOutlined, MailOutlined, ShopOutlined } from "@ant-design/icons";
import { Alert, Button, Form, Input, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useLogin } from "../application/use-auth";
import type { LoginInput } from "../domain/auth.types";
import { TENANT_ID_PATTERN } from "../domain/tenant-id";

const LAST_TENANT_KEY = "contafy_last_tenant";

export function LoginForm() {
  const [form] = Form.useForm<LoginInput>();
  const login = useLogin();
  const searchParams = useSearchParams();
  const sessionExpired = searchParams.get("expired") === "1";

  useEffect(() => {
    const lastTenant = localStorage.getItem(LAST_TENANT_KEY);
    if (lastTenant) form.setFieldValue("tenantId", lastTenant);
  }, [form]);

  const onFinish = (values: LoginInput) => {
    localStorage.setItem(LAST_TENANT_KEY, values.tenantId);
    login.mutate(values, { onError: (error) => applyApiFieldErrors(form, error) });
  };

  const error = login.error instanceof ApiError ? login.error : null;

  return (
    <>
      <Typography.Title level={2} style={{ marginBottom: 6, letterSpacing: "-0.03em", fontWeight: 800 }}>
        Bienvenido de nuevo
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 32, fontSize: 15 }}>
        Ingresa a tu espacio de trabajo para continuar.
      </Typography.Paragraph>

      {sessionExpired && !error && (
        <Alert type="warning" showIcon title="Tu sesión expiró. Vuelve a iniciar sesión." style={{ marginBottom: 20 }} />
      )}
      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 20 }} />
      )}

      <Form form={form} layout="vertical" size="large" requiredMark={false} onFinish={onFinish}>
        <Form.Item
          label="Empresa"
          name="tenantId"
          normalize={(value: string) => value?.toLowerCase().trim()}
          rules={[
            { required: true, message: "Ingresa el identificador de tu empresa" },
            { pattern: TENANT_ID_PATTERN, message: "Identificador no válido" },
          ]}
        >
          <Input prefix={<ShopOutlined />} placeholder="mi-empresa" autoComplete="organization" />
        </Form.Item>

        <Form.Item
          label="Correo electrónico"
          name="email"
          rules={[
            { required: true, message: "Ingresa tu correo" },
            { type: "email", message: "Correo no válido" },
          ]}
        >
          <Input prefix={<MailOutlined />} placeholder="tu@empresa.com" autoComplete="email" />
        </Form.Item>

        <Form.Item label="Contraseña" name="password" rules={[{ required: true, message: "Ingresa tu contraseña" }]}>
          <Input.Password prefix={<LockOutlined />} placeholder="••••••••" autoComplete="current-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={login.isPending} style={{ marginTop: 8 }}>
          Iniciar sesión
        </Button>
      </Form>

      <Typography.Paragraph type="secondary" style={{ marginTop: 28, textAlign: "center" }}>
        ¿Aún no tienes cuenta? <Link href="/register" style={{ color: "var(--cf-purple-600)", fontWeight: 600 }}>Registra tu empresa</Link>
      </Typography.Paragraph>
    </>
  );
}
