/**
 * Uzupełnia brakujące sekrety w .env (bez nadpisywania istniejących).
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');

if (!existsSync(envPath)) {
  console.error('Brak .env — skopiuj .env.example i uzupełnij.');
  process.exit(1);
}

const envMap = dotenv.parse(readFileSync(envPath));
let changed = false;

if (!envMap.REVALIDATE_SECRET?.trim()) {
  envMap.REVALIDATE_SECRET = randomBytes(32).toString('hex');
  changed = true;
  console.log('✓ Wygenerowano REVALIDATE_SECRET');
}

if (changed) {
  const lines = readFileSync(envPath, 'utf8').split(/\r?\n/);
  const keys = new Set(Object.keys(envMap));
  const out = [];

  for (const line of lines) {
    const m = line.match(/^([A-Z0-9_]+)=/);
    if (m && keys.has(m[1]) && envMap[m[1]] !== undefined) {
      const val = envMap[m[1]];
      out.push(`${m[1]}=${val.includes(' ') || val.includes('<') ? `"${val}"` : val}`);
      delete envMap[m[1]];
    } else {
      out.push(line);
    }
  }

  for (const [key, val] of Object.entries(envMap)) {
    if (!lines.some((l) => l.startsWith(`${key}=`))) {
      out.push(`${key}=${val.includes(' ') || val.includes('<') ? `"${val}"` : val}`);
    }
  }

  writeFileSync(envPath, out.join('\n') + '\n', 'utf8');
}

console.log('Zmienne .env — gotowe.');
