# Plan de Déploiement — Pattern Convex Self-Hosted

> Document destiné à l'agent d'implémentation. Lecture obligatoire avant la première modification.
> SHA git de base (snapshot pré-changements) : **`0eb1126`** — `fix(frontend): replace manual static serving with Nitro preset bun`.
> À la fin de l'implémentation, le diff `git diff 0eb1126..HEAD` doit être audité contre ce document.

---

## 1. Contexte et problème actuel

Le déploiement actuel produit deux artefacts Docker (`Dockerfile.frontend` → SSR TanStack Start sur :3000, `Dockerfile.backend` → Hono+WS sur :3001) avec, en théorie, un déploiement séparé sur deux domaines. En pratique, **les ratés de production ("parfois le serveur est inaccessible, parfois le frontend", invalidations WS perdues, calls qui pointent vers `localhost`) viennent de quatre fuites d'injection d'environnement**, pas d'un défaut d'architecture.

### 1.1 Bug racine #1 — `baseUrl` ignoré dans la config client

Le fichier `apps/app/src/routes/__root.tsx` ligne 25 contient actuellement (uncommitted) :

```tsx
<AuraProviderShell config={{ baseUrl: import.meta.env.VITE_AURA_URL ?? "http://localhost:3001" }}>
```

**Cette propriété `baseUrl` n'existe pas dans `AuraClientConfig`.** Voir `packages/aura/src/client/transport.ts:6-10` :

```ts
export interface AuraClientConfig {
  basePath: string;        // ← seul champ d'URL
  csrfCookieName: string;
  csrfHeaderName: string;
}

const defaultConfig: AuraClientConfig = {
  basePath: "/aura",       // ← path relatif, pas d'host
  ...
};
```

`configureAura()` fait un spread `{...activeConfig, ...config}` (ligne 21-24), donc l'objet `{ baseUrl: ... }` est mergé mais **jamais lu** par `fetch()`. Conséquence : tous les `callAura*` appellent `fetch("/aura/operationName")` en **relatif à l'origine de la page**.

Avant le commit `da84c2a` (du 2026-05-26), `apps/app/src/server.ts` montait Hono inline pour répondre à `/aura` sur l'origine du frontend. Ce commit a retiré ce mount : maintenant le SSR ne répond plus à `/aura`. Le client appelle donc `https://app.example.com/aura/...` → 404 ou page HTML (selon la route catch-all de Nitro). **L'app marche en dev** parce que vite/start sert quand même `/aura` via une route locale, **mais casse en prod**.

**Fix** : changer la sémantique. Plutôt que d'ajouter `baseUrl` à `AuraClientConfig` (et risquer de casser le pattern same-origin existant), on **fait du client un vrai client cross-origin Convex-style** en ajoutant `baseUrl` comme nouveau champ optionnel. Quand il est set, l'URL d'opération devient absolue.

### 1.2 Bug racine #2 — `VITE_AURA_URL` pas passé en ARG au build frontend

Voir `Dockerfile.frontend` actuel :

```dockerfile
FROM oven/bun:latest AS build
ARG VITE_AURA_WS_URL             # ← seul ARG
WORKDIR /app
...
ENV VITE_AURA_WS_URL=$VITE_AURA_WS_URL
RUN bun run --filter @aura-js/app build
```

`VITE_AURA_URL` n'est jamais déclaré ni propagé. Quand Coolify (ou un `docker build`) passe `--build-arg VITE_AURA_URL=https://api...`, **la variable est ignorée par Docker** car non déclarée en ARG. Conséquence : `import.meta.env.VITE_AURA_URL` est `undefined` au moment du `vite build`, le fallback `"http://localhost:3001"` est baked dans le bundle JS de production.

### 1.3 Bug racine #3 — Fallback CORS `localhost:3000` masque les erreurs d'env

Voir `packages/aura/src/server/hono-app.ts:23` :

```ts
app.use("*", cors({
  origin: process.env.AURA_APP_URL ?? "http://localhost:3000",
  ...
}));
```

Si `AURA_APP_URL` n'est pas set en runtime (oubli dans Coolify), CORS autorise `localhost:3000` — qui n'est **jamais** l'origine d'une requête en prod. Toutes les requêtes cross-origin sont silencieusement rejetées par le navigateur sans message explicite côté serveur.

Voir aussi `packages/server-hono/src/hono-app.ts:12` :

