import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { isMaintenanceMode } from "./lib/edge-config";
import { NextResponse } from "next/server";

const intlMiddleware = createMiddleware(routing);

const isAdminRoute = createRouteMatcher(["/:locale/admin(.*)"]);
const isMaintenanceRoute = createRouteMatcher(["/:locale/maintenance"]);

export default clerkMiddleware(async (auth, req) => {
  // Admin page routes: require auth (redirects to sign-in if unauthenticated)
  if (isAdminRoute(req)) {
    await auth.protect();
  }

  // Maintenance mode: redirect non-admin users to maintenance page
  if (!isAdminRoute(req) && !isMaintenanceRoute(req)) {
    const maintenance = await isMaintenanceMode();
    if (maintenance) {
      const url = req.nextUrl.clone();
      // Extract locale from pathname or use default
      const segments = url.pathname.split("/").filter(Boolean);
      const locale = routing.locales.includes(segments[0] as "de" | "en")
        ? segments[0]
        : routing.defaultLocale;
      url.pathname = `/${locale}/maintenance`;
      return NextResponse.redirect(url);
    }
  }

  const response = intlMiddleware(req);

  // Ensure cart_session cookie exists for all users (guest + logged-in)
  // The checkout API route uses this cookie since API routes are excluded from Clerk middleware
  if (!req.cookies.get("cart_session")) {
    const sessionId = crypto.randomUUID();
    response.cookies.set("cart_session", sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });
  }

  return response;
});

export const config = {
  matcher: ["/((?!api|_next|_vercel|monitoring|.*\\..*).*)"],
};
