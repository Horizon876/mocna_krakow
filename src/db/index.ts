import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = import.meta.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL nie jest ustawiony. Skopiuj .env.example do .env i uzupełnij zmienne.');
}

// prepare: false — wymagane dla connection poolerów (Neon, Supabase, Vercel Postgres)
export const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
