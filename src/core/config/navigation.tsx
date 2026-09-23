import type { ReactNode } from "react";
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  FileTextOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  TeamOutlined,
} from "@ant-design/icons";

export interface NavItem {
  /** Ruta del módulo; también se usa como key del menú. */
  key: string;
  label: string;
  icon?: ReactNode;
  children?: NavItem[];
}

/**
 * Navegación principal. Agrega aquí cada módulo nuevo.
 * Las rutas sin página propia muestran el placeholder de app/(app)/[...slug].
 */
export const NAVIGATION: NavItem[] = [
  { key: "/dashboard", label: "Dashboard", icon: <AppstoreOutlined /> },
  {
    key: "/accounting",
    label: "Contabilidad",
    icon: <BookOutlined />,
    children: [
      { key: "/accounting/chart-of-accounts", label: "Plan de cuentas" },
      { key: "/accounting/journal-entries", label: "Asientos contables" },
      { key: "/accounting/ledger", label: "Libro mayor" },
    ],
  },
  { key: "/sales", label: "Ventas", icon: <FileTextOutlined /> },
  { key: "/purchases", label: "Compras", icon: <ShoppingCartOutlined /> },
  { key: "/banks", label: "Bancos", icon: <BankOutlined /> },
  { key: "/contacts", label: "Clientes y proveedores", icon: <TeamOutlined /> },
  { key: "/reports", label: "Reportes", icon: <BarChartOutlined /> },
  { key: "/settings", label: "Configuración", icon: <SettingOutlined /> },
];

export function findNavItem(pathname: string, items: NavItem[] = NAVIGATION): NavItem | undefined {
  for (const item of items) {
    if (item.key === pathname) return item;
    const child = item.children && findNavItem(pathname, item.children);
    if (child) return child;
  }
  return undefined;
}
