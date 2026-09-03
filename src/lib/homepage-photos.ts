import { db } from "../db";
import { homepagePhotos } from "../db/schema";
import {
  CONTENT_CACHE_KEYS,
  getCachedContent,
  refreshCachedContent,
} from "./content-cache";

export type HomepagePhotoSlot = "hero" | "mission";

export type HomepagePhoto = {
  slot: HomepagePhotoSlot;
  imageUrl: string;
  imagePosition: string;
  alt: string;
};

const DEFAULTS: HomepagePhoto[] = [
  {
    slot: "hero",
    imageUrl: "/photos/zespol.jpeg",
    imagePosition: "58% 50%",
    alt: "Cały zespół kawiarni MOCna! przy barze",
  },
  {
    slot: "mission",
    imageUrl: "/photos/poznaj_mocna.jpeg",
    imagePosition: "50% 50%",
    alt: "Zespół kawiarni MOCna! przy pracy",
  },
];

export async function ensureHomepagePhotosSeeded(): Promise<void> {
  const existing = await db.select().from(homepagePhotos).limit(1);
  if (existing.length > 0) return;

  await Promise.all(
    DEFAULTS.map((photo) =>
      db.insert(homepagePhotos).values({
        slot: photo.slot,
        imageUrl: photo.imageUrl,
        imagePosition: photo.imagePosition,
        alt: photo.alt,
      }),
    ),
  );
}

async function loadHomepagePhotos(): Promise<Record<HomepagePhotoSlot, HomepagePhoto>> {
  await ensureHomepagePhotosSeeded();
  const rows = await db.select().from(homepagePhotos);
  const bySlot = Object.fromEntries(
    DEFAULTS.map((d) => [d.slot, { ...d }]),
  ) as Record<HomepagePhotoSlot, HomepagePhoto>;

  for (const row of rows) {
    if (row.slot !== "hero" && row.slot !== "mission") continue;
    bySlot[row.slot] = {
      slot: row.slot,
      imageUrl: row.imageUrl,
      imagePosition: row.imagePosition || "50% 50%",
      alt: row.alt || bySlot[row.slot].alt,
    };
  }

  return bySlot;
}

export async function getHomepagePhotos(): Promise<
  Record<HomepagePhotoSlot, HomepagePhoto>
> {
  return getCachedContent(CONTENT_CACHE_KEYS.homepage, loadHomepagePhotos);
}

export async function refreshHomepageCache(): Promise<
  Record<HomepagePhotoSlot, HomepagePhoto>
> {
  return refreshCachedContent(CONTENT_CACHE_KEYS.homepage, loadHomepagePhotos);
}
