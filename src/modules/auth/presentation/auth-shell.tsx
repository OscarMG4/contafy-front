"use client";

import type { ReactNode } from "react";
import {
  AuditOutlined,
  CreditCardOutlined,
  MoonOutlined,
  RiseOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  SunOutlined,
} from "@ant-design/icons";
import { Button, Tooltip } from "antd";

import { useThemeMode } from "@/core/theme/theme-mode";
import { Logo } from "@/shared/ui/logo";

import styles from "./auth-shell.module.css";

const FEATURES = [
  { icon: <ShoppingCartOutlined />, title: "Compras con asiento automático", text: "Percepción, retención 4ta y detracción incluidas." },
  { icon: <AuditOutlined />, title: "Registros SUNAT al día", text: "Registro de Compras 8.1 y libro de retenciones." },
  { icon: <ShopOutlined />, title: "Todos tus clientes en un panel", text: "Cambia de empresa sin cerrar sesión." },
];

/**
 * Mismo lenguaje que la app: lienzo oscuro con aurora violeta y el formulario en un panel elevado
 * (claro u oscuro según el tema), como el panel de trabajo del shell.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { isDark, toggle } = useThemeMode();

  return (
    <div className={styles.shell}>
      <div className={styles.aurora} aria-hidden />

      <aside className={styles.brand}>
        <span className={styles.watermark} aria-hidden>
          <Logo size={620} showText={false} />
        </span>
        <Logo size={36} color="#fff" />

        <div className={styles.pitch}>
          <span className={styles.pill}>
            <span className={styles.pillDot} />
            Contabilidad para estudios en el Perú
          </span>
          <h1 className={styles.headline}>
            El libro de tu estudio, <span className={styles.highlight}>siempre al día.</span>
          </h1>
          <p className={styles.subtitle}>
            Compras valorizadas, tesorería y cierre contable de todos tus clientes en un solo lugar.
          </p>

          <ul className={styles.features}>
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <span className={styles.featureIcon}>{feature.icon}</span>
                <span>
                  <strong>{feature.title}</strong>
                  <span className={styles.featureText}>{feature.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Vista previa decorativa de los indicadores del dashboard */}
        <div className={styles.preview} aria-hidden>
          <div className={styles.previewCard} style={{ ["--tone" as string]: "#9047F7" }}>
            <span className={styles.previewIcon}>
              <RiseOutlined />
            </span>
            <span className={styles.previewLabel}>Ingresos del mes</span>
            <span className={styles.previewValue}>S/ 48,250.00</span>
            <span className={styles.previewBars}>
              {[38, 52, 44, 61, 57, 72, 86].map((height, index) => (
                <i key={index} style={{ height: `${height}%` }} />
              ))}
            </span>
          </div>
          <div className={styles.previewCard} style={{ ["--tone" as string]: "#F59E0B" }}>
            <span className={styles.previewIcon}>
              <CreditCardOutlined />
            </span>
            <span className={styles.previewLabel}>Cuentas por pagar</span>
            <span className={styles.previewValue}>S/ 14,766.30</span>
            <span className={styles.previewTags}>
              <em>Por vencer</em>
              <em>1–15 días</em>
            </span>
          </div>
        </div>

        <div className={styles.footer}>© {new Date().getFullYear()} Contafy</div>
      </aside>

      <main className={styles.panel}>
        <div className={styles.panelTop}>
          <span className={styles.mobileLogo}>
            <Logo size={30} />
          </span>
          <Tooltip title={isDark ? "Modo claro" : "Modo oscuro"}>
            <Button
              type="text"
              icon={isDark ? <SunOutlined /> : <MoonOutlined />}
              onClick={toggle}
              aria-label={isDark ? "Activar modo claro" : "Activar modo oscuro"}
            />
          </Tooltip>
        </div>
        <div className={styles.form}>{children}</div>
        <div className={styles.panelFooter}>¿Problemas para entrar? Escribe al administrador de tu estudio.</div>
      </main>
    </div>
  );
}
