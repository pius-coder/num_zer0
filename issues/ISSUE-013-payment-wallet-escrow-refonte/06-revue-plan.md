# Phase 6 — Revue du Plan (Reviewer Agent 2)

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08
**Agent:** Reviewer Agent 2
**Document revu:** `05-plan.md` (23 steps)

---

## Résumé exécutif

| Critère | Verdict |
|---------|---------|
| Cohérence globale | ✅ OK |
| Ordre des steps | ⚠️ Attention |
| Complétude | ⚠️ Attention |
| Risques non mitigés | ⚠️ Attention |
| Conventions Convex | ✅ OK |
| Migration data | ⚠️ Attention |
| Tests | ❌ Problème |
| Scheduler/jobs | ⚠️ Attention |
| Frontend | ⚠️ Attention |
| Risque global | ⚠️ Élevé |

**Verdict final:** Le plan est solide sur le fond (architecture widen→migrate→narrow, respect des conventions Convex) mais présente **2 problèmes bloquants** (tests absents, dépendance ordering Step 14 vs Step 18) et **7 points d'attention**. Recommandation: corriger les problèmes avant validation.

---

## 1. Cohérence globale — ✅ OK

Le plan respecte le widen→migrate→narrow pattern et couvre correctement le périmètre no-legacy. Les 23 steps s'enchaînent logiquement: schéma → nouveaux modules backend → hooks frontend → composants → migrations données → bascule sms_provider → suppression legacy → vérifications.

Les corrections Convex (tableau lignes 742-749) montrent que les erreurs de type action/mutation ont été identifiées et corrigées par le convex-review-agent. Bon signe.

**Anomalie mineure:** L'en-tête annonce "17 steps" (ligne 11) mais le plan en détaille 23. Mettre à jour l'en-tête.

---

## 2. Ordre des steps — ⚠️ Attention

### Problème 1: Step 14 ordonné avant Step 18 mais dépend de Step 18

Le plan dit (ligne 492): *Step 14 dépend de Step 19 (bascule sms_provider)* — c'est une référence au mauvais numéro. Step 19 est "Supprimer modules legacy", Step 18 est "Bascule sms_provider". 

