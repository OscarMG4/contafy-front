import { ModulePlaceholder } from "@/shared/ui/module-placeholder";

/**
 * Placeholder para módulos del menú que aún no tienen página.
 * Al crear una ruta concreta (p. ej. app/(app)/sales/page.tsx) esta deja de aplicarse.
 */
export default async function ModulePlaceholderPage({ params }: PageProps<"/[...slug]">) {
  const { slug } = await params;
  return <ModulePlaceholder pathname={`/${slug.join("/")}`} />;
}
