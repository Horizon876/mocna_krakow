import type { APIRoute } from 'astro';
import { db } from '../../db';
import { reservations } from '../../db/schema';
import { and, lt, gt, ne } from 'drizzle-orm';

export const GET: APIRoute = async ({ url }) => {
  const date = url.searchParams.get('date')?.trim();
  const time = url.searchParams.get('time')?.trim();

  const empty = new Response(JSON.stringify([]), {
    headers: { 'Content-Type': 'application/json' },
  });

  if (!date || !time) return empty;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return empty;
  if (!/^\d{2}:\d{2}$/.test(time)) return empty;

  const [year, month, day] = date.split('-').map(Number);
  const [hour, minute]     = time.split(':').map(Number);
  const slotStart = new Date(year, month - 1, day, hour, minute, 0, 0);
  const slotEnd   = new Date(slotStart.getTime() + 60 * 60 * 1000);

  if (isNaN(slotStart.getTime())) return empty;

  const rows = await db
    .select({ tableId: reservations.tableId })
    .from(reservations)
    .where(
      and(
        ne(reservations.status, 'cancelled'),
        lt(reservations.startsAt, slotEnd),
        gt(reservations.endsAt,   slotStart),
      )
    );

  const ids = [...new Set(rows.map((r) => r.tableId))];

  return new Response(JSON.stringify(ids), {
    headers: { 'Content-Type': 'application/json' },
  });
};
