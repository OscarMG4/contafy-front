"use client";

import { useState } from "react";
import { CheckCircleFilled, LockOutlined, PlusOutlined, UnlockOutlined } from "@ant-design/icons";
import { App, Button, Card, DatePicker, Empty, Flex, Modal, Tag, Typography, type TableProps } from "antd";
import dayjs, { type Dayjs } from "dayjs";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { DataTable } from "@/shared/ui/data-table";
import { PageHeader } from "@/shared/ui/page-header";

import { useClosedPeriods, useClosePeriod, useReopenPeriod } from "../application/use-periods";
import type { ClosedPeriod } from "../domain/period.types";

const WRITE_ROLES = new Set(["owner", "admin"]);

export function PeriodsView() {
  const { message, modal } = App.useApp();
  const { data: user } = useCurrentUser();
  const { company } = useActiveCompany();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<Dayjs | null>(null);
  const { data, isFetching } = useClosedPeriods();
  const close = useClosePeriod();
  const reopen = useReopenPeriod();
  const canWrite = WRITE_ROLES.has(user?.role ?? "");

  const handleClose = () => {
    if (!selectedPeriod) return;
    const period = selectedPeriod.format("YYYY-MM");

    modal.confirm({
      title: `¿Cerrar el periodo ${selectedPeriod.format("MMMM YYYY")}?`,
      content:
        "Una vez cerrado, no se podrán registrar operaciones en este periodo hasta que lo reabras. Esta acción es reversible.",
      okText: "Cerrar periodo",
      okButtonProps: { danger: true },
      cancelText: "Cancelar",
      onOk: () => {
        close.mutate(period, {
          onSuccess: () => {
            message.success(`Periodo ${selectedPeriod.format("MMMM YYYY")} cerrado`);
            setIsModalOpen(false);
            setSelectedPeriod(null);
          },
          onError: (error) => message.error(error.message),
        });
      },
    });
  };

  const handleReopen = (period: string) => {
    const displayPeriod = dayjs(period, "YYYY-MM").format("MMMM YYYY");

    modal.confirm({
      title: `¿Reabrir el periodo ${displayPeriod}?`,
      content: "Se permitirán nuevamente operaciones en este periodo.",
      okText: "Reabrir periodo",
      cancelText: "Cancelar",
      onOk: () => {
        reopen.mutate(period, {
          onSuccess: () => message.success(`Periodo ${displayPeriod} reabierto`),
          onError: (error) => message.error(error.message),
        });
      },
    });
  };

  const columns: TableProps<ClosedPeriod>["columns"] = [
    {
      title: "Periodo",
      dataIndex: "period",
      render: (period: string) => {
        const date = dayjs(period, "YYYY-MM");
        return <Typography.Text strong>{date.format("MMMM YYYY")}</Typography.Text>;
      },
    },
    {
      title: "Estado",
      key: "status",
      width: 120,
      render: () => (
        <Tag color="error" icon={<CheckCircleFilled />} variant="filled">
          Cerrado
        </Tag>
      ),
    },
    {
      title: "Cerrado por (usuario)",
      dataIndex: "closed_by_user_id",
      responsive: ["md"],
      render: (id: number | null) => id ?? "—",
    },
    {
      title: "Fecha de cierre",
      dataIndex: "closed_at",
      responsive: ["md"],
      render: (date: string) => dayjs(date).format("DD/MM/YYYY HH:mm"),
    },
    {
      key: "actions",
      width: 140,
      align: "right",
      render: (_, record) =>
        canWrite ? (
          <Button type="default" size="small" icon={<UnlockOutlined />} onClick={() => handleReopen(record.period)}>
            Reabrir
          </Button>
        ) : null,
    },
  ];

  if (!company) {
    return (
      <>
        <PageHeader eyebrow="Contabilidad" title="Cierre de periodos" subtitle="Gestiona periodos contables" />
        <Card variant="borderless">
          <Empty description="Selecciona un cliente para gestionar periodos contables" />
        </Card>
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Contabilidad"
        title="Cierre de periodos"
        subtitle="Cierra periodos contables para evitar modificaciones posteriores."
      />

      <DataTable<ClosedPeriod>
        action={
          canWrite && (
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
              Cerrar periodo
            </Button>
          )
        }
        rowKey="period"
        columns={columns}
        dataSource={data}
        loading={isFetching}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description="No hay periodos cerrados"
              style={{ paddingBlock: 24 }}
            >
              {canWrite && (
                <Button type="primary" icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>
                  Cerrar el primer periodo
                </Button>
              )}
            </Empty>
          ),
        }}
        pagination={false}
      />

      <Modal
        open={isModalOpen}
        title="Cerrar periodo contable"
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedPeriod(null);
        }}
        footer={
          <Flex justify="flex-end" gap={12}>
            <Button
              onClick={() => {
                setIsModalOpen(false);
                setSelectedPeriod(null);
              }}
            >
              Cancelar
            </Button>
            <Button
              type="primary"
              icon={<LockOutlined />}
              onClick={handleClose}
              disabled={!selectedPeriod}
              loading={close.isPending}
            >
              Cerrar periodo
            </Button>
          </Flex>
        }
      >
        <Flex vertical gap={16}>
          <Typography.Paragraph type="secondary">
            Selecciona el periodo que deseas cerrar. Una vez cerrado, no se podrán registrar operaciones en este periodo
            hasta que lo reabras.
          </Typography.Paragraph>

          <div>
            <Typography.Text strong style={{ display: "block", marginBottom: 8 }}>
              Periodo a cerrar
            </Typography.Text>
            <DatePicker
              picker="month"
              value={selectedPeriod}
              onChange={setSelectedPeriod}
              format="MMMM YYYY"
              style={{ width: "100%" }}
              placeholder="Selecciona un periodo"
            />
          </div>
        </Flex>
      </Modal>
    </>
  );
}
