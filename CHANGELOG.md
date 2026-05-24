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

- `pnpm-workspace.yaml`, `package.json` racine, `.gitignore`, `tsconfig.base.json`
- `packages/aura/` — package `@aura-js/core` avec exports server/client/ui/shared/core/cli
- `apps/app/` — package `@aura-js/app` avec l'application utilisateur
- Migration du framework : `src/aura/*` → `packages/aura/src/*`
- Migration de l'app : `ref/aura_stack/src/*` → `apps/app/src/*`
- `_generated/` gardé dans l'app car spécifique au projet
- Conversion file-based → code-based routing
  - Ancien: `createFileRoute('/')` + `routeTree.gen.ts`
  - Nouveau: `createRoute({ path: '/', component: ... })` dans `router.tsx`
- `vite.config.ts` avec alias regex : `@/aura/_generated/*` → local, sinon `@/aura/*` → package
- Routeurs convertis : layout, home, about, todos

**Ancienne motivation (file-based) :**
> Les routes sont définies par fichiers dans `app/routes/` avec `createFileRoute`. Le route tree est généré automatiquement par le plugin TanStack Router.

**Nouvelle motivation (code-based) :**
> Les routes sont définies en dur dans `router.tsx` avec `createRoute`. Pas de génération, pas de fichiers de routes, contrôle total sur le route tree. L'utilisateur préfère le contrôle explicite à la magie implicite.
