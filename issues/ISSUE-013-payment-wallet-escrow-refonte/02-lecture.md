# Phase 2 — Lecture ciblée consolidée

**Issue:** ISSUE-013-payment-wallet-escrow-refonte  
**Date:** 2026-06-08  
**Sources brutes:** `02-lecture-backend.md`, `02-lecture-frontend.md`

---

## Backend

- `convex/schema.ts`: les tables financières legacy sont `purchases`, `comptes`, `pieces`, `lignes`, avec `users.balanceUsd` comme champ redondant. Les statuts de `purchases`, `pieces` et `lignes.sens` sont des strings libres. Les `activations.status` sont mieux typés via union.
- `convex/purchases.ts`: le flux recharge est couplé à Fapshi. `initiateDirectPay` crée une purchase puis appelle Fapshi. `verifyPurchase` et `handlePaymentSuccess` peuvent tous deux confirmer le paiement et créer une écriture comptable. L'idempotency key existe mais n'est pas réellement utilisée pour protéger les traitements.
- `convex/comptabilite.ts`: le module comptable sert de wallet et d'escrow. `createPiece` modifie les soldes séquentiellement sans idempotence métier et sans garantie de rollback applicatif. `getMyMouvements` et `getMouvements` font des lectures N+1.
- `convex/http.ts`: le webhook Fapshi appelle directement les mutations `purchases`. `externalId` est lu mais non exploité pour vérifier l'idempotence métier.
- `convex/users.ts`: `getUserBalance` lit `comptes(411-user).solde`; `users.balanceUsd` est donc une colonne morte ou trompeuse. L'accès 48h est découplé du solde réel.
- `convex/auth.ts`: la création utilisateur initialise `balanceUsd: 0`, confirmant le doublon avec le compte comptable.
- `convex/sms_provider.ts`: les activations créent un escrow implicite via `471-escrow`; `refundEscrow` et `completeActivationAccounting` n'ont pas de clé d'idempotence et peuvent entrer en conflit selon l'ordre des actions/polling.
- `convex/packages.ts`: CRUD package legacy, alors que `purchases.packageId` vaut souvent `recharge` en dur.
- `convex/promo_codes.ts`: CRUD promo à conserver ou migrer vers le nouveau `payment_intents`.
- `convex/margins.ts` et `convex/margin_tiers.ts`: pricing/marges utiles, à découpler de la comptabilité legacy.

## Frontend

- `src/components/purchases/hooks/use-purchases.ts`: expose `useBalance`, `useMouvements`, `usePurchases`, `useInitiateDirectPay`, `useVerifyPurchase`, `useCancelPurchase`. Ces hooks pointent vers `api.users`, `api.comptabilite`, `api.purchases`, donc vers la couche legacy.
- `src/components/purchases/hooks/use-activations.ts`: expose les hooks de cycle SMS. Les mutations `completeActivation` et `cancelActivation` sont les points qui capturent/remboursent l'escrow.
- `src/components/admin/hooks/use-admin-queries.ts`: expose les hooks admin legacy `useAdminPurchases`, `useAdminComptes`, `useAdminPieces`.
- `src/components/recharge/recharge-drawer.tsx`: appelle `useInitiateDirectPay` et redirige vers l'URL Fapshi. Contient aussi une logique `signIn.anonymous` couplée au paiement.
- `src/components/recharge/step-topup.tsx`: formulaire de recharge, taux `XAF_RATE = 600` hardcodé, fichier à refactorer car il dépasse 200 lignes.
- `src/components/wallet/wallet-page-shell.tsx`: mappe les mouvements comptables en `TransactionItem`. Toute nouvelle API ledger devra adapter ce contrat.
- `src/components/wallet/wallet-purchase-history.tsx`: dépend de `api.purchases.getPurchases` et des champs `priceXaf`, `status`, `createdAt`.
- `src/routes/payment/result.tsx`: lit `transId` et `status` depuis l'URL, puis appelle `useVerifyPurchase`. La source de vérité doit être backend/provider, pas le paramètre d'URL.
- `src/components/my-space/purchase-panel.tsx`: vérifie le solde côté client et déclenche `initiateActivation` ou `initiateRentalActivation`; dépasse 200 lignes.
- `src/components/my-space/activation-detail.tsx`: expose les actions utilisateur qui terminent ou annulent une activation, donc impactent l'escrow.
- `src/components/admin/accounting/admin-accounting.tsx`: affiche `comptes` et `pieces`; devra être remplacé par vues ledger/wallet/payment/order.
- `src/components/admin/purchases/admin-purchases.tsx`: dépend des statuts et champs `purchases` legacy.

## Data Contracts Legacy

- Balance UI : `{ balanceUsd: number }`, actuellement alimentée par `comptes.solde`.
- Mouvements wallet : `{ id, libelle, date, montant, sens, soldeApres, statut }` sans type strict.
- Purchases : `{ _id, userId, priceXaf, paymentMethod, status, promoCode, createdAt }` sans type strict.
- Activation : modèle plus structuré, mais mélange fournisseur, statut métier, coût provider et prix facturé dans un même document.

## Risques Confirmés

- Double source de vérité du solde.
- Double confirmation possible par webhook et retour utilisateur.
- Escrow non idempotent.
- Montants en `number` flottants avec conversions XAF/USD dupliquées.
- Statuts libres dans les tables financières.
- Admin non typé et unités ambiguës.
- Couplage direct des providers Fapshi et SMS Online Pro aux mutations métier.

## Éléments Legacy à Supprimer ou Remplacer

- `users.balanceUsd` comme champ de solde.
- `purchases` comme modèle central de recharge.
- `comptes`, `pieces`, `lignes` comme source de vérité wallet/escrow.
- `packages` si aucun vrai package n'est conservé.
- Hooks `useMouvements`, `usePurchases`, `useInitiateDirectPay`, `useVerifyPurchase` sous leur forme actuelle.
- UIs admin `Comptes`/`Pièces` sous leur forme actuelle.
