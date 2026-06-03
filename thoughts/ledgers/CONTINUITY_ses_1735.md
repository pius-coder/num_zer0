---
session: ses_1735
updated: 2026-06-03T09:55:52.701Z
---

# Session Summary

## Goal
Harmoniser tous les loaders/pending de l'infrastructure vers le composant `Spinner` de `#/common/spinner`, avec position adaptative : top (20px) quand la page a déjà du contenu, centré quand elle est vierge.

## Constraints & Preferences
- Pas de manipulation d'état complexe
- Solution explicite et simple (prop, pas d'auto-détection DOM)
- Toujours utiliser le même composant `Spinner` central, pas de duplications
- SSR compatible

## Progress
### Done
- [x] Analyse de tous les loaders existants : `RouteLoader` (barre h-1), `GlobalLoader` (déjà Spinner), `defaultPendingComponent` (bordure spinning), `common/ui/spinner.tsx` (inutilisé)
- [x] Ajout d'une prop `position: 'center' | 'top'` au composant `Spinner` (`src/common/spinner.tsx`), défaut `'center'`
- [x] `defaultPendingComponent` dans `router.tsx` passé à `position="top"` (transition de route → contenu présent)
- [x] `RouteLoader` dans `route-loader.tsx` remplacé barre → `<Spinner position="top" />`
- [x] `GlobalLoader` dans `global-loader.tsx` passé à `position="top"` (toujours dans le root layout)
- [x] Suppression de `src/common/ui/spinner.tsx` (inutilisé, importé nulle part)

### In Progress
- [ ] Commit des changements

### Blocked
(none)

## Key Decisions
- **Prop `position` plutôt qu'auto-détection DOM** : l'auto-détection est fragile, non SSR-compatible et complexe. La prop est explicite, zéro état, facile à maintenir.
- **Centre par défaut, top à la demande** : le cas par défaut (`position="center"`) correspond au cas sans contenu. Les call-sites qui savent qu'ils sont dans une page passent `position="top"`.
- **Garder le même composant Spinner** : pas de duplication en `SpinnerCentered`/`SpinnerTop`, un seul point d'entrée avec polymorphisme.

## Next Steps
1. Commiter les changements avec un message clair
2. Vérifier qu'aucun autre loader custom (ex: dans des routes spécifiques) n'a été oublié

## Critical Context
- Tous les loaders actifs sont dans le root layout ou le router → ont toujours du contenu → `position="top"` partout pour l'instant
- `GlobalLoader` est dans `__root.tsx` mais n'est jamais déclenché dans le code actuel (aucun appel à `loadingApi.start()` ou `useGlobalLoading().startLoading`)
- `RouteLoader` est utilisé UNIQUEMENT dans `__root.tsx` ligne 74
- Le store de loading (`src/common/stores/loading.store.ts`) et le hook `use-global-loading.ts` existent comme infrastructure prête pour du futur, avec une API imperative `loadingApi.start(msg?, timeout?)` pour être appelée hors React

## File Operations
### Read
- `/home/afreeserv/projects/num_zer0/src/common/spinner.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/route-loader.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/global-loader.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/ui/spinner.tsx`
- `/home/afreeserv/projects/num_zer0/src/common/stores/loading.store.ts`
- `/home/afreeserv/projects/num_zer0/src/common/hooks/use-global-loading.ts`
- `/home/afreeserv/projects/num_zer0/src/router.tsx`
- `/home/afreeserv/projects/num_zer0/src/routes/__root.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/wallet/pending-payment-banner.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/spa/my-space-skeleton.tsx`
- `/home/afreeserv/projects/num_zer0/src/components/recharge/step-topup.tsx`

### Modified
- `/home/afreeserv/projects/num_zer0/src/common/spinner.tsx` — ajout type `SpinnerPosition` + prop `position` + className dynamique
- `/home/afreeserv/projects/num_zer0/src/common/route-loader.tsx` — import `Spinner`, retourne `<Spinner position="top" />` au lieu de la barre
- `/home/afreeserv/projects/num_zer0/src/common/global-loader.tsx` — passé `position="top"` au Spinner
- `/home/afreeserv/projects/num_zer0/src/router.tsx` — `defaultPendingComponent` passé à `position="top"`

### Deleted
- `/home/afreeserv/projects/num_zer0/src/common/ui/spinner.tsx` — inutilisé
