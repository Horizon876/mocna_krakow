import fs from "node:fs/promises";
import path from "node:path";
import { getServerEnv } from "./env-server";

function isVercelRuntime(): boolean {
  return getServerEnv("VERCEL") === "1";
}

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

/**
 * Zapisuje zdjęcie produktu.
 * Produkcja (Vercel): Vercel Blob (token z runtime env).
 * Dev: katalog public/uploads.
 */
export async function saveImage(file: File): Promise<string> {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error("Dozwolone formaty zdjęć: JPG, PNG, WebP, GIF.");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("Zdjęcie jest za duże (maks. 10 MB).");
  }

  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
  const blobToken = getServerEnv("BLOB_READ_WRITE_TOKEN");

  if (isVercelRuntime() || blobToken) {
    if (!blobToken) {
      throw new Error(
        "Brak Vercel Blob Storage. W panelu Vercel: Storage → Create → Blob.",
      );
    }

    const { put } = await import("@vercel/blob");
    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const blob = await put(`uploads/${fileName}`, buffer, {
        access: "public",
        token: blobToken,
        contentType:
          file.type || `image/${ext === "jpg" ? "jpeg" : ext}`,
      });
      return blob.url;
    } catch (error) {
      console.error("saveImage blob error:", error);
      throw new Error("Nie udało się zapisać zdjęcia. Spróbuj mniejszy plik.");
    }
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await fs.mkdir(uploadDir, { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return `/uploads/${fileName}`;
}
