import type { APIRoute } from 'astro';
import { db } from '../../db';
import { reservations } from '../../db/schema';
import { and, eq, lt, gt, ne } from 'drizzle-orm';
import { sendReservationConfirmation } from '../../lib/reservation-email';

function jsonResponse(body: object, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const POST: APIRoute = async ({ request }) => {
  // --- Zabezpieczenie CSRF ---
  const isDev = import.meta.env.DEV;
  if (!isDev) {
    const originHeader = request.headers.get('origin');
    const refererHeader = request.headers.get('referer');
    const requestUrl = new URL(request.url);
    const origin = originHeader || (refererHeader ? new URL(refererHeader).origin : null);
    
    // Upewnij się, że żądanie pochodzi z naszej domeny
    if (!origin || new URL(origin).host !== requestUrl.host) {
      return jsonResponse({ success: false, error: 'csrf', message: 'Niedozwolone żądanie (CSRF).' }, 403);
    }
  }
  // ---------------------------
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return jsonResponse({ success: false, error: 'validation', message: 'Nieprawidłowe dane formularza.' }, 400);
  }

  const tableId         = formData.get('tableId')?.toString().trim()         ?? '';
  const reservationDate = formData.get('reservationDate')?.toString().trim() ?? '';
  const reservationTime = formData.get('reservationTime')?.toString().trim() ?? '';
  const firstName       = formData.get('firstName')?.toString().trim()       ?? '';
  const lastName        = formData.get('lastName')?.toString().trim()        ?? '';
  const email           = formData.get('email')?.toString().trim()           ?? '';
  const phone           = formData.get('phone')?.toString().trim()           || null;
  const notes           = formData.get('notes')?.toString().trim()           || null;

  if (!tableId || !reservationDate || !reservationTime || !firstName || !lastName || !email) {
    return jsonResponse({
      success: false,
      error: 'validation',
      message: 'Uzupełnij wszystkie wymagane pola: imię, nazwisko i e-mail.',
    }, 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return jsonResponse({
      success: false,
      error: 'validation',
      message: 'Podaj prawidłowy adres e-mail.',
    }, 400);
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(reservationDate) || !/^\d{2}:\d{2}$/.test(reservationTime)) {
    return jsonResponse({
      success: false,
      error: 'validation',
      message: 'Nieprawidłowa data lub godzina rezerwacji.',
    }, 400);
  }

  const [year, month, day] = reservationDate.split('-').map(Number);
  const [hour, minute]     = reservationTime.split(':').map(Number);
  const startsAt = new Date(year, month - 1, day, hour, minute, 0, 0);
  const endsAt   = new Date(startsAt.getTime() + 60 * 60 * 1000);

  if (isNaN(startsAt.getTime())) {
    return jsonResponse({
      success: false,
      error: 'validation',
      message: 'Nieprawidłowa data lub godzina rezerwacji.',
    }, 400);
  }

  const conflicting = await db
    .select({ id: reservations.id })
    .from(reservations)
    .where(
      and(
        eq(reservations.tableId, tableId),
        ne(reservations.status, 'cancelled'),
        lt(reservations.startsAt, endsAt),
        gt(reservations.endsAt,   startsAt),
      )
    )
    .limit(1);

  if (conflicting.length > 0) {
    return jsonResponse({
      success: false,
      error: 'conflict',
      message: 'Ten stolik jest już zajęty w wybranym terminie. Wybierz inny stolik lub zmień godzinę.',
      tableId,
      date: reservationDate,
      time: reservationTime,
    }, 409);
  }

  try {
    const [created] = await db.insert(reservations).values({
      tableId,
      reservationDate,
      reservationTime,
      startsAt,
      endsAt,
      firstName,
      lastName,
      email,
      phone,
      notes,
    }).returning();

    await sendReservationConfirmation({
      firstName,
      lastName,
      email,
      tableId,
      reservationDate,
      reservationTime,
      phone,
      notes,
      cancelToken: created.cancelToken,
    });

    return jsonResponse({ success: true, tableId, date: reservationDate, time: reservationTime });
  } catch (err: any) {
    const isUnique = err?.code === '23505' || String(err?.constraint ?? '').includes('table_slot');
    if (isUnique) {
      return jsonResponse({
        success: false,
        error: 'conflict',
        message: 'Ten stolik jest już zajęty w wybranym terminie. Wybierz inny stolik lub zmień godzinę.',
        tableId,
        date: reservationDate,
        time: reservationTime,
      }, 409);
    }
    console.error('[reservations] błąd zapisu:', err);
    return jsonResponse({
      success: false,
      error: 'server',
      message: 'Wystąpił błąd serwera. Spróbuj ponownie za chwilę.',
    }, 500);
  }
};
