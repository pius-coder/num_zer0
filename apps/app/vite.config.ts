import { defineConfig } from "vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { fileURLToPath } from "url";

const _dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = _dirname;
const PKG_AURA = path.resolve(_dirname, "../../packages/aura/src");

export default defineConfig({
  server: {
    host: true,
    allowedHosts: ["numzero.globalimex.online"],
  },
  resolve: {
    alias: [
      { find: /^@\/aura\/_generated\/(.*)/, replacement: path.resolve(ROOT, "src/aura/_generated/$1") },
      { find: /^@\/aura\/(.*)/, replacement: path.resolve(PKG_AURA, "$1") },
      { find: /^@\/(.*)/, replacement: path.resolve(ROOT, "src/$1") },
      { find: /^#\/aura\/(.*)/, replacement: path.resolve(PKG_AURA, "$1") },
    ],
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      server: {
        routeRules: {
          "/aura/**": { proxy: "http://localhost:3001" },
          "/aura-internal/**": { proxy: "http://localhost:3001" },
          "/files/**": { proxy: "http://localhost:3001" },
          "/health": { proxy: "http://localhost:3001" },
        },
      },
    }),
    viteReact(),
  ],
});
