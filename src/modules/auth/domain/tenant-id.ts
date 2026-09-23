/** Debe coincidir con Contafy\Contexts\Tenancy\Domain\TenantId en el backend. */
export const TENANT_ID_PATTERN = /^[a-z][a-z0-9-]{2,39}$/;

export function tenantIdFromCompanyName(companyName: string): string {
  return companyName
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\b(s\.?a\.?c?|s\.?r\.?l|e\.?i\.?r\.?l)\.?\b/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^[^a-z]+/, "")
    .replace(/-+$/g, "")
    .slice(0, 40);
}
