/** Paleta Contafy — tinta + violeta de marca. */
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
    950: "#0E1116",
    900: "#12151A",
    850: "#181C24",
    800: "#1F2430",
    700: "#2A303B",
    600: "#3A4250",
  },
  white: "#FFFFFF",
  gray: {
    50: "#EEF1F5",
    100: "#E0E4EB",
    200: "#C8CED8",
    400: "#7B8494",
    600: "#5C6573",
  },
  success: "#16A34A",
  warning: "#D97706",
  error: "#DC2626",
} as const;

export const brandGradient = `linear-gradient(145deg, ${palette.purple[700]} 0%, #312E81 55%, ${palette.black[950]} 100%)`;
