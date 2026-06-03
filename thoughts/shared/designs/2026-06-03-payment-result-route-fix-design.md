---
date: 2026-06-03
topic: "Fix /payment/result route - SSR + UI + security hardening"
status: validated
---

## Problem Statement

La route `/payment/result` retourne "No matching routes found" en production. De plus, son implémentation actuelle est pauvre : rend `null`, pas de `head` SSR, auto-redirect sans feedback utilisateur.

## Constraints

- Doit rester compatible avec le flux Fapshi existant (webhook + redirect)
- Doit utiliser `useVerifyPurchase` hook existant
- Doit être SSR-friendly (TanStack Start + Nitro)
- Doit fonctionner sans JavaScript pour le rendu initial (SSR)

## Approach

Réécriture complète de `src/routes/payment/result.tsx` avec :
1. `head` pour le SSR
2. Composant UI visible avec 3 états (vérification, succès, échec)
3. Bouton "Aller au wallet" au lieu d'auto-redirect
4. Conservation du `pendingComponent` existant
5. Garder la logique `useVerifyPurchase` inchangée

## Architecture

```
┌──────────────────────────────────────┐
│ Route /payment/result                │
│                                      │
│ 1. SSR: head() → titre + meta       │
│ 2. validateSearch → transId, status  │
│ 3. pendingComponent → spinner        │
│    (existant, conservé)             │
│ 4. Component: PaymentResultPage      │
│    ├─ Vérification... (spinner)      │
│    ├─ Succès ✓ (check + message)    │
│    ├─ Échec ✗ (erreur + raison)     │
│    └─ "Aller au wallet" bouton       │
└──────────────────────────────────────┘
```

## Components

- **Route definition** : `createFileRoute('/payment/result')` — inchangé
- **Route.head** : NOUVEAU — titre + meta pour SSR
- **validateSearch** : INCHANGÉ — transId + status
- **pendingComponent** : INCHANGÉ — spinner natif
- **PaymentResultPage** : RÉÉCRIT — UI complète avec états

## Data Flow

```
1. User redirected by Fapshi → /payment/result?transId=X&status=SUCCESSFUL
2. TanStack Router (SSR) → valide search params → rend le composant
3. Composant monte → hydrate → useEffect lance verifyPurchase.mutate({transId})
4. verifyPurchase (Convex action) → check auth → check ownership → call Fapshi API
5. Résultat : success true/false → UI met à jour l'état
6. User clique "Aller au wallet" → navigate({to: '/wallet'})
```

## Error Handling

| Cas | Comportement |
|-----|-------------|
| transId manquant | Message "Aucune référence de paiement" + bouton wallet |
| status != SUCCESSFUL | Message "Paiement échoué" + bouton wallet |
| Session expirée | Message "Session expirée" + lien vers login |
| Erreur réseau/API | Message d'erreur technique + bouton wallet |
| Succès | ✓ "Compte crédité avec succès" + bouton wallet |

## Testing Strategy

1. Accès direct avec transId valide + status=SUCCESSFUL
2. Accès direct avec transId valide + status=FAILED
3. Accès direct sans params
4. Accès direct avec transId invalide
5. Vérification que le webhook Fapshi fonctionne toujours indépendamment
