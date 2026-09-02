import { defineAction, ActionError } from "astro:actions";
import { z } from "astro:schema";
import { db } from "../db";
import {
  products,
  events,
  reservations,
  orders,
  ticketOrders,
  tickets,
  cafePhotos,
  teamMembers,
  projects,
} from "../db/schema";
import { and, eq, lt } from "drizzle-orm";
import { slugifyName } from "../lib/team";
import { metaFromFormText } from "../lib/projects";
import bcrypt from "bcryptjs";
import Stripe from "stripe";
import {
  createSessionToken,
  COOKIE_NAME_EXPORT,
  SESSION_DURATION_SEC,
} from "../lib/session";
import { getServerEnv } from "../lib/env-server";
import { saveImage } from "../lib/upload";
import { cancelReservationById } from "../lib/reservations";
import { sendOrderEmail } from "../lib/order-email";
import { sendTicketPendingEmail } from "../lib/ticket-email";
import { parseInPostPointAddress } from "../lib/inpost-point";
import { fulfillPaidTicketOrder } from "../lib/ticket-fulfillment";
import { isEventPast } from "../lib/event";
import { publishContentChange } from "../lib/publish-content";
import {
  getReservationExpiresAt,
  releaseExpiredTicketReservations,
  releaseEventSeats,
  releaseTicketOrderReservation,
  reserveEventSeats,
} from "../lib/ticket-reservations";

/** Puste pole file w multipart → brak pliku (zamiast File o size 0). */
const optionalImageFile = z.preprocess((val) => {
  if (typeof File === "undefined") return undefined;
  if (val instanceof File && val.size === 0) return undefined;
  if (val instanceof File) return val;
  return undefined;
}, z.any().optional());

