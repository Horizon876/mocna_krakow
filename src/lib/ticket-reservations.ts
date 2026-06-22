import { and, eq, lt, sql } from "drizzle-orm";
import { db } from "../db";
import { events, ticketOrders } from "../db/schema";

export const TICKET_RESERVATION_MINUTES = 5;
export const TICKET_RESERVATION_MS = TICKET_RESERVATION_MINUTES * 60 * 1000;

export function getReservationExpiresAt(from = new Date()): Date {
  return new Date(from.getTime() + TICKET_RESERVATION_MS);
}

/** Atomowo rezerwuje miejsca (zwiększa enrolled_count). Zwraca wiersz eventu lub null przy braku miejsc. */
export async function reserveEventSeats(eventId: string, quantity: number) {
  const rows = await db
    .update(events)
    .set({ enrolledCount: sql`${events.enrolledCount} + ${quantity}` })
    .where(
      and(
        eq(events.id, eventId),
        eq(events.status, "active"),
        sql`${events.enrolledCount} + ${quantity} <= ${events.seatLimit}`,
      ),
    )
    .returning({
      id: events.id,
      seatLimit: events.seatLimit,
      enrolledCount: events.enrolledCount,
    });

  return rows[0] ?? null;
}

/** Zmniejsza enrolled_count bez zmiany zamówienia (np. gdy insert zamówienia się nie powiódł). */
export async function releaseEventSeats(eventId: string, quantity: number) {
  await db
    .update(events)
    .set({
      enrolledCount: sql`GREATEST(0, ${events.enrolledCount} - ${quantity})`,
    })
    .where(eq(events.id, eventId));
}

/** Zwalnia rezerwację pending zamówienia i zmniejsza enrolled_count. */
export async function releaseTicketOrderReservation(
  orderId: string,
  newStatus: "cancelled" | "expired" = "cancelled",
) {
  const [released] = await db
    .update(ticketOrders)
    .set({ status: newStatus, expiresAt: null })
    .where(
      and(eq(ticketOrders.id, orderId), eq(ticketOrders.status, "pending")),
    )
    .returning();

  if (!released) return null;

  await db
    .update(events)
    .set({
      enrolledCount: sql`GREATEST(0, ${events.enrolledCount} - ${released.quantity})`,
    })
    .where(eq(events.id, released.eventId));

  return released;
}

/** Zwalnia wygasłe rezerwacje (pending + expiresAt < now). */
export async function releaseExpiredTicketReservations(
  eventId?: string,
): Promise<void> {
  const now = new Date();
  const conditions = [
    eq(ticketOrders.status, "pending"),
    lt(ticketOrders.expiresAt, now),
  ];
  if (eventId) {
    conditions.push(eq(ticketOrders.eventId, eventId));
  }

  const expired = await db
    .select({ id: ticketOrders.id })
    .from(ticketOrders)
    .where(and(...conditions));

  await Promise.all(
    expired.map(({ id }) => releaseTicketOrderReservation(id, "expired")),
  );
}

/** Czyści wygasłe rezerwacje i zwraca aktualną dostępność miejsc. */
export async function getEventSeatAvailability(eventId: string) {
  await releaseExpiredTicketReservations(eventId);
  const [event] = await db
    .select({
      seatLimit: events.seatLimit,
      enrolledCount: events.enrolledCount,
    })
    .from(events)
    .where(eq(events.id, eventId));

  if (!event) return null;

  return {
    seatLimit: event.seatLimit,
    enrolledCount: event.enrolledCount,
    available: Math.max(0, event.seatLimit - event.enrolledCount),
  };
}
