"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

import styles from "./page-transition.module.css";

/** Entrada suave al cambiar de ruta (contabilidad: sobrio, no espectáculo). */
export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className={styles.page}>
      {children}
    </div>
  );
}
