"use client";

import { useEffect, useRef } from "react";
import { IdcardOutlined, LoadingOutlined, MailOutlined, PhoneOutlined, ShopOutlined, TagOutlined } from "@ant-design/icons";
import { Alert, App, Button, Drawer, Flex, Form, Input, InputNumber, Select, Typography } from "antd";

import { isValidRuc } from "@/modules/companies/domain/ruc";
import { ApiError } from "@/core/http/api-error";
import { identityLookupErrorMessage, useIdentityLookup } from "@/modules/identity/application/use-identity-lookup";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useCreateSupplier, useDocumentTypes, usePaymentTerms, useUpdateSupplier } from "../application/use-suppliers";
import type { Supplier, SupplierInput } from "../domain/supplier.types";

const BACKEND_FIELDS: Record<string, keyof SupplierInput> = {
  document_type: "documentType",
  document_number: "documentNumber",
  business_name: "businessName",
  trade_name: "tradeName",
  payment_term: "paymentTerm",
  credit_days: "creditDays",
};

interface SupplierFormDrawerProps {
  open: boolean;
  supplier?: Supplier | null;
  onClose: () => void;
  onSaved?: (supplier: Supplier) => void;
}

function isLookupReady(documentType: string | undefined, documentNumber: string | undefined): boolean {
  if (!documentNumber) return false;
  if (documentType === "6") return isValidRuc(documentNumber);
  if (documentType === "1") return /^\d{8}$/.test(documentNumber);
  return false;
}

