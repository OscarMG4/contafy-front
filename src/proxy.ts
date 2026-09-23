import { NextResponse, type NextRequest } from "next/server";

import { HOME_ROUTE, PUBLIC_ROUTES, SESSION_COOKIES } from "@/core/session/session-constants";

/** Protección optimista de rutas: la validación real del token la hace el backend (401). */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const hasSession = Boolean(request.cookies.get(SESSION_COOKIES.token)?.value);
  const isPublic = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));

  if (!hasSession && !isPublic) {
    const url = new URL("/login", request.url);
    if (pathname !== "/") url.searchParams.set("next", pathname + search);
    return NextResponse.redirect(url);
  }

  if (hasSession && isPublic) {
    return NextResponse.redirect(new URL(HOME_ROUTE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)"],
};
