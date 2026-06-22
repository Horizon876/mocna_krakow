import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { events, ticketOrders, tickets } from "../db/schema";
import { sendTicketEmail } from "./ticket-email";
import { generateTicketNumber, generateTicketQR } from "./ticket-generator";
import {
  releaseExpiredTicketReservations,
  releaseTicketOrderReservation,
  reserveEventSeats,
} from "./ticket-reservations";

export type FulfillTicketOrderResult =
  | {
      ok: true;
      alreadyProcessed: boolean;
      order: typeof ticketOrders.$inferSelect;
      event: typeof events.$inferSelect | null;
    }
  | {
      ok: false;
      reason: "not_found" | "invalid_status" | "expired_no_seats";
    };

/** Idempotentnie potwierdza opłacone zamówienie i generuje bilety. Miejsca są już zarezerwowane przy tworzeniu zamówienia. */
export async function fulfillPaidTicketOrder(
  orderId: string,
): Promise<FulfillTicketOrderResult> {
  const [order] = await db
    .select()
    .from(ticketOrders)
    .where(eq(ticketOrders.id, orderId));

  if (!order) {
    return { ok: false, reason: "not_found" };
  }

  if (order.status === "paid") {
    const [event] = await db
      .select()
      .from(events)
      .where(eq(events.id, order.eventId));
    return { ok: true, alreadyProcessed: true, order, event: event ?? null };
  }

  if (order.status !== "pending") {
    return { ok: false, reason: "invalid_status" };
  }

  const now = new Date();
  const reservationExpired =
    order.expiresAt !== null && order.expiresAt < now;

  if (reservationExpired) {
    await releaseTicketOrderReservation(orderId, "expired");
    const reclaimed = await reserveEventSeats(order.eventId, order.quantity);
    if (!reclaimed) {
      return { ok: false, reason: "expired_no_seats" };
    }
  } else {
    await releaseExpiredTicketReservations(order.eventId);
  }

  const [paidOrder] = await db
    .update(ticketOrders)
    .set({ status: "paid", expiresAt: null })
    .where(
      and(eq(ticketOrders.id, orderId), eq(ticketOrders.status, "pending")),
    )
    .returning();

  if (!paidOrder) {
    const [current] = await db
      .select()
      .from(ticketOrders)
      .where(eq(ticketOrders.id, orderId));
    if (current?.status === "paid") {
      const [event] = await db
        .select()
        .from(events)
        .where(eq(events.id, current.eventId));
      return {
        ok: true,
        alreadyProcessed: true,
        order: current,
        event: event ?? null,
      };
    }
    return { ok: false, reason: "invalid_status" };
  }

  const [event] = await db
    .select()
    .from(events)
    .where(eq(events.id, paidOrder.eventId));

  const existingTickets = await db
    .select({ id: tickets.id })
    .from(tickets)
    .where(eq(tickets.ticketOrderId, paidOrder.id))
    .limit(1);

  if (existingTickets.length === 0) {
    const generatedTickets = await Promise.all(
      Array.from({ length: paidOrder.quantity }, async () => {
        const ticketNumber = await generateTicketNumber();
        const qrDataUrl = await generateTicketQR(ticketNumber);
        await db.insert(tickets).values({
          ticketOrderId: paidOrder.id,
          eventId: paidOrder.eventId,
          ticketNumber,
          status: "active",
        });
        return { ticketNumber, qrDataUrl };
      }),
    );

    await sendTicketEmail({
      orderId: `${paidOrder.id.split("-")[0]}-${String(paidOrder.orderNumber || "").padStart(4, "0")}`,
      firstName: paidOrder.firstName,
      lastName: paidOrder.lastName,
      email: paidOrder.email,
      eventTitle: event?.title ?? "Wydarzenie",
      eventDate: event?.eventDate ?? new Date(),
      quantity: paidOrder.quantity,
      totalAmount: paidOrder.totalAmount,
      tickets: generatedTickets,
    });
  }

  return {
    ok: true,
    alreadyProcessed: false,
    order: paidOrder,
    event: event ?? null,
  };
}
