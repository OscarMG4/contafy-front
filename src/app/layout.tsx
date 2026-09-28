import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Fraunces, Outfit } from "next/font/google";

import { AppProviders } from "@/core/providers/app-providers";
import { THEME_COOKIE } from "@/core/session/session-constants";
import type { ThemeMode } from "@/core/theme/antd-theme";

import "./globals.css";

const fontSans = Outfit({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const fontDisplay = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: { default: "Contafy", template: "%s · Contafy" },
  description: "Contabilidad inteligente en la nube para estudios contables en el Perú.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const themeMode: ThemeMode = (await cookies()).get(THEME_COOKIE)?.value === "dark" ? "dark" : "light";

  return (
    <html lang="es" data-theme={themeMode} className={`${fontSans.variable} ${fontDisplay.variable}`}>
      <body>
        <AppProviders initialThemeMode={themeMode}>{children}</AppProviders>
      </body>
    </html>
  );
}
