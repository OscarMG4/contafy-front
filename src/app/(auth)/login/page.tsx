import { Suspense } from "react";
import type { Metadata } from "next";

import { LoginForm } from "@/modules/auth/presentation/login-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
