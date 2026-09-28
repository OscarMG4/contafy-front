import { redirect } from "next/navigation";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Iniciar sesión" };

/** El alta de estudios solo se hace desde el CRM (backoffice). */
export default function RegisterPage() {
  redirect("/login");
}
