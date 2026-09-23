import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Plus_Jakarta_Sans } from "next/font/google";

import { AppProviders } from "@/core/providers/app-providers";
import { THEME_COOKIE } from "@/core/session/session-constants";
import type { ThemeMode } from "@/core/theme/antd-theme";

import "./globals.css";

const fontSans = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: { default: "Contafy", template: "%s · Contafy" },
  description: "Contabilidad inteligente en la nube para tu empresa.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const themeMode: ThemeMode = (await cookies()).get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <html lang="es" data-theme={themeMode} className={fontSans.variable}>
      <body>
        <AppProviders initialThemeMode={themeMode}>{children}</AppProviders>
      </body>
    </html>
  );
}
