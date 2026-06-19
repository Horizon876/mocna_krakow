/**
 * Pełna konfiguracja: .env → baza → Vercel env → deploy produkcyjny.
 * Uruchomienie: node scripts/configure-all.mjs
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function run(label, command, args = []) {
  console.log(`\n=== ${label} ===`);
  const r = spawnSync(command, args, {
    cwd: root,
    stdio: 'inherit',
    shell: true,
  });
  if (r.status !== 0) {
    console.error(`\n✗ ${label} — błąd (kod ${r.status})`);
    process.exit(r.status ?? 1);
  }
}

run('Uzupełnianie .env', 'node', ['scripts/ensure-env.mjs']);
run('Migracja bazy (drizzle push)', 'npm', ['run', 'db:push']);
run('Zmienne środowiskowe Vercel', 'npm', ['run', 'setup:vercel']);
run('Deploy produkcyjny', 'npm', ['run', 'deploy']);

console.log('\n=== Wszystko skonfigurowane ===');
console.log('Strona: https://mocna-krakow.vercel.app');
console.log('Panel:  https://mocna-krakow.vercel.app/admin/login');
