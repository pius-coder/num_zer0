# Phase 1 — Exploration Backend Convex
**Issue:** ISSUE-013 — Refonte paiement/wallet/escrow/comptabilite (no-legacy)
**Date:** 2026-06-08
**Agent:** Subagent explore (backend Convex)
**Contexte:** Refonte complete sans backward compat — remplacer Fapshi, escrow comptable artisanal, gestion solde via `comptes` et `users.balanceUsd`.

---

## Methodologie

Exploration de tous les fichiers `convex/` et des hooks frontend qui les consomment.
Lecture complete de chaque fichier liste (tous < 200 lignes sauf `sms_provider.ts`/`purchases.ts` qui ont ete lus integralement).
Aucune modification de code applicatif.

---

## Fichiers couverts

| #  | Fichier | Lignes | Pages |
|----|---------|--------|-------|
| 1  | `convex/schema.ts` | 1-135 | Schema DB complet |
| 2  | `convex/purchases.ts` | 1-507 | Paiements Fapshi + integration comptable |
| 3  | `convex/comptabilite.ts` | 1-251 | Comptabilite en partie double (escrow artisanal) |
| 4  | `convex/http.ts` | 1-51 | Webhook Fapshi |
| 5  | `convex/users.ts` | 1-279 | Gestion utilisateurs + balance |
| 6  | `convex/auth.ts` | 1-105 | BetterAuth + sync user |
| 7  | `convex/sms_provider.ts` | 1-1231 | Activations SMS + escrow |
| 8  | `convex/margins.ts` | 1-64 | Overrides de marges SMS |
| 9  | `convex/margin_tiers.ts` | 1-48 | Tiers de marge par defaut |
| 10 | `convex/packages.ts` | 1-69 | Packages recharges |
| 11 | `convex/promo_codes.ts` | 1-76 | Codes promo |
| 12 | `convex/analytics.ts` | 1-90 | Analytics (hors perimetre mais reference users) |
| 13 | `convex/lib/auth_helpers.ts` | 1-17 | Helpers auth (requireAdmin) |
| 14 | `convex/_generated/dataModel.d.ts` | 1-60 | Types generated (Doc, Id, DataModel) |
| 15 | `convex/_generated/api.d.ts` | 1-75 | API generated references |
| 16 | `src/components/purchases/hooks/use-purchases.ts` | 1-68 | Hooks frontend paiements |
| 17 | `src/components/purchases/hooks/use-activations.ts` | 1-141 | Hooks frontend activations |
| 18 | `src/components/admin/hooks/use-admin-queries.ts` | 1-144 | Hooks frontend admin |
| 19 | `src/components/my-space/hooks/my-space-queries.ts` | 1-36 | Hooks frontend my-space |
| 20 | `convex/auth.config.ts` | 1-6 | Config providers auth |
| 21 | `convex/convex.config.ts` | 1-7 | Config Convex app |
| 22 | `convex/sms_countries.ts` | 1-62 | Mapping pays SMS provider |

---

## Analyse detaillee par fichier

---

### 1. `/home/ubuntu/num_zer0/convex/schema.ts` (1-135)

**Role:** Definition de toutes les tables Convex.

**Tables impactees par la refonte:**

| Table | Lignes | Champs cles | Probleme |
|-------|--------|-------------|----------|
| `users` | 5-20 | `balanceUsd: v.optional(v.number())`, `hasMadeDeposit: v.optional(v.boolean())`, `accessExpiresAt` | `balanceUsd` est un champ redondant avec le solde du compte `411-{userId}`. La refonte doit unifier. |
| `purchases` | 38-55 | `status`, `paymentMethod`, `paymentGatewayId`, `priceXaf`, `idempotencyKey` | Lie a Fapshi. `paymentGatewayId` stocke le transId Fapshi. `status` en string libre (`payment_pending`, `confirmed`, `failed`). A remplacer par wallet. |
| `comptes` | 67-71 | `code`, `libelle`, `solde` | Systeme artisanal de comptes en partie double. L'escrow utilise `471-escrow`, `471-fournisseur`, `702-sms-marge`. A remplacer par wallet. |
| `pieces` | 73-78 | `date`, `libelle`, `statut`, `reference` | Ecritures comptables. `statut` en string libre (`validee`, `en_attente`, `annulee`). |
| `lignes` | 80-88 | `pieceId`, `compteCode`, `sens`, `montant`, `soldeApres` | Lignes d'ecriture. `soldeApres` recalcule a chaque insertion. |
| `promoCodes` | 56-65 | `code`, `discountPercent`, `discountFlat`, `usedCount` | Utilise dans `initiateDirectPay` pour reduire le montant. |
| `activations` | 101-134 | `priceCharged`, `providerCost`, `status` | Escrow lie a chaque activation. `priceCharged` est bloque puis revire. |
| `packages` | 31-37 | `slug`, `priceXaf` | Ancien systeme de "recharge" via package. Probablement a migrer. |

