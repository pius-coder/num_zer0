# Phase 3 — Recherche Frontend

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08
**Agent:** subagent recherche

---

## Sources consultées

| Source | Type | Raison |
|--------|------|--------|
| `AGENTS.md` | Interne | Conventions projet, feature folder pattern, hooks vs inline |
| `issues/TEMPLATE.md` | Interne | Workflow 8 phases, règles de persistance |
| `.agents/skills/tanstack-query-best-practices/SKILL.md` | Interne | React Query patterns prioritaires |
| `.agents/skills/tanstack-query-best-practices/rules/qk-factory-pattern.md` | Interne | Query key factories |
| `.agents/skills/tanstack-query-best-practices/rules/mut-optimistic-updates.md` | Interne | Optimistic updates |
| `.agents/skills/tanstack-query-best-practices/rules/mut-invalidate-queries.md` | Interne | Invalidation patterns |
| `.agents/skills/tanstack-integration-best-practices/SKILL.md` | Interne | Router + Query integration |
| `.agents/skills/tanstack-integration-best-practices/rules/setup-query-client-context.md` | Interne | QueryClient per-request |
| `.agents/skills/tanstack-integration-best-practices/rules/cache-single-source.md` | Interne | Query as single cache source |
| `src/router.tsx` | Code | SSR/cache setup réel |
| `src/components/purchases/hooks/use-purchases.ts` | Code | Query factory + mutation pattern réel |
| `src/components/purchases/hooks/use-activations.ts` | Code | Second query factory + action pattern |
| `src/components/admin/hooks/use-admin-queries.ts` | Code | Troisième factory + 20 hooks |
| `src/components/purchases/hooks/index.ts` | Code | Barrel export pattern |
| `src/components/recharge/docs/CONTINUE.md` | Code | Feature lifecycle docs |
| `src/components/recharge/docs/TODOS.md` | Code | Feature checklist |

---

## 1. Query Key Factories — Patterns Existants

### 1.1 Structure des 3 factories existantes

```ts
// use-purchases.ts
export const purchaseKeys = {
  all: ['purchases'] as const,
  purchases: () => [...purchaseKeys.all, 'purchases'] as const,
  balance: () => ['balance'] as const,                       // NOTE: pas dans hierarchical
  mouvements: () => ['mouvements'] as const,                  // NOTE: pas dans hierarchical
}

// use-activations.ts
export const activationKeys = {
  all: ['activations'] as const,
  activation: (id: string) => [...activationKeys.all, 'activation', id] as const,
  myActivations: () => [...activationKeys.all, 'my'] as const,
  numberQuantity: (country: string) => [...activationKeys.all, 'quantity', country] as const,
  topCountries: (service: string) => [...activationKeys.all, 'top', service] as const,
  operators: (country: string) => [...activationKeys.all, 'operators', country] as const,
  prices: (country: string, service?: string) => [...activationKeys.all, 'prices', country, service] as const,
}

// use-admin-queries.ts
export const adminKeys = {
  all: ['admin'] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  purchases: () => [...adminKeys.all, 'purchases'] as const,
  activations: () => [...adminKeys.all, 'activations'] as const,
  accounting: () => [...adminKeys.all, 'accounting'] as const,
  promo_codes: () => [...adminKeys.all, 'promo_codes'] as const,
  margins: () => [...adminKeys.all, 'margins'] as const,
  packages: () => [...adminKeys.all, 'packages'] as const,
}
```

### 1.2 Incohérences détectées

| Problème | Détail |
|----------|--------|
| `purchaseKeys.balance()` et `.mouvements()` hors hiérarchie | Racine `['balance']` au lieu de `['purchases', 'balance']` — invalidation impossible via `purchaseKeys.all` |
| `useRentPriceList` et `useFreePrices` keys inline | L114, L124 — pas de factory, keys construites manuellement |
| Trois factories séparées | `purchaseKeys`, `activationKeys`, `adminKeys` — pas de cohérence centralisée |

### 1.3 Recommandation pour la refonte

