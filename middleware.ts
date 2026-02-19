import { Auth0Client } from "@auth0/nextjs-auth0/server";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const auth0 = new Auth0Client();

export async function middleware(request: NextRequest) {
  // Let auth0 handle /auth/* routes (login, logout, callback) and refresh tokens
  const authRes = await auth0.middleware(request);

  // Don't gate the auth routes or API routes — they handle auth themselves
  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/auth") || pathname.startsWith("/api")) {
    return authRes;
  }

  // For all other routes (the dashboard page), require a valid session
  const session = await auth0.getSession(request, authRes);
  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  return authRes;
}

export const config = {
  matcher: [
    // Run on everything except Next.js internals and static assets
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
