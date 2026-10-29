"use client";

import { useEffect } from "react";
import { Alert, App, Button, DatePicker, Drawer, Flex, Form, Input, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { ApiError } from "@/core/http/api-error";
import { applyApiFieldErrors } from "@/shared/lib/form-errors";

import { useCreateExpenseSheet, useUpdateExpenseSheet } from "../application/use-expense-sheets";
import type { ExpenseSheet } from "../domain/expense-sheet.types";

interface ExpenseSheetFormValues {
  issueDate: Dayjs;
  responsible: string;
  concept: string;
  description?: string | null;
}

const BACKEND_FIELDS: Record<string, keyof ExpenseSheetFormValues> = {
  issue_date: "issueDate",
  responsible: "responsible",
  concept: "concept",
  description: "description",
};

interface ExpenseSheetFormDrawerProps {
  open: boolean;
  sheet?: ExpenseSheet | null;
  onClose: () => void;
  onSaved?: (sheet: ExpenseSheet) => void;
}

export function ExpenseSheetFormDrawer({ open, sheet, onClose, onSaved }: ExpenseSheetFormDrawerProps) {
  const [form] = Form.useForm<ExpenseSheetFormValues>();
  const { message } = App.useApp();
  const create = useCreateExpenseSheet();
  const update = useUpdateExpenseSheet();
  const isEdit = Boolean(sheet);
  const mutation = isEdit ? update : create;

  useEffect(() => {
    if (!open) return;
    if (sheet) {
      form.setFieldsValue({
        issueDate: dayjs(sheet.issue_date, "YYYY-MM-DD"),
        responsible: sheet.responsible,
        concept: sheet.concept,
        description: sheet.description,
      });
    } else {
      form.setFieldsValue({ issueDate: dayjs() });
    }
  }, [open, sheet, form]);

  const close = () => {
    form.resetFields();
    create.reset();
    update.reset();
    onClose();
  };

  const onFinish = (values: ExpenseSheetFormValues) => {
    const input = {
      issueDate: values.issueDate.format("YYYY-MM-DD"),
      responsible: values.responsible,
      concept: values.concept,
      description: values.description?.trim() || null,
    };
    const onSuccess = (saved: ExpenseSheet) => {
      message.success(isEdit ? "Planilla de gasto actualizada" : `Planilla de gasto N° ${saved.number} registrada`);
      onSaved?.(saved);
      close();
    };
    const onError = (error: unknown) => applyApiFieldErrors(form, error, BACKEND_FIELDS);

    if (sheet) update.mutate({ id: sheet.id, input }, { onSuccess, onError });
    else create.mutate(input, { onSuccess, onError });
  };

  const error = mutation.error instanceof ApiError ? mutation.error : null;

  return (
    <Drawer
      open={open}
      onClose={close}
      title={isEdit ? `Editar planilla N° ${sheet?.number}` : "Nueva planilla de gasto"}
      size={520}
      destroyOnHidden
      footer={
        <Flex justify="flex-end" gap={12}>
          <Button onClick={close}>Cancelar</Button>
          <Button type="primary" loading={mutation.isPending} onClick={() => form.submit()}>
            {isEdit ? "Guardar cambios" : "Registrar"}
          </Button>
        </Flex>
      }
    >
      <Typography.Paragraph type="secondary" style={{ marginTop: -4 }}>
        Agrupa los gastos que rinde un responsable (caja chica, viáticos, entregas a rendir).
        {!isEdit && " El número se asigna automáticamente."}
      </Typography.Paragraph>

      {error && !Object.keys(error.fieldErrors).length && (
        <Alert type="error" showIcon title={error.message} style={{ marginBottom: 16 }} />
      )}

      <Form form={form} layout="vertical" onFinish={onFinish} requiredMark="optional">
        <Form.Item label="Fecha de emisión" name="issueDate" rules={[{ required: true, message: "Selecciona la fecha" }]}>
          <DatePicker format="DD/MM/YYYY" style={{ width: "100%" }} />
        </Form.Item>

        <Form.Item
          label="Responsable"
          name="responsible"
          rules={[{ required: true, whitespace: true, message: "Ingresa el responsable" }]}
        >
          <Input placeholder="Ej. Luis Ramos" maxLength={150} />
        </Form.Item>

        <Form.Item label="Concepto" name="concept" rules={[{ required: true, whitespace: true, message: "Ingresa el concepto" }]}>
          <Input placeholder="Ej. Caja chica octubre" maxLength={150} />
        </Form.Item>

        <Form.Item label="Descripción" name="description">
          <Input.TextArea rows={4} maxLength={2000} showCount placeholder="Detalle adicional (opcional)" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
