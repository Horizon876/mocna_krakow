/**
 * Generuje SESSION_SECRET i ADMIN_PASSWORD_HASH_B64.
 * Użycie: node scripts/gen-creds.mjs [haslo]
 * Domyślne hasło: admin123
 */
import { randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';

const password = process.argv[2] || 'admin123';
const sessionSecret = randomBytes(32).toString('hex');
const hash = await bcrypt.hash(password, 12);
const hashB64 = Buffer.from(hash, 'utf8').toString('base64');

console.log('\n=== Skopiuj do .env / Vercel Environment Variables ===\n');
console.log(`SESSION_SECRET="${sessionSecret}"`);
console.log(`ADMIN_PASSWORD_HASH_B64="${hashB64}"`);
console.log(`\nHasło admina: ${password}`);
console.log('(zmień przed produkcją)\n');