**Risques:**
- Supprimer `comptes`/`pieces`/`lignes` = casser toutes les activations SMS en cours
- `users.balanceUsd` est source de verite pour l'UI (consomme par `getUserBalance`) MAIS le solde reellement utilise pour les paiements est dans `comptes` (table `comptes`, code `411-{userId}`). **Duplication de state** → risque majeur d'incoherence.
- `purchases.status` en string libre → risque de valeurs inconsistantes
- Aucune contrainte `unique` sur `idempotencyKey` dans purchases (seulement un index)

---

### 2. `/home/ubuntu/num_zer0/convex/purchases.ts` (1-507)

**Role:** Gestion des paiements via Fapshi (passerelle mobile money Cameroun).

**Fonctions publiques:**

| Fonction | Lignes | Type | Role |
|----------|--------|------|------|
| `getPurchases` | 46-56 | query | Liste des achats de l'utilisateur |
| `validatePromoCode` | 58-75 | query | Valide un code promo |
| `handlePaymentSuccess` | 77-134 | mutation | Callback webhook: confirme achat + credite user + ecriture compta |
| `handlePaymentFailure` | 136-151 | mutation | Callback webhook: marque echec |
| `cancelPurchase` | 153-169 | mutation | Annule un achat en attente |
| `initiateDirectPay` | 285-368 | action | Appelle Fapshi API + cree purchase |
| `verifyPurchase` | 370-452 | action | Verifie statut Fapshi + confirme si success |
| `getAllPurchases` | 454-466 | query | Admin: tous les achats |
| `backfillComptes` | 468-507 | internalMutation | Backfill des ecritures comptables |

**Fonctions internes:**

| Fonction | Lignes | Type | Role |
|----------|--------|------|------|
| `internalCreatePurchase` | 171-194 | internalMutation | Cree un document purchase |
| `internalPatchPurchase` | 196-204 | internalMutation | Patch un document purchase |
| `internalGetPurchaseByGatewayId` | 206-214 | internalQuery | Cherche par paymentGatewayId |
| `internalGetPurchaseById` | 216-221 | internalQuery | Cherche par ID |
| `internalGetPromoCode` | 223-231 | internalQuery | Cherche un code promo |
| `internalIncrementPromo` | 233-240 | internalMutation | Incremente usedCount |
| `internalGetUserByBetterAuthId` | 242-250 | internalQuery | Cherche user par auth ID |
| `internalCreateUser` | 252-269 | internalMutation | Cree user avec deposit |
| `internalUpdateUserDeposit` | 271-283 | internalMutation | Update user hasMadeDeposit + access |

**Points d'integration:**
- Appelle `internal.comptabilite.ensureCompte` (lignes 115-122, 412-419, 484-491)
- Appelle `internal.comptabilite.createPiece` (lignes 124-132, 420-436, 493-501)
- Lecture de `promoCodes` (lignes 306-325)
- Ecriture dans `users` (lignes 91-113)
- Utilise `fapshiPost`/`fapshiGet` (lignes 9-39) avec cles API depuis env

**Risques:**
- **DUPLICATION de logique comptable:** `handlePaymentSuccess` (mutation webhook) ET `verifyPurchase` (action client) font la meme chose: creer piece comptable + crediter user. Si les deux s'executent, double ecriture.
- **Taux de conversion XAF→USD** hardcode a 600 (lignes 89, 428, 439, 482). Devrait etre une config ou un oracle.
- **Fapshi est le seul provider** — couplage fort. `initiateDirectPay` appelle directement Fapshi.
- **`handlePaymentSuccess` ne verifie pas l'idempotency** — un webhook duplique peut creer des doublons (checked via `purchase.status === 'confirmed'` seulement).
- **`internalCreateUser`** est appele dans la mutation mais aussi `handlePaymentSuccess` cree son propre user — duplication possible.
- **Pas de transaction atomique** entre la creation de la piece et la mise a jour du user.