Mais même avec la correction Step 14→Step 18, le problème demeure: **Step 14 est exécuté avant Step 18** (14 < 18 dans l'ordre) alors qu'il en dépend.

**Conséquence:** `activation-detail.tsx` serait adapté aux nouveaux hooks escrow (Step 14) avant que `sms_provider.ts` ne bascule vers ces nouveaux escrows (Step 18). Les hooks `useCompleteActivation` et `useCancelActivation` pointeraient vers des fonctions qui n'existent pas encore dans `sms_provider.ts`.

**Correction:** Déplacer Step 14 APRÈS Step 18, ou éclater Step 14 en deux sous-steps:
- 14a (avant 18): adapter `purchase-panel.tsx` (balance wallet uniquement)
- 14b (après 18): adapter `activation-detail.tsx` (hooks escrow)

### Problème 2: Graphe de dépendances correct mais texte contradictoire

Le graphe (ligne 676) montre Step 14 et Step 18 parallèles depuis Step 6 — c'est correct. Mais le texte (ligne 492) dit que Step 14 dépend de Step 19. Harmoniser.

**Proposition:** Garder le graphe comme source de vérité, corriger le texte.

---

## 3. Complétude — ⚠️ Attention

### Fichiers manquants dans les steps

| Fichier | Où devrait-il être ? | Risque |
|---------|----------------------|--------|
| `convex/auth.ts` | Step 20 — supprimer `balanceUsd: 0` ligne 48 | Si oublié, `users.balanceUsd` continue d'être initialisé à 0 même après suppression du champ dans le schéma → erreur Convex |
| `convex/users.ts` | Step 19 — `getUserBalance` référence `comptes` | Si non migré, les composants qui l'appellent encore (navigation, etc.) reçoivent undefined. Remplacer par `api.wallet.getBalance` |
| `src/components/my-space/country-list.tsx` | Step 2 — importe `XAF_USD_RATE` (ligne 7) | Ne sera pas mis à jour. La constante est utilisée dans le calcul de marge. |
| `src/components/my-space/index.ts` | Step 2 — exporte `XAF_USD_RATE` | Si pas mis à jour, les consommateurs reçoivent undefined |
| `src/components/wallet/wallet-transaction-list.tsx` | Step 11 — le mapping `TransactionItem` doit être adapté pour `WalletLedgerEntry` | Plan mentionne "adapter type TransactionItem pour WalletLedgerEntry" mais ne liste pas le fichier explicitement |
| `src/components/wallet/wallet-balance-card.tsx` | Step 11 — doit accepter les nouvelles props | Non listé dans les fichiers modifiés |
| `convex/margins.ts` / `convex/margin_tiers.ts` | Aucun step — doivent être découplés de `comptabilite.ts` | Si oubliés, restent des dépendances vers le module supprimé |
| `convex/promo_codes.ts` | Aucun step — `validatePromoCode` référence `purchases` | Plan mentionne "Conserver" (04-analyse ligne 308) mais aucun step ne migre ses références |

### Step 2 partiel

Step 2 remplace `XAF_RATE` dans certains fichiers mais omet:
- `src/components/my-space/country-list.tsx` (ligne 7: `import { FLAG_BASE, PAGE_SIZE, XAF_USD_RATE } from './constants'`)
- `src/components/my-space/index.ts` (ligne 19: exporte `XAF_USD_RATE`)

Ces fichiers seront laissés avec des imports cassés après suppression de `constants.ts` (Step 22).

---

## 4. Risques non mitigés — ⚠️ Attention

### 4.1 Auth dans les actions (Step 5)

Le plan traite `initiatePayment` comme une "action authentifiée" (ligne 281). C'est correct — les actions Convex ont accès à `ctx.auth.getUserIdentity()` (contrairement à ce que l'analyse laisse entendre en 04-analyse.md ligne 418).

**Verdict: ❌ FAUX POSITIF DE L'ANALYSE** — l'analyse était erronée sur ce point. Le plan a raison. Pas de correction nécessaire.

### 4.2 Gestion des jobs scheduler legacy (Step 18, risque critique sous-estimé)

Le plan dit: *"drainer les jobs (attendre 5 min après déploiement)"* (ligne 576).

**Problème:** Il y a **15 appels `scheduler.runAfter`** dans `sms_provider.ts`. Ces jobs ne sont pas tous à courte durée:
- `pollActivation` utilise `POLL_INTERVAL_MS` (indéfini, probablement 5-30s) — s'auto-résechedule indéfiniment
- Les jobs existants dans la file d'attente AVANT déploiement exécuteront l'ANCIENNE version compilée des fonctions. Après déploiement du nouveau code, ils exécuteront la NOUVELLE version compilée.

**Risque réel:** Les jobs `pollActivation` déjà schedulés continueront de s'exécuter avec le nouveau code qui référence `internal.escrows.releaseEscrow` (nouveau module) et non plus `comptabilite.annulerPiece` (ancien module). Si les migrations ne sont pas terminées, ces jobs échoueront car ils ne trouveront ni les nouvelles tables (pas encore migrées) ni les anciennes tables (plus référencées).

**Mitigation insuffisante.** Recommandation:
1. AVANT de déployer le nouveau code (Steps 5-8), arrêter le scheduling de pollActivation (déployer une version qui ne schedule plus de nouveaux jobs)
2. Attendre que tous les jobs existants s'exécutent (TTL max)
3. Puis déployer le nouveau code avec les nouvelles mutations

### 4.3 Idempotence dans `internalDebitWallet`

Step 4 (ligne 224): *"Une erreur dans `internalDebitWallet` peut créer une incohérence ledger."*

**Risque non couvert:** Si `internalDebitWallet` s'exécute mais que l'appel API externe (Fapshi/SMS Online Pro) échoue, le débit est déjà commité. Le plan mentionne cette race condition dans l'analyse (Edge Case 8, 04-analyse.md ligne 229) mais ne propose pas de mitigation dans le plan pour le pattern "pending escrow" puis confirmation. Step 6 introduit bien un statut `pending` pour les escrows, mais Step 5 (payment_intents) n'a pas ce pattern.