export const server = {
  createProduct: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1, "Nazwa produktu jest wymagana"),
      description: z.string().optional(),
      price: z.coerce
        .string()
        .transform((v) => parseFloat(v.replace(",", ".")))
        .pipe(
          z
            .number()
            .min(0, "Cena nie może być ujemna")
            .max(10000000, "Cena jest zbyt wysoka"),
        ),
      imageFile: optionalImageFile,
      availabilityStatus: z
        .enum(["available", "unavailable"])
        .default("available"),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        let imageUrl = null;
        if (input.imageFile) {
          imageUrl = await saveImage(input.imageFile);
        }

        const result = await db
          .insert(products)
          .values({
            name: input.name,
            description: input.description,
            price: Math.round(input.price * 100), // in grosze
            imageUrl: imageUrl,
            availabilityStatus: input.availabilityStatus,
          })
          .returning();
        return { success: true, product: result[0] };
      } catch (error) {
        console.error("createProduct failed:", error);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Błąd podczas tworzenia produktu",
        });
      }
    },
  }),

  updateProduct: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
      name: z.string().min(1, "Nazwa produktu jest wymagana"),
      description: z.string().optional(),
      price: z.coerce
        .string()
        .transform((v) => parseFloat(v.replace(",", ".")))
        .pipe(
          z
            .number()
            .min(0, "Cena nie może być ujemna")
            .max(10000000, "Cena jest zbyt wysoka"),
        ),
      imageFile: optionalImageFile,
      existingImageUrl: z.string().optional(),
      availabilityStatus: z
        .enum(["available", "unavailable"])
        .default("available"),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        let imageUrl = input.existingImageUrl || null;
        if (input.imageFile) {
          imageUrl = await saveImage(input.imageFile);
        }

        const result = await db
          .update(products)
          .set({
            name: input.name,
            description: input.description,
            price: Math.round(input.price * 100),
            imageUrl: imageUrl,
            availabilityStatus: input.availabilityStatus,
          })
          .where(eq(products.id, input.id))
          .returning();
        return { success: true, product: result[0] };
      } catch (error) {
        console.error("updateProduct failed:", error);
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Błąd podczas aktualizacji produktu",
        });
      }
    },
  }),

  deleteProduct: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        await db.delete(products).where(eq(products.id, input.id));
        return { success: true };
      } catch (error) {
        throw new Error("Błąd podczas usuwania produktu");
      }
    },
  }),

  createEvent: defineAction({
    accept: "form",
    input: z.object({
      title: z.string().min(1, "Tytuł wydarzenia jest wymagany"),
      kategoria: z.string().default("Wydarzenie"),
      longDescription: z.string().optional(),
      shortDescription: z.string().optional(),
      eventDate: z.string().pipe(z.coerce.date()),
      ticketPrice: z.coerce
        .string()
        .transform((v) => parseFloat(v.replace(",", ".")))
        .pipe(
          z
            .number()
            .min(0, "Cena biletu nie może być ujemna")
            .max(10000000, "Cena jest zbyt wysoka"),
        ),
      seatLimit: z
        .number({ coerce: true })
        .int("Limit miejsc musi być liczbą całkowitą")
        .min(1, "Limit miejsc musi być większy od 0")
        .max(10000, "Limit miejsc jest zbyt wysoki"),
      status: z.enum(["active", "cancelled", "completed"]).default("active"),
      imageFile: z.instanceof(File).optional(),
      imageAlt: z.string().optional(),
      color: z
        .enum(["orange", "red", "yellow", "blue", "green", "pink", "graphite"])
        .default("orange"),
      link: z.string().optional(),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        let imageUrl = null;
        if (
          input.imageFile &&
          input.imageFile instanceof File &&
          input.imageFile.size > 0
        ) {
          imageUrl = await saveImage(input.imageFile);
        }

        const result = await db
          .insert(events)
          .values({
            title: input.title,
            kategoria: input.kategoria,
            longDescription: input.longDescription,
            shortDescription: input.shortDescription,
            eventDate: input.eventDate,
            ticketPrice: Math.round(input.ticketPrice * 100), // in grosze
            seatLimit: input.seatLimit,
            status: input.status,
            imageUrl: imageUrl,
            imageAlt: input.imageAlt,
            color: input.color,
            link: input.link,
          })
          .returning();
        return { success: true, event: result[0] };
      } catch (error) {
        throw new Error("Błąd podczas tworzenia wydarzenia");
      }
    },
  }),

  updateEvent: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
      title: z.string().min(1, "Tytuł wydarzenia jest wymagany"),
      kategoria: z.string().default("Wydarzenie"),
      longDescription: z.string().optional(),
      shortDescription: z.string().optional(),
      eventDate: z.string().pipe(z.coerce.date()),
      ticketPrice: z.coerce
        .string()
        .transform((v) => parseFloat(v.replace(",", ".")))
        .pipe(
          z
            .number()
            .min(0, "Cena biletu nie może być ujemna")
            .max(10000000, "Cena jest zbyt wysoka"),
        ),
      seatLimit: z
        .number({ coerce: true })
        .int("Limit miejsc musi być liczbą całkowitą")
        .min(1, "Limit miejsc musi być większy od 0")
        .max(10000, "Limit miejsc jest zbyt wysoki"),
      status: z.enum(["active", "cancelled", "completed"]).default("active"),
      imageFile: z.instanceof(File).optional(),
      existingImageUrl: z.string().optional(),
      imageAlt: z.string().optional(),
      color: z
        .enum(["orange", "red", "yellow", "blue", "green", "pink", "graphite"])
        .default("orange"),
      link: z.string().optional(),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        let imageUrl = input.existingImageUrl || null;
        if (
          input.imageFile &&
          input.imageFile instanceof File &&
          input.imageFile.size > 0
        ) {
          imageUrl = await saveImage(input.imageFile);
        }

        const result = await db
          .update(events)
          .set({
            title: input.title,
            kategoria: input.kategoria,
            longDescription: input.longDescription,
            shortDescription: input.shortDescription,
            eventDate: input.eventDate,
            ticketPrice: Math.round(input.ticketPrice * 100),
            seatLimit: input.seatLimit,
            status: input.status,
            imageUrl: imageUrl,
            imageAlt: input.imageAlt,
            color: input.color,
            link: input.link,
          })
          .where(eq(events.id, input.id))
          .returning();
        return { success: true, event: result[0] };
      } catch (error) {
        throw new Error("Błąd podczas aktualizacji wydarzenia");
      }
    },
  }),

  deleteEvent: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        await db.delete(events).where(eq(events.id, input.id));
        return { success: true };
      } catch (error) {
        throw new Error("Błąd podczas usuwania wydarzenia");
      }
    },
  }),

  // ─── REZERWACJE ─────────────────────────────────────────────────────────────

  cancelReservation: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input) => {
      const reservation = await cancelReservationById(input.id);
      if (!reservation) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Rezerwacja nie istnieje lub jest już anulowana.",
        });
      }
      return { success: true };
    },
  }),

  deleteReservation: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input) => {
      const result = await db
        .delete(reservations)
        .where(
          and(
            eq(reservations.id, input.id),
            eq(reservations.status, "cancelled"),
          ),
        )
        .returning({ id: reservations.id });

      if (result.length === 0) {
        throw new ActionError({
          code: "BAD_REQUEST",
          message: "Można usunąć tylko anulowane rezerwacje.",
        });
      }

      return { success: true };
    },
  }),

  anonymizeReservations: defineAction({
    accept: "form",
    input: z.object({}),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "pracownik")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });

      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      try {
        const result = await db
          .update(reservations)
          .set({
            firstName: "Anonim",
            lastName: "-",
            email: "-",
            phone: "-",
            notes: "-",
          })
          .where(lt(reservations.startsAt, threeMonthsAgo))
          .returning({ id: reservations.id });

        return { success: true, count: result.length };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Błąd podczas anonimizacji rezerwacji.",
        });
      }
    },
  }),

  // ─── ZAMÓWIENIA ─────────────────────────────────────────────────────────────

  createOrder: defineAction({
    accept: "json",
    input: z.object({
      firstName: z.string().min(1, "Imię jest wymagane"),
      lastName: z.string().min(1, "Nazwisko jest wymagane"),
      email: z.string().email("Nieprawidłowy adres email"),
      phone: z.string().min(1, "Telefon jest wymagany"),
      address: z.string().min(1, "Adres jest wymagany"),
      zipCode: z.string().min(1, "Kod pocztowy jest wymagany"),
      city: z.string().min(1, "Miasto jest wymagane"),
      shippingMethod: z.enum(["courier", "paczkomat"]),
      paymentMethod: z.enum(["online", "cod"]),
      paczkomatPoint: z.string().optional(), // JSON string z danymi paczkomatu
      items: z.array(
        z.object({
          name: z.string(),
          qty: z.number(),
          price: z.string(),
          image: z.string().optional(),
        }),
      ),
      totalAmount: z.number(), // subtotal from cart (PLN)
    }),
    handler: async (input, context) => {
      try {
        // Uzupełnij adres z paczkomatu, gdy klient nie podał kodu/miasta
        let { address, zipCode, city } = input;
        if (input.shippingMethod === "paczkomat" && input.paczkomatPoint) {
          try {
            const parsed = parseInPostPointAddress(
              JSON.parse(input.paczkomatPoint),
            );
            address = parsed.address || address;
            zipCode = parsed.zipCode || zipCode;
            city = parsed.city || city;
          } catch {
            /* ignoruj niepoprawny JSON */
          }
        }

        const shippingCost = input.shippingMethod === "paczkomat" ? 1500 : 2000;
        const paymentCost = input.paymentMethod === "cod" ? 500 : 0;
        const finalAmount =
          Math.round(input.totalAmount * 100) + shippingCost + paymentCost;

        const result = await db
          .insert(orders)
          .values({
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
            status: "pending",
            paczkomatPoint: input.paczkomatPoint ?? null,
          })
          .returning();

        const order = result[0];

        // Wyślij email potwierdzający złożenie zamówienia
        const itemsForEmail = input.items.map((it) => ({
          name: it.name,
          qty: it.qty,
          price: it.price,
        }));
        await sendOrderEmail(
          {
            orderId: `${order.id.split("-")[0]}-${String(order.orderNumber || "").padStart(4, "0")}`,
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
            status: "pending",
          },
          "pending",
        );

        if (input.paymentMethod === "online") {
          const origin = new URL(context.request.url).origin;
          const stripe = new Stripe(
            import.meta.env.STRIPE_SECRET_KEY as string,
            {
              apiVersion: "2024-10-28.acacia",
            },
          );

          const lineItems = input.items.map((item) => {
            const amountStr = item.price.toString();
            const match = amountStr.match(/(\d+(?:[.,]\d+)?)/);
            const parsedAmount = match
              ? parseFloat(match[1].replace(",", "."))
              : 0;
            const unitAmount = Math.round(parsedAmount * 100);

            return {
              price_data: {
                currency: "pln",
                product_data: {
                  name: item.name,
                  images: item.image
                    ? [
                        item.image.startsWith("http")
                          ? item.image
                          : new URL(item.image, origin).href,
                      ]
                    : [],
                },
                unit_amount: unitAmount,
              },
              quantity: item.qty,
            };
          });

          const shippingLabel =
            input.shippingMethod === "paczkomat"
              ? "Paczkomat InPost"
              : "Kurier";
          lineItems.push({
            price_data: {
              currency: "pln",
              product_data: { name: shippingLabel },
              unit_amount: shippingCost,
            },
            quantity: 1,
          });
          if (paymentCost > 0) {
            lineItems.push({
              price_data: {
                currency: "pln",
                product_data: { name: "Opłata za pobranie" },
                unit_amount: paymentCost,
              },
              quantity: 1,
            });
          }

          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "blik", "p24"],
            line_items: lineItems,
            mode: "payment",
            client_reference_id: order.id,
            success_url: `${origin}/checkout/success?order_id=${order.id}`,
            cancel_url: `${origin}/checkout/cancel?order_id=${order.id}`,
          });

          return { success: true, redirectUrl: session.url };
        }

        return { success: true, orderId: order.id };
      } catch (error: unknown) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  }),

  updateOrderStatus: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
      status: z.enum([
        "pending",
        "confirmed",
        "paid",
        "processing",
        "shipped",
        "cancelled",
      ]),
    }),
    handler: async (input) => {
      try {
        await db
          .update(orders)
          .set({ status: input.status })
          .where(eq(orders.id, input.id));

        // Wyślij email powiadamiający o zmianie statusu
        const [order] = await db
          .select()
          .from(orders)
          .where(eq(orders.id, input.id));
        if (order) {
          let items: Array<{ name: string; qty: number; price: string }> = [];
          try {
            items = JSON.parse(order.items);
          } catch {
            /* ignoruj */
          }
          sendOrderEmail(
            {
              orderId: `${order.id.split("-")[0]}-${String(order.orderNumber || "").padStart(4, "0")}`,
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
            },
            input.status,
          ).catch((err) => console.error("[order-email] updateStatus:", err));
        }

        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się zaktualizować statusu",
        });
      }
    },
  }),

  deleteOrder: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        await db.delete(orders).where(eq(orders.id, input.id));
        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się usunąć zamówienia",
        });
      }
    },
  }),

  // ─── KAWIARNIA (GALERIA) ────────────────────────────────────────────────────

  createCafePhoto: defineAction({
    accept: "form",
    input: z.object({
      alt: z.string().optional(),
      imageFile: z
        .instanceof(File)
        .refine(
          (f) => f instanceof File && f.size > 0,
          "Zdjęcie jest wymagane",
        ),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        const imageUrl = await saveImage(input.imageFile);
        const result = await db
          .insert(cafePhotos)
          .values({
            imageUrl,
            alt: input.alt?.trim() || "Zdjęcie z kawiarni MOCna!",
          })
          .returning();
        await publishContentChange("cafe", context.request.url);
        return { success: true, photo: result[0] };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Błąd podczas dodawania zdjęcia",
        });
      }
    },
  }),

  deleteCafePhoto: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        await db.delete(cafePhotos).where(eq(cafePhotos.id, input.id));
        await publishContentChange("cafe", context.request.url);
        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Błąd podczas usuwania zdjęcia",
        });
      }
    },
  }),

  // ─── LUDZIE MOCNEJ ──────────────────────────────────────────────────────────

  createTeamMember: defineAction({
    accept: "form",
    input: z.object({
      name: z.string().min(1, "Imię i nazwisko jest wymagane"),
      description: z.string().min(1, "Opis jest wymagany"),
      slug: z.string().optional(),
      photoPosition: z.string().optional(),
      accent: z
        .enum(["orange", "red", "yellow", "blue", "green", "pink", "graphite"])
        .default("blue"),
      sortOrder: z.coerce.number().int().optional(),
      imageFile: optionalImageFile,
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        let photoUrl: string | null = null;
        if (
          input.imageFile &&
          input.imageFile instanceof File &&
          input.imageFile.size > 0
        ) {
          photoUrl = await saveImage(input.imageFile);
        }

        const slug =
          (input.slug?.trim() && slugifyName(input.slug)) ||
          slugifyName(input.name);

        let sortOrder = input.sortOrder;
        if (sortOrder === undefined || Number.isNaN(sortOrder)) {
          const maxRows = await db
            .select({ sortOrder: teamMembers.sortOrder })
            .from(teamMembers);
          sortOrder =
            maxRows.length === 0
              ? 0
              : Math.max(...maxRows.map((r) => r.sortOrder)) + 1;
        }

        const result = await db
          .insert(teamMembers)
          .values({
            name: input.name.trim(),
            description: input.description.trim(),
            slug,
            photoUrl,
            photoPosition: input.photoPosition?.trim() || null,
            accent: input.accent,
            sortOrder,
          })
          .returning();
        await publishContentChange("team", context.request.url);
        return { success: true, member: result[0] };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Błąd podczas dodawania osoby",
        });
      }
    },
  }),

  updateTeamMember: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
      name: z.string().min(1, "Imię i nazwisko jest wymagane"),
      description: z.string().min(1, "Opis jest wymagany"),
      slug: z.string().optional(),
      photoPosition: z.string().optional(),
      accent: z
        .enum(["orange", "red", "yellow", "blue", "green", "pink", "graphite"])
        .default("blue"),
      sortOrder: z.coerce.number().int().optional(),
      imageFile: optionalImageFile,
      existingPhotoUrl: z.string().optional(),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        let photoUrl = input.existingPhotoUrl || null;
        if (
          input.imageFile &&
          input.imageFile instanceof File &&
          input.imageFile.size > 0
        ) {
          photoUrl = await saveImage(input.imageFile);
        }

        const slug =
          (input.slug?.trim() && slugifyName(input.slug)) ||
          slugifyName(input.name);

        await db
          .update(teamMembers)
          .set({
            name: input.name.trim(),
            description: input.description.trim(),
            slug,
            photoUrl,
            photoPosition: input.photoPosition?.trim() || null,
            accent: input.accent,
            ...(input.sortOrder !== undefined && !Number.isNaN(input.sortOrder)
              ? { sortOrder: input.sortOrder }
              : {}),
          })
          .where(eq(teamMembers.id, input.id));
        await publishContentChange("team", context.request.url);
        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Błąd podczas aktualizacji osoby",
        });
      }
    },
  }),

  deleteTeamMember: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        await db.delete(teamMembers).where(eq(teamMembers.id, input.id));
        await publishContentChange("team", context.request.url);
        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Błąd podczas usuwania osoby",
        });
      }
    },
  }),

  // ─── PROJEKTY ───────────────────────────────────────────────────────────────

  createProject: defineAction({
    accept: "form",
    input: z.object({
      title: z.string().min(1, "Tytuł projektu jest wymagany"),
      description: z.string().min(1, "Opis jest wymagany"),
      fundingNote: z.string().optional(),
      metaText: z.string().optional(),
      color: z
        .enum(["orange", "red", "yellow", "blue", "green", "pink", "graphite"])
        .default("blue"),
      textColor: z.enum(["white", "black"]).default("white"),
      metaTitle: z.string().optional(),
      link: z.string().optional(),
      linkLabel: z.string().optional(),
      imageFile: optionalImageFile,
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        let logoUrl: string | null = null;
        if (
          input.imageFile &&
          input.imageFile instanceof File &&
          input.imageFile.size > 0
        ) {
          logoUrl = await saveImage(input.imageFile);
        }

        const meta = metaFromFormText(input.metaText);
        const rows = await db
          .select({ sortOrder: projects.sortOrder })
          .from(projects);
        const sortOrder =
          rows.length === 0
            ? 0
            : Math.max(...rows.map((r) => r.sortOrder)) + 1;

        const result = await db
          .insert(projects)
          .values({
            title: input.title.trim(),
            description: input.description.trim(),
            fundingNote: input.fundingNote?.trim() || null,
            meta: JSON.stringify(meta),
            color: input.color,
            textColor: input.textColor,
            metaTitle: input.metaTitle?.trim() || "Dofinansowanie",
            logoUrl,
            logoAlt: input.title.trim(),
            link: input.link?.trim() || null,
            linkLabel: input.linkLabel?.trim() || null,
            sortOrder,
          })
          .returning();
        await publishContentChange("projects", context.request.url);
        return { success: true, project: result[0] };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Błąd podczas dodawania projektu",
        });
      }
    },
  }),

  updateProject: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
      title: z.string().min(1, "Tytuł projektu jest wymagany"),
      description: z.string().min(1, "Opis jest wymagany"),
      fundingNote: z.string().optional(),
      metaText: z.string().optional(),
      color: z
        .enum(["orange", "red", "yellow", "blue", "green", "pink", "graphite"])
        .default("blue"),
      textColor: z.enum(["white", "black"]).default("white"),
      metaTitle: z.string().optional(),
      link: z.string().optional(),
      linkLabel: z.string().optional(),
      imageFile: optionalImageFile,
      existingLogoUrl: z.string().optional(),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        let logoUrl = input.existingLogoUrl || null;
        if (
          input.imageFile &&
          input.imageFile instanceof File &&
          input.imageFile.size > 0
        ) {
          logoUrl = await saveImage(input.imageFile);
        }

        const meta = metaFromFormText(input.metaText);

        await db
          .update(projects)
          .set({
            title: input.title.trim(),
            description: input.description.trim(),
            fundingNote: input.fundingNote?.trim() || null,
            meta: JSON.stringify(meta),
            color: input.color,
            textColor: input.textColor,
            metaTitle: input.metaTitle?.trim() || "Dofinansowanie",
            logoUrl,
            logoAlt: input.title.trim(),
            link: input.link?.trim() || null,
            linkLabel: input.linkLabel?.trim() || null,
          })
          .where(eq(projects.id, input.id));
        await publishContentChange("projects", context.request.url);
        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Błąd podczas aktualizacji projektu",
        });
      }
    },
  }),

  deleteProject: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "admin")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        await db.delete(projects).where(eq(projects.id, input.id));
        await publishContentChange("projects", context.request.url);
        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Błąd podczas usuwania projektu",
        });
      }
    },
  }),

  // ─── BILETY ─────────────────────────────────────────────────────────────────

  createTicketOrder: defineAction({
    accept: "json",
    input: z.object({
      eventId: z.string().min(1),
      firstName: z.string().min(1, "Imię jest wymagane"),
      lastName: z.string().min(1, "Nazwisko jest wymagane"),
      email: z.string().email("Nieprawidłowy adres email"),
      phone: z.string().min(1, "Telefon jest wymagany"),
      quantity: z.number().int().min(1).max(20),
    }),
    handler: async (input, context) => {
      try {
        await releaseExpiredTicketReservations(input.eventId);

        const [event] = await db
          .select()
          .from(events)
          .where(eq(events.id, input.eventId));
        if (!event) {
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Wydarzenie nie istnieje.",
          });
        }
        if (event.status !== "active") {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "To wydarzenie nie jest już dostępne.",
          });
        }
        if (isEventPast(event.eventDate)) {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Termin wydarzenia minął — nie można już kupić biletu.",
          });
        }

        const reserved = await reserveEventSeats(input.eventId, input.quantity);
        if (!reserved) {
          const available = Math.max(0, event.seatLimit - event.enrolledCount);
          const limitInfo = `${event.enrolledCount}/${event.seatLimit}`;
          const message =
            available <= 0
              ? `Limit miejsc: ${limitInfo}. Wszystkie miejsca zostały zarezerwowane.`
              : `Limit miejsc: ${limitInfo}. Dostępnych jest tylko ${available}.`;
          throw new ActionError({ code: "BAD_REQUEST", message });
        }

        const totalAmount = event.ticketPrice * input.quantity;
        const expiresAt = getReservationExpiresAt();

        let order;
        try {
          const result = await db
            .insert(ticketOrders)
            .values({
              eventId: input.eventId,
              firstName: input.firstName,
              lastName: input.lastName,
              email: input.email,
              phone: input.phone,
              quantity: input.quantity,
              totalAmount,
              status: "pending",
              expiresAt,
            })
            .returning();
          order = result[0];
        } catch (insertError) {
          await releaseEventSeats(input.eventId, input.quantity);
          throw insertError;
        }

        const origin = new URL(context.request.url).origin;

        // Bezpłatne wydarzenie — pomiń Stripe, generuj bilety od razu
        if (event.ticketPrice === 0) {
          const fulfilled = await fulfillPaidTicketOrder(order.id);
          if (!fulfilled.ok) {
            await releaseTicketOrderReservation(order.id, "cancelled");
            throw new ActionError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Nie udało się potwierdzić bezpłatnego zamówienia.",
            });
          }

          return {
            success: true,
            redirectUrl: `${origin}/bilety/success?order_id=${order.id}`,
          };
        }

        const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY as string, {
          apiVersion: "2024-10-28.acacia",
        });

        let session;
        try {
          session = await stripe.checkout.sessions.create({
            payment_method_types: ["card", "blik", "p24"],
            line_items: [
              {
                price_data: {
                  currency: "pln",
                  product_data: {
                    name: `Bilet: ${event.title}`,
                    images: event.imageUrl
                      ? [
                          event.imageUrl.startsWith("http")
                            ? event.imageUrl
                            : new URL(event.imageUrl, origin).href,
                        ]
                      : [],
                  },
                  unit_amount: event.ticketPrice,
                },
                quantity: input.quantity,
              },
            ],
            mode: "payment",
            client_reference_id: order.id,
            success_url: `${origin}/bilety/success?order_id=${order.id}`,
            cancel_url: `${origin}/bilety/cancel?order_id=${order.id}`,
          });
        } catch (stripeError) {
          await releaseTicketOrderReservation(order.id, "cancelled");
          throw stripeError;
        }

        try {
          await db
            .update(ticketOrders)
            .set({ stripeSessionId: session.id })
            .where(eq(ticketOrders.id, order.id));
        } catch (stripeDbError) {
          await releaseTicketOrderReservation(order.id, "cancelled");
          throw stripeDbError;
        }

        sendTicketPendingEmail({
          firstName: order.firstName,
          email: order.email,
          eventTitle: event.title,
          quantity: order.quantity,
          totalAmount: totalAmount,
          orderId: `${order.id.split("-")[0]}-${String(order.orderNumber || "").padStart(4, "0")}`,
        }).catch((err) => console.error("[ticket-email] pending:", err));

        return { success: true, redirectUrl: session.url };
      } catch (error: unknown) {
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  }),

  confirmTicketOrder: defineAction({
    accept: "json",
    input: z.object({
      orderId: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        const result = await fulfillPaidTicketOrder(input.orderId);
        if (!result.ok) {
          if (result.reason === "not_found") {
            throw new ActionError({
              code: "NOT_FOUND",
              message: "Zamówienie nie istnieje.",
            });
          }
          if (result.reason === "expired_no_seats") {
            throw new ActionError({
              code: "BAD_REQUEST",
              message:
                "Rezerwacja wygasła i miejsca zostały zajęte. Skontaktuj się z nami w sprawie zwrotu płatności.",
            });
          }
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Zamówienie nie może być potwierdzone.",
          });
        }

        return {
          success: true,
          alreadyProcessed: result.alreadyProcessed,
        };
      } catch (error: unknown) {
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  }),

  cancelTicketOrder: defineAction({
    accept: "json",
    input: z.object({
      orderId: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        await releaseTicketOrderReservation(input.orderId, "cancelled");
        return { success: true };
      } catch (error: unknown) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  }),

  validateTicket: defineAction({
    accept: "json",
    input: z.object({
      ticketNumber: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        const [ticket] = await db
          .select()
          .from(tickets)
          .where(eq(tickets.ticketNumber, input.ticketNumber.trim()));

        if (!ticket) {
          return { found: false };
        }

        const [[event], [order]] = await Promise.all([
          db.select().from(events).where(eq(events.id, ticket.eventId)),
          db
            .select()
            .from(ticketOrders)
            .where(eq(ticketOrders.id, ticket.ticketOrderId)),
        ]);

        return {
          found: true,
          ticket: {
            id: ticket.id,
            ticketNumber: ticket.ticketNumber,
            status: ticket.status,
            usedAt: ticket.usedAt?.toISOString() ?? null,
            createdAt: ticket.createdAt.toISOString(),
          },
          event: event
            ? {
                title: event.title,
                eventDate: event.eventDate.toISOString(),
                kategoria: event.kategoria,
              }
            : null,
          order: order
            ? {
                firstName: order.firstName,
                lastName: order.lastName,
                email: order.email,
              }
            : null,
        };
      } catch (error: unknown) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  }),

  markTicketUsed: defineAction({
    accept: "json",
    input: z.object({
      ticketId: z.string().min(1),
    }),
    handler: async (input) => {
      try {
        const [ticket] = await db
          .select()
          .from(tickets)
          .where(eq(tickets.id, input.ticketId));
        if (!ticket)
          throw new ActionError({
            code: "NOT_FOUND",
            message: "Bilet nie istnieje.",
          });
        if (ticket.status === "used") {
          throw new ActionError({
            code: "BAD_REQUEST",
            message: "Bilet został już wykorzystany.",
          });
        }
        await db
          .update(tickets)
          .set({ status: "used", usedAt: new Date() })
          .where(eq(tickets.id, input.ticketId));
        return { success: true };
      } catch (error: unknown) {
        if (error instanceof ActionError) throw error;
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: error instanceof Error ? error.message : String(error),
        });
      }
    },
  }),

  deleteTicket: defineAction({
    accept: "form",
    input: z.object({
      id: z.string().min(1),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "pracownik")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        await db.delete(tickets).where(eq(tickets.id, input.id));
        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się usunąć biletu",
        });
      }
    },
  }),

  deleteEventTickets: defineAction({
    accept: "form",
    input: z.object({
      eventId: z.string().min(1),
    }),
    handler: async (input, context) => {
      if (context.locals.adminRole !== "pracownik")
        throw new ActionError({
          code: "FORBIDDEN",
          message: "Brak uprawnień.",
        });
      try {
        await db.delete(tickets).where(eq(tickets.eventId, input.eventId));
        return { success: true };
      } catch (error) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Nie udało się usunąć biletów dla tego wydarzenia",
        });
      }
    },
  }),

  // ─── AUTORYZACJA ────────────────────────────────────────────────────────────
  login: defineAction({
    accept: "form",
    input: z.object({
      role: z.enum(["admin", "pracownik"]),
      password: z.string().min(1, "Hasło jest wymagane"),
    }),
    handler: async (input, context) => {
      // Hash przechowywany jako base64 aby uniknąć interpolacji $ przez Vite
      const hashAdminB64 = getServerEnv("ADMIN_PASSWORD_HASH_B64");
      const hashPracownikB64 = getServerEnv("PRACOWNIK_PASSWORD_HASH_B64");

      if (!hashAdminB64) {
        throw new ActionError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Konfiguracja serwera jest nieprawidłowa.",
        });
      }

      let matched = false;

      // Sprawdź hasło dla wybranej roli
      if (input.role === "admin") {
        const storedAdminHash = Buffer.from(hashAdminB64, "base64").toString(
          "utf8",
        );
        matched = await bcrypt.compare(input.password, storedAdminHash);
      } else if (input.role === "pracownik" && hashPracownikB64) {
        const storedPracownikHash = Buffer.from(
          hashPracownikB64,
          "base64",
        ).toString("utf8");
        matched = await bcrypt.compare(input.password, storedPracownikHash);
      }

      if (!matched) {
        // Celowe opóźnienie 500ms — ochrona przed brute-force
        await new Promise((r) => setTimeout(r, 500));
        throw new ActionError({
          code: "UNAUTHORIZED",
          message: "Nieprawidłowe hasło.",
        });
      }

      // Generuj podpisany token sesji
      const token = await createSessionToken(input.role);

      // Ustaw HttpOnly cookie — niedostępne z JS po stronie klienta (XSS safe)
      context.cookies.set(COOKIE_NAME_EXPORT, token, {
        httpOnly: true,
        secure: import.meta.env.PROD,
        sameSite: "lax",
        maxAge: SESSION_DURATION_SEC,
        path: "/",
      });

      return { success: true };
    },
  }),

  logout: defineAction({
    accept: "form",
    input: z.object({}),
    handler: async (_input, context) => {
      context.cookies.delete(COOKIE_NAME_EXPORT, { path: "/" });
      return { success: true };
    },
  }),
};
