# Phase 2 — Lecture ciblée

## `src/routes/__root.tsx` (L1-L91)

- Root route avec `createRootRouteWithContext<{ queryClient, convexQueryClient }>()`
- `beforeLoad`: appelle `getAuth()` (server fn qui lit le token) pour setter `isAuthenticated` + `token` dans le context
- `RootComponent` wrapper: `ConvexBetterAuthProvider` + `RootDocument` + `<Outlet />`
- `RootDocument` contient: `<RouteLoader caller="__root.tsx" />`, `<GlobalLoader />`, children, devtools, Toaster, Scripts
- Pas de `RouteLoader` dans `RootDocument` — il est dans le body, rendu avant le `{children}` (qui contient le Outlet)

## `src/routes/(app)/my-space.tsx` (L1-L7)

- Route file minimal: `createFileRoute('/(app)/my-space')`
- `ssr: false` — désactive le SSR
- Component: `MySpacePage` importé depuis `#/components/spa/my-space-page`
- Pas de `loader`, pas de `beforeLoad`, pas de `validateSearch`

## `src/routes/(app)/route.tsx` (L1-L19)

- Layout route pour le pathless group `(app)`
- Component: `BottomNavProvider` > `<main><Outlet /></main>` + `DesktopDrawerProxy` + `MobileBottomNav`
- Pas de `beforeLoad`, pas de auth guard

## `src/routes/auth-splash.tsx` (L1-L24)

- `ssr: false`
- MÊME anti-pattern: `if (!isPending && session) { navigate({ to: '/my-space' }); return null }`
- Render-phase navigation identique au bug rapporté

## `src/components/spa/my-space-page.tsx` (L1-L1162)

- **Composant monolithique** avec 5 vues internes:
  1. `ServiceList` (L139-L265) — Liste de services avec search bar
  2. `HistoryView` (L269-L341) — Historique des activations
  3. `CountryList` (L414-L559) — Liste des pays pour un service, avec pagination infinie
  4. `PurchaseConfirmation` (L860-L895) — Confirmation d'achat
  5. `ActivationDetail` (L899-L1131) — Détail d'une activation avec timeline
- **Sous-composants partagés**:
  6. `PurchaseOptionsInline` (L572-L856) — Panneau d'achat complet (opérateur, prix, stepper, location)
  7. `ServiceIcon` (L377-L398) — Icône de service avec fallback webp→svg→letter
  8. `ServiceBadge` (L403-L410) — Badge lettre pour service
  9. `TimelineLine` (L1133-L1161) — Ligne de timeline
  10. `IconLetter` (L369-L375) — Lettre de fallback pour icône
- **Constantes**: `STATUS_LABELS`, `STATUS_COLORS`, `SVG_IDS`, `NO_ICON_IDS`, `XAF_USD_RATE`
- **Fonctions utilitaires**: `isActiveStatus()`, `getDefaultMarginXaf()`

**Points critiques**:
- `useState<PageView>` pour la navigation interne (L67)
- `navigate()` dans le render (L73-L76) — **CAUSE DIRECTE DU WARNING**
- 12+ hooks React Query appelés directement (L69-L70 + dispatchés dans sous-composants)
- `useEffect` avec IntersectionObserver pour la pagination infinie (L461-L468)
- `onError` sur `<img>` pour le fallback d'icônes (L392-L396)

## `src/common/route-loader.tsx` (L1-L35)

- `useRouterState({ select: (s) => s.status === 'pending' })` — écoute l'état du router
- `useState(false)` pour `showLoader`
- `useEffect` avec `setTimeout` de 1500ms
- Warning en dev si le route est pending >1500ms
- Correct dans son fonctionnement, mais peut déclencher state update après unmount lors d'une transition rapide

## `src/router.tsx` (L1-L68)

- `new QueryClient` avec `staleTime: 30 * 1000`
- `createRouter` avec `defaultPreload: 'intent'`
- PAS de `defaultPreloadStaleTime: 0` — le router gère son propre cache en parallèle de Query
- `setupRouterSsrQueryIntegration` pour SSR hydration
- `ConvexProvider` via `Wrap` option
- `RouterContext` déclaré avec `{ convexQueryClient: ConvexQueryClient }` (sans queryClient)

## `src/components/purchases/hooks/use-activations.ts` (L1-L119)

- `activationKeys` factory: `all`, `activation(id)`, `myActivations()`, `numberQuantity(country)`, `topCountries(service)`, `operators(country)`, `prices(country, service)`
- Hooks: `useActivation`, `useMyActivations`, `useInitiateActivation`, `useCompleteActivation`, `useCancelActivation`, `useRequestAnotherSms`, `useNumberQuantity`, `useTopCountries`, `useOperators`, `usePrices`, `useRentPriceList`
- `useConvexMutation` pour les mutations Convex
- `useConvexAction` pour les actions Convex (requêtes non-réactives)
- `convexQuery` pour les queries Convex réactives
- Pattern: `useMyActivations` utilise `convexQuery(api.sms_provider.getMyActivations, {})`
- Pattern: `useTopCountries` utilise `useConvexAction` avec `queryKey` + `queryFn`
