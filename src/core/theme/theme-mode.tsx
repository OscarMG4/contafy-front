"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import Cookies from "js-cookie";

import { THEME_COOKIE } from "@/core/session/session-constants";

import type { ThemeMode } from "./antd-theme";

interface ThemeModeContextValue {
  mode: ThemeMode;
  isDark: boolean;
  toggle: () => void;
  setMode: (mode: ThemeMode) => void;
}

const ThemeModeContext = createContext<ThemeModeContextValue | null>(null);

export function ThemeModeProvider({ initialMode, children }: { initialMode: ThemeMode; children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
    Cookies.set(THEME_COOKIE, next, { expires: 365, sameSite: "lax" });
    document.documentElement.dataset.theme = next;
  }, []);

  const value = useMemo<ThemeModeContextValue>(
    () => ({
      mode,
      isDark: mode === "dark",
      setMode,
      toggle: () => setMode(mode === "dark" ? "light" : "dark"),
    }),
    [mode, setMode],
  );

  return <ThemeModeContext.Provider value={value}>{children}</ThemeModeContext.Provider>;
}

export function useThemeMode() {
  const context = useContext(ThemeModeContext);
  if (!context) throw new Error("useThemeMode debe usarse dentro de <ThemeModeProvider>");
  return context;
}
