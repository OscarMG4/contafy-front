import type { ReactNode } from "react";
import { Flex, Typography } from "antd";

import styles from "./page-header.module.css";

interface PageHeaderProps {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: ReactNode;
}

export function PageHeader({ title, subtitle, actions, eyebrow }: PageHeaderProps) {
  return (
    <div className={styles.wrap}>
      <Flex justify="space-between" align="flex-start" wrap gap={20} className={styles.row}>
        <div className={styles.copy}>
          {eyebrow && <div className={styles.eyebrow}>{eyebrow}</div>}
          <Typography.Title level={3} className={styles.title}>
            {title}
          </Typography.Title>
          {subtitle && <Typography.Text className={styles.subtitle}>{subtitle}</Typography.Text>}
        </div>
        {actions && <Flex gap={12} wrap className={styles.actions}>{actions}</Flex>}
      </Flex>
    </div>
  );
}
