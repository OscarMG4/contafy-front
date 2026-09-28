"use client";

import { useEffect } from "react";
import { TagOutlined } from "@ant-design/icons";
import { Alert, App, Button, Drawer, Flex, Form, Input, Select, Typography } from "antd";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import {
  useCreateProduct,
  useExistenceTypes,
  useOperationTypes,
  useUnitsOfMeasure,
  useUpdateProduct,
} from "../application/use-products";
import type { Product, ProductInput } from "../domain/product.types";

const BACKEND_FIELDS: Record<string, keyof ProductInput> = {
  description: "description",
  unit_of_measure: "unitOfMeasure",
  existence_type: "existenceType",
  default_operation_type: "defaultOperationType",
};

interface ProductFormDrawerProps {
  open: boolean;
  product?: Product | null;
  onClose: () => void;
  onSaved?: (product: Product) => void;
}

export function ProductFormDrawer({ open, product, onClose, onSaved }: ProductFormDrawerProps) {
  const [form] = Form.useForm<ProductInput>();
  const { message } = App.useApp();
  const { data: operationTypes, isLoading: loadingOps } = useOperationTypes();
  const { data: unitsOfMeasure, isLoading: loadingUnits } = useUnitsOfMeasure();
  const { data: existenceTypes, isLoading: loadingExistence } = useExistenceTypes();
  const create = useCreateProduct();
  const update = useUpdateProduct();
  const isEdit = Boolean(product);
  const mutation = isEdit ? update : create;

  useEffect(() => {
    if (!open) return;
    form.setFieldsValue(
      product
        ? {
            description: product.description,
            unitOfMeasure: product.unit_of_measure,
            existenceType: product.existence_type,
            defaultOperationType: product.default_operation_type,
          }
        : {},
    );
  }, [open, product, form]);

  const close = () => {
    form.resetFields();
    create.reset();
    update.reset();
    onClose();
  };

  const onFinish = (values: ProductInput) => {
    const onSuccess = (saved: Product) => {
      message.success(isEdit ? "Artículo actualizado" : `Artículo ${saved.description} registrado`);
      onSaved?.(saved);
      close();
    };
    const onError = (error: unknown) => applyApiFieldErrors(form, error, BACKEND_FIELDS);

    if (product) update.mutate({ id: product.id, input: values }, { onSuccess, onError });
    else create.mutate(values, { onSuccess, onError });
  };

  const error = mutation.error instanceof ApiError ? mutation.error : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={isEdit ? "Editar artículo" : "Nuevo artículo"}
      size={500}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={12}>
          <Button onClick={close}>Cancelar</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {isEdit ? "Guardar cambios" : "Registrar artículo"}
          </Button>
        </Flex>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
        {isEdit ? "Actualiza la información del artículo." : "Registra un nuevo artículo para gestionar inventarios."}
      </Typography.Paragraph>

      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Form.Item label="Descripción" name="description" rules={[{ required: true }]}>
          <Input prefix={<TagOutlined />} placeholder="Laptop HP Pavilion" maxLength={250} />
        </Form.Item>

        <Form.Item label="Unidad de medida" name="unitOfMeasure" rules={[{ required: true }]}>
          <Select
            showSearch
            loading={loadingUnits}
            options={unitsOfMeasure?.map((u) => ({ value: u.code, label: `${u.code} - ${u.description}` }))}
            placeholder="Selecciona la unidad"
            filterOption={(input, option) =>
              (option?.label?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item label="Tipo de existencia" name="existenceType" rules={[{ required: true }]}>
          <Select
            showSearch
            loading={loadingExistence}
            options={existenceTypes?.map((e) => ({ value: e.code, label: `${e.code} - ${e.description}` }))}
            placeholder="Selecciona el tipo"
            filterOption={(input, option) =>
              (option?.label?.toString() ?? "").toLowerCase().includes(input.toLowerCase())
            }
          />
        </Form.Item>

        <Form.Item
          label="Tipo de operación por defecto"
          name="defaultOperationType"
          rules={[{ required: true }]}
        >
          <Select loading={loadingOps} options={operationTypes} placeholder="Selecciona el tipo de operación" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
