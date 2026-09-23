import { redirect } from "next/navigation";

import { HOME_ROUTE } from "@/core/session/session-constants";

export default function RootPage() {
  redirect(HOME_ROUTE);
}
