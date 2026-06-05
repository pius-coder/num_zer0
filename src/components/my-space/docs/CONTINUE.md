# Continue — my-space

## État actuel

Le monolithe SPA (`my-space-page.tsx`, 1162 lignes) a été refactoré en routes TanStack Start
avec des composants extraits dans `src/components/my-space/`.

### Ce qui fonctionne
- 5 routes dynamiques + 1 route index sous `my-space/`
- Auth guard dans `(app)/route.tsx` (beforeLoad)
- Query factory `mySpaceQueries` avec 5 entrées (convexQuery + convexAction)
- Composants extraits respectant la limite 200 lignes
- Route tree auto-généré avec `$serviceId/index.tsx` (index route du paramètre)
- `auth-splash.tsx` fixé (navigate() dans useEffect au lieu du render)

### Problèmes connus
- **Legacy SPA encore présent** : `src/components/spa/my-space-page.tsx` (1162 lignes) toujours
  dans le codebase, doit être supprimé après validation que les routes fonctionnent
- **`convexAction` type** : les queries basées sur `convexAction` ont une incompatibilité
  avec `useSuspenseQuery` (skipToken). Actuellement contourné avec `useQuery` — à monitorer
  si une mise à jour de `@convex-dev/react-query` corrige le typage
- **Pre-existing TS errors** : quelques `unused` warnings dans `convex/auth.ts`,
  `convex/promo_codes.ts`, `my-space-page.tsx`, `combobox.tsx`

### Architecture

```
my-space.tsx (layout Outlet)
├── index.tsx                          → /my-space                     → ServiceListPage
├── history.tsx                        → /my-space/history             → HistoryViewPage
├── $serviceId.tsx (layout Outlet)
│   ├── index.tsx                      → /my-space/{id}                → CountryListPage
│   └── $serviceId.$countryIso.tsx     → /my-space/{id}/{country}      → PurchasePage
└── activations.$activationId.tsx      → /my-space/activations/{id}    → ActivationPage
```

### Décisions architecturales
- `ssr: false` gardé sur les routes my-space (Convex WebSockets incompatibles SSR)
- Loaders utilisent `ensureQueryData` avec `convexAction` (non-réactif côté serveur)
- Composants utilisent `useSuspenseQuery`/`useQuery` avec `convexQuery` (réactif côté client)
- `#/` alias utilisé pour les imports (configuré dans tsconfig, vite, package.json)
- Query factory pattern avec `queryOptions` pour réutilisabilité dans loaders et composants

### Next steps
1. Supprimer les fichiers legacy SPA (Step 8)
2. Vérifier le build avec `vite build`
3. Tester la navigation complète : /my-space → service → country → purchase
