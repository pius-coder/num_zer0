# Revue de plan — Agent Reviewer

## Résumé

Le plan est solide sur la stratégie générale (auth guard → `beforeLoad`, cache unique → `defaultPreloadStaleTime: 0`, découpage en routes TanStack Router). Les 8 steps couvrent l'essentiel de la refonte. Cependant, **3 omissions significatives** (gestion du `ssr: false`, `notFound` pour routes dynamiques invalides, adaptation de la pagination IntersectionObserver) doivent être corrigées avant exécution, et **2 risques concrets** (taille de `PurchaseOptionsInline` et manque de `validateSearch`) méritent d'être adressés dans le plan.

## Points validés

- ✓ **Step 1 (Auth guard)** — `beforeLoad` avec `throw redirect()` sur le layout `(app)/route.tsx` est le pattern TanStack Start canonique (`auth-route-protection.md`). Supprime le `navigate()` in render, cause racine du warning. L'héritage automatique aux routes enfants est garanti.

- ✓ **Step 2 (Router config)** — `defaultPreloadStaleTime: 0` désactive le cache parallèle du Router et fait de TanStack Query l'unique source de vérité (`cache-single-source.md`). Prérequis correct pour le pattern `ensureQueryData` + `useSuspenseQuery`.

- ✓ **Step 3 (Query factories)** — `queryOptions()` factory est le pattern d'intégration loader/Query type-safe (`ts-query-options-loader.md` + `qk-factory-pattern.md`). Utilisation correcte de `ensureQueryData` dans les loaders (`load-ensure-query-data.md`). À noter: ce ne sont pas des hooks (le plan dit "hooks réutilisables" — c'est un abus de langage, le fond est bon).

- ✓ **Step 4 (Routes structure)** — La résolution `$serviceId.tsx` vs `activations.$activationId.tsx` est correcte:
  - `$serviceId.tsx` capture **1 segment** → `/my-space/france-only`
  - `activations.$activationId.tsx` capture **2 segments** (dont 1 static `activations`) → `/my-space/activations/abc123`
  - TanStack Router priorise les routes avec le plus de segments statiques. **Pas de conflit possible**.

- ✓ **Step 5 (Extraction composants)** — Le découpage suit la convention AGENTS.md (feature folder `my-space/` avec index barrel). La taille des fichiers extraits du monolithe 1162 lignes est cohérente (<200 lignes chacun), sauf `PurchaseOptionsInline` (voir Risques).

- ✓ **Step 6 (Fix auth-splash.tsx)** — Correction du même anti-pattern `navigate()` in render. Recommandation: utiliser `beforeLoad` + `redirect` comme pour `(app)` ou un composant `<Navigate>` si le composant doit rester simple.

- ✓ **Step 7 (Cleanup)** — Suppression des fichiers legacy. Bon réflexe de vérifier que `spa-context.tsx` n'est plus utilisé ailleurs (ex: autres pages SPA).

- ✓ **Step 8 (Docs)** — Lifecycle docs conformes à la convention AGENTS.md.

## Problèmes / Risques

- **Step 4-5: `ssr: false` non traité**
  - Le plan ne dit pas si `ssr: false` est supprimé, conservé, ou déplacé sur les nouvelles routes filles.
  - **Risque: élevé** — Si `ssr: false` est retiré (pour bénéficier du SSR TanStack Start), les hooks Convex (`convexQuery` + `useConvexMutation`) ne fonctionnent pas côté serveur car ils dépendent de WebSocket/ConvexReactClient. Le pattern `ensureQueryData` + `useSuspenseQuery` peut marcher si le loader utilise `convexQuery` via le `convexQueryClient` du route context — mais ce n'est pas documenté dans le plan.
  - **Correction suggérée**: Ajouter une décision explicite dans le plan:
    - Soit **Garder `ssr: false`** sur le layout `(app)/my-space.tsx` et documenter pourquoi (Convex WebSockets incompatibles SSR). Simple, sûr, mais pas d'SSR.
    - Soit **Activer SSR partiel** avec `ssr: true` + hydration du cache Query via `setupRouterSsrQueryIntegration` (déjà configuré dans `router.tsx`). Nécessite que les loaders utilisent `convexQueryClient.query()` (non-réactif) et que les composants utilisent `useSuspenseQuery` avec `convexQuery` (réactif côté client). C'est le pattern indiqué par `flow-loader-query-pattern.md`.

- **Step 4: Pas de `notFoundComponent` pour les routes dynamiques**
  - Scénario: `/my-space/invalid-service-id` → le loader `ensureQueryData` échoue ou retourne `null`. Le plan n'a pas de gestion d'erreur/404.
  - **Risque: moyen** — L'analyse (04-analyse.md) mentionne ce cas comme edge case (ligne 41: "Page 404 ou fallback") mais le plan n'y répond pas.
  - **Correction suggérée**: Ajouter dans Step 4 pour chaque route dynamique ($serviceId, $serviceId.$countryIso, activations.$activationId):
    - `loader`: si `ensureQueryData` retourne `null`, `throw notFound()`
    - Options: `notFoundComponent` local (route-specific) + `defaultNotFoundComponent` sur le router (global)