- **Nouvelle factory unifiée** `paymentKeys` ou `walletKeys` avec hiérarchie complète:
  ```ts
  // Recommandé
  export const walletKeys = {
    all: ['wallet'] as const,
    balance: () => [...walletKeys.all, 'balance'] as const,
    transactions: () => [...walletKeys.all, 'transactions'] as const,
    transaction: (id: string) => [...walletKeys.transactions(), id] as const,
    orders: () => [...walletKeys.all, 'orders'] as const,
    order: (id: string) => [...walletKeys.orders(), id] as const,
    paymentMethods: () => [...walletKeys.all, 'paymentMethods'] as const,
    paymentIntents: () => [...walletKeys.all, 'paymentIntents'] as const,
    paymentIntent: (id: string) => [...walletKeys.paymentIntents(), id] as const,
  }
  ```
- Toutes les keys doivent hériter de `.all` pour permettre l'invalidation bulk
- Utiliser `as const` pour l'immutabilité TypeScript

---

## 2. Mutations Convex avec React Query — Pattern Actuel

### 2.1 Deux patterns coexistent

**Pattern A — `useConvexMutation` (recommandé pour mutations):**
```ts
// use-purchases.ts:57-68
export function useCancelPurchase() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.purchases.cancelPurchase)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: purchaseKeys.all })
      qc.invalidateQueries({ queryKey: purchaseKeys.balance() })
      qc.invalidateQueries({ queryKey: purchaseKeys.mouvements() })
    },
  })
}
```

**Pattern B — `useConvexAction` (pour les actions Convex, non réactif):**
```ts
// use-purchases.ts:31-42
export function useInitiateDirectPay() {
  const qc = useQueryClient()
  const actionFn = useConvexAction(api.purchases.initiateDirectPay)
  return useMutation({
    mutationFn: actionFn,
    onSettled: () => { /* invalidation */ },
  })
}
```

### 2.2 Queries simples avec `convexQuery`

```ts
// Pattern dominant pour les queries réactives
export function useBalance() {
  return useQuery(convexQuery(api.users.getUserBalance, {}))
}

// Avec options supplémentaires (enabled, staleTime)
export function useActivation(activationId: Id<'activations'> | null) {
  return useQuery({
    ...convexQuery(api.sms_provider.getActivation, { activationId: activationId! }),
    enabled: !!activationId,
  })
}

// Avec action non-réactive + staleTime
export function usePrices(country: string, service?: string) {
  const actionFn = useConvexAction(api.sms_provider.getPrices)
  return useQuery({
    queryKey: activationKeys.prices(country, service),
    queryFn: () => actionFn({ country, service }),
    enabled: country.length > 0,
    staleTime: 30_000,
  })
}
```

### 2.3 Recommandation pour la refonte

| Pattern | Usage |
|---------|-------|
| `useConvexMutation` + `useMutation` | Toutes les mutations (create, update, cancel, verify) |
| `convexQuery` + `useQuery` | Toutes les queries réactives (balance, transactions, orders) |
| `useConvexAction` + `useQuery` | Queries non-réactives (prix, disponibilité) — uniquement si `convexQuery` n'est pas possible |
| NE PAS utiliser `useConvexAction` pour des mutations | `useInitiateDirectPay` et `useVerifyPurchase` utilisent `useConvexAction` — incohérent |

---

## 3. Invalidation Pattern

### 3.1 Pattern actuel

Toutes les mutations utilisent **`onSettled`** (pas `onSuccess`) — invalidation déclenchée même en cas d'échec:

```ts
onSettled: () => {
  qc.invalidateQueries({ queryKey: purchaseKeys.all })
  qc.invalidateQueries({ queryKey: purchaseKeys.balance() })
  qc.invalidateQueries({ queryKey: purchaseKeys.mouvements() })
}
```

### 3.2 Problèmes actuels

| Problème | Impact |
|----------|--------|
| Invalidation trop large | `purchaseKeys.all` + `.balance()` + `.mouvements()` = 3 appels systématiques |
| `useCancelActivation` invalide `activationKeys.all` | Trop large — invalide aussi les prix/disponibilités |
| Pas d'invalidation fine | Impossible d'invalider une seule transaction sans toucher au reste |

### 3.3 Recommandation

