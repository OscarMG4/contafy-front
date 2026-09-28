import type { ReactNode } from "react";
import { Flex, Typography } from "antd";

interface FormSectionProps {
  icon: ReactNode;
  title: string;
  extra?: ReactNode;
  children: ReactNode;
  /** Espacio inferior del encabezado de sección (default 20). */
  titleMarginBottom?: number;
}

/** Encabezado de sección: icono + título fuerte, como VendorBillForm. */
export function FormSection({
  icon,
  title,
  extra,
  children,
  titleMarginBottom = 20,
}: FormSectionProps) {
  return (
    <div>
      <Flex justify="space-between" align="center" gap={16} wrap style={{ marginBottom: titleMarginBottom }}>
        <Flex align="center" gap={12}>
          <span
            style={{
              display: "grid",
              placeItems: "center",
              width: 32,
              height: 32,
              borderRadius: 8,
              color: "var(--cf-accent)",
              background: "var(--cf-accent-soft)",
            }}
          >
            {icon}
          </span>
          <Typography.Text strong style={{ fontSize: 15 }}>
            {title}
          </Typography.Text>
        </Flex>
        {extra}
      </Flex>
      {children}
    </div>
  );
}
