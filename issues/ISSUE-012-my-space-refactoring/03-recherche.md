# Phase 3 — Recherche

## Sources consultées

### Skills TanStack (locales)
| Source | Raison |
|---|---|
| `.agents/skills/tanstack-start-best-practices/rules/auth-route-protection.md` | Pattern `beforeLoad` + `redirect` pour auth guard |
| `.agents/skills/tanstack-router-best-practices/rules/load-use-loaders.md` | Route loaders pattern avec `ensureQueryData` |
| `.agents/skills/tanstack-router-best-practices/rules/split-lazy-routes.md` | Code splitting avec `.lazy.tsx` |
| `.agents/skills/tanstack-integration-best-practices/rules/flow-loader-query-pattern.md` | Loader + Query integration avec queryOptions |
| `.agents/skills/tanstack-integration-best-practices/rules/cache-single-source.md` | `defaultPreloadStaleTime: 0` pour Query cache unique |
| `.agents/skills/tanstack-integration-best-practices/rules/setup-query-client-context.md` | QueryClient via router context |
| `.agents/skills/tanstack-query-best-practices/rules/qk-factory-pattern.md` | Query key factories |

### Fichiers projet
| Source | Raison |
|---|---|
| `AGENTS.md` | Conventions du projet |
| `issues/TEMPLATE.md` | Workflow à suivre |
| `src/router.tsx` | Configuration router actuelle |
| `src/routes/__root.tsx` | Pattern existing d'auth + root config |
| `src/lib/auth-server.ts` | Fonction getToken pour auth |
| `src/lib/auth-client.ts` | Auth client better-auth |
| `src/components/purchases/hooks/use-activations.ts` | Query keys factories + hooks React Query |

### Concepts clés retenus

1. **`beforeLoad` + `redirect`**: le pattern TanStack Start pour auth guard. `throw redirect()` empêche le render du composant — contrairement à `navigate()` dans le render qui cause le warning React.

2. **`ensureQueryData` dans les loaders**: prefetch les données dans le cache Query AVANT le render du composant. Le composant utilise `useSuspenseQuery` pour garantir la disponibilité.

3. **`queryOptions` factory**: pattern de query key factories avec `queryOptions()` pour intégration loader + Query type-safe.

4. **`defaultPreloadStaleTime: 0`**: désactive le cache du router, Query devient l'unique source de cache.

5. **Routes dynamiques**: TanStack Router supporte les params dynamiques via `$param` dans les noms de fichiers. L'ordre de matching: static > dynamic.

6. **Lazy routes**: `createLazyFileRoute` pour le code splitting du component, le route file garde la config critique (loader, beforeLoad, validateSearch).