```ts
// Pattern recommandé — invalidation ciblée avec hiérarchie
export function useInitiatePayment() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.payment_intents.create)
  return useMutation({
    mutationFn,
    onMutate: async (args) => {
      await qc.cancelQueries({ queryKey: walletKeys.balance() })
      const prevBalance = qc.getQueryData(walletKeys.balance())
      // Optimistic update ici
      return { prevBalance }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: walletKeys.balance() })
      qc.invalidateQueries({ queryKey: walletKeys.transactions() })
    },
  })
}
```

---

## 4. Optimistic Updates — Absent actuellement, À AJOUTER

### 4.1 Constat

**Aucune mutation dans le codebase n'utilise `withOptimisticUpdate`.** C'est une opportunité majeure d'amélioration UX dans la refonte.

### 4.2 Pattern recommandé par AGENTS.md

```ts
// Pattern cible extrait de AGENTS.md (L110-L121)
export function useAddTodoMutation() {
  const mutationFn = useConvexMutation(api.todos.add)
    .withOptimisticUpdate((localStore, args) => {
      const todos = localStore.getQuery(api.todos.list, {})
      if (!todos) return
      localStore.setQuery(api.todos.list, {}, [
        { _id: `temp_${Date.now()}`, text: args.text, completed: false },
        ...todos,
      ])
    })
  return useMutation({ mutationFn })
}
```

### 4.3 Recommandation pour la refonte

| Mutation | Optimistic update |
|----------|-------------------|
| `createPaymentIntent` | Ajouter une transaction "pending" dans le wallet |
| `cancelOrder` | Marquer l'ordre comme "annulé" instantanément |
| `completeActivation` | Afficher le solde mis à jour instantanément |

⚠️ **Attention:** Le pattern `withOptimisticUpdate` est spécifique à `@convex-dev/react-query`. Il manipule le cache côté Convex local store via `localStore.getQuery` / `localStore.setQuery`, pas le cache React Query directement.

---

## 5. SSR et Cache — Config Actuelle

### 5.1 router.tsx (L17-L60)

```ts
export function getRouter() {
  notifyManager.setScheduler(window.requestAnimationFrame)

  const convexQueryClient = new ConvexQueryClient(CONVEX_URL)

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
    mutationCache: new MutationCache({
      onError: (error) => {
        toast.error(error.message || 'An error occurred')
      },
    }),
  })

  convexQueryClient.connect(queryClient)

  const router = createRouter({
    routeTree,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,     // ← Let Query manage caching
    context: { queryClient, convexQueryClient },
    scrollRestoration: true,
    Wrap: ({ children }) => (
      <ConvexProvider client={convexQueryClient.convexClient}>{children}</ConvexProvider>
    ),
  })
  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}
```

### 5.2 Points clés

| Élément | Valeur | Note |
|---------|--------|------|
| `staleTime` | 30s | Défaut QueryClient — les données sont considérées fraîches 30s |
| `defaultPreloadStaleTime` | 0 | Router délègue entièrement à Query — **single source of truth** |
| `setupRouterSsrQueryIntegration` | Utilisé | SSR hydration automatique |
| `ConvexQueryClient` | Connecté | Pont Convex ↔ React Query |
| `notifyManager.setScheduler` | `requestAnimationFrame` | React 18 concurrent mode optimization |
| `mutationCache.onError` | `toast.error` | Global error handler |

### 5.3 Impact sur la refonte

| Aspect | Recommandation |
|--------|---------------|
| `staleTime` | 30s OK pour balance/transactions. Prix/disponibilités peuvent avoir **leur propre staleTime** (cf. `usePrices` avec 30s) |
| Loader SSR | Utiliser `ensureQueryData` pour précharger les données dans les loaders TanStack Router |
| Invalidation router | Pas nécessaire — `defaultPreloadStaleTime: 0` + Query gère tout |
| Nouveau ConvexQueryClient | Un seul par app — déjà connecté, ne pas en créer un second |

---

## 6. Max-Lines et Feature Docs — Règles du Projet

### 6.1 Règle max-lines

**200 lignes par fichier** (hors blank lines et commentaires). Applicable à tous les fichiers sauf `routeTree.gen.ts`.