---

### 3. `/home/ubuntu/num_zer0/convex/comptabilite.ts` (1-251)

**Role:** Systeme comptable artisanal en partie double avec escrow.

**Fonctions:**

| Fonction | Lignes | Type | Role |
|----------|--------|------|------|
| `ensureCompte` | 5-19 | internalMutation | Cree un compte si inexistant |
| `getCompte` | 21-29 | query | Solde d'un compte |
| `internalGetCompte` | 31-39 | internalQuery | Solde d'un compte (interne) |
| `creditCompte` | 41-53 | internalMutation | Credite un compte (+ montant) |
| `debitCompte` | 55-67 | internalMutation | Debite un compte (- montant) |
| `createPiece` | 69-116 | internalMutation | Cree une ecriture comptable (credit/debit sur plusieurs comptes) |
| `annulerPiece` | 118-146 | internalMutation | Annule une piece (inverse les ecritures) |
| `getMouvements` | 148-176 | query | Mouvements d'un compte |
| `soldeClient` | 178-187 | query | Solde du compte client `411-{userId}` |
| `getAllComptes` | 189-201 | query | Admin: tous les comptes |
| `getAllPieces` | 203-215 | query | Admin: toutes les pieces |
| `getMyMouvements` | 217-251 | query | Mouvements du compte client courant |

**Schema comptable utilise:**
- `411-{userId}` = Compte client (solde utilisateur)
- `471-escrow` = Compte sequestre (argent bloque pendant activation)
- `471-fournisseur` = Dette fournisseur SMS
- `702-sms-marge` = Marge sur activations SMS
- `701-recharge` = Produit des recharges

**Risques:**
- **Operations non atomiques:** `createPiece` insere `pieces` puis iter sur `lignes` en appelant `creditCompte`/`debitCompte` — si une ligne echoue, les precedentes sont deja commited (pas de rollback).
- **`annulerPiece` a un bug potentiel** — il inverse les sens mais si une piece a deja ete "inversee" par une piece de sens oppose (pattern utilise dans `refundEscrow`), annuler la piece inverse peut creer un double refund.
- **Solde calcule a la volee** via `solde` dans `comptes` — pas de lecture depuis `lignes`. Si un `creditCompte`/`debitCompte` est appele sans `createPiece`, le solde est modifie sans trace.
- **`soldeClient`** lit `comptes` et non `users.balanceUsd` — les deux peuvent diverger.
- **Pas de double-entry verification** — rien ne garantit que somme des debits = somme des credits.

---

### 4. `/home/ubuntu/num_zer0/convex/http.ts` (1-51)

**Role:** Routes HTTP — webhook Fapshi + auth routes.

**Fonctions:**

| Fonction | Lignes | Type | Role |
|----------|--------|------|------|
| Webhook `/fapshi-webhook` POST | 12-49 | httpAction | Recoit les notifications Fapshi |

**Points d'integration:**
- Verifie `x-wh-secret` header (env `FAPSHI_WEBHOOK_SECRET`)
- Appelle `api.purchases.handlePaymentSuccess` et `api.purchases.handlePaymentFailure`

**Risques:**
- **Secret partage** entre env et code — si Fapshi change, le webhook ne fonctionne plus
- **Pas de rate limiting** — un attaquant avec le secret peut flood
- **Pas de gestion des evenements inconnus** — tout event non-success/failed est ignore silencieusement
- **Lazy registration** de `authComponent.registerRoutesLazy` (ligne 8-10)

---

### 5. `/home/ubuntu/num_zer0/convex/users.ts` (1-279)

**Role:** Gestion des utilisateurs, balance, acces.

**Fonctions publiques:**

| Fonction | Lignes | Type | Role |
|----------|--------|------|------|
| `getUserBalance` | 10-28 | query | Solde utilisateur (lit `comptes` PAS `users.balanceUsd`) |
| `getAccessStatus` | 30-60 | query | Statut d'acces (expire ou non) |
| `completeDeposit` | 116-140 | mutation | Marque le depot comme effectue |
| `convertToPermanent` | 142-172 | mutation | Convertit compte anonyme en permanent |
| `hasAccess` | 174-193 | query | Verifie si l'utilisateur a acces |
| `checkUserExists` | 195-216 | query | Verifie si un user existe (email/nom) |
| `getAllUsers` | 218-237 | query | Admin: tous les users |
| `updateUserCountry` | 239-259 | mutation | Met a jour le pays |
| `deleteUser` | 261-279 | mutation | Admin: supprime un user |