---

## 5. Conventions Convex — ✅ OK

Le tableau des conventions (lignes 27-43) est exact et bien sourcé. Les corrections appliquées (lignes 742-749) sont correctes:

| Correction | Justesse |
|------------|----------|
| `initiatePayment` utilise `ctx.runMutation()` pour les écritures DB | ✅ OK |
| Ajout de `internalMarkPaymentProcessing` (internalMutation) | ✅ OK |
| Ajout de `internalMarkPaymentFailed` (internalMutation) | ✅ OK |
| `expireOrphanedPaymentIntents`: mutation → internalMutation | ✅ OK |
| `cleanupOrphanedEscrows`: mutation → internalMutation | ✅ OK |
| Webhook handler: `httpAction` avec `ctx.runMutation()` | ✅ OK |

Un seul point d'attention: Step 5 ligne 313 mentionne `ctx.db.runMutation(...)` — c'est une coquille, devrait être `ctx.runMutation(...)`. À corriger.

---

## 6. Migration data — ⚠️ Attention

La stratégie widen→migrate→narrow est bien respectée. Points d'attention:

### 6.1 Mapping des statuts legacy insuffisamment spécifié

Step 16 (ligne 538-541): *"Pour chaque `purchases` avec status='confirmed'"* — le champ `purchases.status` est un `v.string()` libre (schema.ts ligne 45). Les valeurs possibles incluent: `'PENDING'`, `'SUCCESSFUL'`, `'FAILED'`, `'EXPIRED'`, `'pending'`, `'confirmed'`, et potentiellement d'autres.

**Risque:** Le mapping statique `'confirmed'` ne couvre pas `'SUCCESSFUL'` (utilisé dans le webhook) ni la casse variable. Des purchases valides peuvent ne pas être migrées.

**Correction:** Normaliser les statuts legacy AVANT le mapping. Utiliser un mapping insensible à la casse: `['confirmed', 'SUCCESSFUL', 'successful'].includes(status.toLowerCase())`.

### 6.2 `idempotencyKey` manquant pour les anciennes purchases

Step 16 (ligne 537): *"idempotencyKey=transId"* — les anciennes purchases ont un `idempotencyKey` (schema.ts ligne 48) mais le champ `transId` n'existe pas dans `purchases`. Le `paymentGatewayId` existe (ligne 46). Clarifier: utiliser `paymentGatewayId` comme fallback si `idempotencyKey` n'est pas défini.

### 6.3 `balanceAfterCents` récursif (Step 16, migration ledger)

La migration ledger doit calculer `balanceAfterCents` pour chaque entrée. Si `soldeApres` est absent de certaines lignes legacy, le calcul récursif est complexe (nécessite un point de départ connu). Recommandation: pour la migration initiale, utiliser `soldeApres * 100` quand disponible, sinon calculer depuis le solde wallet précédent.

### 6.4 Migration des taux historiques

Step 2 crée une table `exchangeRates` mais la migration initiale (Step 16) ne migre pas les taux historiques. La valeur par défaut (600) sera utilisée pour la conversion des purchases legacy, ce qui peut être incorrect si le taux a changé historiquement. Impact faible (les montants sont déjà stockés en XAF/USD).

---

## 7. Tests — ❌ Problème

C'est le problème le plus grave du plan. **Aucun test n'est prévu dans aucun des 23 steps.**

L'analyse (04-analyse.md lignes 359-366) recommande explicitement:
1. Tests de migration sur copie de prod
2. Tests unitaires de mutations idempotentes
3. Tests de race condition (webhook + callback)
4. Tests d'intégration cycle complet

Le plan ignore toutes ces recommandations.

### Steps qui DEVRAIENT inclure des vérifications test:

