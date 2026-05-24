# Aura — Changelog

> Log incrémental de toutes les modifications.
> Format: `YYYY-MM-DD | Phase N | [Ajouté/Modifié/Supprimé/Déprécié]`

---

## 2026-05-24 | Phase 0 | Ajouté

**Système de tracking pour reprise de contexte**

- `TRACKER.md` — Fichier source de vérité. Contient l'architecture complète, todo list, état d'avancement, décisions contraignantes, et prochaine action.
- `CHANGELOG.md` — CE FICHIER. Log incrémental de chaque modification avec l'ancienne motivation vs nouvelle motivation.

**Motivation initiale :**
> Le contexte de l'IA se réinitialise à chaque session. Impossible de travailler sur un projet complexe sans un fichier qui stocke l'état exact et les décisions. TRACKER.md sert de "mémoire externe".

---

## 2026-05-24 | Phase 1-3 | Ajouté/Modifié

**Migration monorepo complète : structure + framework + app**

- `package.json` racine avec workspaces bun, `.gitignore`, `tsconfig.base.json`
- `packages/aura/` — package `@aura-js/core` avec exports server/client/ui/shared/core/cli
- `apps/app/` — package `@aura-js/app` avec l'application utilisateur
- Migration du framework : `src/aura/*` → `packages/aura/src/*`
- Migration de l'app : `ref/aura_stack/src/*` → `apps/app/src/*`
- `_generated/` gardé dans l'app car spécifique au projet
- `vite.config.ts` avec alias regex : `@/aura/_generated/*` → local, sinon `@/aura/*` → package

## 2026-05-24 | Phase 4 | Modifié

**Routes file-based (compatibilité TanStack Start)**

- Retour aux routes file-based car TanStack Start nécessite la génération du route tree pour le SSR
- `src/routes/` avec `createFileRoute` — layout, home, about, todos
- `router.tsx` importe depuis `routeTree.gen.ts`
- `routeTree.gen.ts` ajouté au `.gitignore`

**Ancienne motivation (code-based) :**
> `createRoute()` dans `router.tsx` — contrôle total, pas de génération.

**Nouvelle motivation (file-based) :**
> TanStack Start a besoin du route tree généré pour le SSR bundling. Les routes sont en `src/routes/` avec `createFileRoute`. La génération est automatique via le plugin Vite. Le `router.tsx` importe le tree généré. C'est la seule manière supportée par Start aujourd'hui.

---

## 2026-05-24 | Split Déploiement (Thème 1) | Ajouté/Modifié

**Deux artifacts : backend Hono standalone + frontend TanStack Start**

- `apps/app/src/server-hono.ts` — Entrypoint Hono standalone pour la prod
- `apps/app/vite.config.ts` — RouteRules Nitro pour proxy /aura/* → backend
- `apps/app/package.json` — Scripts `build:backend` (bun build), `dev:backend`, `start:backend`
- `apps/app/.env.production` — Variables d'env pour la prod
- `Dockerfile.backend` + `Dockerfile.frontend` — Images Docker pour chaque artifact
- `packages/aura/package.json` — Ajout de toutes les dépendances manquantes (uuid, base-ui, langchain, hookform, hugeicons, cva, cmdk, vaul, recharts, resizable-panels, tanstack/react-router, vite)
- `packages/aura/tsconfig.json` — Ajout des paths `@/aura/*` → `./src/` et `@/generated/prisma/*`
- `tsconfig.base.json` — Correction des paths `@aura-js/core/*` et ajout `@/aura/*`
- `packages/aura/src/server/index.ts` — Export de `createAuraHonoApp`
- `apps/app/vite.config.ts` — Ajout alias `#/aura/` → package aura

**Résultat :**
- `bun run build:backend` → `build/backend/server-hono.js` (8.1 MB) ✅
- `bun run build:frontend` → `.output/` (client + ssr) ✅
- `bun src/server-hono.ts` → serveur Hono standalone sur :3001 ✅
- `bun dev` → serveur de dev unifié (TanStack + Hono) ✅

---

## 2026-05-24 | Brain Update 1 | Modifié

**Mise à jour post-session des fichiers de tracking**

- `TRACKER.md` — Architecture: ajout Dockerfiles, server-hono.ts, .env.production.example ; root passe de pnpm à Bun workspaces ; suppression pnpm-workspace.yaml ; router passe de code-based à file-based
- `TRACKER.md` — Décisions D1 et D2 marquées **DEPRECATED** avec nouvelle motivation conservée
- `TRACKER.md` — Table État actuel: commit `2958dc9` pour Thème 1

**Ancienne décision D1 :**
> Monorepo pnpm workspaces — Léger, natif, pas de dépendance build.

**Nouvelle motivation D1 :**
> `bun` est le runtime unique, pas besoin de pnpm. `bun install` + `bun build` remplacent pnpm et tsup. Déduplication automatique dans le monorepo.

**Ancienne décision D2 :**
> Routes code-based — Choix utilisateur, contrôle total.

**Nouvelle motivation D2 :**
> TanStack Start nécessite la génération du route tree pour le SSR bundling. Routes en `src/routes/` avec `createFileRoute`. Génération automatique via le plugin Vite.
