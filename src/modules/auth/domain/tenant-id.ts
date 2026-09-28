/** Identificador del tenant: UUID v4 o slug legado. */
export const TENANT_ID_PATTERN =
  /^(?:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}|[a-z][a-z0-9-]{2,39})$/i;

export const LAST_TENANT_KEY = "contafy_last_tenant";

export function normalizeTenantId(value: string): string {
  const trimmed = value.trim();
  if (/^[0-9a-f-]{36}$/i.test(trimmed)) {
    return trimmed.toLowerCase();
  }
  return trimmed.toLowerCase();
}
