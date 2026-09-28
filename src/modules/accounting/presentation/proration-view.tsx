"use client";

import { useEffect, useState } from "react";
import { SaveOutlined } from "@ant-design/icons";
import { App, Button, Card, DatePicker, Empty, Flex, Form, InputNumber, Spin, Typography } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { PageHeader } from "@/shared/ui/page-header";

import { useProration, useUpdateProration } from "../application/use-proration";
import type { ProrationInput } from "../domain/proration.types";

const WRITE_ROLES = new Set(["owner", "admin"]);

export function ProrationView() {
  const { message } = App.useApp();
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [form] = Form.useForm<ProrationInput>();
  const [selectedPeriod, setSelectedPeriod] = useState<Dayjs>(dayjs());
  const period = selectedPeriod.format("YYYY-MM");
  const { data, isLoading } = useProration(period);
  const update = useUpdateProration();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  useEffect(() => {
    if (data) {
      form.setFieldsValue({ percentage: data.percentage });
    }
  }, [data, form]);

  const onFinish = (values: ProrationInput) => {
    update.mutate(
      { period, input: values },
      {
        onSuccess: () => message.success("Prorrata actualizada"),
        onError: (error) => message.error(error.message),
      },
    );
  };

  if (!company) {
    return (
      <>
        <PageHeader eyebrow="Contabilidad" title="Prorrata IGV" subtitle="Gestiona prorrata IGV" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para gestionar prorrata IGV" />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Contabilidad"
        title="Prorrata IGV"
        subtitle="Coeficiente de prorrata mensual del IGV según SUNAT."
      />

      <Card variant="borderless">
        <Flex vertical gap={24}>
          <div>
            <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
              Periodo
            </Typography.Text>
            <DatePicker
              picker="month"
              value={selectedPeriod}
              onChange={(date) => date && setSelectedPeriod(date)}
              format="MMMM YYYY"
              style={{ width: 200 }}
            />
          </div>

          {isLoading ? (
            <Flex justify="center" style={{ paddingBlock: 40 }}>
              <Spin />
            </Flex>
          ) : (
            <Form form={form} layout="vertical" onFinish={onFinish} disabled={!canWrite}>
              <Form.Item
                label="Porcentaje de prorrata"
                name="percentage"
                rules={[{ required: true }]}
              >
                <InputNumber
                  min={0}
                  max={100}
                  precision={2}
                  placeholder="0.00"
                  style={{ width: 200 }}
                  suffix="%"
                />
              </Form.Item>

              {canWrite && (
                <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={update.isPending}>
                  Guardar prorrata
                </Button>
              )}
            </Form>
          )}

          <Typography.Paragraph type="secondary" style={{ marginTop: 16 }}>
            El coeficiente de prorrata del IGV se aplica cuando el cliente realiza operaciones gravadas y no gravadas.
            Según la normativa tributaria, permite determinar la proporción del crédito fiscal que corresponde a las
            operaciones gravadas.
          </Typography.Paragraph>
        </Flex>
      </Card>
    </>
  );
}
