"use client";

import { useRef } from "react";
import Link from "next/link";
import { LockOutlined, MailOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { Alert, Button, Divider, Form, Input, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useRegisterCompany } from "../application/use-auth";
import type { RegisterCompanyInput } from "../domain/auth.types";
import { TENANT_ID_PATTERN, tenantIdFromCompanyName } from "../domain/tenant-id";

type RegisterFormValues = RegisterCompanyInput & { passwordConfirmation: string };

const BACKEND_FIELDS: Record<string, keyof RegisterFormValues> = {
  tenant_id: "tenantId",
  company_name: "companyName",
};

export function RegisterForm() {
  const [form] = Form.useForm<RegisterFormValues>();
  const register = useRegisterCompany();
  const tenantIdEdited = useRef(false);

  const onValuesChange = (changed: Partial<RegisterFormValues>) => {
    if ("tenantId" in changed) tenantIdEdited.current = true;
    if ("companyName" in changed && !tenantIdEdited.current) {
      form.setFieldValue("tenantId", tenantIdFromCompanyName(changed.companyName ?? ""));
    }
  };

  const onFinish = ({ companyName, tenantId, name, email, password }: RegisterFormValues) => {
    register.mutate(
      { companyName, tenantId, name, email, password },
      { onError: (error) => applyApiFieldErrors(form, error, BACKEND_FIELDS) },
    );
  };

  const error = register.error instanceof ApiError ? register.error : null;

  return (
    <>
      <Typography.Title level={2} style={{ marginBottom: 6, letterSpacing: "-0.03em", fontWeight: 800 }}>
        Crea tu empresa
      </Typography.Title>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 28, fontSize: 15 }}>
        Empieza gratis. Tendrás tu propio espacio de trabajo aislado en segundos.
      </Typography.Paragraph>

      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 20 }} />
      )}

      <Form
        form={form}
        layout="vertical"
        size="large"
        requiredMark={false}
        onFinish={onFinish}
        onValuesChange={onValuesChange}
      >
        <Form.Item label="Nombre de la empresa" name="companyName" rules={[{ required: true, message: "Ingresa el nombre" }]}>
          <Input prefix={<ShopOutlined />} placeholder="Mi Empresa S.A.C." autoComplete="organization" />
        </Form.Item>

        <Form.Item
          label="Identificador"
          name="tenantId"
          extra="Lo usarás para iniciar sesión. Solo minúsculas, números y guiones."
          normalize={(value: string) => value?.toLowerCase().replace(/\s+/g, "-")}
          rules={[
            { required: true, message: "Ingresa un identificador" },
            { pattern: TENANT_ID_PATTERN, message: "Entre 3 y 40 caracteres, iniciando con una letra" },
          ]}
        >
          <Input prefix={<Typography.Text type="secondary">contafy/</Typography.Text>} placeholder="mi-empresa" />
        </Form.Item>

        <Divider plain style={{ margin: "8px 0 20px" }}>
          <Typography.Text type="secondary" style={{ fontSize: 13 }}>Tu cuenta de administrador</Typography.Text>
        </Divider>

        <Form.Item label="Nombre completo" name="name" rules={[{ required: true, message: "Ingresa tu nombre" }]}>
          <Input prefix={<UserOutlined />} placeholder="Ana Pérez" autoComplete="name" />
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

        <Form.Item
          label="Contraseña"
          name="password"
          rules={[
            { required: true, message: "Ingresa una contraseña" },
            { min: 8, message: "Mínimo 8 caracteres" },
            { pattern: /(?=.*[a-zA-Z])(?=.*\d)/, message: "Debe incluir letras y números" },
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Mínimo 8 caracteres" autoComplete="new-password" />
        </Form.Item>

        <Form.Item
          label="Confirmar contraseña"
          name="passwordConfirmation"
          dependencies={["password"]}
          rules={[
            { required: true, message: "Confirma tu contraseña" },
            ({ getFieldValue }) => ({
              validator: (_, value) =>
                !value || getFieldValue("password") === value
                  ? Promise.resolve()
                  : Promise.reject(new Error("Las contraseñas no coinciden")),
            }),
          ]}
        >
          <Input.Password prefix={<LockOutlined />} placeholder="Repite tu contraseña" autoComplete="new-password" />
        </Form.Item>

        <Button type="primary" htmlType="submit" block loading={register.isPending} style={{ marginTop: 8 }}>
          Crear empresa
        </Button>
      </Form>

      <Typography.Paragraph type="secondary" style={{ marginTop: 28, textAlign: "center" }}>
        ¿Ya tienes cuenta? <Link href="/login" style={{ color: "var(--cf-purple-600)", fontWeight: 600 }}>Inicia sesión</Link>
      </Typography.Paragraph>
    </>
  );
}
