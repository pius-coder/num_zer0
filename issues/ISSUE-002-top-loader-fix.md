# Issue: RouteLoader — Timer complexe, position centrée, pas de traçage caller

**Date:** 2026-06-03
**Priorité:** Haute
**Statut:** Résolu
**Composant(s):** `src/common/route-loader.tsx`, `src/common/spinner.tsx`, `src/routes/__root.tsx`
**Signalé par:** Utilisateur

---

## Description

Le `RouteLoader` actuel a 4 problèmes :

### 1. Timer manuel avec `useRef` (complexe inutilement)

```tsx
const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

useEffect(() => {
  if (isRouterPending) {
    timer.current = setTimeout(() => setShowLoader(true), 1500)
  } else {
    if (timer.current) clearTimeout(timer.current)
    setShowLoader(false)
  }
  return () => {
    if (timer.current) clearTimeout(timer.current)
  }
}, [isRouterPending])
```

Le `useRef` + double `clearTimeout` est redondant. `useEffect` cleanup suffit.

### 2. Loader centré (full-screen overlay)

`RouteLoader` rend `<Spinner />` qui est `fixed inset-0 items-center justify-center` — un overlay plein écran centré. L'utilisateur veut un **top loader** (barre fine en haut, style YouTube/nprogress).

### 3. "Mystery loader" sur la page d'accueil

> *"je me retrouve sur la page d'accueil avec un loader dont je ne sais même pas pourquoi il tourne"*

Le loader apparaît sur la page d'accueil sans cause claire. Causes possibles :
- RouteLoader se déclenche sur TOUT `status === 'pending'` (même les micro-chargements)
- `defaultPendingComponent` dans `router.tsx` (ligne 43) est un spinner centré inline
- Aucun log ne permet de tracer l'origine

### 4. Pas de traçage caller

Aucun moyen de savoir qui a déclenché le `RouteLoader`. Impossible de debugger d'où vient l'appel.

---

## Analyse Root Cause

### RouteLoader actuel

```tsx
export function RouteLoader() {
  const isRouterPending = useRouterState({ select: (s) => s.status === 'pending' })
  const [showLoader, setShowLoader] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    if (isRouterPending) {
      timer.current = setTimeout(() => setShowLoader(true), 1500)
    } else {
      if (timer.current) clearTimeout(timer.current)
      setShowLoader(false)
    }
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [isRouterPending])

  if (!showLoader) return null
  return <Spinner />
}
```

**Problèmes:**
- `useRef` pour le timer → complexité inutile, `useEffect` cleanup fait le job
- `Spinner` rend un overlay centré → pas ce que l'utilisateur veut
- Aucune prop caller → pas de débogage possible
- 1500ms hardcodé → pas configurable

### Spinner (utilisé par RouteLoader)

```tsx
<div className="fixed inset-0 z-[100] flex items-center justify-center animate-[fadeIn_0.25s_ease-out]">
```

Full-screen overlay centré. Utile pour `GlobalLoader` mais pas pour `RouteLoader`.

### defaultPendingComponent (router.tsx)

```tsx
defaultPendingComponent: () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--lagoon)] border-t-transparent" />
  </div>
),
```

Un autre spinner centré — peut être confondu avec `RouteLoader`.

### CSS existant (global.css)

```css
@keyframes loader {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(150%); }
}
```

Cette animation existe déjà — parfaite pour un top loader barre horizontale. **Elle n'est utilisée nulle part actuellement.**

---

## ✅ Prompt de Correction

