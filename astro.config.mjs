import { defineConfig } from "astro/config";

// Served from GitHub Pages at https://aaa123eee.github.io/verbos/
export default defineConfig({
  site: "https://aaa123eee.github.io",
  base: "/verbos",
  trailingSlash: "always",
  build: { format: "directory" },
  // the dictionary (src/data/dict.json, ~6.5k words) is one ~560 kB chunk, ~160 kB gzipped; that is expected
  vite: { build: { chunkSizeWarningLimit: 800 } },
});
