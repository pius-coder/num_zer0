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
