/** Paleta Contafy — tomada del logo: lila → violeta eléctrico → índigo tinta. */
export const palette = {
  purple: {
    50: "#F4EEFF",
    100: "#E9DDFF",
    200: "#D5BEFE",
    300: "#C99BFD",
    400: "#B57CFD",
    500: "#9047F7",
    600: "#6C25F2",
    700: "#5420D6",
    800: "#4013BE",
    900: "#2B107F",
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

export const brandGradient = `linear-gradient(145deg, ${palette.purple[600]} 0%, ${palette.purple[900]} 55%, ${palette.black[950]} 100%)`;
