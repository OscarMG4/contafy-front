import type { ReactNode } from "react";
import {
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BookOutlined,
  DatabaseOutlined,
  FileTextOutlined,
  SettingOutlined,
  ShopOutlined,
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
  { key: "/companies", label: "Clientes", icon: <ShopOutlined /> },
  {
    key: "/contacts",
    label: "Contactos",
    icon: <TeamOutlined />,
    children: [{ key: "/partners/suppliers", label: "Proveedores" }],
  },
  {
    key: "/inventory",
    label: "Inventario",
    icon: <DatabaseOutlined />,
    children: [
      { key: "/inventory/warehouses", label: "Almacenes" },
      { key: "/inventory/products", label: "Artículos" },
      { key: "/inventory/receptions", label: "Recepciones" },
      { key: "/inventory/kardex", label: "Kardex" },
    ],
  },
  {
    key: "/accounting",
    label: "Contabilidad",
    icon: <BookOutlined />,
    children: [
      { key: "/accounting/chart-of-accounts", label: "Plan de cuentas" },
      { key: "/accounting/categories", label: "Categorías contables" },
      { key: "/accounting/proration", label: "Prorrata IGV" },
      { key: "/accounting/periods", label: "Cierre de periodos" },
      { key: "/accounting/journal-entries", label: "Asientos contables" },
      { key: "/accounting/ledger", label: "Libro mayor" },
    ],
  },
  { key: "/sales", label: "Ventas", icon: <FileTextOutlined /> },
  {
    key: "/purchases-menu",
    label: "Compras",
    icon: <ShoppingCartOutlined />,
    children: [{ key: "/purchases", label: "Registro de compras" }],
  },
  { key: "/banks", label: "Bancos", icon: <BankOutlined /> },
  {
    key: "/reports",
    label: "Reportes",
    icon: <BarChartOutlined />,
    children: [{ key: "/reports/purchase-register", label: "Registro de Compras 8.1" }],
  },
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