**Fonctions internes:**

| Fonction | Lignes | Type | Role |
|----------|--------|------|------|
| `syncUser` | 62-114 | internalMutation | Sync depuis BetterAuth (appele par auth.ts) |

**Point critique — `getUserBalance` (lignes 10-28):**
```ts
// Lit le solde depuis la table `comptes` (411-{userId}), PAS depuis `users.balanceUsd`
const compte = await ctx.db.query('comptes').withIndex('by_code', ...)
return { balanceUsd: compte?.solde ?? 0, userId: user?._id ?? null }
```
**C'est la source de verite pour le frontend** — le hook `useBalance()` appelle cette query. Donc le solde affiche a l'utilisateur vient de la comptabilite artisanale, pas de `users.balanceUsd`.

**Risques:**
- **`users.balanceUsd` n'est JAMAIS lu par le frontend** — c'est un champ mort / redondant. Il est ecrit dans `handlePaymentSuccess` (purchases.ts:103) mais jamais consomme.
- **`syncUser` a un admin detection fragile** (lignes 79-84) — base sur le count total de users (si 0 users, le premier est admin). Race condition possible.
- **`hasAccess`** lit `users.accessExpiresAt` — mais l'extension d'acces est faite dans `handlePaymentSuccess` et `internalUpdateUserDeposit` qui mettent `accessExpiresAt = now + 48h`. Pas de lien avec le solde.

---

### 6. `/home/ubuntu/num_zer0/convex/auth.ts` (1-105)

**Role:** Configuration BetterAuth + sync user.

**Fonctions:**

| Fonction | Lignes | Type | Role |
|----------|--------|------|------|
| `createAuth` | 15-98 | factory | Cree l'instance BetterAuth |
| `getCurrentUser` | 100-105 | query | Retourne l'utilisateur courant |

**Points d'integration:**
- `syncUserDb` (lignes 16-63) — appele par les hooks `databaseHooks.user.create.after` et `update.after`
- `syncUserDb` utilise `internal.users.syncUser` (ligne 55) quand il est dans un contexte action
- `syncUserDb` accede directement a `ctx.db` (lignes 22-53) quand il est dans un contexte mutation

**Risques:**
- **Double chemin de sync:** tantot direct `ctx.db`, tantot via `runMutation` — fragile
- **`isAdmin` calcule dans `syncUserDb`** (ligne 28) et aussi dans `syncUser` (users.ts:80-84) — duplication de logique
- **`balanceUsd` mis a 0** a la creation (ligne 48) mais jamais mis a jour ensuite — confirme que c'est un champ mort

---

### 7. `/home/ubuntu/num_zer0/convex/sms_provider.ts` (1-1231)

**Role:** Gestion des activations SMS (one-time + rental) avec escrow comptable.

**Fonctions cles pour la refonte:**

| Fonction | Lignes | Type | Role |
|----------|--------|------|------|
| `initiateActivation` | 44-137 | mutation | Debute activation: verifie solde, cree escrow, schedule poll |
| `initiateRentalActivation` | 869-955 | mutation | Debute location: meme pattern que initiateActivation |
| `refundEscrow` | 327-357 | internalMutation | Rembourse l'escrow (piece inverse) |
| `completeActivationAccounting` | 1155-1181 | internalMutation | Comptabilise activation reussie (sort escrow → marge + fournisseur) |
| `cancelActivation` | 434-464 | mutation | Annule activation + refund escrow |
| `completeActivation` | 362-388 | mutation | Complete activation + schedule action |

**Schema escrow utilise:**
1. `initiateActivation`: debit `411-user` (+priceCharged) → credit `471-escrow` (+priceCharged)
2. Si succes: credit `471-escrow` (-priceCharged) → debit `702-sms-marge` (+marge) + debit `471-fournisseur` (+providerCost)
3. Si echec/annulation: credit `471-escrow` (-priceCharged) → debit `411-user` (+priceCharged)