| Fichier | Lignes | Statut |
|---------|--------|--------|
| `purchase-panel.tsx` | 357 | ❌ DOIT être refactoré (<200) |
| `step-topup.tsx` | 234 | ❌ DOIT être refactoré (<200) |
| `wallet-page-shell.tsx` | 55 | ✅ OK |
| `use-purchases.ts` | 68 | ✅ OK |
| `use-activations.ts` | 141 | ✅ OK (mais dense) |
| `use-admin-queries.ts` | 144 | ✅ OK (mais 20 hooks) |

### 6.2 Feature Folder Pattern

```
src/components/<feature>/
├── docs/           # CHANGELOG.md, CONTINUE.md, TODOS.md
├── hooks/          # use-<feature>.ts + index.ts
├── <composant>.tsx # UI inline
└── index.ts        # barrel export
```

**La feature `wallet` actuelle n'a ni `docs/` ni `hooks/`.** La refonte doit créer:
- `src/components/wallet/hooks/use-wallet.ts` — query factory + hooks
- `src/components/wallet/hooks/index.ts` — barrel
- `src/components/wallet/docs/CHANGELOG.md`
- `src/components/wallet/docs/CONTINUE.md`
- `src/components/wallet/docs/TODOS.md`

### 6.3 Hooks vs Inline

| Zone | Contenu |
|------|---------|
| **hooks/** | Convex mutations with `withOptimisticUpdate`, query key factories, logique 3+ étapes |
| **Inline** | UI pure, inputs, listes, toggles, composants sans état serveur |

---

## 7. Recommandations Synthétiques pour la Refonte Frontend

### 7.1 À faire

1. **Créer `src/components/wallet/hooks/`** avec une factory `walletKeys` unifiée
2. **Remplacer `purchaseKeys` par `walletKeys`** — supprimer les 3 factories dispersées
3. **Ajouter `withOptimisticUpdate`** sur toutes les mutations de paiement/escrow
4. **Uniformiser le pattern mutation** — `useConvexMutation` partout (pas `useConvexAction` pour les mutations)
5. **Remplacer `onSettled` par `onSuccess` + `onMutate` rollback** pour les cas critiques (balance)
6. **Refactorer `purchase-panel.tsx` (<357→200)** et `step-topup.tsx` (<234→200)**
7. **Créer les docs feature lifecycle** (`docs/CHANGELOG.md`, `CONTINUE.md`, `TODOS.md`) pour wallet

### 7.2 À conserver

| Pattern | Raison |
|---------|--------|
| `as const` sur les query keys | TypeScript strict, immutabilité |
| `convexQuery()` pour les queries réactives | Pattern officiel Convex + React Query |
| `staleTime` par hook pour les données volatiles | Prix (30s), dispo (30s) |
| `enabled` conditionnel | Évite les fetches inutiles |
| `qc.invalidateQueries` avec queryKey | Pattern standard |
| Barrel exports dans `index.ts` | Convention projet |
| `setupRouterSsrQueryIntegration` | Déjà en place, fonctionnel |
| `defaultPreloadStaleTime: 0` | Single cache source |

### 7.3 À supprimer / remplacer

| Élément | Action |
|---------|--------|
| `purchaseKeys.balance()` et `.mouvements()` hors hiérarchie | Fusionner dans `walletKeys` |
| `useRentPriceList`, `useFreePrices` inline keys | Déplacer dans la factory |
| `useConvexAction` pour mutations | Remplacer par `useConvexMutation` |
| `PendingPaymentBanner` (`return null`) | Supprimer |
| `WalletPaymentMethods` (données mock) | Remplacer par API dynamique |
| `WalletBalanceBreakdown` (placeholder) | Supprimer ou implémenter |
| `TransactionRow` (redondant) | Supprimer (remplacé par `WalletTransactionItem`) |
| `XAF_RATE = 600` hardcodé | Externaliser en env ou config serveur |
| `payment-methods.ts` (constantes) | API-driven |

---

*Rapport généré par subagent recherche — Phase 3 du workflow TEMPLATE.md.*
*Prochaine étape: Phase 4 — Analyse profonde (root cause + edge cases).*
