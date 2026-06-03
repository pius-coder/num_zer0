# Issue Analysis: `/payment/result` route returns "No matching routes found"

## Date
2026-06-03

## Issue
La route `/payment/result` affiche "No matching routes found" en production lorsque Fapshi redirige l'utilisateur après un paiement.

## Root Causes

### 1. Route sans `head` SSR
```ts
// ANCIEN: pas de head → Nitro peut mal générer la route
export const Route = createFileRoute('/payment/result')({ ... })
```

Le renderer Nitro (TanStack Start) exige que chaque route ait un `head` pour le rendu SSR. Sans cela, la route est générée sans balises meta et peut être mal indexée ou servie incorrectement.

**Architecture concernée :** TanStack Start → Nitro → SSR
**Plus d'infos :** `docs/NITRO-SSR-DEBUG.md`

### 2. `pendingMs: 0` supprime le pendingComponent
```ts
pendingMs: 0,       // Le pending component apparaît IMMÉDIATEMENT
pendingMinMs: 500,  // Mais disparaît après 500ms
```

`pendingMs: 0` signifie que le `pendingComponent` s'affiche immédiatement pendant 500ms avant de rendre le vrai composant. Si le rendu SSR est déjà fait, ce comportement peut causer un flash ou un conflit de rendu.

### 3. HEAD de l'ancien composant non défini
L'ancien code avait :
```ts
// PAS DE head() → route invalide pour Nitro
createFileRoute('/payment/result')({ ... })
```

### 4. Comportement utilisateur dégradé
```ts
// ANCIEN: pas d'UI visible
return null  // L'utilisateur ne voit rien
// + auto-redirect immédiat
```

### 5. `VITE_SITE_URL` incorrecte
Les appels Fapshi en développement pointaient vers `localhost:3000` au lieu de l'URL réelle de production.

## Impact
- **Bloquant :** Les utilisateurs ne peuvent pas finaliser leurs achats
- **UX :** Aucun feedback utilisateur après paiement
- **Support :** Augmentation des tickets "j'ai payé mais rien ne se passe"

## Solution
Réécriture complète de `src/routes/payment/result.tsx` avec :
- `head()` pour le SSR
- UI visible avec états (verification/success/failure)
- Bouton "Aller au wallet" au lieu d'auto-redirect
- Conservation de `pendingComponent` existant
- Conservation de `useVerifyPurchase` hook

## Fichiers impactés
- `src/routes/payment/result.tsx` — Réécriture complète

## Checklist
- [x] Analyse root cause
- [x] Design de la solution
- [x] Implémentation
- [x] Review (APEX) — Accepté avec remarques, corrigées
- [x] Rapport final
