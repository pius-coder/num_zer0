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

**Commit:** `3cba500`
**Branche:** `v5`
**Date:** 2026-06-03 04:58

### Changements

**RouteLoader réécrit — top bar mince avec timer simplifié + traçage caller**

1. **Position :** `fixed top-0 left-0 right-0 z-[200] h-1` — barre horizontale fine en haut de page, plus d'overlay centré
2. **Animation :** Utilise `@keyframes loader` existant dans `global.css` (translateX -100% → 150%)
3. **Timer :** Plus de `useRef` — `useEffect` + `setTimeout` + `return () => clearTimeout(timer)` (pattern idiomatique React)
4. **Props :**
   - `caller?: string` — identifie qui a déclenché le loader (loggé en dev)
   - `delay?: number` — délai configurable (défaut 1500ms)
5. **Dev logging :** `console.warn` en mode développement avec le path + caller
6. **Accessibilité :** `role="progressbar"` + `aria-label="Chargement de la page"`
7. **SSR safe :** `globalThis.location?.pathname ?? '?'` pour les environnements sans `window`

**Intégration __root.tsx :**
- `<RouteLoader />` → `<RouteLoader caller="__root.tsx" />`

### Fichiers modifiés

- [x] `src/common/route-loader.tsx` — RÉÉCRITURE COMPLÈTE
- [x] `src/routes/__root.tsx` — caller prop ajoutée

### Vérification

| Critère | Statut |
|---------|--------|
| Barre fine en haut (pas overlay centré) | ✅ `fixed top-0 left-0 right-0 h-1` |
| Timer sans useRef | ✅ useEffect cleanup uniquement |
| caller prop loggée en dev | ✅ console.warn avec path + caller |
| delay prop configurable | ✅ default 1500ms |
| Spinner & GlobalLoader intacts | ✅ inchangés |
| Aucune nouvelle erreur TS | ✅ (3 préexistantes non liées) |
| Build passe | ✅ |
| Review agent | ✅ APPROVED |
