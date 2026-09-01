import { getServerEnv } from "./env-server";

export const MAINTENANCE_PATH = "/strona-techniczna";

/** Włącz przez MAINTENANCE_MODE=true w .env.local (localhost) lub w Vercel (produkcja). */
export function isMaintenanceMode(): boolean {
  return getServerEnv("MAINTENANCE_MODE") === "true";
}

/** Trasy dostępne mimo włączonego trybu technicznego. */
export function isMaintenanceBypass(pathname: string): boolean {
  if (pathname === MAINTENANCE_PATH) return true;
  if (pathname.startsWith("/admin")) return true;
  if (pathname.startsWith("/api/admin")) return true;
  if (pathname.startsWith("/_astro/")) return true;
  if (pathname.startsWith("/_optimized/")) return true;
  if (pathname.startsWith("/brand/")) return true;
  if (pathname.startsWith("/fonts/")) return true;
  if (/\.(?:svg|png|jpe?g|webp|ico|woff2?|css|js)$/i.test(pathname)) return true;
  return false;
}
