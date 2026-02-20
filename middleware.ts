import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Next.js edge middleware — runs before every request.
 * Adds security headers and protects authenticated routes.
 */

const SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
};

/** Routes that require authentication (checked via session cookie) */
const PROTECTED_PREFIXES = [
  "/ide",
  "/profile",
  "/settings",
  "/history",
  "/leaderboard",
  "/duels",
  "/community",
  "/paths",
  "/gamified",
  "/game1",
  "/game2",
  "/game3",
  "/game4",
  "/game5",
  "/admin",
];

/** Static / auth pages that should bypass checks */
const PUBLIC_PREFIXES = [
  "/login",
  "/signup",
  "/forgot-password",
  "/api/",
  "/_next/",
  "/icons/",
  "/manifest.json",
  "/sw.js",
  "/favicon.ico",
  "/offline",
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // Apply security headers to every response
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  // Skip auth check for public routes and the homepage
  if (isPublic(pathname) || pathname === "/") {
    return response;
  }

  // For protected routes, check for session cookie
  if (isProtected(pathname)) {
    const sessionCookie = request.cookies.get("pulsepy_session");
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname + request.nextUrl.search);
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except static files and images
     */
    "/((?!_next/static|_next/image|favicon\\.ico|icons/).*)",
  ],
};
