import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const config = defineConfig({
  resolve: {
    tsconfigPaths: true,
    alias: {
      '@': resolve(__dirname, 'src'),
      '#': resolve(__dirname, 'src'),
    },
  },
  ssr: {
    noExternal: ['@convex-dev/better-auth'],
  },
  server: {
    allowedHosts: ['numzero.globalimex.online', 'localhost'],
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 4206,
    },
  },
  plugins: [
    devtools(),
    nitro({ rollupConfig: { external: [/^@sentry\//] } }),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    babel({ presets: [reactCompilerPreset()] }),
  ],
})

export default config
