import fs from "node:fs/promises";
import path from "node:path";

/**
 * Zapisuje zdjęcie produktu.
 * Produkcja (Vercel): Vercel Blob gdy ustawiony BLOB_READ_WRITE_TOKEN.
 * Dev: katalog public/uploads.
 */
export async function saveImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "jpg";
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;

  if (import.meta.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    const blob = await put(`uploads/${fileName}`, file, {
      access: "public",
      token: import.meta.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return `/uploads/${fileName}`;
}