```yaml
guidelines:
  - RouteLoader doit être une barre fine en haut (pas un overlay centré)
  - Timer simplifié : useEffect cleanup uniquement, pas de useRef
  - Ajouter caller tracking via props + console.warn en dev
  - Utiliser l'animation @keyframes loader existante dans global.css
  - Rendre delay configurable via props (default 1500ms)
  - Ne pas casser GlobalLoader — Spinner reste pour GlobalLoader
  - TypeScript strict, pas de any

steps:
  - Étape 1: Réécrire RouteLoader
    files: [src/common/route-loader.tsx]
    details: >
      - Thin top bar (h-1, fixed top-0)
      - Utilise @keyframes loader pour l'animation
      - useEffect cleanup (pas de useRef)
      - Props: caller?: string, delay?: number
      - console.warn en dev quand le loader s'affiche

  - Étape 2: Mettre à jour __root.tsx
    files: [src/routes/__root.tsx]
    details: >
      - Passer caller="__root.tsx" à RouteLoader
      - Ajouter caller="__root.tsx" à GlobalLoader si pertinent

verification:
  - [ ] RouteLoader rend une barre en haut, pas un overlay centré
  - [ ] Timer simplifié sans useRef
  - [ ] caller prop acceptée et loggée en dev
  - [ ] delay prop fonctionne (default 1500ms)
  - [ ] GlobalLoader inchangé et fonctionnel
  - [ ] Lint & TypeScript pass
  - [ ] Build passe
```

---

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/common/route-loader.tsx` | RÉÉCRITURE | Nouveau design top bar + timer simplifié + caller |
| `src/routes/__root.tsx` | MODIFIER | Ajouter caller prop |

---

## Solution Appliquée

### Phase 1 — Top bar avec RouteLoader
**Commit:** `3cba500`
**Branche:** `v5`
**Date:** 2026-06-03 04:58

RouteLoader réécrit en top bar mince avec timer simplifié + traçage caller :
1. **Position :** `fixed top-0 left-0 right-0 z-[200] h-1`
2. **Animation :** `@keyframes loader` existant dans `global.css`
3. **Timer :** `useEffect` + `setTimeout` + cleanup (plus de `useRef`)
4. **Props :** `caller?`, `delay?` (default 1500ms)
5. **Dev logging :** `console.warn` avec path + caller
6. **Accessibilité :** `role="progressbar"`

### Phase 2 — Refactor vers Spinner unifié
**Commit:** `cae71c4` (amend: `07e9268`)
**Branche:** `v5`
**Date:** 2026-06-03 05:56

**Motif :** Harmoniser tous les loaders (RouteLoader, GlobalLoader, defaultPendingComponent) vers le même composant `Spinner` central avec une prop `position`.

1. **`Spinner`** — ajout de `type SpinnerPosition = 'center' | 'top'` et prop `position` (défaut `'center'`). `'top'` → `items-start justify-center pt-5`
2. **`router.tsx`** — `defaultPendingComponent` passe à `position="top"`
3. **`route-loader.tsx`** — remplace la top bar par `<Spinner position="top" />` (conserve les props `caller` et `delay`)
4. **`global-loader.tsx`** — passe `position="top"` explicitement
5. **`src/common/ui/spinner.tsx`** — supprimé (inutilisé)

**Fix post-refactor :** (même commit, amendé) — ajout de `justify-center` manquant dans le cas `position="top"` (`items-start` sans `justify-center` mettait le spinner en haut à gauche au lieu de haut centré).

### Fichiers modifiés

**Phase 1 :**
- [x] `src/common/route-loader.tsx` — réécriture top bar
- [x] `src/routes/__root.tsx` — caller prop ajoutée

**Phase 2 :**
- [x] `src/common/spinner.tsx` — ajout prop `position`
- [x] `src/common/route-loader.tsx` — passe à Spinner
- [x] `src/common/global-loader.tsx` — passe `position="top"`
- [x] `src/router.tsx` — `defaultPendingComponent` en Spinner `position="top"`
- [x] `src/common/ui/spinner.tsx` — supprimé

### Vérification

| Critère | Statut |
|---------|--------|
| Timer simplifié sans useRef | ✅ useEffect cleanup uniquement |
| caller prop loggée en dev | ✅ console.warn avec path + caller |
| delay prop configurable | ✅ default 1500ms (via RouteLoader) |
| Spinner position="center" centré des deux axes | ✅ `items-center justify-center` |
| Spinner position="top" centré horizontalement | ✅ `items-start justify-center pt-5` |
| Tous les loaders utilisent le même composant | ✅ Spinner partout |
| Aucune nouvelle erreur TS | ✅ (3 préexistantes non liées) |
| Build passe | ✅ |
