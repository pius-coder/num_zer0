# TODOS — my-space

## Routes
- [x] Layout `my-space.tsx` avec Outlet
- [x] `/my-space` index.tsx (ServiceList)
- [x] `/my-space/history` history.tsx (HistoryView)
- [x] `/my-space/$serviceId/index.tsx` (CountryList) — avec Outlet parent
- [x] `/my-space/$serviceId/$countryIso` (PurchasePage)
- [x] `/my-space/activations/$activationId` (ActivationPage)

## Composants
- [x] service-list.tsx
- [x] history-view.tsx
- [x] country-list.tsx
- [x] activation-detail.tsx
- [x] purchase-page.tsx
- [x] purchase-panel.tsx
- [x] operator-selector.tsx
- [x] price-stepper.tsx
- [x] rental-options.tsx
- [x] service-icon.tsx
- [x] service-badge.tsx
- [x] timeline-line.tsx
- [x] constants.ts, utils.ts

## Hooks / Queries
- [x] Query factory (myActivations, balance, activation, topCountries, prices)
- [x] Barrel export (hooks/index.ts, components/my-space/index.ts)

## Auth
- [x] `beforeLoad` guard dans (app)/route.tsx
- [x] `router.tsx` avec `defaultPreloadStaleTime: 0`
- [x] `auth-splash.tsx` — navigate() dans useEffect

## Cleanup
- [ ] Supprimer `src/components/spa/my-space-page.tsx`
- [ ] Supprimer `src/components/spa/my-space-skeleton.tsx`
- [ ] Supprimer `src/components/spa/my-space-hero-desktop.tsx`
- [ ] Supprimer `src/components/spa/my-space-hero-mobile.tsx`
- [ ] Vérifier dépendances et supprimer `spa-context.tsx`
- [ ] Vérifier dépendances et supprimer `login-splash.tsx`, `auth-splash-store.ts`

## Bugs connus
- [x] `$serviceId.tsx` manquait Outlet → la route enfant `$countryIso` ne rendait jamais
- [x] `auth-splash.tsx` navigate() in render → warning React
- [x] `convexAction` type incompatible avec `useSuspenseQuery` → contournement `useQuery`

## Tests
- [ ] Tester navigation /my-space → /my-space/{serviceId} → /my-space/{serviceId}/{country}
- [ ] Tester historique /my-space/history
- [ ] Tester détail activation /my-space/activations/{id}
- [ ] Vérifier auth guard : non-auth → redirect /auth-splash
