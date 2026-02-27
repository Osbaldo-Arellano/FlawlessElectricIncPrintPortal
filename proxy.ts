import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export async function proxy(request: NextRequest) {
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const appBaseUrl = `${proto}://${host}`;

  const auth0 = new Auth0Client({ appBaseUrl, logoutStrategy: "v2" });

  const authResponse = await auth0.middleware(request);

  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return authResponse;
  }

  const session = await auth0.getSession(request);

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return authResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
