"use client";

import { CreditCardOutlined, DownloadOutlined, FallOutlined, PlusOutlined, ReloadOutlined, RiseOutlined, WalletOutlined } from "@ant-design/icons";
import { Button, Card, Col, Empty, Row, Skeleton } from "antd";
import { useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";

import { useCurrentUser } from "@/modules/auth/application/use-auth";
import { useActiveCompany } from "@/modules/companies/application/active-company";
import { PageHeader } from "@/shared/ui/page-header";

import { useDashboardSummary, useRefreshDashboardSummary } from "../application/use-dashboard-summary";
import type { KpiKey } from "../domain/dashboard.types";
import { CashflowCard } from "./cashflow-card";
import { FinancialSummaryCard } from "./financial-summary-card";
import { KpiCard } from "./kpi-card";
import { OnboardingCard } from "./onboarding-card";
import { RecentEntriesCard } from "./recent-entries-card";
import styles from "./dashboard-view.module.css";

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
  const router = useRouter();
  const { data: user } = useCurrentUser();
  const { company, isLoading: loadingCompany } = useActiveCompany();
  const { data, isLoading } = useDashboardSummary();
  const refreshSummary = useRefreshDashboardSummary();
  const [refreshing, setRefreshing] = useState(false);
  const firstName = user?.name.split(" ")[0];
  const waiting = loadingCompany || (Boolean(company) && isLoading);
  const noCompany = !loadingCompany && !company;

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshSummary();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Panel del estudio"
        title={`${greeting()}${firstName ? `, ${firstName}` : ""}`}
        subtitle={
          company
            ? `Resumen financiero de ${company.trade_name || company.business_name}.`
            : "Registra un cliente para ver su resumen financiero."
        }
        actions={
          <>
            <Button
              icon={<ReloadOutlined />}
              loading={refreshing}
              disabled={!company}
              onClick={() => void onRefresh()}
            >
              Actualizar
            </Button>
            <Button icon={<DownloadOutlined />} disabled={!data?.hasFinancialActivity}>
              Exportar
            </Button>
            <Button type="primary" icon={<PlusOutlined />} disabled={!company}>
              Nuevo asiento
            </Button>
          </>
        }
      />

      {noCompany ? (
        <Card variant="borderless" styles={{ body: { padding: "40px 28px" } }}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description="El resumen financiero se calcula por cliente."
            style={{ marginBlock: 0 }}
          >
            <Button type="primary" onClick={() => router.push("/companies")} style={{ marginTop: 8 }}>
              Ir a clientes
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[24, 24]}>
          {waiting || !data
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
                    index={index}
                  />
                </Col>
              ))}

          <Col xs={24} xl={16} className={styles.section} style={{ ["--cf-stagger" as string]: "4" }}>
            {data ? (
              <CashflowCard data={data.cashflow} hasActivity={data.hasFinancialActivity} />
            ) : (
              <Card variant="borderless">
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            )}
          </Col>
          <Col xs={24} xl={8} className={styles.section} style={{ ["--cf-stagger" as string]: "5" }}>
            {data ? (
              <OnboardingCard steps={data.onboarding} />
            ) : (
              <Card variant="borderless">
                <Skeleton active paragraph={{ rows: 6 }} />
              </Card>
            )}
          </Col>

          <Col span={24} className={styles.section} style={{ ["--cf-stagger" as string]: "6" }}>
            <FinancialSummaryCard
              kpis={data?.kpis ?? []}
              exchangeRate={data?.exchangeRate ?? null}
              hasActivity={data?.hasFinancialActivity ?? false}
              loading={waiting}
            />
          </Col>

          <Col span={24} className={styles.section} style={{ ["--cf-stagger" as string]: "7" }}>
            <RecentEntriesCard data={data?.recentEntries ?? []} loading={waiting} />
          </Col>
        </Row>
      )}
    </>
  );
}
