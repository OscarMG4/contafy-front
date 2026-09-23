"use client";

import { LogoutOutlined, SettingOutlined, ShopOutlined, UserOutlined } from "@ant-design/icons";
import { Avatar, Dropdown, Skeleton, Typography, type MenuProps } from "antd";
import { useRouter } from "next/navigation";

import { palette } from "@/core/theme/palette";
import { useCurrentUser, useLogout } from "@/modules/auth/application/use-auth";
import { ROLE_LABELS } from "@/modules/auth/domain/auth.types";

import styles from "./app-shell.module.css";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserMenu() {
  const router = useRouter();
  const { data: user, isLoading } = useCurrentUser();
  const logout = useLogout();

  if (isLoading || !user) {
    return <Skeleton.Avatar active size={36} />;
  }

  const items: MenuProps["items"] = [
    {
      key: "tenant",
      icon: <ShopOutlined />,
      label: (
        <span>
          Empresa: <strong>{user.tenant_id}</strong>
        </span>
      ),
      disabled: true,
    },
    { type: "divider" },
    { key: "/settings/profile", icon: <UserOutlined />, label: "Mi perfil" },
    { key: "/settings", icon: <SettingOutlined />, label: "Configuración" },
    { type: "divider" },
    { key: "logout", icon: <LogoutOutlined />, label: "Cerrar sesión", danger: true },
  ];

  const onClick: MenuProps["onClick"] = ({ key }) => {
    if (key === "logout") logout.mutate();
    else router.push(key);
  };

  return (
    <Dropdown menu={{ items, onClick }} trigger={["click"]} placement="bottomRight">
      <div className={styles.userButton}>
        <Avatar size={36} style={{ background: palette.purple[600], fontWeight: 700 }}>
          {initials(user.name)}
        </Avatar>
        <div className={styles.userMeta}>
          <Typography.Text strong style={{ fontSize: 13 }}>
            {user.name}
          </Typography.Text>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {ROLE_LABELS[user.role] ?? user.role}
          </Typography.Text>
        </div>
      </div>
    </Dropdown>
  );
}
