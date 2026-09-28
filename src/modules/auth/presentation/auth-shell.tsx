"use client";

import type { ReactNode } from "react";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { Button, Tooltip } from "antd";

import { useThemeMode } from "@/core/theme/theme-mode";
import { Logo } from "@/shared/ui/logo";

import { AuthLedgerArt } from "./auth-ledger-art";
import styles from "./auth-shell.module.css";

export function AuthShell({ children }: { children: ReactNode }) {
  const { isDark, toggle } = useThemeMode();

  return (
    <div className={styles.shell}>
      <aside className={styles.brand} aria-hidden={false}>
        <div className={styles.atmosphere} aria-hidden>
          <div className={styles.ledger} />
          <div className={styles.orbA} />
          <div className={styles.orbB} />
          <div className={styles.wash} />
        </div>

        <div className={styles.brandStack}>
          <div className={styles.brandContent}>
            <Logo size={40} color="#fff" />
            <p className={styles.brandMark}>Contafy</p>
            <h1 className={styles.headline}>
              El libro de tu estudio,
              <em> siempre al día.</em>
            </h1>
            <p className={styles.subtitle}>
              Un solo panel para clientes, compras valorizadas y cierre contable en el Perú.
            </p>
          </div>
          <AuthLedgerArt className={styles.art} />
        </div>

        <div className={styles.footer}>© {new Date().getFullYear()} Contafy</div>
      </aside>

      <main className={styles.formSide}>
        <Tooltip title={isDark ? "Modo claro" : "Modo oscuro"}>
          <Button
            type="text"
            className={styles.themeToggle}
            icon={isDark ? <SunOutlined /> : <MoonOutlined />}
            onClick={toggle}
            aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
          />
        </Tooltip>
        <div className={styles.formPanel}>
          <div className={styles.mobileLogo}>
            <Logo size={36} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