```ts
app.use("*", cors({ origin: process.env["AURA_APP_URL"] ?? "*" }));
```

Ce fichier-là fait pire : fallback `"*"` (wildcard, insécurisé). Note : ce module **n'est pas utilisé** par `apps/app/src/backend.ts` (qui appelle `createAuraHonoApp` de `packages/aura/src/server/hono-app.ts`), mais on le corrige par symétrie.

### 1.4 Bug racine #4 — Fallback WS `defaultWsUrl()` obsolète

Voir `packages/plugins/realtime/src/client.tsx:16-19` :

```ts
function defaultWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/aura-realtime/ws`;
}
```

Ce fallback est un vestige du pattern reverse-proxy abandonné. Le path `/aura-realtime/ws` n'est plus exposé par le backend (qui sert le WS sur `/ws`, voir `packages/plugins/realtime/src/server.ts`). Si `VITE_AURA_WS_URL` n'est pas baked, le client tente une connexion WS sur l'origine du **frontend** vers `/aura-realtime/ws` → handshake échoue → reconnect loop infinie → realtime cassé.

---

## 2. Architecture cible (pattern Convex pur)

```
┌────────────────────────────────┐         ┌──────────────────────────────────┐
│  Frontend image                │         │  Backend image                   │
│  Image: oven/bun:latest        │         │  Image: oven/bun:latest          │
│  Process: bun .output/server   │         │  Process: bun backend/backend.js │
│  Port: 3000                    │         │  Port: 3001                      │
│  Coolify: app n°1, domaine A   │         │  Coolify: app n°2, domaine B     │
│                                │         │                                  │
│  TanStack Start (SSR)          │ ──HTTPS─▶│  Hono + WS (Bun.serve)          │
│  = client du backend           │  +WSS   │  /aura, /aura-internal, /files, │
│                                │         │  /health, /publish, /ws         │
│                                │         │                                  │
│  BUILD ARGS (build-time) :     │         │  RUNTIME ENV :                   │
│   VITE_AURA_URL=https://B      │         │   PORT=3001                      │
│   VITE_AURA_WS_URL=wss://B/ws  │         │   AURA_APP_URL=https://A         │
│                                │         │   AURA_INTERNAL_SECRET=<shared>  │
│  RUNTIME ENV :                 │         │   AURA_CSRF_SECRET=<shared>      │
│   PORT=3000                    │         │   DATABASE_URL=postgres://...    │
│                                │         │   AURA_REALTIME_INTERNAL_URL=    │
│                                │         │     http://localhost:3001        │
└────────────────────────────────┘         └──────────────────────────────────┘
```

- **A** = domaine frontend choisi par l'utilisateur (ex. `app.example.com`)
- **B** = domaine backend choisi par l'utilisateur (ex. `api.example.com`)
- **Aucun fichier `docker-compose.yml`** (l'utilisateur n'en veut pas).
- **Aucun reverse proxy embarqué** (l'utilisateur ne veut pas configurer Caddy/Traefik).
- Coolify (ou tout autre PaaS) déploie chaque image indépendamment avec son propre domaine et son propre TLS.

---

## 3. Modifications fichier par fichier

> **Convention** : les blocs `AVANT` montrent l'état au SHA `0eb1126` (+ la modif uncommitted de `__root.tsx`). Les blocs `APRÈS` montrent le résultat attendu. Toujours préserver le reste du fichier.

### 3.1 `packages/aura/src/client/transport.ts` — ajouter `baseUrl` à `AuraClientConfig`

**AVANT (lignes 1-32)** :

```ts
"use client";

import type { AuraBump, AuraEnvelope, AuraErrorEnvelope } from "@/aura/core/envelope";
import type { AuraFieldErrors } from "@/aura/core/errors";

export interface AuraClientConfig {
  basePath: string;
  csrfCookieName: string;
  csrfHeaderName: string;
}

const defaultConfig: AuraClientConfig = {
  basePath: "/aura",
  csrfCookieName: "aura_csrf",
  csrfHeaderName: "x-aura-csrf",
};

let activeConfig: AuraClientConfig = defaultConfig;

export function configureAuraClient(config: Partial<AuraClientConfig>): void {
  activeConfig = {
    ...activeConfig,
    ...config,
  };
}

export const configureAura = configureAuraClient;

export function getAuraClientConfig(): AuraClientConfig {
  return activeConfig;
}
```

**APRÈS** :

```ts
"use client";

