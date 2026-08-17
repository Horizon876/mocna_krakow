/**
 * Generuje lekkie warianty WebP dla logo i zdjęć na stronie głównej.
 * Wyniki: public/_optimized/...
 */
import sharp from "sharp";
import { mkdir, readFile, writeFile, access, readdir, stat } from "node:fs/promises";
import { join, dirname, basename, extname, relative } from "node:path";
import { createHash } from "node:crypto";

const ROOT = new URL("..", import.meta.url).pathname.replace(/^\/([A-Z]:)/, "$1");
const OUT_DIR = join(ROOT, "public", "_optimized");
const MANIFEST = join(ROOT, "scripts", ".cache", "image-manifest.json");

const LOGO_WIDTHS = [128, 256];
const PHOTO_WIDTHS = [480, 960, 1440];

/** Ścieżki względem public/ — homepage Lighthouse */
const LOGO_PATHS = [
  "media/logos/malopolskie.png",
  "media/logos/instagram.jpg",
  "media/logos/eska.png",
  "media/logos/gosc.jpg",
  "media/logos/pfron.jpg",
  "media/logos/facebook.png",
  "media/logos/radiownet.png",
  "media/logos/onet.png",
  "media/logos/razemztoba.jpg",
  "media/logos/orly.png",
  "media/logos/krakow.png",
  "media/logos/logo_malopolska.png",
  "photos/integracja.png",
  "photos/logo_tvp.jpg",
];

const PHOTO_PATHS = [
  "photos/poznaj_mocna.jpeg",
  "photos/zespol.jpeg",
];

const RASTER_EXT = new Set([".jpg", ".jpeg", ".png", ".webp"]);

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function fileSignature(absPath) {
  const buf = await readFile(absPath);
  const st = await stat(absPath);
  const hash = createHash("md5").update(buf).digest("hex");
  return `${st.size}:${st.mtimeMs}:${hash}`;
}

async function loadManifest() {
  if (!(await exists(MANIFEST))) return {};
  try {
    return JSON.parse(await readFile(MANIFEST, "utf8"));
  } catch {
    return {};
  }
}

async function saveManifest(manifest) {
  await mkdir(dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + "\n", "utf8");
}

async function optimizeOne(publicRel, widths, quality) {
  const absIn = join(ROOT, "public", publicRel);
  if (!(await exists(absIn))) {
    console.warn(`images: skip missing ${publicRel}`);
    return;
  }

  const sig = await fileSignature(absIn);
  const manifest = await loadManifest();
  const key = `public/${publicRel.replace(/\\/g, "/")}`;

  const stem = publicRel.replace(/\\/g, "/").replace(/\.[^.]+$/, "");
  const outBase = join(OUT_DIR, stem);
  await mkdir(dirname(outBase), { recursive: true });

  const expectedOut = widths.map((w) => `${outBase}-${w}.webp`);
  if (manifest[key] === sig && (await Promise.all(expectedOut.map(exists))).every(Boolean)) {
    return;
  }

  const input = sharp(absIn);
  const meta = await input.metadata();

  for (const w of widths) {
    const targetW = Math.min(w, meta.width ?? w);
    const outPath = `${outBase}-${w}.webp`;
    await sharp(absIn)
      .rotate()
      .resize({ width: targetW, withoutEnlargement: true })
      .webp({ quality, effort: 4 })
      .toFile(outPath);
  }

  manifest[key] = sig;
  await saveManifest(manifest);
  console.log(`images: optimized ${publicRel}`);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });

  for (const p of LOGO_PATHS) {
    await optimizeOne(p, LOGO_WIDTHS, 82);
  }
  for (const p of PHOTO_PATHS) {
    await optimizeOne(p, PHOTO_WIDTHS, 80);
  }

  console.log("images: done");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
