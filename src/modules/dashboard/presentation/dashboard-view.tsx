"use client";

import type { ReactNode } from "react";
import { DownloadOutlined, FallOutlined, PlusOutlined, RiseOutlined, WalletOutlined, CreditCardOutlined } from "@ant-design/icons";
import { Button, Card, Col, Row, Skeleton } from "antd";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { PageHeader } from "@/shared/ui/page-header";

import { useDashboardSummary } from "../application/use-dashboard-summary";
import type { KpiKey } from "../domain/dashboard.types";
import { CashflowCard } from "./cashflow-card";
import { KpiCard } from "./kpi-card";
import { OnboardingCard } from "./onboarding-card";
import { RecentEntriesCard } from "./recent-entries-card";

const KPI_ICONS: Record<KpiKey, ReactNode> = {
  income: <RiseOutlined />,
  expenses: <FallOutlined />,
  receivables: <WalletOutlined />,
  payables: <CreditCardOutlined />,
};

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function DashboardView() {
  const { data: user } = useCurrentUser();
  const { data, isLoading } = useDashboardSummary();
  const firstName = user?.name.split(" ")[0];

  return (
    <>
      <PageHeader
        title={`${greeting()}${firstName ? `, ${firstName}` : ""} 👋`}
        subtitle="Este es el resumen financiero de tu empresa."
        actions={
          <>
            <Button icon={<DownloadOutlined />}>Exportar</Button>
            <Button type="primary" icon={<PlusOutlined />}>
              Nuevo asiento
            </Button>
          </>
        }
      />

      <Row gutter={[20, 20]}>
        {isLoading || !data
          ? Array.from({ length: 4 }).map((_, index) => (
              <Col key={index} xs={24} sm={12} xl={6}>
                <Card variant="borderless">
                  <Skeleton active paragraph={{ rows: 2 }} />
                </Card>
              </Col>
            ))
          : data.kpis.map((kpi, index) => (
              <Col key={kpi.key} xs={24} sm={12} xl={6}>
                <KpiCard
                  kpi={kpi}
                  icon={KPI_ICONS[kpi.key]}
                  inverse={kpi.key === "expenses" || kpi.key === "payables"}
                  highlighted={index === 0}
                />
              </Col>
            ))}

        <Col xs={24} xl={16}>
          {data ? <CashflowCard data={data.cashflow} /> : <Card variant="borderless"><Skeleton active paragraph={{ rows: 8 }} /></Card>}
        </Col>
        <Col xs={24} xl={8}>
          <OnboardingCard />
        </Col>

        <Col span={24}>
          <RecentEntriesCard data={data?.recentEntries ?? []} loading={isLoading} />
        </Col>
      </Row>
    </>
  );
}
