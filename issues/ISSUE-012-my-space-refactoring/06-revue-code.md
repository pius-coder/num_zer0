# Revue de code — Agent Reviewer

## Résumé

Le code existant est fonctionnel mais présente des problèmes architecturaux majeurs : un monolithe SPA de 1282 lignes, des navigations conditionnelles dangereuses pendant le render, et une duplication de l'auth checking entre le route loader et les composants. Plusieurs anti-patterns TanStack Router sont également présents.

## Problèmes bloquants

- **Problème**: Navigation conditionnelle dans le render (sans `useEffect` ni `router.navigate` avec `replace`)
  - Fichier: `src/components/spa/my-space-page.tsx:L73-L76`
  - Fichier: `src/routes/auth-splash.tsx:L15-L17`
  - Risque: **critique**
  - Suggestion: Utiliser `beforeLoad` + `redirect` (comme déjà fait dans `(app)/route.tsx`). Les navigations conditionnelles dans le render violent les règles de React (effets de bord dans le render). En mode strict React 18+, ce code peut exécuter la navigation deux fois et causer des boucles ou des incohérences d'état.

- **Problème**: `MySpacePage` est un monolithe de 1282 lignes avec 8 sous-composants définis dans le même fichier
  - Fichier: `src/components/spa/my-space-page.tsx`
  - Risque: **élevé**
  - Suggestion: Découper en fichiers séparés suivant le feature folder pattern décrit dans `AGENTS.md`:
    - `src/components/my-space/ServiceList.tsx`
    - `src/components/my-space/HistoryView.tsx`
    - `src/components/my-space/CountryList.tsx`
    - `src/components/my-space/PurchaseConfirmation.tsx`
    - `src/components/my-space/ActivationDetail.tsx`
    - `src/components/my-space/PurchaseOptionsInline.tsx`
    - Plus un barrel `index.ts`

- **Problème**: `PageView` state machine et routage manuel qui duplique le routeur
  - Fichier: `src/components/spa/my-space-page.tsx:L29-L34`
  - Risque: **élevé**
  - Suggestion: Chaque vue (`countries`, `confirm`, `activation`, `history`) devrait être une route TanStack Router à part entière avec ses propres search params. La state machine manuelle (`setView`) contourne complètement le router, rendant l'historique de navigation, le partage d'URL et le SSR impossibles.

- **Problème**: `ssr: false` sur la route `my-space` et `auth-splash` — perte des bénéfices SSR/SEO
  - Fichier: `src/routes/(app)/my-space.tsx:L5`
  - Fichier: `src/routes/auth-splash.tsx:L6`
  - Risque: **moyen**
  - Suggestion: Remplacer `ssr: false` par une détection côté client pour les parties vraiment interactives. Le layout, le skeleton loader et les données Convex peuvent être rendus côté serveur.

- **Problème**: `RouteLoader` est instancié dans `__root.tsx` mais n'est jamais utilisé ailleurs
  - Fichier: `src/common/route-loader.tsx`
  - Fichier: `src/routes/__root.tsx:L74`
  - Risque: **moyen**
  - Suggestion: Le `RouteLoader` a un délai de 1500ms avant d'afficher un spinner. C'est un pattern correct, mais son utilité est limitée si `defaultPendingComponent` est déjà défini dans `router.tsx:L45`. Soit l'un soit l'autre, pas les deux.

## Problèmes non-bloquants

- **Problème**: `isAuthenticated` retourné par `beforeLoad` de `__root.tsx` n'est pas consommé par les routes enfants
  - Fichier: `src/routes/__root.tsx:L44`
  - Priorité: **haute**
  - Suggestion: La route `(app)/route.tsx` refait un appel `getAuth()` au lieu d'utiliser `ctx.context.isAuthenticated`. Passer `isAuthenticated` via le context router et l'utiliser dans les `beforeLoad` enfants éviterait un appel serveur redondant.

- **Problème**: Pas de mutation invalidation après les actions dans `ActivationDetail`
  - Fichier: `src/components/spa/my-space-page.tsx:L1032-L1035`
  - Priorité: **moyenne**
  - Suggestion: Après `completeActivation`, `cancelActivation`, ou `requestSms`, les queries `useActivation` et `useMyActivations` devraient être invalidées pour refléter l'état à jour. Vérifier si les hooks le font déjà (via Convex reactivity ou TanStack Query invalidation).

- **Problème**: `useEffect` avec dépendance instable `observerCb` dans `CountryList`
  - Fichier: `src/components/spa/my-space-page.tsx:L461-L468`
  - Priorité: **moyenne**
  - Suggestion: `observerCb` est recréé via `useCallback([enriched.length])` à chaque changement de `enriched.length`. L'IntersectionObserver est reconnecté à chaque fois. Utiliser une ref pour la callback ou un `useMemo` avec une approche différente.

