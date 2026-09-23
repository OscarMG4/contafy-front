"use client";

import type { ReactNode } from "react";
import { BankOutlined, LineChartOutlined, SafetyCertificateOutlined } from "@ant-design/icons";

import { Logo } from "@/shared/ui/logo";

import styles from "./auth-shell.module.css";

const FEATURES = [
  { icon: <LineChartOutlined />, text: "Reportes financieros en tiempo real" },
  { icon: <BankOutlined />, text: "Conciliación bancaria automatizada" },
  { icon: <SafetyCertificateOutlined />, text: "Datos aislados y cifrados por empresa" },
];

const BAR_HEIGHTS = [38, 54, 46, 70, 62, 84, 100];

export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className={styles.shell}>
      <aside className={styles.brand}>
        <div className={styles.brandContent}>
          <Logo size={38} color="#fff" />

          <h1 className={styles.headline}>
            La contabilidad de tu empresa, <span>simple y en la nube.</span>
          </h1>
          <p className={styles.subtitle}>
            Centraliza ventas, compras, bancos e impuestos en una sola plataforma diseñada para equipos contables
            modernos.
          </p>

          <ul className={styles.features}>
            {FEATURES.map((feature) => (
              <li key={feature.text}>
                <span className={styles.featureIcon}>{feature.icon}</span>
                {feature.text}
              </li>
            ))}
          </ul>

          <div className={styles.glassCard}>
            <div className={styles.glassLabel}>Utilidad neta · últimos 7 meses</div>
            <div className={styles.glassValue}>S/ 248,930.00</div>
            <div className={styles.bars}>
              {BAR_HEIGHTS.map((height, index) => (
                <span key={index} style={{ height: `${height}%` }} />
              ))}
            </div>
          </div>
        </div>

        <div className={styles.footer}>© {new Date().getFullYear()} Contafy. Todos los derechos reservados.</div>
      </aside>

      <main className={styles.formSide}>
        <div className={styles.formContainer}>
          <div className={styles.mobileLogo}>
            <Logo size={36} />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
