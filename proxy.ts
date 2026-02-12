import { getSessionCookie } from "better-auth/cookies";
import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { i18nConfig } from "./i18n/i18nConfig";
import { routing } from "./i18n/routing";
import { devLog } from "./lib/utils";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  // Redirect all routes to the setted locale or the default one
  if (
    !routing.locales.includes(request.nextUrl.pathname.split("/")[1] as any)
  ) {
    console.log(
      `${request.nextUrl.origin}/${
        request.cookies.get("NEXT_LOCALE")?.value || i18nConfig.defaultLocale
      }${request.nextUrl.pathname}`,
    );
    return NextResponse.redirect(
      `${request.nextUrl.origin}/${
        request.cookies.get("NEXT_LOCALE")?.value || i18nConfig.defaultLocale
      }${request.nextUrl.pathname}`,
    );
  }
  const sessionCookie = getSessionCookie(request);
  // THIS IS NOT SECURE!
  // This is the recommended approach to optimistically redirect users
  // We recommend handling auth checks in each page/route
  const isProtectedRoute = request.nextUrl.pathname.includes("/app");
  const isAuthRoute = request.nextUrl.pathname.includes("/sign-in") || request.nextUrl.pathname.includes("/sign-up");
  if (!sessionCookie && isProtectedRoute) {
    devLog("[PROXY] No session and protected route, redirecting to /sign-in");
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }else if (sessionCookie && isAuthRoute) {
    devLog("[PROXY]Session and auth route, redirecting to /app");
    return NextResponse.redirect(new URL("/app", request.url));
  }
  return handleI18nRouting(request);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|image|.*\\.png$).*)"],
};
