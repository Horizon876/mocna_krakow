import { getServerEnv } from "./env-server";

function revalidateSecret(): string {
  return (
    getServerEnv("REVALIDATE_SECRET") ||
    getServerEnv("VERCEL_REVALIDATE_TOKEN") ||
    ""
  );
}

/** Odświeża ISR / CDN cache wskazanych ścieżek po zmianie treści. */
export async function revalidatePaths(
  origin: string,
  paths: string[],
): Promise<boolean> {
  const secret = revalidateSecret();
  if (!secret || paths.length === 0) return false;

  const results = await Promise.all(
    paths.map(async (pathname) => {
      try {
        const url = new URL(pathname, origin).toString();
        const res = await fetch(url, {
          method: "HEAD",
          headers: {
            "x-prerender-revalidate": secret,
            "x-revalidate-secret": secret,
          },
          cache: "no-store",
        });
        const vercel = res.headers.get("X-Vercel-Cache");
        return res.ok || vercel === "REVALIDATED";
      } catch {
        return false;
      }
    }),
  );

  return results.every(Boolean);
}

/** Odświeża cache strony wydarzeń po zmianach w panelu admina. */
export async function revalidateEventsPage(origin: string): Promise<boolean> {
  return revalidatePaths(origin, ["/wydarzenia"]);
}

export async function revalidateTeamPage(origin: string): Promise<boolean> {
  return revalidatePaths(origin, ["/ludziemocnej"]);
}

export async function revalidateProjectsPage(origin: string): Promise<boolean> {
  return revalidatePaths(origin, ["/projekty"]);
}

export async function revalidateCafePage(origin: string): Promise<boolean> {
  return revalidatePaths(origin, ["/kawiarnia"]);
}
