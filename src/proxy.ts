import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 `proxy.ts` (formerly `middleware.ts`). The file convention was
 * renamed to clarify its routing/network role; runtime is now always Node.js
 * (edge runtime is not supported in `proxy`).
 *
 * What this file does: propagate the request pathname (+ search) as
 * `x-pathname` and `x-url` headers so server components / layouts can
 * compute a faithful `returnTo` when redirecting to sign-in.
 *
 * **This is the only thing it does.** It is intentionally not an auth gate:
 *
 * - Better-Auth's `getSessionCookie` is optimistic (cookie-existence check,
 *   not a session validation) and is documented as not secure for protected
 *   actions — the route handler must still re-check.
 * - A full session check here would duplicate the work that
 *   `requireAuthorizedAppSession()` already does inside the AppShell with
 *   `React.cache` deduplication.
 *
 * If we later need a proxy-level backstop (e.g. for `/api/admin/:path*`
 * route handlers) it can be added here as an optimistic 401, but the
 * per-route `requireRole` / `requirePermission` calls remain the actual
 * security gate.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", request.nextUrl.pathname);
  requestHeaders.set(
    "x-url",
    request.nextUrl.pathname + request.nextUrl.search,
  );

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Skip static assets and Next internals; everything else passes through so
  // server components in any route can read `x-pathname`.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|css|js|map)$).*)",
  ],
};
