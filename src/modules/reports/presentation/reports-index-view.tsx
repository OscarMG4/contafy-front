"use client";

import Link from "next/link";
import { DatabaseOutlined, FileTextOutlined, RightOutlined } from "@ant-design/icons";
import { Card, Col, Flex, Row, Typography } from "antd";

import { PageHeader } from "@/shared/ui/page-header";

const REPORTS = [
  {
    href: "/reports/purchase-register",
    title: "Registro de Compras 8.1",
    description: "Libro de compras del periodo contable, con exportación CSV y TXT para SIRE.",
    icon: <FileTextOutlined />,
  },
  {
    href: "/inventory/kardex",
    title: "Kardex valorizado",
    description: "Movimientos de inventario con costo promedio ponderado y exportación CSV.",
    icon: <DatabaseOutlined />,
  },
] as const;

export function ReportsIndexView() {
  return (
    <>
      <PageHeader
        eyebrow="Reportes"
        title="Reportes"
        subtitle="Kardex valorizado y Registro de Compras (formato 8.1 / SIRE)."
      />

      <Row gutter={[20, 20]}>
        {REPORTS.map((report) => (
          <Col xs={24} md={12} key={report.href}>
            <Link href={report.href} style={{ display: "block", color: "inherit" }}>
              <Card variant="borderless" hoverable styles={{ body: { padding: 24 } }}>
                <Flex gap={16} align="flex-start">
                  <span
                    style={{
                      display: "grid",
                      placeItems: "center",
                      width: 44,
                      height: 44,
                      borderRadius: 10,
                      flexShrink: 0,
                      fontSize: 18,
                      color: "var(--cf-accent)",
                      background: "var(--cf-accent-soft)",
                    }}
                  >
                    {report.icon}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Flex justify="space-between" align="center" gap={12}>
                      <Typography.Text strong style={{ fontSize: 16 }}>
                        {report.title}
                      </Typography.Text>
                      <RightOutlined style={{ color: "var(--cf-text-muted)", fontSize: 12 }} />
                    </Flex>
                    <Typography.Paragraph type="secondary" style={{ margin: "8px 0 0", fontSize: 14 }}>
                      {report.description}
                    </Typography.Paragraph>
                  </div>
                </Flex>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    </>
  );
}