import type { AuraBump, AuraEnvelope, AuraErrorEnvelope } from "@/aura/core/envelope";
import type { AuraFieldErrors } from "@/aura/core/errors";

export interface AuraClientConfig {
  baseUrl: string;
  basePath: string;
  csrfCookieName: string;
  csrfHeaderName: string;
}

const defaultConfig: AuraClientConfig = {
  baseUrl: "",
  basePath: "/aura",
  csrfCookieName: "aura_csrf",
  csrfHeaderName: "x-aura-csrf",
};

let activeConfig: AuraClientConfig = defaultConfig;

export function configureAuraClient(config: Partial<AuraClientConfig>): void {
  activeConfig = {
    ...activeConfig,
    ...config,
  };
}

export const configureAura = configureAuraClient;

export function getAuraClientConfig(): AuraClientConfig {
  return activeConfig;
}
```

**Et plus bas dans le même fichier**, modifier `operationUrl()` (lignes 169-178) pour préfixer le `baseUrl` quand il est non vide :

**AVANT** :

```ts
function operationUrl(basePath: string, operationName: string): string {
  const safeBasePath = basePath.endsWith("/")
    ? basePath.slice(0, -1)
    : basePath;
  const path = operationName
    .split(".")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${safeBasePath}/${path}`;
}
```

**APRÈS** :

```ts
function operationUrl(operationName: string): string {
  const config = getAuraClientConfig();
  const baseUrl = config.baseUrl.endsWith("/")
    ? config.baseUrl.slice(0, -1)
    : config.baseUrl;
  const safeBasePath = config.basePath.endsWith("/")
    ? config.basePath.slice(0, -1)
    : config.basePath;
  const path = operationName
    .split(".")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${baseUrl}${safeBasePath}/${path}`;
}
```

> **Important** : la signature de `operationUrl()` change (un seul argument). Adapter les **3 appelants** dans le même fichier :
> - Ligne 73 : `operationUrl(config.basePath, options.operationName)` → `operationUrl(options.operationName)`
> - Ligne 107 : `operationUrl(config.basePath, "_manifest")` → `operationUrl("_manifest")`
> - Ligne 149 : `operationUrl(config.basePath, "_manifest")` → `operationUrl("_manifest")`

> **Aussi** : changer `credentials: "same-origin"` → `credentials: "include"` aux lignes 76 et 109 (sinon les cookies CSRF ne sont pas envoyés cross-origin). Note : cette bascule **exige** que le serveur réponde avec `Access-Control-Allow-Credentials: true` et que `AURA_APP_URL` soit une origine explicite (pas `*`).

### 3.2 `packages/aura/src/server/hono-app.ts` — CORS strict avec credentials, fail-loud en prod

**Localiser le bloc CORS** (autour des lignes 19-27). Vérifier l'extrait exact en lisant le fichier — il ressemble à :

```ts
app.use("*", cors({
  origin: process.env.AURA_APP_URL ?? "http://localhost:3000",
  ...
}));
```

**Modification** :

```ts
const appUrl = process.env.AURA_APP_URL;
if (!appUrl && process.env.NODE_ENV === "production") {
  throw new Error(
    "[aura] AURA_APP_URL must be set in production (frontend origin for CORS allow-list)."
  );
}

app.use("*", cors({
  origin: appUrl ?? "http://localhost:3000",
  credentials: true,
  // Conserver les autres options existantes (allowMethods, allowHeaders, etc.)
}));
```

> **À VÉRIFIER avant d'éditer** : lire le bloc `cors({...})` complet et garder toutes les options déjà configurées (`allowMethods`, `allowHeaders`, `exposeHeaders`...). N'ajouter que `credentials: true` et remplacer la résolution de `origin`.

### 3.3 `packages/server-hono/src/hono-app.ts:12` — même fix symétrique

Même pattern : refuser le wildcard `"*"` en prod, accepter le fallback dev.

```ts
const appUrl = process.env["AURA_APP_URL"];
if (!appUrl && process.env["NODE_ENV"] === "production") {
  throw new Error(
    "[aura] AURA_APP_URL must be set in production."
  );
}
app.use("*", cors({ origin: appUrl ?? "*", credentials: true }));
```

> Note : ce module n'est pas l'entrypoint runtime principal (qui passe par `packages/aura/src/server/hono-app.ts`), mais on aligne pour éviter le piège futur.

### 3.4 `apps/app/src/routes/__root.tsx` — fail-loud sur env build manquante

**État actuel uncommitted ligne 25** :

```tsx
<AuraProviderShell config={{ baseUrl: import.meta.env.VITE_AURA_URL ?? "http://localhost:3001" }}>
```

**APRÈS** : déplacer la résolution en module-level pour fail-loud au moment du **bundle SSR**, pas au premier render.

```tsx
import { createRootRoute, HeadContent, Scripts, Outlet } from '@tanstack/react-router'
import { AuraProviderShell } from '@/aura/server/manifest-injector'
import { AuraBumpToaster } from '@/aura/ui/aura-bump-toaster'

