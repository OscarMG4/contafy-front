"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { sessionCookies } from "@/core/session/session-cookies";

import type { Company } from "../domain/company.types";
import { companyKeys, useActiveCompanies } from "./use-companies";

/**
 * Raíces de query keys que NO dependen de la empresa activa.
 * El resto de la caché se reinicia al cambiar de empresa.
 */
const GLOBAL_QUERY_ROOTS = new Set(["auth", "companies", "catalogs", "exchange-rates"]);

interface ActiveCompanyValue {
  /** Id persistido de la empresa con la que se opera (fuente de verdad). */
  selectedId: string | null;
  company: Company | null;
  companies: Company[];
  isLoading: boolean;
  select: (companyId: string, hint?: Company) => void;
}

const ActiveCompanyContext = createContext<ActiveCompanyValue | null>(null);

export function ActiveCompanyProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data, isLoading } = useActiveCompanies();
  const [selectedId, setSelectedId] = useState(() => sessionCookies.getCompany() ?? null);
  /** Snapshot al elegir desde la tabla, por si el listado activo aún no la trae. */
  const [hint, setHint] = useState<Company | null>(null);

  const companies = useMemo(() => {
    const items = data?.items ?? [];
    if (hint && !items.some((item) => item.id === hint.id)) {
      return [hint, ...items];
    }
    return items;
  }, [data, hint]);

  const company = useMemo(() => {
    if (selectedId) {
      return companies.find((item) => item.id === selectedId) ?? (hint?.id === selectedId ? hint : null);
    }
    return companies[0] ?? null;
  }, [companies, selectedId, hint]);

  useEffect(() => {
    if (!data) return;

    if (selectedId) {
      const existsInServerList = (data.items ?? []).some((item) => item.id === selectedId);
      if (existsInServerList) {
        sessionCookies.saveCompany(selectedId);
        if (hint?.id === selectedId) setHint(null);
        return;
      }

      // Lista vacía o sin la empresa: puede ser caché stale tras restaurar. No borrar la selección.
      if ((data.items ?? []).length === 0) {
        void queryClient.invalidateQueries({ queryKey: companyKeys.active });
        return;
      }

      // La seleccionada ya no está activa (archivada): caer a la primera disponible.
      const fallback = data.items[0];
      setSelectedId(fallback.id);
      sessionCookies.saveCompany(fallback.id);
      setHint(null);
      return;
    }

    if (data.items[0]) {
      setSelectedId(data.items[0].id);
      sessionCookies.saveCompany(data.items[0].id);
    }
  }, [data, selectedId, hint, queryClient]);

  const select = useCallback(
    (companyId: string, companyHint?: Company) => {
      sessionCookies.saveCompany(companyId);
      setSelectedId(companyId);
      if (companyHint) setHint(companyHint);
      void queryClient.invalidateQueries({ queryKey: companyKeys.active });
      queryClient.resetQueries({
        predicate: ({ queryKey }) => !GLOBAL_QUERY_ROOTS.has(String(queryKey[0])),
      });
    },
    [queryClient],
  );

  const value = useMemo(
    () => ({ selectedId, company, companies, isLoading, select }),
    [selectedId, company, companies, isLoading, select],
  );

  return <ActiveCompanyContext.Provider value={value}>{children}</ActiveCompanyContext.Provider>;
}

export function useActiveCompany(): ActiveCompanyValue {
  const context = useContext(ActiveCompanyContext);
  if (!context) throw new Error("useActiveCompany debe usarse dentro de <ActiveCompanyProvider>.");
  return context;
}
