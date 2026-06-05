# Phase 1 — Exploration

## Fichiers impactés

| Fichier | Intervalle | Rôle dans l'issue |
|---|---|---|
| `src/routes/__root.tsx` | L1-L91 | Root route: RouteLoader à L74, appelé dans la stack trace du warning |
| `src/routes/(app)/my-space.tsx` | L1-L7 | Route definition avec `ssr: false`, component délégué à `MySpacePage` |
| `src/routes/(app)/route.tsx` | L1-L19 | Layout `(app)` avec BottomNavProvider, pas de auth guard |
| `src/routes/(app)/wallet.tsx` | L1-L7 | Route similaire avec `ssr: true` (pattern correct) |
| `src/routes/(app)/recharge.tsx` | L1-L26 | Route avec `ssr: true` |
| `src/routes/auth-splash.tsx` | L1-L24 | Auth splash avec MÊME anti-pattern `navigate()` in render |
| `src/components/spa/my-space-page.tsx` | L1-L1162 | Monolithe SPA — 5 vues internes gérées par useState<PageView> |
| `src/components/spa/my-space-skeleton.tsx` | L1-L321 | Skeleton loading pour my-space |
| `src/components/spa/spa-context.tsx` | L1-L19 | LocaleProvider simple |
| `src/common/route-loader.tsx` | L1-L35 | RouteLoader avec setTimeout + setShowLoader |
| `src/router.tsx` | L1-L68 | Config router: pas de `defaultPreloadStaleTime: 0` |
| `src/components/purchases/hooks/use-activations.ts` | L1-L119 | React Query hooks + query key factory |

## Dependances identifiées

- `my-space-page.tsx` importe depuis:
  - `#/lib/auth-client` — authClient.useSession()
  - `@tanstack/react-router` — useNavigate
  - `#/components/purchases/hooks` — 12+ hooks React Query
  - `@/components/services/data` — SERVICES, COUNTRIES
  - `@/components/layout/bottom-nav-store` — useBottomNav
  - `#/type/sms_activation` — types
  - `../../../convex/_generated/dataModel` — Convex Id type

## Agents utilisés

- Exploration directe par l'agent coordinateur

## Synthèse

Le warning React "Can't perform a React state update on a component that hasn't mounted yet" est causé par un appel à `navigate()` pendant le render dans `my-space-page.tsx:74`. La stack trace montre que cela déclenche le `Transitioner` de TanStack Router pendant le render phase.

Le composant `my-space-page.tsx` fait 1162 lignes (limite projet: 200) et gère 5 vues internes avec `useState<PageView>`. L'architecture doit être migrée vers des routes dynamiques TanStack Router.
