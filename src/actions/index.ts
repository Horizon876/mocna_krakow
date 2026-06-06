import { defineAction, ActionError } from 'astro:actions';
import { z } from 'astro:schema';
import { db } from '../db';
import { products, events, reservations } from '../db/schema';
import { and, eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSessionToken, COOKIE_NAME_EXPORT, SESSION_DURATION_SEC } from '../lib/session';
import { saveProductImage } from '../lib/upload';
import { cancelReservationById } from '../lib/reservations';


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
          imageUrl = await saveProductImage(input.imageFile);
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
          imageUrl = await saveProductImage(input.imageFile);
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
      longDescription: z.string().optional(),
      shortDescription: z.string().optional(),
      eventDate: z.string().pipe(z.coerce.date()),
      ticketPrice: z.number({ coerce: true }).int('Cena musi być liczbą całkowitą').min(0, 'Cena biletu nie może być ujemna').max(10000000, 'Cena jest zbyt wysoka'),
      seatLimit: z.number({ coerce: true }).int('Limit miejsc musi być liczbą całkowitą').min(1, 'Limit miejsc musi być większy od 0').max(10000, 'Limit miejsc jest zbyt wysoki'),
      status: z.enum(['active', 'cancelled', 'completed']).default('active'),
    }),
    handler: async (input) => {
      try {
        const result = await db.insert(events).values({
          title: input.title,
          longDescription: input.longDescription,
          shortDescription: input.shortDescription,
          eventDate: input.eventDate,
          ticketPrice: input.ticketPrice, // in grosze
          seatLimit: input.seatLimit,
          status: input.status,
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
      longDescription: z.string().optional(),
      shortDescription: z.string().optional(),
      eventDate: z.string().pipe(z.coerce.date()),
      ticketPrice: z.number({ coerce: true }).int('Cena musi być liczbą całkowitą').min(0, 'Cena biletu nie może być ujemna').max(10000000, 'Cena jest zbyt wysoka'),
      seatLimit: z.number({ coerce: true }).int('Limit miejsc musi być liczbą całkowitą').min(1, 'Limit miejsc musi być większy od 0').max(10000, 'Limit miejsc jest zbyt wysoki'),
      status: z.enum(['active', 'cancelled', 'completed']).default('active'),
    }),
    handler: async (input) => {
      try {
        const result = await db.update(events).set({
          title: input.title,
          longDescription: input.longDescription,
          shortDescription: input.shortDescription,
          eventDate: input.eventDate,
          ticketPrice: input.ticketPrice,
          seatLimit: input.seatLimit,
          status: input.status,
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
