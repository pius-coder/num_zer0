# num_zer0

SMS verification number marketplace — users buy virtual numbers for WhatsApp, Telegram, etc. using mobile money (Cameroon/Africa).

## Tech Stack

- **TanStack Start** (SSR with file-based routing via TanStack Router)
- **Convex** — database + serverless functions + reactive queries (NOT traditional REST/GraphQL)
- **better-auth** via `@convex-dev/better-auth` — email/password + anonymous (48h expiry)
- **Fapshi** — Cameroonian mobile money payments (MTN MoMo, Orange Money)
- **Base UI** (from @base-ui/react) for UI primitives, not Radix
- **Nitro** — deploy adapter (produces self-contained `dist/`)

## Commands

- `bun --bun run dev` — Dev server on port 3000
- `bun --bun run build` — Production build
- `bun --bun run test` — Vitest
- `bun --bun run format` — Prettier + ESLint --fix
- `npx convex dev` — Local Convex backend

## Important Files

- **ARCHITECTURE.md** — Full system overview (read first)
- **CODE_STYLE.md** — Coding conventions, React/Convex patterns, theming
- `convex/schema.ts` — Database schema (8 tables)
- `convex/auth.ts` + `convex/auth.config.ts` — Auth setup
- `convex/purchases.ts` — Payment lifecycle + Fapshi webhook + idempotency
- `convex/comptabilite.ts` — Double-entry accounting (OHADA chart)
- `src/lib/result.ts` — Rust-style `Result<T, E>` for error handling
- `src/lib/auth-server.ts` — SSR auth helper (critical for route loading)

## Rules

- Start here before coding — rules get added as friction is encountered
