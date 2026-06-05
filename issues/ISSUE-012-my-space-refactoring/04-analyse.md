# Phase 4 — Analyse profonde

## Root cause

Le warning React "Can't perform a React state update on a component that hasn't mounted yet" est causé par **`navigate()` appelé pendant le render** dans `my-space-page.tsx:74`:

```tsx
if (!isSessionLoading && !session) {
    navigate({ to: '/auth-splash' })  // ← TRIGGER PENDANT LE RENDER
    return null
}
```

Séquence:
1. `MySpacePage` render → `authClient.useSession()` retourne `{ data: null, isPending: false }`
2. Condition `!isSessionLoading && !session` est vraie
3. `navigate()` appelé — modifie l'état du router (`Transitioner.tsx:27`)
4. React détecte: state update pendant le render phase → warning
5. La stack mentionne `__root.tsx:91` (RouteLoader/RootDocument) car le composant racine n'a pas fini de monter

**Cause secondaire**: le `RouteLoader` utilise `setTimeout` + `setShowLoader` dans un `useEffect`. Si une transition rapide unmount le composant avant la fin du setTimeout, le `setShowLoader` peut déclencher un state update sur un composant démonté. Le `useEffect` cleanup (L26: `return () => clearTimeout(timer)`) devrait gérer ce cas, mais le warning principal vient bien du `navigate()`.

## Même anti-pattern dans `auth-splash.tsx:15-17`

```tsx
if (!isPending && session) {
    navigate({ to: '/my-space' })
    return null
}
```

## Edge cases

| Scenario | Comportement attendu | Problème |
|---|---|---|
| Non-auth → `/my-space` | Rediriger vers `/auth-splash` sans flash ni warning | Flash du Spinner + warning React |
| Auth → `/my-space` | Afficher le service list | OK (pas de navigate()) |
| Session en cours de chargement | Afficher un spinner | OK (Spinner rendu L79) |
| Transition rapide entre vues internes | Changement de vue fluide | Possible state update après unmount via le RouteLoader |
| Refresh page sur `/my-space` | Recharger les données | Pas de loader, tout est client |
| Naviguer vers `/my-space/some-invalid-id` | Page 404 ou fallback | Pas de 404 handler, crash possible |

## Impacts du `ssr: false`

- Pas de server-side rendering → temps de chargement initial plus long
- Pas de prefetching serveur → waterfall (JS load → session check → navigate)
- Les bots/SEO ne peuvent pas indexer le contenu (mais peut-être intentionnel pour une app)

## Problèmes additionnels

1. **1162 lignes** dans `my-space-page.tsx` vs limite projet de 200
2. **Code dupliqué**: `history.tsx` de wallet, `recharge.tsx` partagent des patterns similaires
3. **Pas de route guard**: toute route sous `(app)` est accessible sans auth
4. **Pas de lazy loading**: tout le bundle my-space est chargé même si l'utilisateur ne visite pas la page
5. **Pas de `defaultPreloadStaleTime: 0`**: le router et Query ont des caches parallèles potentiellement inconsistants

## Si refactoring complet ("no backward compat")

- `src/components/spa/my-space-page.tsx` — supprimé entièrement
- `src/routes/(app)/my-space.tsx` — remplacé par nouvelle structure de routes
- `src/components/spa/my-space-skeleton.tsx` — peut être supprimé si remplacé par Spinner
- `src/components/spa/my-space-hero-mobile.tsx` — peut être supprimé si plus utilisé
- `src/components/spa/my-space-hero-desktop.tsx` — peut être supprimé si plus utilisé
