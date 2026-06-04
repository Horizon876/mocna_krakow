// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import react from "@astrojs/react";

// https://astro.build/config
export default defineConfig({
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
  // Astro Islands: JS is shipped only for components hydrated with client:* directives.
  integrations: [
    tailwind({
      // We control base styles ourselves in src/styles/global.css.
      applyBaseStyles: false,
    }),
    react(),
  ],
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
});
