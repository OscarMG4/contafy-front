import { theme, type ThemeConfig } from "antd";

import { palette } from "./palette";

export type ThemeMode = "light" | "dark";

const sharedToken: ThemeConfig["token"] = {
  colorPrimary: palette.purple[600],
  colorInfo: palette.purple[600],
  colorLink: palette.purple[600],
  colorSuccess: palette.success,
  colorWarning: palette.warning,
  colorError: palette.error,
  fontFamily: "var(--font-sans), -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  borderRadius: 10,
  borderRadiusLG: 14,
  controlHeight: 38,
  controlHeightLG: 46,
  fontSize: 14,
  wireframe: false,
};

/** El sidebar es negro en ambos modos: es parte de la identidad visual. */
const siderComponents = {
  Layout: {
    siderBg: palette.black[900],
    triggerBg: palette.black[850],
  },
  Menu: {
    darkItemBg: palette.black[900],
    darkSubMenuItemBg: palette.black[950],
    darkItemSelectedBg: palette.purple[600],
    darkItemHoverBg: palette.black[700],
    darkItemColor: "rgba(255,255,255,0.68)",
    itemBorderRadius: 10,
    itemMarginInline: 10,
    itemHeight: 42,
    iconSize: 16,
  },
} satisfies ThemeConfig["components"];

export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  if (mode === "dark") {
    return {
      algorithm: theme.darkAlgorithm,
      token: {
        ...sharedToken,
        colorBgBase: palette.black[950],
        colorBgLayout: palette.black[950],
        colorBgContainer: palette.black[850],
        colorBgElevated: palette.black[800],
        colorBorder: palette.black[600],
        colorBorderSecondary: palette.black[700],
      },
      components: {
        ...siderComponents,
        Layout: { ...siderComponents.Layout, headerBg: palette.black[900], bodyBg: palette.black[950] },
        Card: { colorBgContainer: palette.black[850] },
      },
    };
  }

  return {
    algorithm: theme.defaultAlgorithm,
    token: {
      ...sharedToken,
      colorBgLayout: palette.gray[50],
      colorBgContainer: palette.white,
      colorBorderSecondary: palette.gray[100],
      colorText: palette.black[900],
    },
    components: {
      ...siderComponents,
      Layout: { ...siderComponents.Layout, headerBg: palette.white, bodyBg: palette.gray[50] },
      Button: { primaryShadow: `0 6px 16px -6px ${palette.purple[600]}99` },
    },
  };
}