- **Problème**: `auth-splash.tsx` et `my-space-page.tsx` dupliquent la vérification d'auth
  - Fichier: `src/routes/auth-splash.tsx:L15-L17`
  - Fichier: `src/components/spa/my-space-page.tsx:L73-L76`
  - Priorité: **moyenne**
  - Suggestion: La route `(app)/route.tsx` a déjà un `beforeLoad` qui redirige vers `/auth-splash`. La redirection inverse (auth-splash → my-space si déjà connecté) est correcte, mais `my-space-page.tsx` ne devrait pas avoir à refaire cette vérification client-side.

- **Problème**: `PurchaseOptionsInline` utilise `useEffect` pour initialiser `maxPrice`
  - Fichier: `src/components/spa/my-space-page.tsx:L620-L624`
  - Priorité: **basse**
  - Suggestion: Utiliser un `useMemo` ou initialiser directement dans le `useState` avec une fonction d'initialisation. L'`useEffect` cause un render supplémentaire.

- **Problème**: `css` utilitaire non utilisé dans `router.tsx` (importé mais pas référencé)
  - Fichier: `src/router.tsx` (imports)
  - Priorité: **basse**
  - Suggestion: Nettoyer les imports inutilisés — vérifier que `notifyManager` est bien utilisé (il est appelé ligne 19).

- **Problème**: `PurchaseOptionsInline` accepte `country: CountryPrice` mais `PurchaseConfirmation` passe `country: CountryPrice` sans vérifier que `country` existe (return null si pas trouvé)
  - Fichier: `src/components/spa/my-space-page.tsx:L995-L996`
  - Priorité: **basse**
  - Suggestion: Soit rendre `country` optionnel dans `PurchaseOptionsInline`, soit gérer le cas `country === undefined` avec un message d'erreur.

## Points OK

- ✓ `src/routes/(app)/route.tsx` — Layout propre et minimal. La séparation `BottomNavProvider`, `DesktopDrawerProxy`, `MobileBottomNav` est claire.
- ✓ `src/router.tsx` — Configuration router claire avec `ConvexQueryClient`, MutationCache global avec toast d'erreur, et `setupRouterSsrQueryIntegration`.
- ✓ `src/common/route-loader.tsx` — Composant bien isolé, délai configurablé, log de debug en dev uniquement.
- ✓ `src/routes/__root.tsx` — Bonne utilisation de `createServerFn` pour l'auth SSR, `THEME_INIT_SCRIPT` bien géré, providers correctement wrappés.
- ✓ `src/components/spa/my-space-page.tsx` — Utilisation des bons hooks Convex/Query (`useMyActivations`, `useBalance`, etc.), state machine `PageView` bien typée, gestion d'erreur cohérente dans les actions.

## Recommandations

1. **Router-driven navigation**: Remplacer la state machine `PageView` par des routes filles sous `/(app)/my-space/` :
   - `/(app)/my-space/` → ServiceList
   - `/(app)/my-space/countries/$serviceId` → CountryList
   - `/(app)/my-space/confirm/$serviceId?country=` → PurchaseConfirmation
   - `/(app)/my-space/activation/$activationId` → ActivationDetail
   - `/(app)/my-space/history` → HistoryView
   
   Chaque route aurait son `beforeLoad` pour les données nécessaires, supprimant le besoin de `useState` + `switch`.

2. **Éliminer les navigations dans le render**: Toute redirection doit passer par `beforeLoad` + `redirect` (pattern déjà utilisé dans `(app)/route.tsx`).

3. **Découpage en feature folder**: Suivre le pattern décrit dans `AGENTS.md` — `src/components/my-space/` avec hooks, sous-composants, docs, et barrel export.

4. **Supprimer la redondance d'auth**: La route `(app)/route.tsx` et `__root.tsx` devraient être les seules à gérer l'authentification. Le `MySpacePage` ne devrait pas vérifier `session`.

5. **Unifier le loading state**: Choisir entre `defaultPendingComponent` (router.tsx) et `RouteLoader` (root). Les deux affichent un spinner mais avec des mécanismes différents.

## Conclusion

**Approuvé avec réserves** — Le code fonctionne mais la refonte est justifiée. Les problèmes critiques (navigations dans le render, monolithe de 1282 lignes, state machine remplaçant le routeur) doivent être adressés dans le refactoring. Les patterns d'auth et de SSR peuvent être améliorés mais ne bloquent pas le fonctionnement actuel.
