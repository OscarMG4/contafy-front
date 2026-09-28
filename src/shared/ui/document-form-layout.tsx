"use client";

import type { ReactNode } from "react";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { Button, Col, Flex, Row, Typography } from "antd";
import { useRouter } from "next/navigation";

import { StickySidebar } from "@/shared/ui/sticky-sidebar";

interface DocumentFormLayoutProps {
  title: string;
  subtitle?: string;
  backHref?: string;
  main: ReactNode;
  sidebar: ReactNode;
}

/** Shell 17/7 del document-entry form (simple-frontend VendorBill). */
export function DocumentFormLayout({
  title,
  subtitle,
  backHref = "/purchases",
  main,
  sidebar,
}: DocumentFormLayoutProps) {
  const router = useRouter();

  return (
    <div>
      <Flex
        align="center"
        gap={20}
        wrap
        style={{ marginBottom: 32, paddingBottom: 20, borderBottom: "1px solid var(--cf-border)" }}
      >
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.push(backHref)}>
          Volver
        </Button>
        <Flex vertical gap={4}>
          <Typography.Title level={4} style={{ margin: 0, fontFamily: "var(--font-display), Georgia, serif" }}>
            {title}
          </Typography.Title>
          {subtitle && (
            <Typography.Text type="secondary" style={{ fontSize: 14 }}>
              {subtitle}
            </Typography.Text>
          )}
        </Flex>
      </Flex>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={17}>
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>{main}</div>
        </Col>
        <Col xs={24} lg={7}>
          <StickySidebar>{sidebar}</StickySidebar>
        </Col>
      </Row>
    </div>
  );
}
