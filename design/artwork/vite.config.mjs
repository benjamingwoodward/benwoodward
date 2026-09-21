import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
const root = fileURLToPath(new URL("./", import.meta.url));
export default defineConfig({ root, cacheDir: "../../node_modules/.vite-artwork", publicDir: "../../public", plugins: [react()], server: { host: "127.0.0.1", port: 4322, strictPort: true, fs: { allow: [fileURLToPath(new URL("../../", import.meta.url))] } } });
