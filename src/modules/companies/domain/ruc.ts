const RUC_PREFIXES = ["10", "15", "16", "17", "20"];
const RUC_WEIGHTS = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];

/** Misma validación que el backend (IdentityDocument::isValidRuc): prefijo y dígito verificador. */
export function isValidRuc(ruc: string): boolean {
  if (!/^\d{11}$/.test(ruc) || !RUC_PREFIXES.includes(ruc.slice(0, 2))) return false;

  const sum = RUC_WEIGHTS.reduce((total, weight, index) => total + Number(ruc[index]) * weight, 0);
  const check = 11 - (sum % 11);
  const expected = check === 10 ? 0 : check === 11 ? 1 : check;

  return expected === Number(ruc[10]);
}
