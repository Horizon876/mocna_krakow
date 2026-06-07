/**
 * Wgrywa tylko zmienne Resend do Vercel (production + preview).
 */
import { readFileSync, writeFileSync, unlinkSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve, dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const envPath = resolve(root, '.env');
const isWin = process.platform === 'win32';

if (!existsSync(envPath)) {
  console.error('Brak .env');
  process.exit(1);
}

const envMap = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const quoted = line.match(/^\s*([A-Z_]+)\s*=\s*"([^"]*)"\s*/);
  const plain = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
  const m = quoted || plain;
  if (m) envMap[m[1]] = m[2].trim();
}

function addEnv(name, target, value) {
  const tmp = join(tmpdir(), `vercel-env-${name}-${target}.txt`);
  writeFileSync(tmp, value.trim(), 'utf8');
  const cmd = isWin
    ? `powershell -NoProfile -Command "Get-Content -Raw '${tmp.replace(/'/g, "''")}' | npx vercel env add ${name} ${target} --force --yes"`
    : `cat "${tmp}" | npx vercel env add ${name} ${target} --force --yes`;
  const r = spawnSync(cmd, { cwd: root, encoding: 'utf8', shell: true });
  unlinkSync(tmp);
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    return false;
  }
  return true;
}

for (const name of ['RESEND_API_KEY', 'RESEND_FROM_EMAIL']) {
  const value = envMap[name];
  if (!value) {
    console.error(`Brak ${name} w .env`);
    process.exit(1);
  }
  for (const target of ['production', 'preview']) {
    console.log(`Ustawiam ${name} (${target})...`);
    if (!addEnv(name, target, value)) process.exit(1);
  }
}

console.log('Gotowe.');
