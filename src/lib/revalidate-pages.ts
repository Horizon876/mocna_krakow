/** Odświeża cache strony wydarzeń po zmianach w panelu admina. */
export async function revalidateEventsPage(origin: string): Promise<boolean> {
  try {
    const secret = import.meta.env.REVALIDATE_SECRET;
    const headers: HeadersInit = secret
      ? { "x-revalidate-secret": secret }
      : {};
    const res = await fetch(`${origin}/wydarzenia`, {
      method: "GET",
      headers,
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}
