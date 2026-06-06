// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel/serverless";

// https://astro.build/config
export default defineConfig({
  output: "server",
  adapter: vercel({
    maxDuration: 60,
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
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
});
