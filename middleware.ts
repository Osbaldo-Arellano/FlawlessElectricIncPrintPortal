import type { NextRequest } from "next/server";
import { Auth0Client } from "@auth0/nextjs-auth0/server";

export async function middleware(request: NextRequest) {
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  const appBaseUrl = `${proto}://${host}`;

  const auth0 = new Auth0Client({ appBaseUrl, logoutStrategy: "v2" });
  return await auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
