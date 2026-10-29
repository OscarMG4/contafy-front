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
  /** Rótulo de la sección del menú lateral (solo en el primer nivel). */
  section?: string;
}

/**
 * Navegación principal. Agrega aquí cada módulo nuevo.
 * Las rutas sin página propia muestran el placeholder de app/(app)/[...slug].
 */
export const NAVIGATION: NavItem[] = [
  { key: "/dashboard", label: "Dashboard", icon: <AppstoreOutlined />, section: "General" },
  { key: "/companies", label: "Clientes", icon: <ShopOutlined />, section: "General" },
  {
    key: "/contacts",
    label: "Contactos",
    icon: <TeamOutlined />,
    section: "Operaciones",
    children: [{ key: "/partners/suppliers", label: "Proveedores" }],
  },
  {
    key: "/purchases-menu",
    label: "Compras",
    icon: <ShoppingCartOutlined />,
    section: "Operaciones",
    children: [
      { key: "/purchases/orders", label: "Órdenes de compra" },
      { key: "/purchases", label: "Registro de compras" },
    ],
  },
  { key: "/sales", label: "Ventas", icon: <FileTextOutlined />, section: "Operaciones" },
  {
    key: "/inventory",
    label: "Inventario",
    icon: <DatabaseOutlined />,
    section: "Operaciones",
    children: [
      { key: "/inventory/warehouses", label: "Almacenes" },
      { key: "/inventory/products", label: "Artículos" },
      { key: "/inventory/receptions", label: "Recepciones" },
      { key: "/inventory/kardex", label: "Kardex" },
    ],
  },
  {
    key: "/treasury",
    label: "Tesorería",
    icon: <BankOutlined />,
    section: "Operaciones",
    children: [
      { key: "/treasury/accounts", label: "Cajas y bancos" },
      { key: "/treasury/payments", label: "Pagos a proveedores" },
      { key: "/treasury/payables", label: "Cuentas por pagar" },
    ],
  },
  {
    key: "/accounting",
    label: "Contabilidad",
    icon: <BookOutlined />,
    section: "Contabilidad",
    children: [
      { key: "/accounting/chart-of-accounts", label: "Plan de cuentas" },
      { key: "/accounting/categories", label: "Categorías contables" },
      { key: "/accounting/proration", label: "Prorrata IGV" },
      { key: "/accounting/periods", label: "Cierre de periodos" },
      { key: "/accounting/journal-entries", label: "Asientos contables" },
      { key: "/accounting/ledger", label: "Libro mayor" },
    ],
  },
  {
    key: "/reports",
    label: "Reportes",
    icon: <BarChartOutlined />,
    section: "Contabilidad",
    children: [
      { key: "/reports/purchase-register", label: "Registro de Compras 8.1" },
      { key: "/reports/fee-receipts", label: "Libro de retenciones 4ta" },
    ],
  },
  { key: "/settings", label: "Configuración", icon: <SettingOutlined />, section: "Sistema" },
];

export function findNavItem(pathname: string, items: NavItem[] = NAVIGATION): NavItem | undefined {
  for (const item of items) {
    if (item.key === pathname) return item;
    const child = item.children && findNavItem(pathname, item.children);
    if (child) return child;
  }
  return undefined;
}
