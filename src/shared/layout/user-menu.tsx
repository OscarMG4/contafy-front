"use client";

import { LogoutOutlined, SettingOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Flex, Skeleton, Typography, type MenuProps } from "antd";
import { useRouter } from "next/navigation";

import { palette } from "@/core/theme/palette";
import { useCurrentUser, useLogout } from "@/modules/auth/application/use-auth";
import { ROLE_LABELS } from "@/modules/auth/domain/auth.types";

import styles from "./app-shell.module.css";

function initials(name?: string | null, email?: string | null) {
  const fromName = (name ?? "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]!.toUpperCase())
    .join("");

  if (fromName) return fromName;
  return email?.trim().charAt(0)?.toUpperCase() || null;
}

export function UserMenu() {
  const router = useRouter();
  const { data: user, isPending, isFetching, isPlaceholderData } = useCurrentUser();
  const logout = useLogout();

  const hasProfile = Boolean(user?.name || user?.email);
  const loading = !hasProfile && (isPending || isFetching);

  const items: MenuProps["items"] = [
    ...(user?.tenant_id || user?.tenant_name
      ? [
          {
            key: "tenant",
            icon: <ShopOutlined />,
            label: (
              <span>
                Estudio: <strong>{user.tenant_name || user.tenant_id}</strong>
              </span>
            ),
            disabled: true,
          } as const,
          { type: "divider" as const },
        ]
      : []),
    { key: "/settings/profile", icon: <UserOutlined />, label: "Mi perfil" },
    { key: "/settings", icon: <SettingOutlined />, label: "Configuración" },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Cerrar sesión", danger: true },
  ];

  const onClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") logout.mutate();
    else router.push(key);
  };

  const label = initials(user?.name, user?.email);
  const displayName = user?.name || user?.email || "Usuario";
  const displayRole = user?.role ? (ROLE_LABELS[user.role] ?? user.role) : isPlaceholderData ? "…" : "—";

  return (
    <Dropdown menu={{ items, onClick }} trigger={["click"]} placement="bottomRight">
      <div className={styles.userButton}>
        {loading ? (
          <Flex align="center" gap={10}>
            <Skeleton.Avatar active size={36} shape="circle" />
            <div className={styles.userMeta}>
              <Skeleton.Input active size="small" style={{ width: 96, height: 14, minWidth: 96 }} />
              <Skeleton.Input active size="small" style={{ width: 72, height: 12, minWidth: 72, marginTop: 4 }} />
            </div>
          </Flex>
        ) : (
          <>
            <Avatar
              size={36}
              shape="circle"
              icon={label ? undefined : <UserOutlined />}
              style={{
                background: palette.purple[600],
                color: "#fff",
                fontWeight: 700,
                borderRadius: "50%",
                flexShrink: 0,
              }}
            >
              {label}
            </Avatar>
            <div className={styles.userMeta}>
              <Typography.Text strong style={{ fontSize: 13 }} ellipsis>
                {displayName}
              </Typography.Text>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {displayRole}
              </Typography.Text>
            </div>
          </>
        )}
      </div>
    </Dropdown>
  );
}