import '../styles.css'

const AURA_URL = (() => {
  const baked = import.meta.env.VITE_AURA_URL;
  if (baked) return baked as string;
  if (import.meta.env.DEV) return "http://localhost:3001";
  throw new Error(
    "[aura] VITE_AURA_URL is required at build time for production. " +
    "Pass it via --build-arg VITE_AURA_URL=https://api.example.com when building Dockerfile.frontend."
  );
})();

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Todo App' },
    ],
  }),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="fr" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <AuraProviderShell config={{ baseUrl: AURA_URL }}>
          <Outlet />
          <AuraBumpToaster />
        </AuraProviderShell>
        <Scripts />
      </body>
    </html>
  )
}
```

### 3.5 `packages/aura/src/server/manifest-injector.tsx` — propager `config`

Le composant `AuraProviderShell` accepte déjà `config` et le transmet à `AuraProvider`. Vérifier que rien n'est cassé après ajout du champ `baseUrl` :

```tsx
export function AuraProviderShell({
  children,
  config,
  queryClient,
}: {
  children: ReactNode;
  config?: Parameters<typeof AuraProvider>[0]["config"];
  queryClient?: Parameters<typeof AuraProvider>[0]["queryClient"];
}) {
  return (
    <AuraProvider config={config} queryClient={queryClient} initialManifest={getClientOperationManifest()}>
      {children}
    </AuraProvider>
  );
}
```

→ **Aucune modification nécessaire** ici. Mais relire pour confirmer après changement du type `AuraClientConfig`.

### 3.6 `packages/plugins/realtime/src/client.tsx` — supprimer `defaultWsUrl()`

**AVANT (lignes 16-19)** :

```ts
function defaultWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/aura-realtime/ws`;
}
```

**Ligne 46** (dans le composant Provider) :

```ts
const url = wsUrl ?? defaultWsUrl();
```

**APRÈS** : supprimer `defaultWsUrl()` entièrement. Et changer la résolution à la ligne 46 :

```ts
if (!wsUrl) {
  console.warn(
    "[aura:realtime] wsUrl is not configured — realtime invalidations disabled. " +
    "Set VITE_AURA_WS_URL at build time (e.g. wss://api.example.com/ws)."
  );
  return; // ne pas tenter de connexion WS
}
const url = wsUrl;
```

> **À VÉRIFIER** : lire le composant complet à partir de la ligne 36 pour comprendre dans quel `useEffect` se trouve la ligne 46, et adapter le `return;` correctement (probablement un early-return du `useEffect`).

### 3.7 `packages/aura/src/client/provider.tsx` — pas de fallback WS magique

Lignes 36-40 actuelles :

```ts
const envWsUrl = import.meta.env.VITE_AURA_WS_URL as string | undefined;
```

→ **Aucune modification de fichier** : on garde le passe-plat. Le warning et le no-op sont gérés par `client.tsx` (3.6).

> En revanche, **ajouter en module-level** un check fail-loud symétrique à `__root.tsx` (ligne ~40, juste après la déclaration de `envWsUrl`) :

```ts
const envWsUrl = (() => {
  const baked = import.meta.env.VITE_AURA_WS_URL as string | undefined;
  if (baked) return baked;
  if (import.meta.env.DEV) return undefined; // dev: warn-only
  console.error(
    "[aura] VITE_AURA_WS_URL is not set — realtime disabled in production build. " +
    "Pass it via --build-arg VITE_AURA_WS_URL=wss://api.example.com/ws."
  );
  return undefined;
})();
```

