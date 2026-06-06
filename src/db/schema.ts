import { pgTable, text, integer, timestamp, varchar } from 'drizzle-orm/pg-core';

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
  longDescription: text('long_description'),
  shortDescription: text('short_description'),
  eventDate: timestamp('event_date').notNull(),
  ticketPrice: integer('ticket_price').notNull(), // price in grosze
  seatLimit: integer('seat_limit').notNull(),
  enrolledCount: integer('enrolled_count').default(0).notNull(),
  status: varchar('status', { length: 50 }).default('active'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
