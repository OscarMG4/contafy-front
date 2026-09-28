"use client";

import { useEffect, useRef } from "react";
import { EnvironmentOutlined, IdcardOutlined, LoadingOutlined, ShopOutlined, TagOutlined } from "@ant-design/icons";
import { Alert, App, Button, Drawer, Flex, Form, Input, Select, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { identityLookupErrorMessage, useIdentityLookup } from "@/modules/identity/application/use-identity-lookup";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useCreateCompany, useTaxRegimes, useUpdateCompany } from "../application/use-companies";
import type { Company, CompanyInput } from "../domain/company.types";
import { isValidRuc } from "../domain/ruc";

const BACKEND_FIELDS: Record<string, keyof CompanyInput> = {
  business_name: "businessName",
  trade_name: "tradeName",
  tax_regime: "taxRegime",
};

interface CompanyFormDrawerProps {
  open: boolean;
  company?: Company | null;
  onClose: () => void;
  onSaved?: (company: Company) => void;
}

export function CompanyFormDrawer({ open, company, onClose, onSaved }: CompanyFormDrawerProps) {
  const [form] = Form.useForm<CompanyInput>();
  const { message } = App.useApp();
  const { data: taxRegimes, isLoading: loadingRegimes } = useTaxRegimes();
  const create = useCreateCompany();
  const update = useUpdateCompany();
  const lookup = useIdentityLookup();
  const lastLookedUp = useRef<string | null>(null);
  const isEdit = Boolean(company);
  const mutation = isEdit ? update : create;
  const ruc = Form.useWatch("ruc", form);

  useEffect(() => {
    if (!open) return;
    lastLookedUp.current = company?.ruc ?? null;
    form.setFieldsValue(
      company
        ? {
            ruc: company.ruc,
            businessName: company.business_name,
            tradeName: company.trade_name ?? undefined,
            address: company.address ?? undefined,
            taxRegime: company.tax_regime,
          }
        : { taxRegime: "general" },
    );
  }, [open, company, form]);

  useEffect(() => {
    if (!open || isEdit || !ruc || !isValidRuc(ruc) || lastLookedUp.current === ruc) return;

    const timer = window.setTimeout(async () => {
      lastLookedUp.current = ruc;
      try {
        const result = await lookup.mutateAsync({ documentType: "6", documentNumber: ruc });
        if (form.getFieldValue("ruc") !== ruc) return;
        form.setFieldsValue({
          businessName: result.business_name,
          address: result.address ?? undefined,
        });
        message.success("Datos cargados desde SUNAT");
      } catch (error) {
        if (lastLookedUp.current === ruc) lastLookedUp.current = null;
        message.error(identityLookupErrorMessage(error));
      }
    }, 350);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lookup/message estables; evitar re-disparos
  }, [open, isEdit, ruc, form]);

  const close = () => {
    form.resetFields();
    create.reset();
    update.reset();
    lookup.reset();
    lastLookedUp.current = null;
    onClose();
  };

  const onFinish = (values: CompanyInput) => {
    const onSuccess = (saved: Company) => {
      message.success(isEdit ? "Empresa actualizada" : `Empresa ${saved.business_name} registrada`);
      onSaved?.(saved);
      close();
    };
    const onError = (error: unknown) => applyApiFieldErrors(form, error, BACKEND_FIELDS);

    if (company) update.mutate({ id: company.id, input: values }, { onSuccess, onError });
    else create.mutate(values, { onSuccess, onError });
  };

  const error = mutation.error instanceof ApiError ? mutation.error : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={isEdit ? "Editar empresa" : "Nueva empresa"}
      size={500}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={12}>
          <Button onClick={close}>Cancelar</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {isEdit ? "Guardar cambios" : "Registrar empresa"}
          </Button>
        </Flex>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
        {isEdit
          ? "El RUC identifica a la empresa y no se puede modificar."
          : "Registra una empresa a la que el estudio le lleva la contabilidad."}
      </Typography.Paragraph>

      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item
          label="RUC"
          name="ruc"
          normalize={(value: string) => value?.replace(/\D/g, "").slice(0, 11)}
          rules={[
            { required: true, message: "Ingresa el RUC" },
            {
              validator: (_, value: string) =>
                !value || isValidRuc(value) ? Promise.resolve() : Promise.reject(new Error("El RUC no es válido")),
            },
          ]}
        >
          <Input
            prefix={<IdcardOutlined />}
            suffix={lookup.isPending ? <LoadingOutlined /> : undefined}
            placeholder="20123456789"
            inputMode="numeric"
            disabled={isEdit}
          />
        </Form.Item>

        <Form.Item label="Razón social" name="businessName" rules={[{ required: true }]}>
          <Input prefix={<ShopOutlined />} placeholder="Comercial Andina S.A.C." maxLength={200} />
        </Form.Item>

        <Form.Item label="Nombre comercial" name="tradeName">
          <Input prefix={<TagOutlined />} placeholder="Opcional" maxLength={150} />
        </Form.Item>

        <Form.Item label="Dirección fiscal" name="address">
          <Input prefix={<EnvironmentOutlined />} placeholder="Opcional" maxLength={250} />
        </Form.Item>

        <Form.Item label="Régimen tributario" name="taxRegime" rules={[{ required: true }]}>
          <Select loading={loadingRegimes} options={taxRegimes} placeholder="Selecciona el régimen" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
