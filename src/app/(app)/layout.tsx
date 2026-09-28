import { ActiveCompanyProvider } from "@/modules/companies/application/active-company";
import { AppShell } from "@/shared/layout/app-shell";

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <ActiveCompanyProvider>
      <AppShell>{children}</AppShell>
    </ActiveCompanyProvider>
  );
}
