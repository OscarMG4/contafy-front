"use client";

import Link from "next/link";
import { ToolOutlined } from "@ant-design/icons";
import { Button, Card, Result } from "antd";

import { findNavItem } from "@/core/config/navigation";

export function ModulePlaceholder({ pathname }: { pathname: string }) {
  const item = findNavItem(pathname);

  return (
    <Card variant="borderless">
      <Result
        icon={<ToolOutlined style={{ color: "var(--cf-purple-600)" }} />}
        title={item ? item.label : "Página no encontrada"}
        subTitle={item ? "Este módulo está en construcción." : `No existe la ruta ${pathname}.`}
        extra={
          <Link href="/dashboard">
            <Button type="primary">Volver al dashboard</Button>
          </Link>
        }
      />
    </Card>
  );
}
