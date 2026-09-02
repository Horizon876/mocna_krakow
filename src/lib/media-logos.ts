import { asc } from "drizzle-orm";
import { db } from "../db";
import { mediaLogos } from "../db/schema";
import { MEDIA_LOGOS_HOME, type MediaLogo } from "../data/site";
import {
  CONTENT_CACHE_KEYS,
  getCachedContent,
  refreshCachedContent,
} from "./content-cache";

/** Wstawia domyślne kafelki z site.ts, gdy tabela jest pusta. */
export async function ensureMediaLogosSeeded(): Promise<void> {
  const existing = await db
    .select({ id: mediaLogos.id })
    .from(mediaLogos)
    .limit(1);
  if (existing.length > 0) return;

  await Promise.all(
    MEDIA_LOGOS_HOME.map((item, index) =>
      db.insert(mediaLogos).values({
        name: item.name,
        logoUrl: item.logo || null,
        href: item.href || null,
        sortOrder: index,
      }),
    ),
  );
}

async function loadMediaFromDb(): Promise<MediaLogo[]> {
  await ensureMediaLogosSeeded();
  const rows = await db
    .select()
    .from(mediaLogos)
    .orderBy(asc(mediaLogos.sortOrder), asc(mediaLogos.createdAt));

  return rows.map((row) => ({
    name: row.name,
    logo: row.logoUrl || "",
    href: row.href || undefined,
  }));
}

export async function getMediaLogos(): Promise<MediaLogo[]> {
  return getCachedContent(CONTENT_CACHE_KEYS.media, loadMediaFromDb);
}

export async function refreshMediaCache(): Promise<MediaLogo[]> {
  return refreshCachedContent(CONTENT_CACHE_KEYS.media, loadMediaFromDb);
}
