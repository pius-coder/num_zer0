# Build stage
FROM oven/bun:1 AS build
WORKDIR /app

COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

COPY . .

# ───────────────────────────────────────────────────────────────────
# Build-time env vars (baked into client JS + SSR code)
#
# VITE_CONVEX_URL
#   → URL that both SSR AND the browser can reach.
#     On the Coolify Docker network "o14khxf94eni3l6puzc4dsyt",
#     the Convex backend container is reachable as "backend".
#     SSR: http://backend:3210     (Docker internal, works in-container)
#     Browser: needs a public URL — set up Traefik routing in Coolify
#     or use a Cloudflare tunnel that terminates at the backend.
#
# VITE_CONVEX_SITE_URL
#   → Convex HTTP actions proxy, always port 3211 on the same host.
#     SSR-only (auth callbacks), not used in the browser.
# ───────────────────────────────────────────────────────────────────
ARG VITE_CONVEX_URL=http://backend:3210
ARG VITE_CONVEX_SITE_URL=http://backend:3211
ENV VITE_CONVEX_URL=$VITE_CONVEX_URL
ENV VITE_CONVEX_SITE_URL=$VITE_CONVEX_SITE_URL

RUN bun run build

# Runtime stage
FROM oven/bun:1
WORKDIR /app
COPY --from=build /app/.output ./.output
EXPOSE 3000
CMD ["bun", ".output/server/index.mjs"]
