import { AuthShell } from "@/modules/auth/presentation/auth-shell";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return <AuthShell>{children}</AuthShell>;
}