> Choix conscient : on **n'arrête pas le boot** si le WS manque (l'app fonctionne sans realtime, juste sans invalidation cross-tab/cross-device). On log une erreur grasse. Différent de `AURA_URL` qui est *nécessaire* pour que l'app marche du tout.

### 3.8 `Dockerfile.frontend` — déclarer `VITE_AURA_URL` en ARG + healthcheck

**AVANT** :

```dockerfile
FROM oven/bun:latest AS build
ARG VITE_AURA_WS_URL
WORKDIR /app
COPY package.json bun.lock tsconfig.base.json ./
COPY apps/app/package.json apps/app/tsconfig.json apps/app/
COPY packages/aura/package.json packages/aura/
COPY packages/core/package.json packages/core/
COPY packages/client-react/package.json packages/client-react/
COPY packages/plugins/realtime/package.json packages/plugins/realtime/
COPY packages/plugins/observability/package.json packages/plugins/observability/
COPY packages/plugins/http-actions/package.json packages/plugins/http-actions/
COPY packages/plugins/dashboard/package.json packages/plugins/dashboard/
COPY packages/plugins/workflows/package.json packages/plugins/workflows/
COPY packages/plugins/notifications/package.json packages/plugins/notifications/
RUN bun install
COPY . .
ENV VITE_AURA_WS_URL=$VITE_AURA_WS_URL
RUN bun run --filter @aura-js/app build

FROM oven/bun:latest
USER bun
WORKDIR /app
# Preserve original directory structure so Bun's relative symlinks resolve
COPY --from=build --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/apps/app/ ./apps/app/
ENV PORT=3000
EXPOSE 3000
CMD ["bun", "apps/app/.output/server/index.mjs"]
```

**APRÈS** :

```dockerfile
FROM oven/bun:latest AS build
ARG VITE_AURA_URL
ARG VITE_AURA_WS_URL
WORKDIR /app
COPY package.json bun.lock tsconfig.base.json ./
COPY apps/app/package.json apps/app/tsconfig.json apps/app/
COPY packages/aura/package.json packages/aura/
COPY packages/core/package.json packages/core/
COPY packages/client-react/package.json packages/client-react/
COPY packages/plugins/realtime/package.json packages/plugins/realtime/
COPY packages/plugins/observability/package.json packages/plugins/observability/
COPY packages/plugins/http-actions/package.json packages/plugins/http-actions/
COPY packages/plugins/dashboard/package.json packages/plugins/dashboard/
COPY packages/plugins/workflows/package.json packages/plugins/workflows/
COPY packages/plugins/notifications/package.json packages/plugins/notifications/
RUN bun install
COPY . .
ENV VITE_AURA_URL=$VITE_AURA_URL
ENV VITE_AURA_WS_URL=$VITE_AURA_WS_URL
RUN bun run --filter @aura-js/app build

FROM oven/bun:latest
USER bun
WORKDIR /app
COPY --from=build --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/apps/app/ ./apps/app/
ENV PORT=3000
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD bun -e "fetch('http://localhost:'+(process.env.PORT||3000)+'/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "apps/app/.output/server/index.mjs"]
```

### 3.9 `Dockerfile.backend` — healthcheck

**AVANT** : pas de `HEALTHCHECK`.

**APRÈS** : ajouter juste avant la dernière ligne `CMD`.

```dockerfile
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD bun -e "fetch('http://localhost:'+(process.env.PORT||3001)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["bun", "backend/backend.js"]
```

Aucun ARG à ajouter (le backend est purement runtime-configurable).

### 3.10 `apps/app/.env.production.example` — clarifier build vs runtime

> **NE PAS LIRE** ce fichier directement (permission denied dans la session de planification). Le **réécrire entièrement** au format suivant. Si une variable du fichier existant n'est pas couverte ici, **ne pas la supprimer** : la conserver et l'ajouter à un commentaire `# kept from previous version`.