| Step | Test recommandé |
|------|----------------|
| Step 4 (wallet.ts) | Test unitaire: credit + debit = balance finale correcte. Test: debit > balance → throw |
| Step 5 (payment_intents) | Test: `confirmPaymentIntent` appelé deux fois → idempotent. Test: webhook + callback simultanés |
| Step 6 (escrows) | Test: `releaseEscrow` puis `refundEscrow` sur même escrow → second throw |
| Step 8 (http.ts) | Test d'intégration: appel webhook → `confirmPaymentIntent` est appelé |
| Step 18 (bascule) | Test de non-régression: cycle activation complet (initiate → provider → complete → refund) |

Le plan mentionne "Tester" dans les risques (lignes 727-728) mais ne crée pas de fichier de test et n'ajoute pas de step pour les tests.

**Correction:** Ajouter un Step 3bis "Tests unitaires des nouveaux modules wallet + payment_intents + escrows" avant de passer au frontend. Même des tests manuels scriptés valent mieux que rien.

---

## 8. Scheduler/jobs — ⚠️ Attention

### 8.1 15 points de scheduling à auditer

15 `scheduler.runAfter` dans `sms_provider.ts` (lignes 131, 196, 244, 273, 377, 381, 458, 493, 523, 949, 1021, 1082, 1087, 1104, 1218). Le plan Step 18 promet de les mettre à jour mais ne les liste pas explicitement.

**Recommandation:** Ajouter une checklist dans Step 18: "Chaque `scheduler.runAfter` dans sms_provider.ts pointe vers la nouvelle mutation escrow." Utiliser un grep:

```bash
rg "scheduler.runAfter" convex/sms_provider.ts
```

### 8.2 polling auto-réschedulant

`pollActivation` et `pollRentalActivation` s'auto-réscheduled. Même après déploiement du nouveau code, si l'activation n'est pas terminée, le prochain cycle de polling utilisera le nouveau code. C'est correct SI les migrations sont faites avant. Mais si Step 18 (bascule) arrive APRÈS Step 15-16 (migrations), le polling legacy pourrait échouer entre les deux.

**Mitigation:** Dans Step 18, déployer d'abord les nouvelles mutations dans `activations.ts`, attendre que les jobs en cours se terminent, puis supprimer les anciennes fonctions de `sms_provider.ts`.

---

## 9. Frontend — ⚠️ Attention

### 9.1 React Query invalidations non spécifiées

Le plan Step 9 dit: *"Factory walletKeys + hooks"* (ligne 422) mais ne détaille pas les invalidations dans les mutations.

L'analyse (04-analyse.md lignes 391-395) liste des invalidations critiques qui ne sont pas reprises dans le plan:

| Mutation | Keys à invalider |
|----------|-----------------|
| `createPaymentIntent` | `walletKeys.all` |
| `confirmPaymentIntent` | `walletKeys.balance()`, `walletKeys.transactions()` |
| `holdEscrow` | `walletKeys.balance()`, `escrowKeys.all` |
| `releaseEscrow`/`refundEscrow` | `walletKeys.balance()`, `walletKeys.transactions()`, `escrowKeys.all` |

Ces invalidations doivent être spécifiées dans le plan pour chaque mutation.

### 9.2 Optimistic updates absents

Le plan ne mentionne aucune stratégie d'optimistic update. Pourtant, AGENTS.md l'exige: *"Use `withOptimisticUpdate` on all mutations"*. Pour des mutations financières, l'optimistic update est discutable (risque d'afficher un solde incorrect), mais le pattern devrait au moins être discuté dans le plan.

### 9.3 Barrel export bridge manquant

`src/components/purchases/hooks/index.ts` exporte `useBalance`, `useMouvements`, etc. Après la refonte, ces hooks n'existent plus. Le plan ne prévoit pas de bridge pour que les consommateurs (navigation, etc.) continuent de fonctionner.

**Recommandation (optionnelle):** Pendant la phase de transition, les anciens exports de `src/components/purchases/hooks/index.ts` peuvent rediriger vers les nouveaux hooks wallet:

```ts
// Bridge temporaire
export { useWalletBalance as useBalance } from '@/components/wallet/hooks'
```