export function SupplierFormDrawer({ open, supplier, onClose, onSaved }: SupplierFormDrawerProps) {
  const [form] = Form.useForm<SupplierInput>();
  const { message } = App.useApp();
  const { data: paymentTerms, isLoading: loadingTerms } = usePaymentTerms();
  const { data: documentTypes, isLoading: loadingDocs } = useDocumentTypes();
  const create = useCreateSupplier();
  const update = useUpdateSupplier();
  const lookup = useIdentityLookup();
  const lastLookedUp = useRef<string | null>(null);
  const isEdit = Boolean(supplier);
  const mutation = isEdit ? update : create;

  const documentType = Form.useWatch("documentType", form);
  const documentNumber = Form.useWatch("documentNumber", form);

  useEffect(() => {
    if (!open) return;
    lastLookedUp.current = supplier
      ? `${supplier.document_type}:${supplier.document_number}`
      : null;
    form.setFieldsValue(
      supplier
        ? {
            documentType: supplier.document_type,
            documentNumber: supplier.document_number,
            businessName: supplier.business_name,
            tradeName: supplier.trade_name ?? undefined,
            address: supplier.address ?? undefined,
            email: supplier.email ?? undefined,
            phone: supplier.phone ?? undefined,
            paymentTerm: supplier.payment_term,
            creditDays: supplier.credit_days,
          }
        : { documentType: "6", paymentTerm: "cash", creditDays: 0 },
    );
  }, [open, supplier, form]);

  useEffect(() => {
    if (!open || isEdit) return;
    if (documentType !== "1" && documentType !== "6") return;
    if (!isLookupReady(documentType, documentNumber)) return;

    const key = `${documentType}:${documentNumber}`;
    if (lastLookedUp.current === key) return;

    const timer = window.setTimeout(async () => {
      lastLookedUp.current = key;
      try {
        const result = await lookup.mutateAsync({
          documentType,
          documentNumber: documentNumber!,
        });
        if (form.getFieldValue("documentNumber") !== documentNumber) return;
        if (form.getFieldValue("documentType") !== documentType) return;
        form.setFieldsValue({
          businessName: result.business_name,
          address: result.address ?? undefined,
        });
        message.success(documentType === "6" ? "Datos cargados desde SUNAT" : "Datos cargados desde RENIEC");
      } catch (error) {
        if (lastLookedUp.current === key) lastLookedUp.current = null;
        message.error(identityLookupErrorMessage(error));
      }
    }, 350);

    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- lookup/message estables; evitar re-disparos
  }, [open, isEdit, documentType, documentNumber, form]);

  const close = () => {
    form.resetFields();
    create.reset();
    update.reset();
    lookup.reset();
    lastLookedUp.current = null;
    onClose();
  };

  const onFinish = (values: SupplierInput) => {
    const onSuccess = (saved: Supplier) => {
      message.success(isEdit ? "Proveedor actualizado" : `Proveedor ${saved.business_name} registrado`);
      onSaved?.(saved);
      close();
    };
    const onError = (error: unknown) => applyApiFieldErrors(form, error, BACKEND_FIELDS);

    if (supplier) update.mutate({ id: supplier.id, input: values }, { onSuccess, onError });
    else create.mutate(values, { onSuccess, onError });
  };

  const error = mutation.error instanceof ApiError ? mutation.error : null;
  const maxDigits = documentType === "1" ? 8 : 11;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={isEdit ? "Editar proveedor" : "Nuevo proveedor"}
      size={500}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={12}>
          <Button onClick={close}>Cancelar</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {isEdit ? "Guardar cambios" : "Registrar proveedor"}
          </Button>
        </Flex>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
        {isEdit
          ? "El tipo y número de documento identifican al proveedor y no se pueden modificar."
          : "Registra un proveedor para gestionar compras y cuentas por pagar."}
      </Typography.Paragraph>

      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Tipo de documento" name="documentType" rules={[{ required: true }]}>
          <Select
            loading={loadingDocs}
            options={documentTypes?.map((t) => ({ value: t.code, label: t.description }))}
            placeholder="Selecciona el tipo"
            disabled={isEdit}
            onChange={() => {
              lastLookedUp.current = null;
              form.setFieldValue("documentNumber", undefined);
            }}
          />
        </Form.Item>

        <Form.Item
          label="Número de documento"
          name="documentNumber"
          normalize={(value: string) => value?.replace(/\D/g, "").slice(0, maxDigits)}
          rules={[
            { required: true, message: "Ingresa el número" },
            {
              validator: (_, value: string) => {
                if (!value || documentType !== "6") return Promise.resolve();
                return isValidRuc(value) ? Promise.resolve() : Promise.reject(new Error("El RUC no es válido"));
              },
            },
          ]}
        >
          <Input
            prefix={<IdcardOutlined />}
            suffix={lookup.isPending ? <LoadingOutlined /> : undefined}
            placeholder={documentType === "1" ? "12345678" : "20123456789"}
            inputMode="numeric"
            disabled={isEdit}
          />
        </Form.Item>

        <Form.Item label="Razón social" name="businessName" rules={[{ required: true }]}>
          <Input prefix={<ShopOutlined />} placeholder="Proveedor S.A.C." maxLength={200} />
        </Form.Item>

        <Form.Item label="Nombre comercial" name="tradeName">
          <Input prefix={<TagOutlined />} placeholder="Opcional" maxLength={150} />
        </Form.Item>

        <Form.Item label="Dirección" name="address">
          <Input placeholder="Opcional" maxLength={250} />
        </Form.Item>

        <Form.Item label="Correo" name="email" rules={[{ type: "email", message: "Ingresa un correo válido" }]}>
          <Input prefix={<MailOutlined />} placeholder="Opcional" maxLength={100} />
        </Form.Item>

        <Form.Item label="Teléfono" name="phone">
          <Input prefix={<PhoneOutlined />} placeholder="Opcional" maxLength={20} />
        </Form.Item>

        <Form.Item label="Condición de pago" name="paymentTerm" rules={[{ required: true }]}>
          <Select loading={loadingTerms} options={paymentTerms} placeholder="Selecciona la condición" />
        </Form.Item>

        <Form.Item label="Días de crédito" name="creditDays" rules={[{ required: true }]}>
          <InputNumber min={0} max={365} placeholder="0" style={{ width: "100%" }} />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
