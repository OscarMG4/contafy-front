import { theme, type ThemeConfig } from "antd";

import { palette } from "./palette";

export type ThemeMode = "light" | "dark";

/** Soft slate dark — readable, not pitch-black */
const dark = {
  bg: "#1C2030",
  surface: "#262B3C",
  elevated: "#31384A",
  muted: "#2C3344",
  border: "#3E465A",
  borderStrong: "#525B72",
  text: "#F4F5F8",
  textMuted: "#B4BBC9",
  sider: "#171B28",
  accent: "#A78BFA",
} as const;

const sharedToken: ThemeConfig["token"] = {
  colorSuccess: palette.success,
  colorWarning: palette.warning,
  colorError: palette.error,
  fontFamily: "var(--font-sans), ui-sans-serif, sans-serif",
  borderRadius: 8,
  borderRadiusLG: 12,
  borderRadiusSM: 6,
  borderRadiusXS: 4,
  controlHeight: 40,
  controlHeightLG: 48,
  controlHeightSM: 32,
  fontSize: 14,
  fontSizeLG: 16,
  lineHeight: 1.55,
  lineWidth: 1,
  wireframe: false,
  boxShadow: "0 12px 32px rgba(16, 24, 40, 0.12)",
  boxShadowSecondary: "0 12px 32px rgba(16, 24, 40, 0.14)",
  boxShadowTertiary: "none",
};

const menu = {
  darkItemColor: "rgba(255,255,255,0.78)",
  darkItemSelectedColor: "#fff",
  darkItemHoverColor: "#fff",
  itemBorderRadius: 8,
  itemMarginInline: 12,
  itemMarginBlock: 4,
  itemHeight: 44,
  iconSize: 16,
  iconMarginInlineEnd: 12,
};

function components(mode: ThemeMode): ThemeConfig["components"] {
  const isDark = mode === "dark";
  const siderBg = isDark ? dark.sider : palette.black[900];

  return {
    Layout: {
      siderBg,
      triggerBg: siderBg,
      headerBg: isDark ? dark.surface : palette.white,
      bodyBg: isDark ? dark.bg : palette.gray[50],
    },
    Menu: {
      ...menu,
      darkItemBg: siderBg,
      darkSubMenuItemBg: siderBg,
      darkPopupBg: isDark ? dark.elevated : palette.black[850],
      darkItemSelectedBg: isDark ? "rgba(167, 139, 250, 0.28)" : "rgba(139, 92, 246, 0.22)",
      darkItemHoverBg: "rgba(255, 255, 255, 0.1)",
    },
    Button: {
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      paddingInline: 18,
      paddingInlineLG: 22,
      fontWeight: 500,
      defaultBg: isDark ? dark.elevated : palette.white,
      defaultBorderColor: isDark ? dark.borderStrong : palette.gray[200],
      defaultHoverBg: isDark ? "#3A4256" : undefined,
      defaultHoverBorderColor: isDark ? "#636D84" : undefined,
    },
    Card: {
      bodyPadding: 24,
      headerPadding: 24,
      headerHeight: 60,
      headerFontSize: 15,
    },
    Form: {
      itemMarginBottom: 22,
      verticalLabelPadding: "0 0 8px",
      labelRequiredMarkColor: palette.error,
      labelColor: isDark ? dark.textMuted : undefined,
    },
    Input: {
      paddingBlock: 8,
      paddingInline: 12,
      activeShadow: isDark
        ? "0 0 0 3px rgba(167, 139, 250, 0.28)"
        : "0 0 0 3px rgba(124, 58, 237, 0.12)",
      hoverBorderColor: isDark ? "#6B7590" : undefined,
      activeBorderColor: isDark ? dark.accent : undefined,
    },
    Select: {
      activeOutlineColor: isDark ? "rgba(167, 139, 250, 0.28)" : "rgba(124, 58, 237, 0.12)",
      optionSelectedBg: isDark ? "rgba(167, 139, 250, 0.22)" : undefined,
    },
    Table: {
      cellPaddingBlock: 14,
      cellPaddingInline: 16,
      headerBg: isDark ? dark.muted : "#F7F8FA",
      headerColor: isDark ? dark.textMuted : palette.gray[600],
      headerSplitColor: "transparent",
      rowHoverBg: isDark ? "#2F3648" : "#FAFAFC",
      borderColor: isDark ? dark.border : "#EEF0F4",
    },
    Modal: {
      titleFontSize: 18,
      contentBg: isDark ? dark.elevated : palette.white,
      headerBg: isDark ? dark.elevated : palette.white,
      footerBg: "transparent",
    },
    Drawer: {
      colorBgElevated: isDark ? dark.surface : palette.white,
    },
    Segmented: {
      trackPadding: 4,
      trackBg: isDark ? dark.muted : palette.gray[100],
      itemSelectedBg: isDark ? dark.elevated : palette.white,
    },
    Tag: {
      defaultBg: isDark ? dark.muted : palette.gray[50],
    },
    Dropdown: {
      paddingBlock: 8,
      controlPaddingHorizontal: 14,
    },
  };
}

export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  if (mode === "dark") {
    return {
      algorithm: theme.darkAlgorithm,
      token: {
        ...sharedToken,
        colorPrimary: dark.accent,
        colorInfo: dark.accent,
        colorLink: "#C4B5FD",
        colorBgBase: dark.bg,
        colorBgLayout: dark.bg,
        colorBgContainer: dark.surface,
        colorBgElevated: dark.elevated,
        colorBgSpotlight: dark.elevated,
        colorFillAlter: dark.muted,
        colorFillSecondary: "rgba(255, 255, 255, 0.06)",
        colorFillTertiary: "rgba(255, 255, 255, 0.04)",
        colorBorder: dark.borderStrong,
        colorBorderSecondary: dark.border,
        colorText: dark.text,
        colorTextSecondary: dark.textMuted,
        colorTextTertiary: "#949CB0",
        colorTextQuaternary: "#747C90",
        boxShadow: "0 12px 36px rgba(12, 14, 24, 0.35)",
        boxShadowSecondary: "0 8px 24px rgba(12, 14, 24, 0.28)",
      },
      components: components("dark"),
    };
  }

  return {
    algorithm: theme.defaultAlgorithm,
    token: {
      ...sharedToken,
      colorPrimary: palette.purple[600],
      colorInfo: palette.purple[600],
      colorLink: palette.purple[600],
      colorBgLayout: palette.gray[50],
      colorBgContainer: palette.white,
      colorBorder: palette.gray[200],
      colorBorderSecondary: "#E6E8EE",
      colorText: palette.black[900],
      colorTextSecondary: palette.gray[600],
    },
    components: components("light"),
  };
}
