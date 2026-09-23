import { Suspense } from "react";
import type { Metadata } from "next";

import { RegisterForm } from "@/modules/auth/presentation/register-form";

export const metadata: Metadata = { title: "Registrar empresa" };

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
