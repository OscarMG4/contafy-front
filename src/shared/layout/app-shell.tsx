"use client";

import { useMemo, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  BellOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  MoonOutlined,
  SearchOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { Badge, Button, Flex, Input, Layout, Menu, Tooltip, type MenuProps } from "antd";

import { NAVIGATION, type NavItem } from "@/core/config/navigation";
import { useThemeMode } from "@/core/theme/theme-mode";
import { CompanySwitcher } from "@/modules/companies/presentation/company-switcher";
import { NoCompanyAlert } from "@/modules/companies/presentation/no-company-alert";
import { Logo } from "@/shared/ui/logo";

import styles from "./app-shell.module.css";
import { UserMenu } from "./user-menu";
import { PageTransition } from "@/shared/ui/page-transition";

type MenuItem = Required<MenuProps>["items"][number];

function toMenuItems(items: NavItem[]): MenuItem[] {
  return items.map((item) => ({
    key: item.key,
    icon: item.icon,
    label: item.label,
    children: item.children ? toMenuItems(item.children) : undefined,
  }));
}

function parentKeysOf(pathname: string): string[] {
  return NAVIGATION.filter((item) => item.children?.some((child) => pathname.startsWith(child.key))).map(
    (item) => item.key,
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isDark, toggle } = useThemeMode();
  const [collapsed, setCollapsed] = useState(false);

  const menuItems = useMemo(() => toMenuItems(NAVIGATION), []);
  const selectedKey = useMemo(() => {
    const flat = NAVIGATION.flatMap((item) => [item, ...(item.children ?? [])]);
    return flat
      .filter((item) => pathname === item.key || pathname.startsWith(`${item.key}/`))
      .sort((a, b) => b.key.length - a.key.length)[0]?.key;
  }, [pathname]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout.Sider
        width={264}
        collapsedWidth={80}
        collapsed={collapsed}
        breakpoint="lg"
        onBreakpoint={setCollapsed}
        trigger={null}
        className={styles.sider}
      >
        <div className={styles.siderInner}>
          <div className={styles.brand} style={{ justifyContent: collapsed ? "center" : "flex-start" }}>
            <Logo size={32} showText={!collapsed} />
          </div>

          <Menu
            theme="dark"
            mode="inline"
            className={styles.menu}
            items={menuItems}
            selectedKeys={selectedKey ? [selectedKey] : []}
            defaultOpenKeys={collapsed ? [] : parentKeysOf(pathname)}
            onClick={({ key }) => router.push(key)}
          />
        </div>
      </Layout.Sider>

      <Layout>
        <Layout.Header className={styles.header}>
          <div className={styles.rail}>
            <Flex align="center" gap={16} style={{ flex: 1, minWidth: 0 }}>
              <Button
                type="text"
                aria-label="Alternar menú"
                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                onClick={() => setCollapsed((value) => !value)}
              />
              <CompanySwitcher />
              <Input
                className={styles.search}
                prefix={<SearchOutlined />}
                placeholder="Buscar asientos, cuentas, clientes…"
                variant="filled"
                allowClear
              />
            </Flex>

            <Flex align="center" gap={8}>
              <Tooltip title={isDark ? "Modo claro" : "Modo oscuro"}>
                <Button type="text" icon={isDark ? <SunOutlined /> : <MoonOutlined />} onClick={toggle} />
              </Tooltip>
              <Tooltip title="Notificaciones">
                <Badge dot offset={[-4, 4]}>
                  <Button type="text" icon={<BellOutlined />} />
                </Badge>
              </Tooltip>
              <UserMenu />
            </Flex>
          </div>
        </Layout.Header>

        <Layout.Content className={styles.content}>
          <NoCompanyAlert />
          <PageTransition>{children}</PageTransition>
        </Layout.Content>
      </Layout>
    </Layout>
  );
}
