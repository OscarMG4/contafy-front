/** Paleta de marca Contafy: morado, negro y blanco. */
export const palette = {
  purple: {
    50: "#F5F3FF",
    100: "#EDE9FE",
    200: "#DDD6FE",
    300: "#C4B5FD",
    400: "#A78BFA",
    500: "#8B5CF6",
    600: "#7C3AED",
    700: "#6D28D9",
    800: "#5B21B6",
    900: "#4C1D95",
  },
  black: {
    950: "#07070B",
    900: "#0B0B12",
    850: "#111119",
    800: "#16161F",
    700: "#1F1F2B",
    600: "#2A2A38",
  },
  white: "#FFFFFF",
  gray: {
    50: "#F7F7FB",
    100: "#EFEEF5",
    200: "#E4E2EE",
    400: "#9B98AE",
    600: "#5E5B72",
  },
  success: "#16A34A",
  warning: "#F59E0B",
  error: "#E11D48",
} as const;

export const brandGradient = `linear-gradient(135deg, ${palette.purple[500]} 0%, ${palette.purple[700]} 55%, ${palette.purple[900]} 100%)`;
