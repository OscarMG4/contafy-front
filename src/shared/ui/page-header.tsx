import type { ReactNode } from "react";
import { Flex, Typography } from "antd";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <Flex justify="space-between" align="flex-end" wrap gap={16} style={{ marginBottom: 24 }}>
      <div>
        <Typography.Title level={3} style={{ margin: 0, fontWeight: 800, letterSpacing: "-0.03em" }}>
          {title}
        </Typography.Title>
        {subtitle && (
          <Typography.Text type="secondary" style={{ fontSize: 14 }}>
            {subtitle}
          </Typography.Text>
        )}
      </div>
      {actions && <Flex gap={8}>{actions}</Flex>}
    </Flex>
  );
}
