const amountFormatter = new Intl.NumberFormat("es-PE", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Monto con 2 decimales y separador de miles (sin símbolo). */
export function formatAmount(value: string | number | null | undefined): string {
  return amountFormatter.format(Number(value ?? 0));
}

export function currencySymbol(currency: string | null | undefined): string {
  return currency === "USD" ? "US$" : "S/";
}

/** "S/ 1,234.50" / "US$ 100.00" */
export function formatCurrency(value: string | number | null | undefined, currency: string | null | undefined): string {
  return `${currencySymbol(currency)} ${formatAmount(value)}`;
}

export function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export const CURRENCY_OPTIONS = [
  { value: "PEN", label: "PEN - Soles" },
  { value: "USD", label: "USD - Dólares" },
];

export const CURRENCY_NAMES: Record<string, string> = {
  PEN: "SOLES",
  USD: "DÓLARES AMERICANOS",
};

export const DATE_FORMAT = "DD/MM/YYYY";

/** True si hay un desplegable de antd abierto (Select / DatePicker): Esc debe cerrarlo, no la ventana. */
function isPopupOpen(): boolean {
  if (typeof document === "undefined") return false;
  return Boolean(
    document.querySelector(
      ".ant-select-dropdown:not(.ant-select-dropdown-hidden), .ant-picker-dropdown:not(.ant-picker-dropdown-hidden)",
    ),
  );
}

/** Envuelve el handler de Esc para no cerrar la ventana mientras un desplegable está abierto. */
export function guardEscape(handler: () => void): () => void {
  return () => {
    if (isPopupOpen()) return;
    handler();
  };
}

export const TREASURY_ADMIN_ROLES = new Set(["owner", "admin"]);
export const TREASURY_WRITE_ROLES = new Set(["owner", "admin", "accountant"]);
