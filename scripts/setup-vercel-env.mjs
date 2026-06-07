/**
 * Wgrywa zmienne z .env do Vercel.
 * Wymaga: npx vercel login + npx vercel link
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
  console.error('Brak .env — skopiuj .env.example i uzupełnij.');
  process.exit(1);
}

const envMap = {};
for (const line of readFileSync(envPath, 'utf8').split('\n')) {
  const quoted = line.match(/^\s*([A-Z_]+)\s*=\s*"([^"]*)"\s*/);
  const plain = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
  const m = quoted || plain;
  if (m) envMap[m[1]] = m[2].trim();
}

const vars = [
  'DATABASE_URL',
  'SESSION_SECRET',
  'ADMIN_PASSWORD_HASH_B64',
  'BLOB_READ_WRITE_TOKEN',
  'RESEND_API_KEY',
  'RESEND_FROM_EMAIL',
];
const targets = ['production', 'preview', 'development'];

function runShell(command) {
  const r = spawnSync(command, {
    cwd: root,
    encoding: 'utf8',
    shell: true,
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (r.status !== 0) {
    console.error(r.stderr || r.stdout);
    return false;
  }
  return true;
}

function addEnv(name, target, value) {
  const tmp = join(tmpdir(), `vercel-env-${name}-${target}.txt`);
  writeFileSync(tmp, value.trim(), 'utf8');
  const cmd = isWin
    ? `powershell -NoProfile -Command "Get-Content -Raw '${tmp.replace(/'/g, "''")}' | npx vercel env add ${name} ${target} --force --yes"`
    : `cat "${tmp}" | npx vercel env add ${name} ${target} --force --yes`;
  const ok = runShell(cmd);
  unlinkSync(tmp);
  return ok;
}

console.log('Sprawdzam logowanie Vercel...');
if (!runShell('npx vercel whoami')) {
  console.error('Zaloguj się: npx vercel login');
  process.exit(1);
}

if (!existsSync(resolve(root, '.vercel/project.json'))) {
  console.log('Łączenie projektu...');
  runShell('npx vercel link --yes');
}

for (const name of vars) {
  const value = envMap[name];
  if (!value) {
    if (name === 'BLOB_READ_WRITE_TOKEN') {
      console.log(`Pomijam ${name} — utwórz Blob Storage w Vercel Dashboard`);
      continue;
    }
    if (name === 'RESEND_FROM_EMAIL') {
      console.log(`Pomijam ${name} — użyty zostanie domyślny nadawca Resend`);
      continue;
    }
    console.error(`Brak ${name} w .env`);
    process.exit(1);
  }
  for (const target of targets) {
    console.log(`Ustawiam ${name} (${target})...`);
    if (!addEnv(name, target, value)) {
      process.exit(1);
    }
  }
}

console.log('\nGotowe. Deploy: npm run deploy');
