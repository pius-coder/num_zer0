# Bug: `/payment/result` route returns "No matching routes found"

**Date:** 2026-06-03
**Priority:** CRITICAL (bloque le flux de recharge)
**Status:** À corriger

---

## Constat

L'URL `https://site-bpsd.globalimex.online/payment/result?transId=5kjuPkWY2u&status=SUCCESSFUL`
retourne **"No matching routes found"** au lieu de déclencher la vérification du paiement.

---

## Analyse Root Cause

### 1. La ROUTE EXISTE dans le code

Le fichier `src/routes/payment/result.tsx` existe et est bien enregistré dans l'arbre de routage :

- **Fichier :** `src/routes/payment/result.tsx` — Route TanStack créée avec `createFileRoute('/payment/result')`
- **Route tree :** `src/routeTree.gen.ts` ligne 54 : `{ id: '/payment/result', path: '/payment/result', getParentRoute: () => rootRouteImport }`

### 2. Causes probables de l'erreur

| Cause | Probabilité | Détail |
|-------|-------------|--------|
| **Build de production obsolète** | ÉLEVÉE | Le fichier a été ajouté après le dernier déploiement. Le `routeTree.gen.ts` est généré automatiquement et bien commité (pas dans `.gitignore`), mais le build Nitro n'a pas été reconstruit/re-déployé |
| **Absence de config SSR** | MOYENNE | La route n'a pas de définition `head: () => ({...})` pour le rendu SSR. TanStack Start/Nitro peut échouer à rendre la route côté serveur si elle manque de métadonnées SSR. |
| **VITE_SITE_URL incorrect** | MOYENNE | `.env.local` contient `VITE_SITE_URL=http://localhost:3000` au lieu de l'URL de production. Cela n'affecte PAS la route elle-même, mais le `redirectUrl` envoyé à Fapshi dans `initiateDirectPay` est incorrect. |

### 3. Problèmes de conception de la route actuelle

- **Retourne `null`** — Aucun feedback visuel pour l'utilisateur
- **Toute la logique dans `useEffect`** — Pas SSR-friendly. Pendant le SSR, `useEffect` ne s'exécute pas, donc la route pourrait être considérée comme vide
- **Pas de `head`** — Pas de titre de page SEO, pas de méta pour SSR
- **Auto-redirect immédiat** — L'utilisateur est redirigé vers `/wallet` sans voir le résultat de la vérification
- **Le composant ne gère pas bien l'état de chargement** — Le `startLoading`/`stopLoading` utilise le `GlobalLoader` qui est défini dans `__root.tsx`, mais la route rend `null` donc l'utilisateur ne voit que le spinner global sur fond blanc

---

## Analyse de Sécurité

### Ce qui est BIEN

1. **Le `verifyPurchase` (Convex action) ne fait PAS confiance au `status` du client** — Il vérifie directement via l'API Fapshi
2. **Vérification d'authentification** — `verifyPurchase` exige une session valide via `ctx.auth.getUserIdentity()`
3. **Vérification de propriété** — `purchase.userId !== userId` → refuse si l'utilisateur n'est pas le propriétaire
4. **Double webhook + route verification** — Le webhook Fapshi (`/fapshi-webhook`) et la route `/payment/result` sont deux chemins indépendants qui peuvent créditer le compte. Mais la mutation `handlePaymentSuccess` est idempotente (`if (purchase.status === 'confirmed') return`)

### Vulnérabilités potentielles

| Risque | Analyse | Gravité |
|--------|---------|---------|
| **URL param `status` non utilisé** | Le `status` du search param n'est utilisé que pour un affichage immédiat ("échec" toast). La vraie vérification est serveur. | FAIBLE |
| **Pas de rate limiting** | Un attaquant pourrait marteler `/payment/result?transId=xxx` avec des transId aléatoires. Mais chaque appel fait une requête API à Fapshi, pas de modification de BDD en échec. | MOYENNE |
| **Pas de nonce** | N'importe qui avec un `transId` valide peut accéder à la route. Mais la vérification serveur bloque si l'utilisateur n'est pas le propriétaire. | FAIBLE |
| **XSS via search params** | Les params sont passés à `validateSearch` qui les caste en string — pas de risque XSS. | FAIBLE |
| **Race condition webhook vs route** | Si le webhook Fapshi arrive AVANT que l'utilisateur n'arrive sur `/payment/result`, le `verifyPurchase` voit `status === 'confirmed'` et ne fait rien de mal (idempotent). | FAIBLE |

---

## Implémentations existantes (vérification redondance)

| Composant | Rôle | Duplication risque |
|-----------|------|-------------------|
| `pending-payment-banner.tsx` | Bannière "paiement en cours" dans le wallet | NON — montre l'état "pending" |
| `payment-feedback-message.tsx` | Message succès/échec dans le drawer de recharge | NON — UI différente, dans le drawer |
| `wallet-cta-footer.tsx` | Bouton CTA footer wallet | NON — navigation générale |
| `GlobalLoader` | Spinner global utilisé actuellement par la route | OUI PARTIEL — on va remplacer par un loader natif TanStack |

**Aucune implémentation existante ne duplique la fonctionnalité de `/payment/result`.** On peut donc réécrire proprement.

---

## Solution proposée

### Objectifs

1. Route SSR-friendly avec `head` et `loader`
2. UI visible avec statut de vérification
3. Top loader (TanStack Router `pendingComponent`)
4. Bouton "Aller au wallet" au lieu d'auto-redirect
5. Garder la logique métier existante (`useVerifyPurchase` hook)

### Architecture nouvelle route

```
Route /payment/result
├── head: titre + meta pour SSR
├── validateSearch: transId, status (inchangé)
├── loader: validation des params côté serveur
├── pendingComponent: spinner natif TanStack
└── component: PaymentResultPage
    ├── Affiche le statut (vérification en cours / succès / échec)
    ├── Bouton "Retour au wallet"
    └── Pas d'auto-redirect
```

### Plan de correction

1. Réécrire `src/routes/payment/result.tsx`
2. Ajouter `head` pour SSR
3. UI complète avec `pendingComponent` natif TanStack
4. Garder la mutation `useVerifyPurchase`
5. Ajouter `errorComponent` pour les erreurs de vérification
6. Corriger `VITE_SITE_URL` dans `.env.local` de production
7. Rebuild + redéploiement

---

## Fichiers impactés

- `src/routes/payment/result.tsx` — RÉÉCRITURE COMPLÈTE
- `.env.local` — Correction `VITE_SITE_URL`

## Tests de vérification

1. Accéder à `/payment/result?transId=xxx&status=SUCCESSFUL` → doit charger, spinner, vérifier
2. Accéder à `/payment/result?transId=xxx&status=FAILED` → doit afficher échec, bouton wallet
3. Accéder à `/payment/result` sans params → doit afficher message d'erreur
4. Vérifier que le webhook Fapshi fonctionne toujours indépendamment