- **Step 5: `PurchaseOptionsInline` dépasse la limite 200 lignes**
  - Le composant fait 284 lignes (L572-L856). Même extrait dans son propre fichier, il viole la règle AGENTS.md des <200 lignes.
  - **Risque: élevé** — Bloquant si ESLint `max-lines` est en mode error.
  - **Correction suggérée**: Sous-découpage en 3 parties:
    1. `PurchaseOptionsInline` (orchestrateur, ~80 lignes)
    2. `OperatorSelector` (sélecteur opérateur ~80 lignes)
    3. `PriceStepper` (stepper quantité ~80 lignes)
    Ou conserver la logique métier dans le composant route (`$serviceId.$countryIso.tsx`) et extraire uniquement la présentation.

- **Step 4: Pas de `validateSearch` pour le formulaire d'achat**
  - `$serviceId.$countryIso.tsx` représente la confirmation d'achat. L'état du formulaire (numéro, opérateur, quantité) devrait être dans les search params pour être partagable et persistable (refresh).
  - **Risque: moyen** — Sans `validateSearch`, l'état du formulaire est perdu au refresh. Perte de l'URL en tant que single source of truth.
  - **Correction suggérée**: Ajouter `validateSearch` avec zod pour `phoneNumber`, `operatorId`, `quantity` avec defaults.

## Oublis / Manques

1. **Pagination IntersectionObserver non adaptée** — `CountryList` utilise un `useEffect` + `IntersectionObserver` en client-only. Avec `useSuspenseQuery` + loader, seule la page 1 est prefetchée. Le plan ne dit pas comment le chargement des pages suivantes fonctionne dans la nouvelle architecture. Solution: laisser le composant `CountryList` gérer l'offset/page dans son propre `useInfiniteQuery` (TanStack Query), et ne prefetcher que la page 1 dans le loader avec `ensureQueryData`.

2. **`RouteLoader` non traité** — Le composant `route-loader.tsx` est mentionné dans l'analyse (cause secondaire du warning via `setTimeout`/`setShowLoader`). Le plan ne dit pas si on le garde, le modifie, ou le supprime. Une transition vers les routes TanStack Router rend ce composant moins nécessaire (plus de `useState<PageView>`), mais il pourrait encore servir pour les transitions inter-routes lentes. À documenter.

3. **Absence de lazy routes** — Pour une SPA de 1162 lignes -> 5 routes, le plan aurait pu mentionner l'utilisation de `.lazy.tsx` ou `autoCodeSplitting` (`split-lazy-routes.md`) pour éviter de charger tous les sous-composants dans le bundle initial. Non bloquant mais opportunité manquée d'optimisation.

4. **HistoryView a-t-il son propre loader?** — Le plan crée `history.tsx` mais ne spécifie pas quelles données il charge. Dans le monolithe, `HistoryView` utilise probablement `useMyActivations` — ce devrait être dans le loader de la route avec `ensureQueryData`. À préciser.

5. **Pas de migration des imports wallet/recharge** — L'analyse mentionne que `wallet.tsx` et `recharge.tsx` partagent des patterns similaires. Si des hooks query factories sont déplacés, il faut s'assurer que les imports de ces routes ne cassent pas. Ajouter une vérification des imports existants dans Step 3.

## Recommandations

1. **Traiter `ssr: false` explicitement** avant de commencer Step 4. C'est le point le plus bloquant car il impacte toute l'architecture de données (Convex côté serveur vs client).

2. **Ajouter `notFoundComponent`** sur le layout `(app)/my-space.tsx` (parent de toutes les routes dynamiques my-space) pour centraliser le cas "service/activation inconnue".

3. **Split `PurchaseOptionsInline`** en 2-3 sous-composants pour rester sous la limite des 200 lignes. À faire dans Step 5.

4. **Utiliser `validateSearch`** pour le formulaire d'achat (`$serviceId.$countryIso.tsx`) avec zod, et `search` param dans le `Link` de navigation.

5. **Documenter `CountryList`** que l'IntersectionObserver est conservé mais que la pagination utilise maintenant `useInfiniteQuery` au lieu du `useEffect` maison.

6. **Déplacer Step 6 (auth-splash) avant Step 4** pour corriger les deux sources du warning React (my-space + auth-splash) à la suite.

## Conclusion

**Approuvé avec réserves.** Le plan est structurellement correct et la stratégie globale est la bonne. Les réserves sont:
1. L'absence de décision sur `ssr: false` peut bloquer l'exécution de Step 4 (routes avec loaders).
2. L'absence de `notFoundComponent` laisse un edge case non géré.
3. `PurchaseOptionsInline` doit être sous-découpé.

Ces 3 points peuvent être intégrés au plan existant sans remettre en cause l'ordre général des steps. Une fois ces corrections apportées, le plan est prêt à être exécuté.
