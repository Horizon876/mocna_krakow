import { db } from '../db';
import { reservations } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import { sendReservationCancellation } from './reservation-email';

export type ReservationRow = typeof reservations.$inferSelect;

export async function findConfirmedByCancelToken(token: string) {
  const rows = await db
    .select()
    .from(reservations)
    .where(and(eq(reservations.cancelToken, token), eq(reservations.status, 'confirmed')))
    .limit(1);
  return rows[0] ?? null;
}

export async function findByCancelToken(token: string) {
  const rows = await db
    .select()
    .from(reservations)
    .where(eq(reservations.cancelToken, token))
    .limit(1);
  return rows[0] ?? null;
}

async function notifyCancellation(reservation: ReservationRow) {
  await sendReservationCancellation({
    firstName: reservation.firstName,
    lastName: reservation.lastName,
    email: reservation.email,
    tableId: reservation.tableId,
    reservationDate: reservation.reservationDate,
    reservationTime: reservation.reservationTime,
  });
}

export async function cancelReservationById(id: string) {
  const rows = await db
    .update(reservations)
    .set({ status: 'cancelled' })
    .where(and(eq(reservations.id, id), eq(reservations.status, 'confirmed')))
    .returning();

  const reservation = rows[0];
  if (!reservation) return null;

  await notifyCancellation(reservation);
  return reservation;
}

export async function cancelReservationByToken(token: string) {
  const rows = await db
    .update(reservations)
    .set({ status: 'cancelled' })
    .where(and(eq(reservations.cancelToken, token), eq(reservations.status, 'confirmed')))
    .returning();

  const reservation = rows[0];
  if (!reservation) return null;

  await notifyCancellation(reservation);
  return reservation;
}
