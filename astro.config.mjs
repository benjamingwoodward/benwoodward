import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import vercel from "@astrojs/vercel";

export default defineConfig({
  site: "https://benwoodward.bio",
  integrations: [react()],
  // The site stays static; only routes with `prerender = false`
  // (currently just /api/hit) become serverless functions.
  adapter: vercel(),
});
