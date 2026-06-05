# Phase 5 — Plan complet (v2 après revue)

## Décisions architecturales (post-revue)

| Décision | Choix | Raison |
|---|---|---|
| `ssr: false` | **Gardé sur le layout `(app)/my-space`** | Convex WebSockets incompatibles SSR pour les données réactives. Les loaders utiliseront `ensureQueryData` avec les actions Convex (non-réactives). Les composants utiliseront `useSuspenseQuery` avec `convexQuery` (réactif côté client) |
| `notFoundComponent` | **Ajouté sur chaque route dynamique** | Gérer les cas service/activation inconnue |
| `PurchaseOptionsInline` | **Sous-découpé** en OperatorSelector + PriceStepper | Respecter la limite 200 lignes |
| `validateSearch` | **Ajouté** pour le formulaire d'achat | État partageable via URL, persistant au refresh |
| `RouteLoader` | **Conservé** mais pas prioritaire | Utilitaire de debug pour routes lentes, pas de conflit avec `defaultPendingComponent` |

## Structure de routes finale

```
(app)/
├── my-space.tsx              ← Layout parent: auth guard (deja fait Agent 1) + Outlet
├── my-space/
│   ├── index.tsx             ← /my-space — ServiceList
│   │   loader: ensureQueryData(myActivations, balance)
│   │   notFound: N/A (index)
│   ├── history.tsx           ← /my-space/history — HistoryView
│   │   loader: ensureQueryData(myActivations)
│   │   notFound: N/A (route statique)
│   ├── $serviceId.tsx        ← /my-space/{serviceId} — CountryList
│   │   loader: ensureQueryData(topCountries(serviceId))
│   │   notFound: si serviceId invalide
│   │   search: filter (optionnel)
│   ├── $serviceId.$countryIso.tsx  ← /my-space/{serviceId}/{countryIso}
│   │   loader: ensureQueryData(prices(countryIso, serviceId))
│   │   notFound: si service/country invalide
│   │   validateSearch: { operator, maxPrice, rentalIdx }
│   └── activations.$activationId.tsx  ← /my-space/activations/{activationId}
│       loader: ensureQueryData(activation(activationId))
│       notFound: si activationId invalide
```

## Steps

### Step 1 — Auth guard (DÉJÀ FAIT)
- **Fichiers**: `src/routes/(app)/route.tsx`, `src/router.tsx`
- **Action**: Ajouter `beforeLoad` avec vérification auth via `getToken`, `throw redirect()` si non-auth
- **Résultat**: Toute route sous `(app)` protégée, plus de `navigate()` in render
- **Statut**: ✓ FAIT

### Step 2 — Router config
- **Fichier**: `src/router.tsx`
- **Action**: Ajouter `defaultPreloadStaleTime: 0` dans `createRouter`
- **Résultat**: Query devient source unique de cache
- **Agent**: `general`

### Step 3 — Query factories
- **Fichiers**:
  - `src/components/my-space/hooks/my-space-queries.ts` — `queryOptions` factory
  - `src/components/my-space/hooks/index.ts` — barrel
- **Contenu**: Factory pour `myActivations`, `balance`, `activation(id)`, `topCountries(serviceId)`, `prices(countryIso, serviceId)`
- **Pattern**: Utiliser `queryOptions()` + `convexQuery()` ou `actionFn` existant
- **Résultat**: Hooks type-safe et réutilisables avec pattern `ensureQueryData`
- **Agent**: `general`

### Step 4 — Restructurer les routes my-space
- **Fichiers**:
  - `src/routes/(app)/my-space.tsx` — Layout avec Outlet
  - `src/routes/(app)/my-space/index.tsx` — ServiceList
  - `src/routes/(app)/my-space/history.tsx` — HistoryView
  - `src/routes/(app)/my-space/$serviceId.tsx` — CountryList
  - `src/routes/(app)/my-space/$serviceId.$countryIso.tsx` — PurchaseConfirm
  - `src/routes/(app)/my-space/activations.$activationId.tsx` — ActivationDetail
- **Contenu chaque route**: `beforeLoad` → `loader` avec `ensureQueryData` → component
- **Gestion 404**: `notFoundComponent` sur chaque route dynamique
- **Search params**: `validateSearch` avec zod sur `$serviceId.$countryIso`
- **Résultat**: Navigation URL-based, plus de useState<PageView>
- **Agent**: `general`

### Step 5 — Extraire composants
- **Fichiers**:
  - `src/components/my-space/service-list.tsx`
  - `src/components/my-space/history-view.tsx`
  - `src/components/my-space/country-list.tsx`
  - `src/components/my-space/activation-detail.tsx`
  - `src/components/my-space/purchase-confirmation.tsx` (orchestrateur + header)
  - `src/components/my-space/operator-selector.tsx` (extrait de PurchaseOptionsInline)
  - `src/components/my-space/price-stepper.tsx` (extrait de PurchaseOptionsInline)
  - `src/components/my-space/rental-options.tsx` (extrait de PurchaseOptionsInline)
  - `src/components/my-space/service-icon.tsx`
  - `src/components/my-space/service-badge.tsx`
  - `src/components/my-space/timeline-line.tsx`
  - `src/components/my-space/constants.ts`
  - `src/components/my-space/utils.ts`
  - `src/components/my-space/index.ts` — barrel
- **Règle**: Chaque fichier <200 lignes (limite ESLint)
- **Pagination CountryList**: Conserver IntersectionObserver dans le composant, mais utiliser `useInfiniteQuery` au lieu du `useEffect` maison
- **Résultat**: Feature folder complète conforme AGENTS.md
- **Agent**: `general`

### Step 6 — Fix auth-splash.tsx
- **Fichier**: `src/routes/auth-splash.tsx`
- **Action**: Remplacer `navigate()` in render par:
  - Option 1: `beforeLoad` avec `getAuth` + `redirect` vers `/my-space` si déjà connecté
  - Option 2: Composant `<Navigate>` de TanStack Router
- **Résultat**: Plus de warning React sur auth-splash
- **Agent**: `general`

### Step 7 — Update docs
- **Fichiers**:
  - `src/components/my-space/docs/CHANGELOG.md` — Date, auteur, changement
  - `src/components/my-space/docs/CONTINUE.md` — État actuel, décisions, next steps
  - `src/components/my-space/docs/TODOS.md` — Checklist d'implémentation
- **Agent**: `general`

### Step 8 — Cleanup (après validation)
- **Fichiers**:
  - Supprimer `src/components/spa/my-space-page.tsx`
  - Supprimer `src/components/spa/my-space-skeleton.tsx` (si plus utilisé)
  - Supprimer `src/components/spa/my-space-hero-desktop.tsx` (si plus utilisé)
  - Supprimer `src/components/spa/my-space-hero-mobile.tsx` (si plus utilisé)
  - `src/components/spa/spa-context.tsx` (vérifier dépendances d'abord)
  - `src/components/spa/login-splash.tsx` et `auth-splash-store.ts` (vérifier dépendances)
- **Résultat**: Codebase clean sans legacy
- **Agent**: `general`

## Ordre d'exécution

Step 1 (fait) → Step 2 → Step 3 → Step 4 → Step 5 → Step 6 → Step 7 → Step 8

Chaque step exécuté par un agent `general` dédié. Chaque step produit un commit potentiel.
Ne pas sauter de step. Pas de parallélisme entre steps (dépendances séquentielles).
