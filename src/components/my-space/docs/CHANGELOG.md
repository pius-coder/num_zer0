# Changelog — my-space

## 2026-06-05 — Route fix + auth-splash fix
- **Fix**: `$serviceId.tsx` converti en layout `<Outlet />`, création `$serviceId/index.tsx` pour CountryList — la route enfant `$countryIso` ne rendait jamais car le parent n'avait pas d'Outlet
- **Fix**: `auth-splash.tsx` — `navigate()` déplacé de la phase de render vers `useEffect` pour éliminer le warning React "state update on unmounted component"
- **Fix**: `useSuspenseQuery` → `useQuery` pour les queries basées sur `convexAction` (`topCountries`, `prices`) pour résoudre l'incompatibilité de type avec `skipToken`

## 2026-06-05 — Composants extraits (Step 5)
- **Nouveau**: `operator-selector.tsx`, `price-stepper.tsx`, `rental-options.tsx` extraits de `PurchaseOptionsInline`
  pour respecter la limite 200 lignes
- **Nouveau**: `service-list.tsx`, `history-view.tsx`, `country-list.tsx`, `activation-detail.tsx`,
  `purchase-page.tsx`, `purchase-panel.tsx` — composants principaux extraits du monolithe SPA
- **Nouveau**: `service-icon.tsx`, `service-badge.tsx`, `timeline-line.tsx` — sous-composants
- **Nouveau**: `constants.ts`, `utils.ts` — valeurs et helpers partagés
- **Nouveau**: `index.ts` — barrel export
- **Nouveau**: `hooks/my-space-queries.ts` — factory `queryOptions` pour 5 queries
- **Nouveau**: `hooks/index.ts` — barrel

## 2026-06-05 — Routes dynamiques créées (Step 4)
- **Nouveau**: `src/routes/(app)/my-space/index.tsx` — `/my-space` avec ServiceList
- **Nouveau**: `src/routes/(app)/my-space/history.tsx` — `/my-space/history` avec HistoryView
- **Nouveau**: `src/routes/(app)/my-space/$serviceId.tsx` — `/my-space/{serviceId}` avec CountryList
- **Nouveau**: `src/routes/(app)/my-space/$serviceId.$countryIso.tsx` — `/my-space/{serviceId}/{countryIso}` avec PurchasePage
- **Nouveau**: `src/routes/(app)/my-space/activations.$activationId.tsx` — `/my-space/activations/{activationId}` avec ActivationDetail
- **Pattern**: Chaque route avec `loader` (`ensureQueryData`), `notFoundComponent`, `validateSearch` (zod)

## 2026-06-05 — Infrastructure
- **Setup**: `defaultPreloadStaleTime: 0` dans `router.tsx` (Query = source unique de cache)
- **Setup**: Auth guard dans `src/routes/(app)/route.tsx` — `beforeLoad` avec `getToken` + `throw redirect`
- **Setup**: Contexte router étendu avec `isAuthenticated`
