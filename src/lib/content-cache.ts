import fs from "node:fs/promises";
import path from "node:path";

const memory = new Map<string, unknown>();

function cacheDir(): string {
  return path.join(process.cwd(), ".cache", "content");
}

function cachePath(key: string): string {
  return path.join(cacheDir(), `${key}.json`);
}

async function readFileCache<T>(key: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(cachePath(key), "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

async function writeFileCache(key: string, data: unknown): Promise<void> {
  try {
    await fs.mkdir(cacheDir(), { recursive: true });
    await fs.writeFile(cachePath(key), JSON.stringify(data), "utf8");
  } catch (error) {
    console.warn(`[content-cache] nie zapisano ${key}:`, error);
  }
}

/**
 * Zwraca dane ze pamięci / pliku. Przy braku — ładuje z DB i zapisuje snapshot.
 * Publiczne strony nie odpytują bazy przy każdym wejściu.
 */
export async function getCachedContent<T>(
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  if (memory.has(key)) {
    return memory.get(key) as T;
  }

  const fromFile = await readFileCache<T>(key);
  if (fromFile !== null) {
    memory.set(key, fromFile);
    return fromFile;
  }

  const data = await loader();
  memory.set(key, data);
  await writeFileCache(key, data);
  return data;
}

/** Po zmianie w panelu admina — przebudowuje snapshot i czyści pamięć. */
export async function refreshCachedContent<T>(
  key: string,
  loader: () => Promise<T>,
): Promise<T> {
  memory.delete(key);
  const data = await loader();
  memory.set(key, data);
  await writeFileCache(key, data);
  return data;
}

export const CONTENT_CACHE_KEYS = {
  team: "team",
  projects: "projects",
  cafe: "cafe",
} as const;
