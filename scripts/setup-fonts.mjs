/**
 * Pobiera fonty Fontshare (Clash Display, Satoshi) do public/fonts/
 * i generuje src/styles/fonts.css z długim cache po stronie Vercel.
 */
import { mkdir, writeFile, readFile, access } from "node:fs/promises";
import { join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const FONTS_DIR = join(ROOT, "public", "fonts");
const CSS_OUT = join(ROOT, "src", "styles", "fonts.css");

const FONTSHARE_CSS =
  "https://api.fontshare.com/v2/css?f[]=clash-display@600,700&f[]=satoshi@300,400,500,700&display=swap";

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

function normalizeUrl(raw) {
  if (raw.startsWith("//")) return `https:${raw}`;
  return raw;
}

async function main() {
  await mkdir(FONTS_DIR, { recursive: true });

  const res = await fetch(FONTSHARE_CSS);
  if (!res.ok) throw new Error(`Fontshare CSS failed: ${res.status}`);
  const remoteCss = await res.text();

  const woff2Urls = [
    ...remoteCss.matchAll(/url\(['"]?(\/\/cdn\.fontshare\.com\/[^)'"]+\.woff2)['"]?\)/g),
  ].map((m) => normalizeUrl(m[1]));
  const unique = [...new Set(woff2Urls)];

  const urlMap = new Map();
  for (const url of unique) {
    const file = basename(new URL(url).pathname);
    const localPath = join(FONTS_DIR, file);
    if (!(await exists(localPath))) {
      const fontRes = await fetch(url);
      if (!fontRes.ok) throw new Error(`Font download failed: ${url}`);
      await writeFile(localPath, Buffer.from(await fontRes.arrayBuffer()));
      console.log(`fonts: downloaded ${file}`);
    }
    urlMap.set(url, `/fonts/${file}`);
  }

  let css = remoteCss.replace(
    /url\(['"]?(\/\/cdn\.fontshare\.com\/[^)'"]+\.woff2)['"]?\)\s*format\('woff2'\),?\s*\n?\s*url\(['"]?\/\/cdn\.fontshare\.com\/[^)'"]+\.woff['"]?\)[^;]*;?/g,
    (match, rawUrl) => {
      const url = normalizeUrl(rawUrl);
      const local = urlMap.get(url);
      return local ? `url('${local}') format('woff2');` : match;
    },
  );

  css = `/* Self-hosted Fontshare — cache via vercel.json */\n${css}`;

  await writeFile(CSS_OUT, css, "utf8");
  console.log(`fonts: wrote ${CSS_OUT} (${unique.length} woff2 files)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
