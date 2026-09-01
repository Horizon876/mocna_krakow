import type { MiddlewareHandler } from "astro";
import {
  isMaintenanceBypass,
  isMaintenanceMode,
  MAINTENANCE_PATH,
} from "./lib/maintenance";
import { verifySessionToken, COOKIE_NAME_EXPORT } from "./lib/session";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;

  if (isMaintenanceMode() && !isMaintenanceBypass(pathname)) {
    return context.redirect(MAINTENANCE_PATH);
  }

  // Chroń wszystkie trasy /admin/* oprócz strony logowania
  const isAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/admin/login";

  if (isAdminRoute && !isLoginPage) {
    const token = context.cookies.get(COOKIE_NAME_EXPORT)?.value;

    if (!token) {
      return context.redirect("/admin/login");
    }

    const session = await verifySessionToken(token);
    if (!session.valid || !session.role) {
      // Usuń przeterminowane/nieprawidłowe ciasteczko
      context.cookies.delete(COOKIE_NAME_EXPORT, { path: "/" });
      return context.redirect("/admin/login?expired=1");
    }

    context.locals.adminRole = session.role;

    if (session.role === "pracownik") {
      const restrictedRoutes = [
        "/admin/sklep",
        "/admin/wydarzenia",
        "/admin/kawiarnia",
      ];
      if (restrictedRoutes.some((route) => pathname.startsWith(route))) {
        return context.redirect("/admin/dashboard?forbidden=1");
      }
    }
  }

  return next();
};