```
# ============================================================
# Aura — Production environment template
# ============================================================
#
# This project deploys as TWO independent Docker images, each
# with its own domain (Convex-style split):
#
#   - Dockerfile.frontend  → SSR TanStack Start, port 3000
#                            → e.g. https://app.example.com
#   - Dockerfile.backend   → Hono + WebSocket, port 3001
#                            → e.g. https://api.example.com
#
# Vite environment variables (VITE_*) are BAKED INTO THE BUNDLE
# at build time. They MUST be passed via --build-arg to
# `docker build` (or the equivalent UI field in Coolify, etc.).
#
# Non-VITE_* variables are runtime-only. Pass them via `-e` to
# `docker run` (or the equivalent runtime env field).
# ============================================================

# ----- FRONTEND (build-time, baked into JS bundle) -----
VITE_AURA_URL=https://api.example.com
VITE_AURA_WS_URL=wss://api.example.com/ws

# ----- BACKEND (runtime) -----
PORT=3001
NODE_ENV=production
AURA_APP_URL=https://app.example.com
AURA_INTERNAL_SECRET=replace-with-openssl-rand-hex-32
AURA_CSRF_SECRET=replace-with-openssl-rand-hex-32
AURA_REALTIME_INTERNAL_URL=http://localhost:3001
DATABASE_URL=postgresql://user:pass@host:5432/db?sslmode=require

# ----- BACKEND (optional, runtime) -----
# AURA_BCRYPT_ROUNDS=12
# AURA_STORAGE_PATH=/data/files
# AURA_STORAGE_PUBLIC_PREFIX=/files
# AURA_S3_ENDPOINT=
# AURA_S3_BUCKET_NAME=aura-media
# AURA_S3_PUBLIC_ENDPOINT=
# AURA_OTP_WEBHOOK_URL=
# AURA_DASHBOARD_ENABLED=false
```

---

## 4. Choses à NE PAS toucher

- `apps/app/src/backend.ts` — l'entrypoint backend est correct (`createAuraHonoApp` + `addRealtimeRoutes` + `Bun.serve({ fetch, websocket })`).
- `apps/app/src/server.ts` — le SSR pur est correct, NE PAS y remonter Hono.
- `apps/app/vite.config.ts` — pas de `routeRules`, pas de proxy.
- `apps/app/package.json` scripts — `build`, `build:backend`, `start`, `start:backend` sont OK.
- `packages/plugins/realtime/src/server.ts` — le serveur WS est OK, sert `/ws`.
- `packages/plugins/realtime/src/publish.ts` — la boucle interne via `AURA_REALTIME_INTERNAL_URL` est OK.
- `.dockerignore` — exclut déjà les fichiers `.env*`.

---

## 5. Vérification post-implémentation

### 5.1 Type-check

```bash
bun x tsc --noEmit --project packages/aura/tsconfig.json
bun x tsc --noEmit --project apps/app/tsconfig.json
```

Aucune erreur ne doit apparaître **dans les fichiers modifiés** (les erreurs pré-existantes listées dans `AGENTS.md` pitfalls sont tolérées).

### 5.2 Build frontend avec env

```bash
docker build -f Dockerfile.frontend \
  --build-arg VITE_AURA_URL=https://api.test.local \
  --build-arg VITE_AURA_WS_URL=wss://api.test.local/ws \
  -t aura-front:test .
```

Lancer :

```bash
docker run --rm -p 3000:3000 -e PORT=3000 aura-front:test
```

Tester :

```bash
curl -s http://localhost:3000/ | head -20            # HTML rendu
# Inspecter le bundle JS servi : "api.test.local" doit apparaître,
# "localhost:3001" ne doit JAMAIS apparaître.
curl -s http://localhost:3000/_build/assets/*.js | grep -c "localhost:3001"  # → 0
curl -s http://localhost:3000/_build/assets/*.js | grep -c "api.test.local"  # → ≥ 1
```

### 5.3 Build frontend SANS env (doit échouer)

```bash
docker build -f Dockerfile.frontend -t aura-front:nofail .
```

→ Le `RUN bun run --filter @aura-js/app build` doit **lever l'erreur** définie en 3.4 (`VITE_AURA_URL is required at build time`).

### 5.4 Build et run backend

```bash
docker build -f Dockerfile.backend -t aura-back:test .
docker run --rm -d --name aura-back -p 3001:3001 \
  -e PORT=3001 \
  -e NODE_ENV=production \
  -e AURA_APP_URL=https://app.test.local \
  -e AURA_INTERNAL_SECRET=$(openssl rand -hex 32) \
  -e AURA_CSRF_SECRET=$(openssl rand -hex 32) \
  -e DATABASE_URL=postgresql://test:test@host.docker.internal:5432/test \
  aura-back:test
```

Vérifier :

