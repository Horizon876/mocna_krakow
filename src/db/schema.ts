import { sql } from 'drizzle-orm';
import { pgTable, text, integer, timestamp, varchar, uniqueIndex } from 'drizzle-orm/pg-core';

export const products = pgTable('products', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  price: integer('price').notNull(), // price in grosze
  imageUrl: varchar('image_url', { length: 1024 }),
  availabilityStatus: varchar('availability_status', { length: 50 }).default('available'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: varchar('title', { length: 255 }).notNull(),
  kategoria: varchar('kategoria', { length: 255 }).default('Wydarzenie').notNull(),
  longDescription: text('long_description'),
  shortDescription: text('short_description'),
  eventDate: timestamp('event_date').notNull(),
  ticketPrice: integer('ticket_price').notNull(), // price in grosze
  seatLimit: integer('seat_limit').notNull(),
  enrolledCount: integer('enrolled_count').default(0).notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  imageUrl: varchar('image_url', { length: 1024 }),
  imageAlt: varchar('image_alt', { length: 255 }),
  color: varchar('color', { length: 50 }).default('orange').notNull(),
  link: varchar('link', { length: 1024 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

/**
 * Rezerwacje stolików.
 * Każda rezerwacja trwa 1 godzinę (startsAt → endsAt = startsAt + 1h).
 * Unique index na (tableId, startsAt) zapobiega zduplikowanym rezerwacjom
 * przy race condition (ostatnia linia obrony po jawnym sprawdzeniu konfliktu).
 */
export const reservations = pgTable('reservations', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  tableId: varchar('table_id', { length: 20 }).notNull(),
  reservationDate: varchar('reservation_date', { length: 10 }).notNull(), // YYYY-MM-DD
  reservationTime: varchar('reservation_time', { length: 5 }).notNull(),  // HH:MM
  startsAt: timestamp('starts_at').notNull(),
  endsAt: timestamp('ends_at').notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }),
  notes: text('notes'),
  status: varchar('status', { length: 50 }).default('confirmed').notNull(),
  cancelToken: varchar('cancel_token', { length: 255 }).notNull().default(sql`gen_random_uuid()::text`),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('reservations_table_slot_idx').on(table.tableId, table.startsAt),
  uniqueIndex('reservations_cancel_token_idx').on(table.cancelToken),
]);

export const cafePhotos = pgTable('cafe_photos', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  imageUrl: varchar('image_url', { length: 1024 }).notNull(),
  alt: varchar('alt', { length: 255 }).default('Zdjęcie z kawiarni MOCna!'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const ticketOrders = pgTable('ticket_orders', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  eventId: varchar('event_id', { length: 255 }).notNull(),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  quantity: integer('quantity').notNull(),
  totalAmount: integer('total_amount').notNull(), // w groszach
  status: varchar('status', { length: 50 }).default('pending').notNull(), // pending | paid | cancelled
  stripeSessionId: varchar('stripe_session_id', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const tickets = pgTable('tickets', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  ticketOrderId: varchar('ticket_order_id', { length: 255 }).notNull(),
  eventId: varchar('event_id', { length: 255 }).notNull(),
  ticketNumber: varchar('ticket_number', { length: 9 }).notNull(), // 9-digit unique number
  status: varchar('status', { length: 50 }).default('active').notNull(), // active | used
  usedAt: timestamp('used_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  uniqueIndex('tickets_number_idx').on(table.ticketNumber),
]);

export const orders = pgTable('orders', {
  id: varchar('id', { length: 255 }).primaryKey().$defaultFn(() => crypto.randomUUID()),
  firstName: varchar('first_name', { length: 255 }).notNull(),
  lastName: varchar('last_name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull(),
  phone: varchar('phone', { length: 50 }).notNull(),
  address: varchar('address', { length: 255 }).notNull(),
  zipCode: varchar('zip_code', { length: 20 }).notNull(),
  city: varchar('city', { length: 255 }).notNull(),
  shippingMethod: varchar('shipping_method', { length: 50 }).notNull(),
  paymentMethod: varchar('payment_method', { length: 50 }).notNull(),
  totalAmount: integer('total_amount').notNull(), // w groszach
  items: text('items').notNull(), // JSON string representing cart items
  status: varchar('status', { length: 50 }).default('pending').notNull(),
  /** JSON string z danymi wybranego paczkomatu InPost (tylko gdy shippingMethod = 'paczkomat') */
  paczkomatPoint: text('paczkomat_point'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
