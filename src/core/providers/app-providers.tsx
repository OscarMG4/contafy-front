"use client";

import { useState, type ReactNode } from "react";
import { AntdRegistry } from "@ant-design/nextjs-registry";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { App as AntdApp, ConfigProvider } from "antd";
import esES from "antd/locale/es_ES";
import dayjs from "dayjs";
import "dayjs/locale/es";

import { buildAntdTheme, type ThemeMode } from "@/core/theme/antd-theme";
import { ThemeModeProvider, useThemeMode } from "@/core/theme/theme-mode";

dayjs.locale("es");

function AntdConfig({ children }: { children: ReactNode }) {
  const { mode } = useThemeMode();

  return (
    <ConfigProvider theme={buildAntdTheme(mode)} locale={esES} componentSize="middle">
      <AntdApp>{children}</AntdApp>
    </ConfigProvider>
  );
}

export function AppProviders({ children, initialThemeMode }: { children: ReactNode; initialThemeMode: ThemeMode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { retry: 1, staleTime: 30_000, refetchOnWindowFocus: false },
        },
      }),
  );

  return (
    <AntdRegistry>
      <QueryClientProvider client={queryClient}>
        <ThemeModeProvider initialMode={initialThemeMode}>
          <AntdConfig>{children}</AntdConfig>
        </ThemeModeProvider>
      </QueryClientProvider>
    </AntdRegistry>
  );
}