```bash
sleep 15
docker inspect --format='{{.State.Health.Status}}' aura-back   # → "healthy"
curl -s http://localhost:3001/health                            # → {"ok":true,...}
curl -i -H "Origin: https://evil.com" http://localhost:3001/aura/_manifest  # CORS refusé
curl -i -H "Origin: https://app.test.local" -X OPTIONS http://localhost:3001/aura/_manifest  # 204 + Access-Control-*
docker logs aura-back | grep -i error    # rien
docker rm -f aura-back
```

### 5.5 Backend SANS `AURA_APP_URL` en prod (doit échouer)

```bash
docker run --rm -p 3001:3001 \
  -e PORT=3001 -e NODE_ENV=production \
  -e DATABASE_URL=postgresql://x:x@x:5432/x \
  aura-back:test
```

→ Le process doit crash au boot avec `AURA_APP_URL must be set in production`.

### 5.6 Test end-to-end manuel (après deploy Coolify)

1. Frontend déployé sur domaine A, backend sur domaine B.
2. Ouvrir `https://A/` dans le navigateur.
3. Onglet Network DevTools : confirmer que `_manifest`, les `callAura*`, et le WebSocket pointent **tous vers `https://B/...`** et `wss://B/ws` (jamais vers A).
4. Faire une mutation (ex. créer un todo) → l'invalidation realtime arrive (UI refresh sans rechargement).
5. Ouvrir un 2e onglet sur `https://A/` → les mutations du 1er onglet déclenchent l'invalidation du 2e (BroadcastChannel local + WS leader election).
6. Aucune erreur CORS dans la console.

---

## 6. Checklist pour l'agent d'implémentation

Cocher au fur et à mesure. Tout doit être vrai à la fin.

- [ ] `packages/aura/src/client/transport.ts` : `baseUrl` ajouté à `AuraClientConfig` + default `""` + `operationUrl()` refactored + 3 appelants adaptés + `credentials: "include"` aux lignes 76 et 109.
- [ ] `packages/aura/src/server/hono-app.ts` : fail-loud sur `AURA_APP_URL` en prod + `credentials: true` ajouté à CORS.
- [ ] `packages/server-hono/src/hono-app.ts:12` : même fix symétrique.
- [ ] `apps/app/src/routes/__root.tsx` : `AURA_URL` extrait en module-level avec fail-loud + passe `{ baseUrl: AURA_URL }` au `AuraProviderShell`.
- [ ] `packages/plugins/realtime/src/client.tsx` : `defaultWsUrl()` supprimé + early-return propre dans le `useEffect` si `wsUrl` falsy.
- [ ] `packages/aura/src/client/provider.tsx` : `envWsUrl` enrichi d'un log d'erreur prod-only quand absent.
- [ ] `Dockerfile.frontend` : `ARG VITE_AURA_URL` + `ENV VITE_AURA_URL=$VITE_AURA_URL` ajoutés + `HEALTHCHECK` ajouté.
- [ ] `Dockerfile.backend` : `HEALTHCHECK` ajouté.
- [ ] `apps/app/.env.production.example` : réécrit selon le template de 3.10 (en conservant les éventuelles vars supplémentaires existantes).
- [ ] `bun x tsc --noEmit` passe sur les deux projets sans nouvelle erreur.
- [ ] La section 5 (Vérification) a été parcourue au moins jusqu'à 5.4 inclus.
- [ ] **Aucun fichier suivant n'a été modifié** : `apps/app/src/backend.ts`, `apps/app/src/server.ts`, `apps/app/vite.config.ts`, `apps/app/package.json` (scripts), `packages/plugins/realtime/src/server.ts`, `packages/plugins/realtime/src/publish.ts`.
- [ ] **Aucun fichier `docker-compose.yml`, `Caddyfile`, ou config Traefik n'a été créé.**

---

## 7. Pour l'audit post-implémentation

Après que l'agent a fini, l'orchestrateur (moi à la session suivante) fera :

```bash
git diff 0eb1126..HEAD -- \
  packages/aura/src/client/transport.ts \
  packages/aura/src/server/hono-app.ts \
  packages/server-hono/src/hono-app.ts \
  apps/app/src/routes/__root.tsx \
  packages/plugins/realtime/src/client.tsx \
  packages/aura/src/client/provider.tsx \
  Dockerfile.frontend \
  Dockerfile.backend \
  apps/app/.env.production.example
```

Et vérifiera que **chaque case de la checklist § 6 est cochée** par une modif visible dans le diff. Tout fichier modifié hors de cette liste devra être justifié.
