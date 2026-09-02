// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/serverless";

const revalidateToken =
  process.env.REVALIDATE_SECRET || process.env.VERCEL_REVALIDATE_TOKEN || "";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel({
    maxDuration: 60,
    ...(revalidateToken.length >= 32
      ? {
          isr: {
            bypassToken: revalidateToken,
            // Trasy z żywymi danymi — bez cache ISR
            // @astrojs/vercel v7: tylko stringi (RegExp od v8+)
            exclude: [
              "/api/admin/login",
              "/api/admin/logout",
              "/api/admin/revalidate-events",
              "/api/reservations",
              "/api/reservations/cancel",
              "/api/occupied-tables",
              "/api/inpost/points",
              "/admin/login",
              "/admin/dashboard",
              "/admin/wydarzenia",
              "/admin/sklep",
              "/admin/kawiarnia",
              "/admin/zamowienia",
              "/admin/rezerwacje",
              "/admin/bilety",
              "/admin/ludzie",
              "/admin/projekty",
              "/checkout",
              "/checkout/dane",
              "/checkout/podsumowanie",
              "/checkout/platnosc",
              "/checkout/success",
              "/checkout/cancel",
              "/bilety/[eventId]",
              "/bilety/[eventId]/dane",
              "/bilety/[eventId]/podsumowanie",
              "/bilety/success",
              "/bilety/cancel",
              "/sklep",
              "/wydarzenia",
              "/rezerwacja",
              "/rezerwacja/anuluj",
              "/strona-techniczna",
            ],
          },
        }
      : {}),
  }),
  site: "https://mocna.org",
  devToolbar: {
    enabled: false,
  },
  vite: {
    server: {
      hmr: {
        overlay: false,
      },
    },
  },
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
    react(),
  ],
  prefetch: {
    prefetchAll: false,
    defaultStrategy: "hover",
  },
  build: {
    inlineStylesheets: "always",
  },
});
