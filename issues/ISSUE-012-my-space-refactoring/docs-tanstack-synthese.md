# Synthèse TanStack — Patterns pour refactoring my-space

> **Fichiers lus :** 42 fichiers de règles (TanStack Start, Router, Query, Integration)
> **Fichiers manquants (n'existaient pas) :** 20 fichiers listés dans la mission n'ont pas été trouvés (notés dans chaque section)

---

## 1. Architecture Router (org-*)

**Fichiers lus :** `org-virtual-routes.md`, `ctx-root-context.md`, `ts-register-router.md`, `ts-use-from-param.md`, `router-default-options.md`
**Manquants :** `org-file-based-routing.md`, `org-route-tree-structure.md`, `org-pathless-layouts.md`, `org-index-routes.md`

### Points clés

- **`declare module '@tanstack/react-router' { interface Register { router: typeof router } }`** — Obligatoire dans `router.tsx` pour le typage global (autocomplete params, routes, search params). Sans ça, `useNavigate`, `useParams`, `Link` n'ont aucun typage.
- **`createRootRouteWithContext<RouterContext>()`** — Pattern pour injecter `queryClient`, `auth`, etc. dans tout l'arbre de routes. Le contexte est accessible dans `loader`, `beforeLoad`, et les composants via `Route.useRouteContext()`.
- **`from` parameter obligatoire** — `useParams({ from: '/my-space/$id' })`, `useLoaderData({ from: Route.fullPath })`, `getRouteApi('/my-space/$id')` pour les composants code-split. Sans `from`, TypeScript unionne tous les types de toutes les routes.
- **Virtual routes** — Quand un fichier `.lazy.tsx` existe sans fichier principal, le router génère une route virtuelle automatiquement. Évite le boilerplate si pas de `loader`/`beforeLoad`/`validateSearch`.
- **Pathless layouts** — Les fichiers `_layout.tsx` créent des groupes de routes sans ajouter de segment d'URL. Pattern pour auth protection (`_authenticated.tsx`).
- **Route masks (`mask`)** — Pour les modales : l'URL affichée reste sur la page parent, mais le routage interne va vers la route modale. Utile pour "quick view" dans my-space.

### Application my-space

- Le router doit être typé avec `Register`
- Contexte racine : `{ queryClient, user }` via `createRootRouteWithContext`
- Les routes `/my-space` et `/my-space/$id` utilisent `_authenticated` comme layout pathless
- Utiliser `getRouteApi('/my-space')` dans les composants code-split

---

## 2. Data Loading avec loaders (load-*)

**Fichiers lus :** `load-use-loaders.md`, `load-parallel.md`, `load-ensure-query-data.md`
**Manquants :** `load-loader-deps.md`, `load-deferred-data.md`, `load-error-handling.md`

### Points clés

- **Loader = exécution avant rendu** — Le loader s'exécute pendant le matching de route, avant que le composant ne render. Permet d'avoir les données prêtes au mount. Élimine les loading waterfalls.
- **`ensureQueryData()` est la méthode recommandée** dans les loaders (vs `prefetchQuery` ou `fetchQuery`). Elle : (1) retourne la data, (2) respecte `staleTime`, (3) ne refetch pas si frais, (4) throw sur erreur → error boundary.
- **Parallel loading natif** — Les loaders des routes parent/enfant s'exécutent EN PARALLÈLE (pas séquentiel). Utiliser `Promise.all()` dans un même loader pour paralléliser les requêtes.
- **`cause: 'enter' | 'preload' | 'stay'`** — Propriété du loader indiquant pourquoi il s'exécute. Permet de charger des données allégées en préload vs complètes en navigation.
- **AbortController** — Passé dans le loader via `abortController.signal`, permet d'annuler les requêtes périmées.

### Application my-space

- Loader de `/my-space` : `ensureQueryData(spaceQueries.list())` — pas de return nécessaire, data vit dans Query cache
- Loader de `/my-space/$id` : `ensureQueryData(spaceQueries.detail(params.id))` — parallélisé avec les éventuels sous-chargements
- Streaming : data critique awaitée dans le loader, data non-critique en `prefetchQuery` sans await + `useQuery` dans le composant

---

## 3. Search Params (search-*)

**Fichiers lus :** `search-validation.md`, `search-custom-serializer.md`
**Manquants :** `search-defaults.md`

### Points clés

- **Toujours valider les search params** — Ils viennent de l'URL (contrôle utilisateur). Utiliser `validateSearch` avec Zod ou Valibot.
- **`.catch()` / `fallback()` pour les defaults** — Zod `z.number().min(1).catch(1)` garantit des valeurs valides même si l'URL est malformée.
- **`validateSearch` s'exécute à chaque navigation** — Doit rester rapide.
- **Les search params sont hérités par les routes enfants** — Utile pour des filtres qui persistent dans toute une section.
- **Custom serializer via `router` config** — Par défaut JSON (URLs moches). Possibilité d'utiliser `jsurl2`, `query-string`, `qs`, ou Base64. Pour my-space, le serializer par défaut suffit.
- **Pattern navigate avec search updater** : `navigate({ to: '.', search: (prev) => ({ ...prev, page: 1, ...newFilters }) })` préserve les params existants.

### Application my-space

- `validateSearch: z.object({ filter: z.string().optional(), sort: z.enum(['name', 'date']).catch('name'), view: z.enum(['grid', 'list']).catch('grid') })`
- Navigation par filtres : `navigate({ to: '.', search: (prev) => ({ ...prev, filter: newFilter }) })`
- Reset page à 1 quand les filtres changent

---

## 4. Auth & Middleware (auth-*, mw-*)

**Fichiers lus :** `auth-session-management.md`, `auth-route-protection.md`, `mw-request-middleware.md`
**Manquants :** `sec-auth-middleware.md`, `auth-server-functions.md`, `mw-function-middleware.md`

### Points clés

- **`beforeLoad` pour la protection de routes** — Pattern : layout pathless `_authenticated.tsx` avec `beforeLoad` qui vérifie la session et `throw redirect({ to: '/login', search: { redirect: location.href } })`. Le contexte étendu (`return { user }`) est disponible dans tous les enfants.
- **Sessions HTTP-only cookies** — `useSession()` avec `httpOnly: true, secure: true, sameSite: 'lax'`. Jamais de token dans localStorage.
- **Middleware chaînable** — `createMiddleware().server(async ({ next }) => { ... return next({ context: {...} }) })`. Les middlewares s'empilent : `authMiddleware` → `requireAuthMiddleware` (dépend du premier).
- **Request middleware global** — Défini dans `app/start.ts` via `createStart({ requestMiddleware: [...] })`. S'applique à toutes les requêtes (routes, SSR, server functions).
- **Role-based access** — `beforeLoad` dans `_admin.tsx` : vérifie `context.user.role === 'admin'`, sinon redirect.

### Application my-space

- Layout `_authenticated.tsx` avec `beforeLoad` :
  - Vérifie la session Convex (`ctx.auth.getUserIdentity()`)
  - Si pas authentifié → redirect `/login?redirect=...`
  - Étend le contexte avec `{ user }` pour les enfants
- Route `/my-space` et sous-routes protégées par ce layout
- Route `/` (publique) : `beforeLoad` optionnel pour personnaliser si connecté

---

## 5. SSR & Hydration (ssr-*)

**Fichiers lus :** `ssr-streaming.md`, `ssr-prerender.md`, `ssr-hydration-safety.md`
**Manquants :** `ssr-data-loading.md` (Start)

### Points clés

- **Streaming SSR** — Await seulement les données critiques dans le loader. Les données non-critiques sont préfetchées sans await et streamées via Suspense. Chaque `Suspense` boundary est un chunk de streaming indépendant.
- **`ErrorBoundary` + `Suspense`** — Pattern pour chaque section streamée : `ErrorBoundary` (gère les erreurs de la section) > `Suspense` (gère le loading) > composant.
- **Hydration safety** — Ne jamais utiliser `Date.now()`, `Math.random()`, `window`, `document` directement dans le render (mismatch serveur/client). Pattern : générer dans le loader, passer via loaderData. Pour les features client-only : `lazy()` + `Suspense` ou `useEffect`.
- **Prerendering** — Config dans `app.config.ts` via `server.prerender.routes`. Pour pages statiques (about, pricing). ISR via `setHeaders({ 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' })`.
- **Cache-Control** — `private, no-store` pour données utilisateur ; `public, s-maxage=N` pour CDN ; `stale-while-revalidate` pour serve stale + background refresh.

### Application my-space

- My-space est user-specific → pas de prerendering, SSR avec `private, no-store`
- Streaming : data du space (critique) awaitée dans loader ; historique/activité (non-critique) streamée via Suspense
- Hydration safety : toutes les dates formatées côté serveur via le loader ou via composant client-only avec useEffect
- Layout : `ErrorBoundary` + `Suspense` autour des sections indépendantes

---

## 6. Code Splitting (split-*)

**Fichiers lus :** `split-lazy-routes.md`
**Manquants :** `split-auto-splitting.md`

### Points clés

- **`.lazy.tsx`** — Sépare la config (loader, beforeLoad, validateSearch) dans le fichier principal du composant dans le fichier `.lazy.tsx`. Réduit le bundle initial.
- **Ce qui va dans le fichier principal** : `validateSearch`, `beforeLoad`, `loader`, `loaderDeps`, context manipulation.
- **Ce qui va dans le lazy** : `component`, `pendingComponent`, `errorComponent`, `notFoundComponent`.
- **`createLazyFileRoute`** — N'accepte que les options liées au composant (pas de loader/beforeLoad).
- **`getRouteApi()`** — Dans les fichiers lazy pour accès type-safe à `useParams`, `useLoaderData`, `useSearch` sans importer le fichier principal.
- **`autoCodeSplitting: true`** — Option du plugin Vite qui automatise le code splitting : plus besoin de fichiers `.lazy.tsx` manuellement.
- **Virtual routes** — Quand seul un `.lazy.tsx` existe, le router génère une route virtuelle automatiquement.

### Application my-space

- Fichier principal `my-space.tsx` : `loader` + `validateSearch` + `beforeLoad`
- Fichier lazy `my-space.lazy.tsx` : `component`, `pendingComponent`, `errorComponent`
- Sous-routes `my-space/$id.tsx` + `my-space/$id.lazy.tsx` : même pattern
- `autoCodeSplitting: true` dans le plugin Vite pour automatiser

---

## 7. Query Integration (flow-*, cache-*, setup-*)

**Fichiers lus :** `setup-query-client-context.md`, `flow-loader-query-pattern.md`, `cache-single-source.md`, `ssr-dehydrate-hydrate.md`
**Manquants :** `setup-stale-time-coordination.md`, `flow-suspense-query-component.md`, `flow-mutations-invalidation.md`, `ssr-per-request-client.md`

### Points clés

- **QueryClient dans le contexte du router** — `createRootRouteWithContext<{ queryClient: QueryClient }>()`, puis fourni dans `createRouter({ context: { queryClient } })`. Pas de singleton global.
- **`setupRouterSsrQueryIntegration`** — Automatise la déshydratation/hydratation SSR entre Router et Query. Options : `handleRedirects: true`, `wrapQueryClient: true`.
- **`defaultPreloadStaleTime: 0`** — Critique : désactive le cache du Router, Query devient la seule source de vérité pour le caching. Évite la confusion de deux caches.
- **Pattern loader + Query** :
  1. Loader appelle `queryClient.ensureQueryData(queryOptions)` → préremplit le cache Query
  2. Composant utilise `useSuspenseQuery(queryOptions)` → data garantie (pas de loading state)
  3. Query gère les refetches, mutations, invalidations, staleTime, gcTime
- **`useSuspenseQuery`** — À utiliser dans les composants quand le loader garantit la présence des données. Combine avec `useQuery` pour les données non-critiques.
- **Per-request QueryClient** — SSR nécessite un nouveau `QueryClient` par requête pour éviter le partage de données entre utilisateurs.
- **queryOptions factory** — Définir les options queries de façon centralisée : `postQueries.detail(id)` retourne `{ queryKey, queryFn, staleTime }`. Utilisable partout : `useQuery`, `ensureQueryData`, `prefetchQuery`.

### Application my-space

- `router.tsx` : `setupRouterSsrQueryIntegration({ router, queryClient, handleRedirects: true, wrapQueryClient: true })`
- `defaultPreloadStaleTime: 0` pour laisser Query gérer le cache
- Factory `spaceQueries.list()` et `spaceQueries.detail(id)` avec `queryOptions`
- Loader → `ensureQueryData` → composant avec `useSuspenseQuery`
- Données non-critiques : `prefetchQuery` sans await dans le loader, `useQuery` dans le composant

---

## 8. Mutations (mut-*)

**Fichiers lus :** `mut-invalidate-queries.md`, `mut-optimistic-updates.md`, `mut-mutation-state.md`

### Points clés

- **Toujours invalider les queries affectées après mutation** — Dans `onSuccess`, appeler `queryClient.invalidateQueries({ queryKey: [...] })`. Une mutation qui crée un todo doit invalider `['todos']` (toutes les listes, compteurs, etc.).
- **Invalidation en cascade** — `invalidateQueries({ queryKey: ['spaces'] })` invalide toutes les sous-queries (`['spaces', 'list']`, `['spaces', id]`, `['spaces', id, 'items']`).
- **`exact: true`** — Pour invalider UNE query spécifique seulement (`queryKey: ['spaces', 'detail', id], exact: true` ne touche pas `['spaces', 'detail', id, 'items']`).
- **Optimistic updates** — Pattern `onMutate` :
  1. `cancelQueries` pour annuler les refetches en cours
  2. Snapshot de l'état précédent
  3. `setQueryData` pour mettre à jour immédiatement l'UI
  4. Retourner le snapshot dans `context`
  5. `onError` : rollback via `setQueryData` avec le snapshot
  6. `onSettled` : `invalidateQueries` pour synchronisation avec le serveur
- **Optimistic create** — Id temporaire (`temp-${Date.now()}`), remplacé dans `onSuccess` par la vraie donnée.
- **`mutationKey` + `useMutationState`** — Permet de tracker l'état des mutations depuis n'importe quel composant (ex: indicateur global "Sauvegarde en cours..." ou "3 éléments en attente").
- **`onSettled`** vs `onSuccess` — `onSettled` s'exécute même en cas d'erreur. Utile pour l'invalidation "best-effort" après une tentative.

### Application my-space

- Mutation `createSpace` : invalidate `['spaces']` dans `onSuccess` + optimiste `onMutate` pour ajout immédiat à la liste
- Mutation `updateSpace` : invalidate `['spaces', id]` + `['spaces', 'list']` dans `onSuccess` + optimiste pour mise à jour instantanée
- Mutation `deleteSpace` : optimiste avec rollback + invalidate toutes les queries spaces
- Pattern Convex `withOptimisticUpdate` (compatible via `useConvexMutation`)
- `mutationKey: ['create-space']` pour tracker l'état de création depuis MySpaceHeader (indicateur de pending)

---

## 9. Error Handling (err-*)

**Fichiers lus :** `err-server-errors.md` (Start), `err-not-found.md` (Router)
**Manquants :** `err-redirects.md`, `err-not-found.md` (Start)

### Points clés

- **`throw notFound()`** — Intégré TanStack Router pour les 404. Attrapé par le `notFoundComponent` le plus proche dans l'arbre. Peut recevoir des données : `throw notFound({ data: { username, suggestions } })`.
- **`throw redirect()`** — Pour les redirections (auth principalement). Attrapé par le router.
- **Hiérarchie notFound** — `notFoundComponent` local → parent → `defaultNotFoundComponent` (router). Utilisation de routes catch-all `routes/$.tsx` pour les 404 globaux.
- **Erreurs de loader** → `errorComponent` le plus proche. Intégré natif au router.
- **Erreurs de server function** → Pattern `AppError` custom :
  ```ts
  export class AppError extends Error {
    constructor(message: string, public code: string, public status: number = 400) { super(message) }
  }
  ```
- **`setResponseStatus()`** — Pour définir le code HTTP approprié côté serveur.
- **Validation errors** — Les erreurs de `.validator()` (Zod) sont automatiquement sérialisées et renvoyées au client avec le bon status code.
- **Sanitization côté serveur** — Logger l'erreur complète côté serveur, ne renvoyer qu'un message générique au client.

### Application my-space

- Loader `my-space/$id` : si space introuvable → `throw notFound({ data: { spaceId: params.id } })`
- Layout racine : `defaultNotFoundComponent: GlobalNotFound` + `defaultErrorComponent: DefaultCatchBoundary`
- Route-specific `notFoundComponent` pour `/my-space` avec navigation de retour
- `ErrorBoundary` autour de chaque section streamée (indépendance des erreurs)
- Server functions Convex : erreurs Convex gérées avec des classes d'erreur custom

---

## 10. Patterns spécifiques à appliquer à my-space

### Configuration router (`router.tsx`)

```ts
const router = createRouter({
  routeTree,
  context: { queryClient, user: null },
  defaultPreload: 'intent',
  defaultPreloadStaleTime: 0,
  defaultErrorComponent: DefaultCatchBoundary,
  defaultNotFoundComponent: GlobalNotFound,
  scrollRestoration: true,
  defaultStructuralSharing: true,
})
setupRouterSsrQueryIntegration({ router, queryClient, handleRedirects: true, wrapQueryClient: true })
```

### Query factory (`lib/queries/spaces.ts`)

```ts
export const spaceQueries = {
  all: () => queryOptions({
    queryKey: ['spaces'],
    queryFn: () => getSpaces(),
    staleTime: 2 * 60 * 1000,
  }),
  detail: (id: string) => queryOptions({
    queryKey: ['spaces', id],
    queryFn: () => getSpace({ data: { id } }),
    staleTime: 2 * 60 * 1000,
  }),
}
```

### Structure des routes

```
routes/
├── __root.tsx                          # Layout racine, contexte, notFoundComponent
├── index.tsx                           # Landing page (publique)
├── _authenticated.tsx                  # Layout pathless auth-protection + beforeLoad
├── _authenticated/
│   ├── my-space.tsx                    # Loader + validateSearch (filtres)
│   ├── my-space.lazy.tsx               # Component (liste des espaces)
│   ├── my-space/
│   │   ├── $id.tsx                     # Loader space detail
│   │   └── $id.lazy.tsx                # Component (détail space avec onglets streamés)
│   └── ...
└── login.tsx                           # Login avec redirect
```

### Data flow détaillé

```
Navigation vers /my-space/abc
  │
  ├─ 1. Route match : /_authenticated + /_authenticated/my-space/$id
  │
  ├─ 2. beforeLoad (_authenticated) : vérifie session → étend contexte { user }
  │
  ├─ 3. Loader (_authenticated/my-space/$id) [PARALLÈLE avec #2 si pas de dépendance] :
  │      await queryClient.ensureQueryData(spaceQueries.detail(params.id))     // Critique
  │      queryClient.prefetchQuery(activityQueries.forSpace(params.id))        // Non-critique
  │      queryClient.prefetchQuery(memberQueries.forSpace(params.id))          // Non-critique
  │
  ├─ 4. Render (my-space/$id.lazy.tsx) :
  │      useSuspenseQuery(spaceQueries.detail(id)) → data garantie
  │      Suspense fallback={<ActivitySkeleton />} → useQuery → Activité (streamée)
  │      Suspense fallback={<MembersSkeleton />} → useQuery → Membres (streamée)
  │
  └─ 5. Mutation (toggleFavorite) → onMutate optimistic → onSettled invalidate
```

### Mutations avec Convex (pattern du projet existant)

```ts
export function useCreateSpaceMutation() {
  const mutationFn = useConvexMutation(api.spaces.create)
    .withOptimisticUpdate((localStore, args) => {
      const spaces = localStore.getQuery(api.spaces.list, {})
      if (!spaces) return
      localStore.setQuery(api.spaces.list, {}, [
        { _id: `temp_${Date.now()}`, name: args.name, ... },
        ...spaces,
      ])
    })
  return useMutation({
    mutationFn,
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['spaces'] }),
  })
}
```

---

## Résumé des fichiers manquants (non trouvés)

| Skill | Fichiers manquants |
|-------|-------------------|
| TanStack Start | `ssr-data-loading.md`, `sf-method-selection.md`, `sf-error-handling.md`, `sec-auth-middleware.md`, `auth-server-functions.md`, `mw-function-middleware.md`, `err-redirects.md`, `err-not-found.md`, `file-functions-file.md` |
| TanStack Router | `ts-route-context-typing.md`, `ts-query-options-loader.md`, `org-file-based-routing.md`, `org-route-tree-structure.md`, `org-pathless-layouts.md`, `org-index-routes.md`, `load-loader-deps.md`, `load-deferred-data.md`, `load-error-handling.md`, `search-defaults.md`, `nav-use-navigate.md`, `split-auto-splitting.md`, `preload-stale-time.md`, `ctx-before-load.md` |
| TanStack Query | `pf-ensure-query-data.md` |
| Integration | `setup-stale-time-coordination.md`, `flow-suspense-query-component.md`, `flow-mutations-invalidation.md`, `ssr-per-request-client.md` |

Les patterns manquants les plus notables (déduits des autres fichiers) :
- **Nav programmatique** : `useNavigate` pour after-submit, after-login. `<Link>` pour tout le reste (a11y, SEO, préchargement).
- **StaleTime coordination** : Query `staleTime` prime sur router `defaultPreloadStaleTime: 0`.
- **Flow mutations + invalidation** : Mutation → `onSuccess` invalidation queries affectées → Query refetch automatique.
- **Per-request client** : SSR nécessite `new QueryClient()` par requête → implémenté via `getRouter()` qui reçoit des paramètres.
