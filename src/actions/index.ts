import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { db } from '../db';
import { products, events, reservations, orders, ticketOrders, tickets, cafePhotos } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import Stripe from 'stripe';
import { createSessionToken, COOKIE_NAME_EXPORT, SESSION_DURATION_SEC } from '../lib/session';
import { saveImage } from '../lib/upload';
import { cancelReservationById } from '../lib/reservations';
import { sendOrderEmail } from '../lib/order-email';
import { sendTicketEmail, sendTicketPendingEmail } from '../lib/ticket-email';
import { parseInPostPointAddress } from '../lib/inpost-point';
import { generateTicketNumber, generateTicketQR } from '../lib/ticket-generator';


export const server = {
  createProduct: defineAction({
    accept: 'form',
    input: z.object({
      name: z.string().min(1, 'Nazwa produktu jest wymagana'),
      description: z.string().optional(),
      price: z.number({ coerce: true }).int('Cena musi być liczbą całkowitą').min(0, 'Cena nie może być ujemna').max(10000000, 'Cena jest zbyt wysoka'),
      imageFile: z.any().optional(),
      availabilityStatus: z.enum(['available', 'unavailable']).default('available'),
    }),
    handler: async (input) => {
      try {
        let imageUrl = null;
        if (input.imageFile && input.imageFile instanceof File && input.imageFile.size > 0) {
          imageUrl = await saveImage(input.imageFile);
        }

        const result = await db.insert(products).values({
          name: input.name,
          description: input.description,
          price: input.price, // in grosze
          imageUrl: imageUrl,
          availabilityStatus: input.availabilityStatus,
        }).returning();
        return { success: true, product: result[0] };
      } catch (error) {
        throw new Error('Błąd podczas tworzenia produktu');
      }
    },
  }),
  
  updateProduct: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
      name: z.string().min(1, 'Nazwa produktu jest wymagana'),
      description: z.string().optional(),
      price: z.number({ coerce: true }).int('Cena musi być liczbą całkowitą').min(0, 'Cena nie może być ujemna').max(10000000, 'Cena jest zbyt wysoka'),
      imageFile: z.any().optional(),
      existingImageUrl: z.string().optional(),
      availabilityStatus: z.enum(['available', 'unavailable']).default('available'),
    }),
    handler: async (input) => {
      try {
        let imageUrl = input.existingImageUrl || null;
        if (input.imageFile && input.imageFile instanceof File && input.imageFile.size > 0) {
          imageUrl = await saveImage(input.imageFile);
        }

        const result = await db.update(products).set({
          name: input.name,
          description: input.description,
          price: input.price,
          imageUrl: imageUrl,
          availabilityStatus: input.availabilityStatus,
        }).where(eq(products.id, input.id)).returning();
        return { success: true, product: result[0] };
      } catch (error) {
        throw new Error('Błąd podczas aktualizacji produktu');
      }
    },
  }),

  deleteProduct: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        await db.delete(products).where(eq(products.id, input.id));
        return { success: true };
      } catch (error) {
        throw new Error('Błąd podczas usuwania produktu');
      }
    },
  }),

  createEvent: defineAction({
    accept: 'form',
    input: z.object({
      title: z.string().min(1, 'Tytuł wydarzenia jest wymagany'),
      kategoria: z.string().default('Wydarzenie'),
      longDescription: z.string().optional(),
      shortDescription: z.string().optional(),
      eventDate: z.string().pipe(z.coerce.date()),
      ticketPrice: z.number({ coerce: true }).int('Cena musi być liczbą całkowitą').min(0, 'Cena biletu nie może być ujemna').max(10000000, 'Cena jest zbyt wysoka'),
      seatLimit: z.number({ coerce: true }).int('Limit miejsc musi być liczbą całkowitą').min(1, 'Limit miejsc musi być większy od 0').max(10000, 'Limit miejsc jest zbyt wysoki'),
      status: z.enum(['active', 'cancelled', 'completed']).default('active'),
      imageFile: z.any().optional(),
      imageAlt: z.string().optional(),
      color: z.enum(['orange', 'red', 'yellow', 'blue', 'green', 'pink', 'graphite']).default('orange'),
      link: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        let imageUrl = null;
        if (input.imageFile && input.imageFile instanceof File && input.imageFile.size > 0) {
          imageUrl = await saveImage(input.imageFile);
        }

        const result = await db.insert(events).values({
          title: input.title,
          kategoria: input.kategoria,
          longDescription: input.longDescription,
          shortDescription: input.shortDescription,
          eventDate: input.eventDate,
          ticketPrice: input.ticketPrice, // in grosze
          seatLimit: input.seatLimit,
          status: input.status,
          imageUrl: imageUrl,
          imageAlt: input.imageAlt,
          color: input.color,
          link: input.link,
        }).returning();
        return { success: true, event: result[0] };
      } catch (error) {
        throw new Error('Błąd podczas tworzenia wydarzenia');
      }
    },
  }),

  updateEvent: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
      title: z.string().min(1, 'Tytuł wydarzenia jest wymagany'),
      kategoria: z.string().default('Wydarzenie'),
      longDescription: z.string().optional(),
      shortDescription: z.string().optional(),
      eventDate: z.string().pipe(z.coerce.date()),
      ticketPrice: z.number({ coerce: true }).int('Cena musi być liczbą całkowitą').min(0, 'Cena biletu nie może być ujemna').max(10000000, 'Cena jest zbyt wysoka'),
      seatLimit: z.number({ coerce: true }).int('Limit miejsc musi być liczbą całkowitą').min(1, 'Limit miejsc musi być większy od 0').max(10000, 'Limit miejsc jest zbyt wysoki'),
      status: z.enum(['active', 'cancelled', 'completed']).default('active'),
      imageFile: z.any().optional(),
      existingImageUrl: z.string().optional(),
      imageAlt: z.string().optional(),
      color: z.enum(['orange', 'red', 'yellow', 'blue', 'green', 'pink', 'graphite']).default('orange'),
      link: z.string().optional(),
    }),
    handler: async (input) => {
      try {
        let imageUrl = input.existingImageUrl || null;
        if (input.imageFile && input.imageFile instanceof File && input.imageFile.size > 0) {
          imageUrl = await saveImage(input.imageFile);
        }

        const result = await db.update(events).set({
          title: input.title,
          kategoria: input.kategoria,
          longDescription: input.longDescription,
          shortDescription: input.shortDescription,
          eventDate: input.eventDate,
          ticketPrice: input.ticketPrice,
          seatLimit: input.seatLimit,
          status: input.status,
          imageUrl: imageUrl,
          imageAlt: input.imageAlt,
          color: input.color,
          link: input.link,
        }).where(eq(events.id, input.id)).returning();
        return { success: true, event: result[0] };
      } catch (error) {
        throw new Error('Błąd podczas aktualizacji wydarzenia');
      }
    },
  }),

  deleteEvent: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        await db.delete(events).where(eq(events.id, input.id));
        return { success: true };
      } catch (error) {
        throw new Error('Błąd podczas usuwania wydarzenia');
      }
    },
  }),

  // ─── REZERWACJE ─────────────────────────────────────────────────────────────

  cancelReservation: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input) => {
      const reservation = await cancelReservationById(input.id);
      if (!reservation) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Rezerwacja nie istnieje lub jest już anulowana.',
        });
      }
      return { success: true };
    },
  }),

  deleteReservation: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input) => {
      const result = await db
        .delete(reservations)
        .where(and(eq(reservations.id, input.id), eq(reservations.status, 'cancelled')))
        .returning({ id: reservations.id });

      if (result.length === 0) {
        throw new ActionError({
          code: 'BAD_REQUEST',
          message: 'Można usunąć tylko anulowane rezerwacje.',
        });
      }

      return { success: true };
    },
  }),

  // ─── ZAMÓWIENIA ─────────────────────────────────────────────────────────────

  createOrder: defineAction({
    accept: 'json',
    input: z.object({
      firstName: z.string().min(1, 'Imię jest wymagane'),
      lastName: z.string().min(1, 'Nazwisko jest wymagane'),
      email: z.string().email('Nieprawidłowy adres email'),
      phone: z.string().min(1, 'Telefon jest wymagany'),
      address: z.string().min(1, 'Adres jest wymagany'),
      zipCode: z.string().min(1, 'Kod pocztowy jest wymagany'),
      city: z.string().min(1, 'Miasto jest wymagane'),
      shippingMethod: z.enum(['courier', 'paczkomat']),
      paymentMethod: z.enum(['online', 'cod']),
      paczkomatPoint: z.string().optional(), // JSON string z danymi paczkomatu
      items: z.array(z.any()),
      totalAmount: z.number(), // subtotal from cart (PLN)
    }),
    handler: async (input, context) => {
      try {
        // Uzupełnij adres z paczkomatu, gdy klient nie podał kodu/miasta
        let { address, zipCode, city } = input;
        if (input.shippingMethod === 'paczkomat' && input.paczkomatPoint) {
          try {
            const parsed = parseInPostPointAddress(JSON.parse(input.paczkomatPoint));
            address = parsed.address || address;
            zipCode = parsed.zipCode || zipCode;
            city = parsed.city || city;
          } catch { /* ignoruj niepoprawny JSON */ }
        }

        const shippingCost = input.shippingMethod === 'paczkomat' ? 1500 : 2000;
        const paymentCost = input.paymentMethod === 'cod' ? 500 : 0;
        const finalAmount = Math.round(input.totalAmount * 100) + shippingCost + paymentCost;

        const result = await db.insert(orders).values({
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          address,
          zipCode,
          city,
          shippingMethod: input.shippingMethod,
          paymentMethod: input.paymentMethod,
          totalAmount: finalAmount,
          items: JSON.stringify(input.items),
          status: 'pending',
          paczkomatPoint: input.paczkomatPoint ?? null,
        }).returning();

        const order = result[0];

        // Wyślij email potwierdzający złożenie zamówienia
        const itemsForEmail = input.items.map((it: any) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
        }));
        await sendOrderEmail({
          orderId: order.id,
          firstName: order.firstName,
          lastName: order.lastName,
          email: order.email,
          phone: order.phone,
          address: order.address,
          zipCode: order.zipCode,
          city: order.city,
          shippingMethod: order.shippingMethod,
          paymentMethod: order.paymentMethod,
          totalAmount: order.totalAmount,
          items: itemsForEmail,
          paczkomatPoint: order.paczkomatPoint,
          status: 'pending',
        }, 'pending');

        if (input.paymentMethod === 'online') {
          const origin = new URL(context.request.url).origin;
          const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string, {
            apiVersion: '2024-10-28.acacia',
          });

          const lineItems = input.items.map((item: any) => {
            const amountStr = item.price.toString();
            const match = amountStr.match(/(\d+(?:[.,]\d+)?)/);
            const parsedAmount = match ? parseFloat(match[1].replace(',', '.')) : 0;
            const unitAmount = Math.round(parsedAmount * 100);

            return {
              price_data: {
                currency: 'pln',
                product_data: {
                  name: item.name,
                  images: item.image ? [item.image.startsWith('http') ? item.image : new URL(item.image, origin).href] : [],
                },
                unit_amount: unitAmount,
              },
              quantity: item.qty,
            };
          });

          const shippingLabel = input.shippingMethod === 'paczkomat' ? 'Paczkomat InPost' : 'Kurier';
          lineItems.push({
            price_data: { currency: 'pln', product_data: { name: shippingLabel }, unit_amount: shippingCost },
            quantity: 1,
          });
          if (paymentCost > 0) {
            lineItems.push({
              price_data: { currency: 'pln', product_data: { name: 'Opłata za pobranie' }, unit_amount: paymentCost },
              quantity: 1,
            });
          }

          const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'blik', 'p24'],
            line_items: lineItems,
            mode: 'payment',
            client_reference_id: order.id,
            success_url: `${origin}/checkout/success?order_id=${order.id}`,
            cancel_url: `${origin}/checkout/cancel?order_id=${order.id}`,
          });

          return { success: true, redirectUrl: session.url };
        }

        return { success: true, orderId: order.id };
      } catch (error: any) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    },
  }),

  updateOrderStatus: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
      status: z.enum(['pending', 'confirmed', 'paid', 'processing', 'shipped', 'cancelled']),
    }),
    handler: async (input) => {
      try {
        await db.update(orders).set({ status: input.status }).where(eq(orders.id, input.id));

        // Wyślij email powiadamiający o zmianie statusu
        const [order] = await db.select().from(orders).where(eq(orders.id, input.id));
        if (order) {
          let items: Array<{ name: string; qty: number; price: string }> = [];
          try { items = JSON.parse(order.items); } catch { /* ignoruj */ }
          sendOrderEmail({
            orderId: order.id,
            firstName: order.firstName,
            lastName: order.lastName,
            email: order.email,
            phone: order.phone,
            address: order.address,
            zipCode: order.zipCode,
            city: order.city,
            shippingMethod: order.shippingMethod,
            paymentMethod: order.paymentMethod,
            totalAmount: order.totalAmount,
            items,
            paczkomatPoint: order.paczkomatPoint,
            status: input.status,
          }, input.status).catch(err => console.error('[order-email] updateStatus:', err));
        }

        return { success: true };
      } catch (error) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Nie udało się zaktualizować statusu' });
      }
    },
  }),

  deleteOrder: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        await db.delete(orders).where(eq(orders.id, input.id));
        return { success: true };
      } catch (error) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Nie udało się usunąć zamówienia' });
      }
    },
  }),

  // ─── KAWIARNIA (GALERIA) ────────────────────────────────────────────────────

  createCafePhoto: defineAction({
    accept: 'form',
    input: z.object({
      alt: z.string().optional(),
      imageFile: z.any().refine(
        (f) => f instanceof File && f.size > 0,
        'Zdjęcie jest wymagane',
      ),
    }),
    handler: async (input) => {
      try {
        const imageUrl = await saveImage(input.imageFile);
        const result = await db.insert(cafePhotos).values({
          imageUrl,
          alt: input.alt?.trim() || 'Zdjęcie z kawiarni MOCna!',
        }).returning();
        return { success: true, photo: result[0] };
      } catch (error) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Błąd podczas dodawania zdjęcia' });
      }
    },
  }),

  deleteCafePhoto: defineAction({
    accept: 'form',
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        await db.delete(cafePhotos).where(eq(cafePhotos.id, input.id));
        return { success: true };
      } catch (error) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: 'Błąd podczas usuwania zdjęcia' });
      }
    },
  }),

  // ─── BILETY ─────────────────────────────────────────────────────────────────

  createTicketOrder: defineAction({
    accept: 'json',
    input: z.object({
      eventId: z.string().min(1),
      firstName: z.string().min(1, 'Imię jest wymagane'),
      lastName: z.string().min(1, 'Nazwisko jest wymagane'),
      email: z.string().email('Nieprawidłowy adres email'),
      phone: z.string().min(1, 'Telefon jest wymagany'),
      quantity: z.number().int().min(1).max(20),
    }),
    handler: async (input, context) => {
      try {
        const [event] = await db.select().from(events).where(eq(events.id, input.eventId));
        if (!event) {
          throw new ActionError({ code: 'NOT_FOUND', message: 'Wydarzenie nie istnieje.' });
        }
        if (event.status !== 'active') {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'To wydarzenie nie jest już dostępne.' });
        }
        const available = event.seatLimit - event.enrolledCount;
        if (input.quantity > available) {
          const limitInfo = `${event.enrolledCount}/${event.seatLimit}`;
          const message = available <= 0
            ? `Limit miejsc: ${limitInfo}. Wszystkie miejsca zostały zarezerwowane.`
            : `Limit miejsc: ${limitInfo}. Dostępnych jest tylko ${available}.`;
          throw new ActionError({ code: 'BAD_REQUEST', message });
        }

        const totalAmount = event.ticketPrice * input.quantity;

        const result = await db.insert(ticketOrders).values({
          eventId: input.eventId,
          firstName: input.firstName,
          lastName: input.lastName,
          email: input.email,
          phone: input.phone,
          quantity: input.quantity,
          totalAmount,
          status: 'pending',
        }).returning();

        const order = result[0];

        const origin = new URL(context.request.url).origin;

        // Bezpłatne wydarzenie — pomiń Stripe, generuj bilety od razu
        if (event.ticketPrice === 0) {
          await db.update(ticketOrders).set({ status: 'paid' }).where(eq(ticketOrders.id, order.id));
          await db.update(events)
            .set({ enrolledCount: event.enrolledCount + input.quantity })
            .where(eq(events.id, event.id));

          const generatedTickets: Array<{ ticketNumber: string; qrDataUrl: string }> = [];
          for (let i = 0; i < input.quantity; i++) {
            const ticketNumber = await generateTicketNumber();
            const qrDataUrl = await generateTicketQR(ticketNumber);
            await db.insert(tickets).values({
              ticketOrderId: order.id,
              eventId: event.id,
              ticketNumber,
              status: 'active',
            });
            generatedTickets.push({ ticketNumber, qrDataUrl });
          }

          sendTicketEmail({
            orderId: order.id,
            firstName: order.firstName,
            lastName: order.lastName,
            email: order.email,
            eventTitle: event.title,
            eventDate: event.eventDate,
            quantity: order.quantity,
            totalAmount: 0,
            tickets: generatedTickets,
          }).catch(err => console.error('[ticket-email] free:', err));

          return { success: true, redirectUrl: `${origin}/bilety/success?order_id=${order.id}` };
        }

        const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string, {
          apiVersion: '2024-10-28.acacia',
        });

        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card', 'blik', 'p24'],
          line_items: [{
            price_data: {
              currency: 'pln',
              product_data: {
                name: `Bilet: ${event.title}`,
                images: event.imageUrl ? [event.imageUrl.startsWith('http') ? event.imageUrl : new URL(event.imageUrl, origin).href] : [],
              },
              unit_amount: event.ticketPrice,
            },
            quantity: input.quantity,
          }],
          mode: 'payment',
          client_reference_id: order.id,
          success_url: `${origin}/bilety/success?order_id=${order.id}`,
          cancel_url: `${origin}/bilety/cancel?order_id=${order.id}`,
        });

        await db.update(ticketOrders)
          .set({ stripeSessionId: session.id })
          .where(eq(ticketOrders.id, order.id));

        sendTicketPendingEmail({
          firstName: order.firstName,
          email: order.email,
          eventTitle: event.title,
          quantity: order.quantity,
          totalAmount: totalAmount,
          orderId: order.id,
        }).catch(err => console.error('[ticket-email] pending:', err));

        return { success: true, redirectUrl: session.url };
      } catch (error: any) {
        if (error instanceof ActionError) throw error;
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    },
  }),

  confirmTicketOrder: defineAction({
    accept: 'json',
    input: z.object({
      orderId: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        const [order] = await db.select().from(ticketOrders).where(eq(ticketOrders.id, input.orderId));
        if (!order) throw new ActionError({ code: 'NOT_FOUND', message: 'Zamówienie nie istnieje.' });
        if (order.status === 'paid') {
          return { success: true, alreadyProcessed: true };
        }
        if (order.status !== 'pending') {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'Zamówienie nie może być potwierdzone.' });
        }

        const [event] = await db.select().from(events).where(eq(events.id, order.eventId));
        const eventTitle = event?.title ?? 'Wydarzenie';

        await db.update(ticketOrders).set({ status: 'paid' }).where(eq(ticketOrders.id, order.id));
        await db.update(events)
          .set({ enrolledCount: (event?.enrolledCount ?? 0) + order.quantity })
          .where(eq(events.id, order.eventId));

        const generatedTickets: Array<{ ticketNumber: string; qrDataUrl: string }> = [];
        for (let i = 0; i < order.quantity; i++) {
          const ticketNumber = await generateTicketNumber();
          const qrDataUrl = await generateTicketQR(ticketNumber);
          await db.insert(tickets).values({
            ticketOrderId: order.id,
            eventId: order.eventId,
            ticketNumber,
            status: 'active',
          });
          generatedTickets.push({ ticketNumber, qrDataUrl });
        }

        await sendTicketEmail({
          orderId: order.id,
          firstName: order.firstName,
          lastName: order.lastName,
          email: order.email,
          eventTitle,
          eventDate: event?.eventDate ?? new Date(),
          quantity: order.quantity,
          totalAmount: order.totalAmount,
          tickets: generatedTickets,
        });

        return { success: true, alreadyProcessed: false };
      } catch (error: any) {
        if (error instanceof ActionError) throw error;
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    },
  }),

  cancelTicketOrder: defineAction({
    accept: 'json',
    input: z.object({
      orderId: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        await db.update(ticketOrders)
          .set({ status: 'cancelled' })
          .where(and(eq(ticketOrders.id, input.orderId), eq(ticketOrders.status, 'pending')));
        return { success: true };
      } catch (error: any) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    },
  }),

  validateTicket: defineAction({
    accept: 'json',
    input: z.object({
      ticketNumber: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        const [ticket] = await db.select().from(tickets)
          .where(eq(tickets.ticketNumber, input.ticketNumber.trim()));

        if (!ticket) {
          return { found: false };
        }

        const [event] = await db.select().from(events).where(eq(events.id, ticket.eventId));
        const [order] = await db.select().from(ticketOrders).where(eq(ticketOrders.id, ticket.ticketOrderId));

        return {
          found: true,
          ticket: {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            status: ticket.status,
            usedAt: ticket.usedAt?.toISOString() ?? null,
            createdAt: ticket.createdAt.toISOString(),
          },
          event: event ? {
            title: event.title,
            eventDate: event.eventDate.toISOString(),
            kategoria: event.kategoria,
          } : null,
          order: order ? {
            firstName: order.firstName,
            lastName: order.lastName,
            email: order.email,
          } : null,
        };
      } catch (error: any) {
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    },
  }),

  markTicketUsed: defineAction({
    accept: 'json',
    input: z.object({
      ticketId: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        const [ticket] = await db.select().from(tickets).where(eq(tickets.id, input.ticketId));
        if (!ticket) throw new ActionError({ code: 'NOT_FOUND', message: 'Bilet nie istnieje.' });
        if (ticket.status === 'used') {
          throw new ActionError({ code: 'BAD_REQUEST', message: 'Bilet został już wykorzystany.' });
        }
        await db.update(tickets)
          .set({ status: 'used', usedAt: new Date() })
          .where(eq(tickets.id, input.ticketId));
        return { success: true };
      } catch (error: any) {
        if (error instanceof ActionError) throw error;
        throw new ActionError({ code: 'INTERNAL_SERVER_ERROR', message: error.message });
      }
    },
  }),

  // ─── AUTORYZACJA ────────────────────────────────────────────────────────────
  login: defineAction({
    accept: 'form',
    input: z.object({
      password: z.string().min(1, 'Hasło jest wymagane'),
    }),
    handler: async (input, context) => {
      // Hash przechowywany jako base64 aby uniknąć interpolacji $ przez Vite
      const hashB64 = import.meta.env.ADMIN_PASSWORD_HASH_B64;
      if (!hashB64) {
        throw new ActionError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Konfiguracja serwera jest nieprawidłowa.',
        });
      }

      // Dekoduj base64 → oryginalny hash bcrypt
      const storedHash = Buffer.from(hashB64, 'base64').toString('utf8');

      // Bezpieczne porównanie hasła z hashem (timing-safe)
      const isValid = await bcrypt.compare(input.password, storedHash);

      if (!isValid) {
        // Celowe opóźnienie 500ms — ochrona przed brute-force
        await new Promise((r) => setTimeout(r, 500));
        throw new ActionError({
          code: 'UNAUTHORIZED',
          message: 'Nieprawidłowe hasło.',
        });
      }

      // Generuj podpisany token sesji
      const token = await createSessionToken();

      // Ustaw HttpOnly cookie — niedostępne z JS po stronie klienta (XSS safe)
      context.cookies.set(COOKIE_NAME_EXPORT, token, {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: 'lax',
        maxAge: SESSION_DURATION_SEC,
        path: '/',
      });

      return { success: true };
    },
  }),

  logout: defineAction({
    accept: 'form',
    input: z.object({}),
    handler: async (_input, context) => {
      context.cookies.delete(COOKIE_NAME_EXPORT, { path: '/' });
      return { success: true };
    },
  }),
};
