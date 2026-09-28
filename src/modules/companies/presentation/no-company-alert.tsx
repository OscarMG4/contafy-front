"use client";

import { usePathname, useRouter } from "next/navigation";
import { Alert, Button } from "antd";

import { useActiveCompany } from "../application/active-company";

/** Aviso global mientras el estudio no tenga ninguna empresa cliente activa. */
export function NoCompanyAlert() {
  const pathname = usePathname();
  const router = useRouter();
  const { companies, isLoading } = useActiveCompany();

  if (isLoading || companies.length > 0 || pathname.startsWith("/companies")) return null;

  return (
    <Alert
      type="info"
      showIcon
      title="Registra tu primer cliente"
      description="Compras, inventario y contabilidad se llevan por cliente. Regístralo para empezar a trabajar."
      action={
        <Button type="primary" onClick={() => router.push("/companies")}>
          Registrar cliente
        </Button>
      }
      style={{ marginBottom: 24 }}
    />
  );
}
