import { asc } from "drizzle-orm";
import { db } from "../db";
import { cafePhotos } from "../db/schema";
import { CAFE_GALLERY } from "../data/site";

/** Wstawia domyślne zdjęcia z site.ts, gdy galeria w bazie jest pusta. */
export async function ensureCafeGallerySeeded(): Promise<void> {
  const existing = await db
    .select({ id: cafePhotos.id })
    .from(cafePhotos)
    .limit(1);
  if (existing.length > 0) return;

  await Promise.all(
    CAFE_GALLERY.map((photo) =>
      db.insert(cafePhotos).values({
        imageUrl: photo.src,
        alt: photo.alt,
      }),
    ),
  );
}

export async function getCafeGalleryPhotos(): Promise<
  Array<{ src: string; alt: string }>
> {
  await ensureCafeGallerySeeded();
  const rows = await db
    .select()
    .from(cafePhotos)
    .orderBy(asc(cafePhotos.createdAt));
  return rows.map((p) => ({
    src: p.imageUrl,
    alt: p.alt || "Zdjęcie z kawiarni MOCna!",
  }));
}
