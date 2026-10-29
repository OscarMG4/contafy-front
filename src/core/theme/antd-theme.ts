import { theme, type ThemeConfig } from "antd";

import { palette } from "./palette";

export type ThemeMode = "light" | "dark";

/**
 * Capas (ver globals.css): lienzo → panel → tarjeta → flotante.
 * El oscuro es casi negro con tinte violeta; cada capa sube un escalón de luz.
 */
const light = {
  canvas: "#130B2B",
  panel: "#F9F9FB",
  surface: "#FFFFFF",
  muted: "#F6F6F9",
  hover: "#F3F3F7",
  border: "#E6E6EC",
  borderSoft: "#EFEFF3",
  borderStrong: "#D6D6DE",
  text: "#101018",
  textMuted: "#5F6170",
  accent: palette.purple[600],
} as const;

const dark = {
  canvas: "#0A0814",
  panel: "#0E0E14",
  surface: "#14141C",
  elevated: "#1C1C26",
  muted: "#191922",
  hover: "#1D1D27",
  border: "#24242F",
  borderSoft: "#1C1C25",
  borderStrong: "#33333F",
  text: "#EDEDF3",
  textMuted: "#9C9DAC",
  accent: "#B57CFD",
} as const;

const sharedToken: ThemeConfig["token"] = {
  colorSuccess: palette.success,
  colorWarning: palette.warning,
  colorError: palette.error,
  fontFamily: "var(--font-sans), ui-sans-serif, sans-serif",
  borderRadius: 8,
  borderRadiusLG: 14,
  borderRadiusSM: 6,
  borderRadiusXS: 4,
  controlHeight: 38,
  controlHeightLG: 48,
  controlHeightSM: 32,
  fontSize: 14,
  fontSizeLG: 16,
  lineHeight: 1.55,
  lineWidth: 1,
  wireframe: false,
  boxShadow: "0 12px 32px -8px rgba(16, 16, 32, 0.16)",
  boxShadowSecondary: "0 12px 28px -8px rgba(16, 16, 32, 0.14)",
  boxShadowTertiary: "none",
};

const menu = {
  itemBorderRadius: 8,
  itemMarginInline: 10,
  itemMarginBlock: 2,
  itemHeight: 38,
  iconSize: 16,
  iconMarginInlineEnd: 12,
  activeBarBorderWidth: 0,
  activeBarWidth: 0,
  activeBarHeight: 0,
  itemBg: "transparent",
  subMenuItemBg: "transparent",
};

function components(mode: ThemeMode): ThemeConfig["components"] {
  const isDark = mode === "dark";
  const c = isDark ? dark : light;

  return {
    Layout: {
      siderBg: c.canvas,
      triggerBg: c.canvas,
      headerBg: "transparent",
      bodyBg: c.canvas,
    },
    /* La barra lateral es oscura en los dos modos (Menu theme="dark"). */
    Menu: {
      ...menu,
      darkItemBg: "transparent",
      darkSubMenuItemBg: "transparent",
      darkItemColor: "rgba(255, 255, 255, 0.66)",
      darkItemHoverColor: "#FFFFFF",
      darkItemHoverBg: "rgba(255, 255, 255, 0.06)",
      darkItemSelectedColor: "#FFFFFF",
      darkItemSelectedBg: "transparent",
      darkGroupTitleColor: "rgba(255, 255, 255, 0.38)",
      darkPopupBg: dark.elevated,
      groupTitleFontSize: 11,
    },
    Button: {
      primaryShadow: "none",
      defaultShadow: "none",
      dangerShadow: "none",
      paddingInline: 16,
      paddingInlineLG: 22,
      fontWeight: 500,
      defaultBg: isDark ? dark.elevated : light.surface,
      defaultBorderColor: c.border,
      defaultHoverBg: isDark ? "#22222D" : light.hover,
      defaultHoverBorderColor: c.borderStrong,
      defaultHoverColor: c.text,
    },
    Card: {
      bodyPadding: 22,
      headerPadding: 22,
      headerHeight: 56,
      headerFontSize: 15,
      colorBgContainer: c.surface,
    },
    Form: {
      itemMarginBottom: 22,
      verticalLabelPadding: "0 0 8px",
      labelRequiredMarkColor: palette.error,
      labelColor: c.text,
    },
    Input: {
      paddingBlock: 8,
      paddingInline: 12,
      activeShadow: isDark ? "0 0 0 3px rgba(181, 124, 253, 0.22)" : "0 0 0 3px rgba(108, 37, 242, 0.12)",
      hoverBorderColor: c.borderStrong,
      activeBorderColor: c.accent,
    },
    Select: {
      activeOutlineColor: isDark ? "rgba(181, 124, 253, 0.22)" : "rgba(108, 37, 242, 0.12)",
      optionSelectedBg: isDark ? "rgba(181, 124, 253, 0.16)" : palette.purple[50],
      optionActiveBg: c.hover,
    },
    Table: {
      cellPaddingBlock: 13,
      cellPaddingInline: 16,
      headerBg: c.muted,
      headerColor: c.textMuted,
      headerSplitColor: "transparent",
      rowHoverBg: c.hover,
      borderColor: c.borderSoft,
      colorBgContainer: c.surface,
    },
    Modal: {
      titleFontSize: 17,
      contentBg: isDark ? dark.elevated : light.surface,
      headerBg: "transparent",
      footerBg: "transparent",
    },
    Drawer: {
      colorBgElevated: isDark ? dark.surface : light.surface,
    },
    Segmented: {
      trackPadding: 3,
      trackBg: isDark ? dark.muted : light.hover,
      itemSelectedBg: isDark ? "#262631" : light.surface,
    },
    Tag: {
      defaultBg: c.muted,
    },
    Dropdown: {
      paddingBlock: 7,
      controlPaddingHorizontal: 12,
    },
    Statistic: {
      contentFontSize: 26,
    },
  };
}

export function buildAntdTheme(mode: ThemeMode): ThemeConfig {
  if (mode === "dark") {
    return {
      algorithm: theme.darkAlgorithm,
      token: {
        ...sharedToken,
        colorPrimary: palette.purple[500],
        colorInfo: dark.accent,
        colorLink: "#D5BEFE",
        colorBgBase: dark.canvas,
        colorBgLayout: dark.canvas,
        colorBgContainer: dark.surface,
        colorBgElevated: dark.elevated,
        colorBgSpotlight: dark.elevated,
        colorFillAlter: dark.muted,
        colorFillSecondary: "rgba(255, 255, 255, 0.06)",
        colorFillTertiary: "rgba(255, 255, 255, 0.04)",
        colorBorder: dark.borderStrong,
        colorBorderSecondary: dark.border,
        colorSplit: dark.borderSoft,
        colorText: dark.text,
        colorTextSecondary: dark.textMuted,
        colorTextTertiary: "#7E7F8F",
        colorTextQuaternary: "#5E5F6E",
        boxShadow: "0 16px 40px -12px rgba(0, 0, 0, 0.75)",
        boxShadowSecondary: "0 12px 32px -10px rgba(0, 0, 0, 0.7)",
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
      colorBgLayout: light.canvas,
      colorBgContainer: light.surface,
      colorFillAlter: light.muted,
      colorBorder: light.borderStrong,
      colorBorderSecondary: light.border,
      colorSplit: light.borderSoft,
      colorText: light.text,
      colorTextSecondary: light.textMuted,
    },
    components: components("light"),
  };
}
