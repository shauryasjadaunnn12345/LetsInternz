import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const PROTECTED_PREFIXES = ["/dashboard", "/applications", "/saved", "/profile", "/settings", "/onboarding"];
const AUTH_ONLY_PATHS = new Set(["/login", "/signup", "/onboarding"]);

/**
 * Proxy runs at the edge and has no access to localStorage, so it reads
 * the `access_token` cookie that `lib/api.ts` mirrors alongside localStorage
 * on every token update. This is a UX gate only — it decodes the JWT payload
 * to check expiry without verifying the signature (no secret is available
 * here), so it can't be trusted as real authentication. The Django backend
 * still authenticates every API request for real via JWTAuthentication, and
 * the axios response interceptor handles refresh/redirect if a request ends
 * up unauthenticated despite passing this check.
 */
function isTokenValid(token: string | undefined): boolean {
  if (!token) return false;

  try {
    const payloadSegment = token.split(".")[1];
    if (!payloadSegment) return false;

    const normalized = payloadSegment.replace(/-/g, "+").replace(/_/g, "/");
    const payload = JSON.parse(atob(normalized)) as { exp?: number };

    if (typeof payload.exp !== "number") return true;
    return payload.exp * 1000 > Date.now();
  } catch {
    return false;
  }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get("access_token")?.value;
  const isAuthenticated = isTokenValid(token);

  if (PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix)) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (AUTH_ONLY_PATHS.has(pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/applications",
    "/applications/:path*",
    "/saved",
    "/saved/:path*",
    "/profile",
    "/profile/:path*",
    "/settings",
    "/settings/:path*",
    "/login",
    "/signup",
    "/onboarding",
  ],
};
