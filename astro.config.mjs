import { defineConfig } from "astro/config";

// Served from GitHub Pages at https://aaa123eee.github.io/verbos/
export default defineConfig({
  site: "https://aaa123eee.github.io",
  base: "/verbos",
  trailingSlash: "always",
  build: { format: "directory" },
});