**Risques:**
- **Imbrication complexe** — les activations sont gerees par un polling avec `scheduler.runAfter`. Si le scheduler echoue ou si le state Convex est restaure, les activations peuvent rester bloquees.
- **Escrow cree en `en_attente`** (ligne 122) puis complete en `validee` — la piece en attente n'est jamais "annulee" (cancel utilise `createPiece` avec sens inverse, pas `annulerPiece`). C'est intentionnel (commentaire ligne 352-355) mais deroutant.
- **`refundEscrow` cherche la piece par `reference`** (ligne 337-338) — si plusieurs pieces ont la meme reference (plusieurs refunds), le comportement est indefini (`.first()`).
- **`completeActivationAccounting`** ne verifie pas que l'escrow piece existe ou a le bon statut — si la piece `en_attente` a ete supprimee, la compta est silencieusement ignoree.
- **Provider cost utilise `activation.maxPrice` pour les rentals** (ligne 1017) au lieu du cout reel retourne par l'API — la marge calculee est donc inexacte.
- **Double appel a `refundEscrow` possible** — si `pollActivation` expire en meme temps que l'utilisateur annule, les deux refunds peuvent s'executer.

---

### 8. Fichiers secondaires

#### `/home/ubuntu/num_zer0/convex/margins.ts` (1-64)
- CRUD sur `marginOverrides` — table utilisee par `margin_tiers.ts`
- Non directement lie au paiement mais impactera le pricing des activations

#### `/home/ubuntu/num_zer0/convex/margin_tiers.ts` (1-48)
- `computeDefaultMargin` et `getEffectiveMargin` — calcule la marge XAF par service/pays
- Utilise dans le pricing des activations SMS

#### `/home/ubuntu/num_zer0/convex/packages.ts` (1-69)
- CRUD sur `packages` — table des "recharges" predefinies
- `list`, `create`, `update`, `delete_` — admin seulement
- A re-evaluer si la refonte supprime le concept de package

#### `/home/ubuntu/num_zer0/convex/promo_codes.ts` (1-76)
- CRUD sur `promoCodes` — codes promo appliques aux recharges
- `list`, `create`, `update`, `delete_` — admin seulement

#### `/home/ubuntu/num_zer0/convex/analytics.ts` (1-90)
- Tracking d'evenements — non lie au paiement
- Reference `users` pour verifier le role admin

---

### 9. Fichiers generated

#### `/home/ubuntu/num_zer0/convex/_generated/dataModel.d.ts` (1-60)
- Types `Doc<TableName>`, `Id<TableName>`, `TableNames`
- Regenerer apres modification du schema

#### `/home/ubuntu/num_zer0/convex/_generated/api.d.ts` (1-75)
- Declaration `api`, `internal`, `components`
- Regenerer automatiquement par `npx convex dev`

#### `/home/ubuntu/num_zer0/convex/_generated/server.d.ts` (1-143)
- Types `query`, `mutation`, `action`, `internalQuery`, etc.
- Regenerer automatiquement

---

### 10. Frontend hooks consommateurs

| Fichier | Hooks | Endpoints convex appeles |
|---------|-------|--------------------------|
| `src/components/purchases/hooks/use-purchases.ts` | `useBalance`, `useMouvements`, `usePurchases`, `useValidatePromoCode`, `useInitiateDirectPay`, `useVerifyPurchase`, `useCancelPurchase` | `api.users.getUserBalance`, `api.comptabilite.getMyMouvements`, `api.purchases.getPurchases`, `api.purchases.validatePromoCode`, `api.purchases.initiateDirectPay`, `api.purchases.verifyPurchase`, `api.purchases.cancelPurchase` |
| `src/components/purchases/hooks/use-activations.ts` | `useActivation`, `useMyActivations`, `useInitiateActivation`, `useCompleteActivation`, `useCancelActivation`, `useRequestAnotherSms`, `useNumberQuantity`, `useTopCountries`, `useOperators`, `usePrices`, `useRentPriceList`, `useFreePrices`, `useInitiateRentalActivation` | Tous les endpoints `api.sms_provider.*` |
| `src/components/admin/hooks/use-admin-queries.ts` | `useAdminPurchases`, `useAdminActivations`, `useAdminComptes`, `useAdminPieces`, `useAdminUsers`, `useDeleteUser` | `api.users.getAllUsers`, `api.purchases.getAllPurchases`, `api.sms_provider.getAllActivations`, `api.comptabilite.getAllComptes`, `api.comptabilite.getAllPieces`, `api.users.deleteUser` |
| `src/components/my-space/hooks/my-space-queries.ts` | `mySpaceQueries.balance`, `mySpaceQueries.myActivations`, `mySpaceQueries.activation`, `mySpaceQueries.prices`, `mySpaceQueries.freePrices` | `api.users.getUserBalance`, `api.sms_provider.getMyActivations`, `api.sms_provider.getActivation`, `api.sms_provider.getPrices`, `api.sms_provider.getFreePrices` |
| `src/components/auth/auth-modal.tsx` | `useUpdateUserCountry` | `api.users.updateUserCountry` |
| `src/components/auth/convert-page.tsx` | `convertToPermanent` mutation | `api.users.convertToPermanent` |
| `src/routes/(landing)/index.tsx` | `getAccessStatus` query | `api.users.getAccessStatus` |
| `src/components/auth/access-banner.tsx` | `getAccessStatus` query | `api.users.getAccessStatus` |
| `src/components/admin/admin-layout.tsx` | `getAccessStatus` query | `api.users.getAccessStatus` |

