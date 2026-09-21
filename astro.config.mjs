import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://benwoodward.bio",
  integrations: [react()],
  devToolbar: { enabled: false },
  // Isolated caches let the synthetic-data QA servers run beside the local preview.
  vite: { cacheDir: process.env.VITE_CACHE_DIR || "node_modules/.vite" },
  // The site stays static; only routes with `prerender = false`
  // (currently just /api/hit) become serverless functions.
  adapter: vercel(),
});
