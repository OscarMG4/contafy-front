import type { Metadata } from "next";

import { CompaniesView } from "@/modules/companies/presentation/companies-view";

export const metadata: Metadata = { title: "Clientes" };

export default function CompaniesPage() {
  return <CompaniesView />;
}