---

## Architecture des flux (as-is)

```
[Frontend]
  ├── useBalance() → api.users.getUserBalance → lit comptes(411-{userId}).solde
  ├── useInitiateDirectPay() → api.purchases.initiateDirectPay → Fapshi API → purchase(created)
  ├── Webhook Fapshi → /fapshi-webhook → handlePaymentSuccess → purchase(confirmed) + createPiece + credit user
  ├── useVerifyPurchase() → api.purchases.verifyPurchase → Fapshi status check → purchase(confirmed) + createPiece + update user
  ├── useInitiateActivation() → api.sms_provider.initiateActivation → check solde → escrow(411→471) → poll
  ├── useCompleteActivation() → completeActivationAccounting → escrow(471→702+471-fournisseur)
  └── Panels admin: getAllComptes, getAllPieces, getAllPurchases, getAllActivations
```

---

## Problemes identifies pour la refonte

### 1. Duplication de source de verite pour le solde
- `users.balanceUsd` — ecrit parfois, jamais lu
- `comptes(411-{userId}).solde` — la veritable source (lue par getUserBalance)
- **Objectif de la refonte:** unifier → wallet dedie

### 2. Systeme comptable artisanal couteux
- `comptes`, `pieces`, `lignes` = ~450 lignes de code pour de la compta en partie double
- Pas de transactions atomiques
- Pas de verifications d'integrite (debit=credit)
- `createPiece` fait N mutations sequentielles (N lignes) sans rollback

### 3. Couplage fort a Fapshi
- `purchases.ts` appelle directement l'API Fapshi
- `http.ts` a un webhook Fapshi hardcode
- Pas d'abstraction de provider de paiement
- Taux XAF→USD hardcode (600)

### 4. Escrow artisanal pour les activations SMS
- `sms_provider.ts` utilise `comptabilite.createPiece` pour bloquer/debloquer les fonds
- Risque de double refund
- Pas de verrou atomique entre l'activation et l'escrow

### 5. Pas d'idempotency robuste
- `handlePaymentSuccess` check `purchase.status === 'confirmed'` mais rien pour les doublons de creation de piece
- `idempotencyKey` existe mais pas de contrainte unique

### 6. Gestion d'acces fragile
- L'acces (`accessExpiresAt`) est etendu de 48h a chaque deposit, independamment du solde
- Un utilisateur avec solde > 0 peut avoir un acces expire

---

## Recommandations pour Phase 2 (lecture ciblee)

Commencer par lire en priorite:
1. `convex/schema.ts` — pour comprendre le modele de donnees cible
2. `convex/purchases.ts` (L77-L134, L285-L452) — les deux flux de paiement (webhook + verify)
3. `convex/sms_provider.ts` (L44-L137, L327-L357, L869-L955, L1155-L1181) — le cycle escrow
4. `convex/comptabilite.ts` (L69-L146, L217-L251) — le systeme comptable
5. `convex/users.ts` (L10-L28, L62-L114) — la gestion de balance et sync
6. Fichiers frontend `use-purchases.ts`, `use-activations.ts` — pour comprendre les besoins API
