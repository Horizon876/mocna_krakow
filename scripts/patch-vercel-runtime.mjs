/**
 * Vercel wyłączył nodejs18.x — adapter Astro 4 nadal go generuje.
 * Po buildzie podmieniamy runtime na nodejs22.x.
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const functionsDir = '.vercel/output/functions';

function patchDir(dir) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) {
      patchDir(path);
      continue;
    }
    if (name !== '.vc-config.json') continue;

    const config = JSON.parse(readFileSync(path, 'utf8'));
    if (config.runtime === 'nodejs18.x') {
      config.runtime = 'nodejs22.x';
      writeFileSync(path, JSON.stringify(config, null, '\t') + '\n');
      console.log(`runtime → nodejs22.x: ${path}`);
    }
  }
}

patchDir(functionsDir);