### 9.4 `payment/result.tsx` — empty deps array bug

Le `useEffect` de `payment/result.tsx` a un tableau de dépendances vide (`// eslint-disable-next-line react-hooks/exhaustive-deps` ligne 86). Ce bug existe dans le code actuel. Le plan Step 13 devrait en profiter pour le corriger (dépendances manquantes: `transId`, `verifyPurchase`).

---

## 10. Risque global — ⚠️ Élevé

| Facteur | Impact |
|---------|--------|
| **Scope** | Refonte complète no-legacy d'un système financier. 54 fichiers impactés. |
| **Tests** | ❌ Zéro test dans le plan. C'est le plus gros risque. |
| **Scheduler** | ⚠️ 15 points de scheduling à auditer, mitigation "5 min drain" insuffisante |
| **Migration data** | ⚠️ Mapping des statuts imprécis, cas edge non traités |
| **Dépendances** | ⚠️ Step 14 avant Step 18 |
| **Complétude** | ⚠️ 7+ fichiers non inclus dans le plan |
| **Frontend** | ⚠️ Invalidations React Query non spécifiées |
| **Convex** | ✅ Conventions respectées |
| **Backup** | ✅ Mentionné pour Step 20 |

**Notes positives:**
- Les corrections Convex (action vs mutation) sont excellentes
- Le widen→migrate→narrow pattern est correct
- Les vérifications d'intégrité post-migration (Steps 17, 23) sont exhaustives
- Le plan est bien structuré avec graphe de dépendances

**Évaluation globale:** Le plan est 75% complet. Il nécessite des corrections sur les tests, l'ordre des steps, et la complétude avant validation.

---

## Checklist des corrections demandées

| # | Correction | Criticité |
|---|-----------|-----------|
| 1 | Ajouter des steps de **tests** pour wallet, payment_intents, escrows | 🔴 Bloquant |
| 2 | Déplacer **Step 14 après Step 18** ou éclater en 14a/14b | 🔴 Bloquant |
| 3 | Ajouter `convex/auth.ts` (balanceUsd init) à Step 20 | 🟡 Important |
| 4 | Ajouter `convex/users.ts` (getUserBalance) à la migration | 🟡 Important |
| 5 | Ajouter `src/components/my-space/country-list.tsx` et `index.ts` à Step 2 | 🟡 Important |
| 6 | Ajouter `convex/margins.ts` découplage de comptabilite.ts | 🟡 Important |
| 7 | Corriger `ctx.db.runMutation(...)` → `ctx.runMutation(...)` Step 5 ligne 313 | 🟡 Important |
| 8 | Ajouter les invalidations React Query dans la spec Step 9 | 🟡 Important |
| 9 | Renforcer la mitigation scheduler: drain préalable + audit des 15 runAfter | 🟡 Important |
| 10 | Ajouter le bridge barrel `src/components/purchases/hooks/index.ts` | 🟡 Important |
| 11 | Corriger "17 steps" → "23 steps" dans l'en-tête | 🟢 Mineur |
| 12 | Corriger référence Step 19 → Step 18 dans dépendance Step 14 | 🟢 Mineur |
| 13 | Ajouter capture d'écran/checklist des 15 scheduler.runAfter | 🟢 Mineur |
| 14 | Fixer le empty deps array dans `payment/result.tsx` | 🟢 Mineur |
| 15 | Ajouter discussion optimistic updates dans Step 9 | 🟢 Mineur |

---

## Conclusion

Le plan a une base architecturale solide et démontre une bonne compréhension des contraintes Convex. Les corrections action/mutation sont appliquées correctement. Cependant, **l'absence totale de tests** et **l'erreur d'ordonnancement Step 14 ↔ Step 18** sont des problèmes bloquants.

**Recommandation:** Valider le plan APRÈS corrections des 2 problèmes bloquants (#1 et #2) et des points importants (#3-#9).

---

*Rapport généré par Reviewer Agent 2 — Phase 6 du workflow TEMPLATE.md.*
*Prochaine étape : Phase 7 — Validation utilisateur.*
