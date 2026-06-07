import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client);

async function main() {
  const res = await client`select * from orders`;
  console.log('Orders in DB:', res.length);
  console.log(res);
  process.exit(0);
}
main();
