# Phase 4 — Analyse Profonde

**Issue:** ISSUE-013-payment-wallet-escrow-refonte
**Date:** 2026-06-08
**Agent:** deep-analysis

---

## 1. Root Cause des 12 Défauts Structurels

### Défaut 1 — Double source de vérité du solde

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `users.balanceUsd` (champ redondant dans `auth.ts`) ET `comptes(411-{userId}).solde` (table `comptes` dans `comptabilite.ts`) stockent le même concept. `getUserBalance()` dans `users.ts` lit `comptes.solde`, tandis que `auth.ts` initialise `balanceUsd: 0` en création. Les deux divergent si un seul est mis à jour. |
| **Root cause** | Architecture monolythique sans séparation des domaines. Le modèle `users` a été étendu avec un champ financier (`balanceUsd`) au lieu de créer une table wallet dédiée. La table `comptes` a ensuite été ajoutée comme solution comptable sans supprimer le champ legacy. |
| **Pourquoi arrive** | Manque de discipline architecturale : 3 développeurs différents ont touché ce code sans coordonner la source de vérité. Aucune règle AGENTS.md n'interdisait le doublon à l'époque. |
| **Impact** | Le frontend (`useBalance`) reçoit une valeur qui peut être obsolète si un webhook met à jour `comptes.solde` sans patcher `users.balanceUsd`. L'admin voit `comptes.solde` mais le profil utilisateur affiche `users.balanceUsd`. |

### Défaut 2 — Escrow non idempotent

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `refundEscrow` dans `sms_provider.ts` cherche par `reference=activationId` et prend `.first()`. Si appelé deux fois, le second appel trouve le même escrow (déjà refunded) et tente de recréditer le wallet. `completeActivationAccounting` cherche aussi par `reference` sans vérifier l'état. |
| **Root cause** | L'escrow n'est pas une entité de premier ordre. C'est un sous-produit comptable : des écritures inversées dans `pieces/lignes` avec code `471-escrow`. Il n'y a pas de document `escrow` avec état et transitions, donc pas de guard atomique "déjà traité". |
| **Pourquoi arrive** | `sms_provider.ts` (1231 lignes) a été écrit en ajoutant l'escrow comme une réflexion tardive au flux d'activation. L'auteur a réutilisé la comptabilité existante sans ajouter de table dédiée. |
| **Impact** | Double refund = perte financière. Double capture = facturation excessive. Les deux sont possibles simultanément si webhook provider + scheduler de polling s'exécutent en parallèle. |

### Défaut 3 — Pas d'atomicité dans les opérations comptables

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `createPiece` dans `comptabilite.ts` appelle `creditCompte` et `debitCompte` en boucle `for...of`. Chaque appel est une mutation Convex séparée. Si la 3e ligne échoue, les 2 premières sont commitées. |
| **Root cause** | Violation du principe ACID. Une pièce comptable avec N lignes devrait être une transaction atomique. Le code a été écrit sans comprendre que Convex isole chaque mutation individuellement, pas les itérations. |
| **Pourquoi arrive** | Le développeur a importé le paradigme SQL (BEGIN/COMMIT autour d'un lot d'écritures) sans réaliser qu'une mutation Convex = une transaction. Chaque `creditCompte` et `debitCompte` est un appel de fonction isolé. |
| **Impact** | Incohérence comptable : un débit wallet peut être enregistré sans le crédit escrow correspondant. Les soldes des comptes 411 et 471 divergent irrémédiablement. Aucun mécanisme de détection ou de réparation n'existe. |

### Défaut 4 — Montants en `number` flottants

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `priceXaf`, `solde`, `montant` sont stockés comme `number` en XAF puis convertis en USD via `XAF_RATE = 600` dans `purchases.ts`, `users.ts`, `step-topup.tsx`, `my-space/constants.ts`. |
| **Root cause** | JavaScript `number` = IEEE 754 double précision. `0.1 + 0.2 !== 0.3` s'applique. Une conversion XAF/USD avec taux non entier (1/600 ≈ 0.001666...) crée des arrondis imprévisibles. |
| **Pourquoi arrive** | Aucune directive de projet n'imposait les cents entiers. Le développeur a utilisé le type le plus simple (`number`) sans considérer les implications financières. |
| **Impact** | À grande échelle, des centimes d'écart par transaction aboutissent à des écarts comptables non explicables. L'admin ne peut pas auditer proprement. |

### Défaut 5 — Statuts en strings libres

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `purchases.status` peut être `'PENDING'`, `'SUCCESSFUL'`, `'FAILED'`, `'EXPIRED'`, `'pending'`, `'confirmed'` — pas de validation. `lignes.sens` peut être `'credit'`, `'debit'`, `'crédit'` (accent). `activations.status` est mieux typé (union). |
| **Root cause** | Schéma Convex sans `v.union()`. Les champs status sont typés `v.string()`, autorisant n'importe quelle chaîne. Aucune validation métier dans les mutations qui modifient ces statuts. |
| **Pourquoi arrive** | Le schéma a été écrit avant que le projet n'adopte les unions typées (pattern `activations.status` est arrivé plus tard). Les anciennes tables n'ont pas été mises à jour. |
| **Impact** | Impossible de garantir l'intégrité des transitions d'état. Un bug dans une mutation peut créer un statut `'confirmed '` (espace finale) qui ne sera jamais reconnu par les queries. L'admin voit des statuts bizarres sans comprendre pourquoi. |

### Défaut 6 — Idempotence absente sur le webhook Fapshi

| Aspect | Détail |
|--------|--------|
| **Symptôme** | Le webhook HTTP (`convex/http.ts`) appelle `handlePaymentSuccess` directement. Pas de vérification "ce payment_intent a-t-il déjà été traité ?". `externalId` est lu mais pas utilisé pour vérifier le statut. |
| **Root cause** | L'idempotencyKey existe dans le schéma `purchases` (L65 du schema) mais n'est pas exploitée comme guard. Aucune table `idempotencyKeys` dédiée. Aucun index unique. |
| **Pourquoi arrive** | L'idempotence a été ajoutée comme champ passif ("utile plus tard") sans implémenter la logique de vérification. Le développeur a supposé que Fapshi n'envoie qu'un seul webhook. |
| **Impact** | Recharge double si Fapshi retransmet le webhook (infrastructure), ou si le callback utilisateur arrive pendant que le webhook est traité. Double crédit du wallet = perte financière. |

### Défaut 7 — Race condition webhook + callback utilisateur

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `verifyPurchase` (callback utilisateur) et `handlePaymentSuccess` (webhook) peuvent tous deux confirmer la même purchase. Aucun mutex, aucune vérification atomique "si déjà confirmé, skip". |
| **Root cause** | Deux entrées différentes (callback ET webhook) mènent à la même logique de confirmation sans point de passage unique. Le pattern devrait être "webhook = source de vérité, callback = vérification passive". |
| **Pourquoi arrive** | Le callback utilisateur a été ajouté parce que Fapshi promet des webhooks fiables mais en pratique ils peuvent être retardés. Pour ne pas bloquer l'utilisateur, le callback confirme aussi le paiement. |
| **Impact** | Double écriture comptable. L'utilisateur voit son wallet crédité deux fois. La correction nécessite une écriture de contrepassation manuelle. |

### Défaut 8 — Pas de pagination sur les lectures comptables

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `getMyMouvements` et `getMouvements` utilisent `ctx.db.query('lignes').collect()` sans `.take()`. `getAdminComptes` fait un `.collect()` sur tous les comptes. |
| **Root cause** | Aucune considération des limites Convex (32000 docs scannés par transaction). Le code assume que le nombre de lignes comptables reste petit. |
| **Pourquoi arrive** | Convex scale verticalement et les tests avec peu de données passent. Le problème n'apparaît qu'en production avec des utilisateurs actifs depuis des mois. |
| **Impact** | `Error: Over 32000 documents scanned` à partir d'un certain volume. Fonctionnement intermittent selon l'utilisateur. Impossible pour un admin de consulter les comptes d'un utilisateur avec beaucoup d'opérations. |

### Défaut 9 — Taux XAF/USD dupliqué et hardcodé

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `XAF_RATE = 600` dans `purchases.ts` (3 occurrences), `users.ts`, `step-topup.tsx`, `my-space/constants.ts`. La constante est dupliquée en frontend ET backend. |
| **Root cause** | Extraction en constante sans point d'accès centralisé. Chaque module qui a eu besoin du taux a défini sa propre constante plutôt que d'importer depuis un fichier partagé. |
| **Pourquoi arrive** | Les fichiers frontend et backend Convex ne partagent pas le même contexte. Importer depuis `convex/` vers `src/` n'est pas naturel. Les développeurs ont préféré dupliquer. |
| **Impact** | Modifier le taux nécessite 6 changements dans 4 fichiers. Le risque d'en oublier un est élevé. Si le taux CFA change (arrimé à l'EUR mais réévaluable), le système produit des montants incohérents. |

### Défaut 10 — Pas de ligne d'audit pour les appels provider

| Aspect | Détail |
|--------|--------|
| **Symptôme** | Les appels à Fapshi (`fapshiPost`, `fapshiGet`) et SMS Online Pro sont faits sans stockage de la requête/réponse. En cas de litige, aucune trace exploitable. |
| **Root cause** | Aucune table `provider_operations` pour journaliser les échanges. La seule trace est celle du provider, hors de notre contrôle. |
| **Pourquoi arrive** | Le code a été écrit comme un prototype et n'a jamais eu d'audit traçable. Les logs Convex ne conservent pas les payloads HTTP sortants. |
| **Impact** | Impossible de diagnostiquer pourquoi un paiement a échoué (erreur Fapshi vs erreur réseau). Impossible de prouver qu'un appel a été fait en cas de litige client. |

### Défaut 11 — Admin sans typage et unités ambiguës

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `admin-accounting.tsx` affiche `comptes.solde` sans unité (XAF ? USD ?). Les montants dans `admin-purchases.tsx` mélangent `priceXaf` et montants convertis. Les statuts sont affichés bruts. |
| **Root cause** | Les composants admin étaient destinés à un usage interne rapide. Pas de design système, pas de types partagés. L'affichage reflète directement la structure DB. |
| **Pourquoi arrive** | L'admin a été construit itérativement sans spécifications. Chaque nouveau besoin a ajouté une colonne ou une ligne sans réfléchir à la cohérence globale. |
| **Impact** | L'admin ne peut pas prendre de décisions financières fiables. Le risque d'erreur humaine est élevé (confusion XAF/USD, lecture de statut erroné). |

### Défaut 12 — Packages legacy (modèle `recharge` en dur)

| Aspect | Détail |
|--------|--------|
| **Symptôme** | `packages.ts` existe avec CRUD complet mais `purchases.packageId` vaut systématiquement `'recharge'`. Pas de vrai package utilisé. La table contient 1 document. |
| **Root cause** | Le modèle packages a été créé en prévision d'une tarification par package qui n'a jamais été implémentée. Le CRUD existe mais l'usage réel est un string en dur. |
| **Pourquoi arrive** | Surcharge spéculative : fonctionnalité prévue mais jamais livrée. Le code mort n'a pas été nettoyé. |
| **Impact** | Maintenance inutile. Confusion pour les nouveaux développeurs qui croient que les packages sont utilisés. |

---

## 2. Causes Secondaires

### 2.1 Design patterns absents

| Pattern manquant | Où | Conséquence |
|---|---|---|
| **State Machine** | `purchases.status`, `pieces` | Statuts strings libres, transitions non protégées |
| **Idempotent Consumer** | Webhook, callback, refund | Doublons de traitement |
| **Transactional Outbox** | Appels provider | Pas d'audit, pas de rejeu |
| **Gateway/Strategy** | Providers paiement | Couplage à Fapshi |
| **Immutable Ledger** | Wallet entries | UPDATE et DELETE possibles (pas de contrepassation) |
| **Repository/DAO** | Accès comptes | N+1 queries, pas de pagination |
| **CQRS** | Lectures admin | Subscriptions réactives lourdes |

### 2.2 Conventions non suivies

| Convention AGENTS.md | Violation |
|---|---|
| Max 200 lignes | `purchase-panel.tsx` (357), `step-topup.tsx` (234) |
| Feature folder pattern | `wallet` n'a ni `docs/` ni `hooks/` |
| Hooks vs inline | `purchase-panel.tsx` mélange UI et logique métier |
| Types Convex | `any` dans les handlers comptables |
| Auth serveur | `initiateDirectPay` passe `userId` en argument (action sans auth) |

### 2.3 Décisions de conception discutables

1. **Faire confiance au statut dans l'URL** : `payment/result.tsx` lit `status` depuis les query params de l'URL et le passe à `verifyPurchase`. Un utilisateur ou un attaquant peut falsifier `/?status=SUCCESSFUL&transId=...` pour tenter de confirmer un paiement qui n'existe pas. La protection est que `verifyPurchase` appelle le statut Fapshi, mais c'est un appel externe coûteux inutile si le statut est trivialement faux.
2. **Packages dans le schema** : Table `packages` avec CRUD complet pour un usage vide (`'recharge'` hardcodé). Coût de maintenance pour zéro bénéfice.
3. **Promo `usedCount` en écriture** : La mutation incrémente `promoCodes.usedCount` directement. C'est un hot document si le code promo est populaire.
4. **Polling côté client** : `sms_provider.ts` utilise `scheduler.runAfter` pour le polling activation. C'est correct, mais le même pattern n'est pas appliqué aux paiements Fapshi (où c'est le client qui rappelle après redirection).

### 2.4 Manque de séparation des responsabilités

- `sms_provider.ts` (1231 lignes) gère : les appels API SMS, le cycle d'activation, l'escrow, le refund, la capture, le polling. C'est 4 responsabilités dans un fichier.
- `purchases.ts` (507 lignes) gère : la création de paiement, la vérification, la confirmation, la compta et le webhook.
- `comptabilite.ts` (251 lignes) gère : le wallet, l'escrow, la comptabilité fournisseur, les marges.

---

## 3. Edge Cases pour Chaque Flux Critique

### Edge Case 1 — Double webhook Fapshi (même événement reçu 2x)

| Aspect | Détail |
|--------|--------|
| **Scénario** | Fapshi envoie le webhook `SUCCESSFUL` pour un paiement. Le serveur traite et crédite le wallet. 2 secondes plus tard, Fapshi renvoie exactement le même webhook (retry infrastructure, proxy bug). |
| **Impact actuel** | Double crédit. `handlePaymentSuccess` est appelé deux fois, crée deux écritures `piece(701-recharge)` et deux crédits du compte `411-user`. |
| **Impact futur (si idempotent)** | Aucun. La vérification atomique `by_idempotencyKey` dans `confirmPaymentIntent` renvoie le document existant sans traitement. |
| **Mitigation** | Idempotency key sur `payment_intents` utilisant `transId` Fapshi comme clé. Vérification `status !== 'succeeded'` avant de procéder. Guard atomique dans la mutation : si `status` est déjà `succeeded`, return early. |
| **Difficulté** | Simple. Une mutation idempotente `confirmPaymentIntent` protège tous les points d'entrée. |

### Edge Case 2 — Webhook + callback utilisateur simultanés

| Aspect | Détail |
|--------|--------|
| **Scénario** | L'utilisateur paie via Fapshi puis est redirigé vers `/payment/result?transId=...&status=SUCCESSFUL`. Simultanément, Fapshi envoie le webhook. Les deux arrivent au backend à quelques millisecondes d'intervalle. |
| **Impact actuel** | Double traitement. Les deux appels passent la vérification `purchase.status === 'PENDING'` (tous deux lisent 'PENDING' avant que l'autre n'écrive 'SUCCESSFUL'). |
| **Impact futur** | Aucun, grâce à l'atomicité de la mutation Convex. `confirmPaymentIntent` vérifie atomiquement : `read status → if 'succeeded' return → else process`. La première mutation passe et set `succeeded`. La seconde lit `succeeded` et skip. |
| **Mitigation** | Faire de `confirmPaymentIntent` une `internalMutation` unique qui contient check + write dans la même transaction. Tous les points d'entrée (webhook, callback) appellent cette même fonction. |
| **Difficulté** | Moyenne. Le défi est de réconcilier les deux entrées (l'une a le statut Fapshi vérifié, l'autre lit le webhook). Solution : le callback appelle `verifyPaymentIntent` qui vérifie via Fapshi API, puis appelle la même `confirmPaymentIntent` atomique. Si le webhook a déjà traité, la mutation atomique skip. |

### Edge Case 3 — Activation annulée pendant que le webhook arrive

| Aspect | Détail |
|--------|--------|
| **Scénario** | L'utilisateur clique "Annuler l'activation". Le frontend appelle `cancelActivation` qui fait `setStatus(8)` sur SMS Online Pro et appelle `refundEscrow`. Au même moment, le dernier SMS arrive et le polling déclenche `completeActivation` avec `releaseEscrow`. |
| **Impact actuel** | Race condition entre `refundEscrow` et `releaseEscrow`. Tous deux cherchent par `reference=activationId` et prennent `.first()`. Si `releaseEscrow` passe en premier, l'escrow est capturé. Puis `refundEscrow` arrive et trouve... le même escrow (capturé mais pas vérifié) et recrédite le wallet. |
| **Impact futur** | Protégé par la machine à états de l'escrow. `releaseEscrow` vérifie `escrow.status === 'held'`, le passe à `released`. `refundEscrow` vérifie `escrow.status === 'held'`, le passe à `refunded`. Le second appel (quel qu'il soit) trouve `escrow.status !== 'held'` et throw. |
| **Mitigation** | État d'escrow avec guard atomique : `status: 'held' | 'released' | 'refunded'`. Transition vérifiée dans la mutation. Une fois que l'escrow n'est plus `held`, ni release ni refund ne peuvent s'exécuter. |
| **Difficulté** | Haute. Il faut aussi gérer le cas où `setStatus(8)` a déjà été appelé mais `releaseEscrow` arrive quand même. La protection est uniquement côté Convex — l'appel API externes n'est pas rollbackable. Mais le guard dans `releaseEscrow` empêchera le débit wallet. |

### Edge Case 4 — Migration avec activations en cours

| Aspect | Détail |
|--------|--------|
| **Scénario** | Pendant la migration des données legacy vers les nouvelles tables, des utilisateurs ont des activations en cours (status `awaiting_number`, `awaiting_sms`, `sms_received`) avec des escrows implicites dans `pieces/lignes`. |
| **Impact** | Si la migration échoue ou est incomplète, `completeActivation` (qui cherche l'escrow dans les nouvelles tables `escrows`) ne trouve rien et throw. L'utilisateur perd son activation. |
| **Mitigation** | 1. Migrer les escrows actifs EN PREMIER (avant la bascule des flux). 2. Pour chaque activation active, lire le montant dans `pieces/lignes` et créer un `escrows(status: 'held')`. 3. Tester avec une activation en cours que `completeActivation` trouve l'escrow. 4. Pendant la phase de dual write, les nouvelles mutations `refundEscrow`/`releaseEscrow` écrivent aussi l'ancien système. |
| **Difficulté** | Haute. Nécessite une migration parallèle et une phase de dual write où les deux systèmes sont cohérents. |

### Edge Case 5 — Race condition entre refund et capture d'un même escrow

| Aspect | Détail |
|--------|--------|
| **Scénario** | L'activation expire côté provider. Le scheduler `pollActivation` détecte l'expiration et appelle `cancelActivation` (qui refund). Simultanément, un dernier SMS arrive et `pollActivation` appelle `completeActivation` (qui capture). |
| **Impact** | L'escrow peut être capturé ET refunded si les deux mutations lisent `'held'` avant que l'autre n'écrive. |
| **Impact futur** | Protégé par l'atomicité de la mutation. `releaseEscrow` vérifie atomiquement `status === 'held'` puis patch `status = 'released'`. `refundEscrow` fait de même avec `'refunded'`. L'isolation de mutation Convex garantit qu'un seul passera. |
| **Mitigation** | Une seule mutation atomique par transition. Verrouillage optimiste (OCC) : si la mutation échoue à cause d'un conflit, Convex retry. La seconde lecture trouvera `status !== 'held'` et throw. |
| **Difficulté** | Faible si la machine à états est bien implémentée. Le risque est que la mutation throw une erreur non gérée que le scheduler ne catch pas. |

### Edge Case 6 — Solde insuffisant au moment de l'escrow mais suffisant au moment de la capture

| Aspect | Détail |
|--------|--------|
| **Scénario** | L'utilisateur a 10€ au moment de l'activation. L'escrow bloque 5€. Il reste 5€. Puis l'utilisateur dépense ses 5€ restants (autre activation). Au moment de la capture, le wallet a 5€... mais l'escrow est de 5€. Le wallet total est 5€ (déjà utilisé) + 5€ (bloqué) = 10€ de valeur totale. |
| **Impact** | Pas d'impact. L'escrow a déjà bloqué les fonds lors de la création. La capture ne fait que déplacer l'argent du statut "bloqué" vers "dépensé". Le solde disponible (non bloqué) était déjà ajusté à la création. |
| **Mitigation** | Rien. L'escrow est correct par conception. Le wallet doit gérer deux compteurs : `balanceCents` (total déposé) et `availableBalanceCents` (total déposé - escrows actifs). La capture ne fait que transférer entre ces deux. |
| **Difficulté** | Simple si les deux compteurs existent. Complexe si on n'a qu'un seul `balanceCents`. |

### Edge Case 7 — Taux XAF/USD qui change entre création et confirmation du payment intent

| Aspect | Détail |
|--------|--------|
| **Scénario** | L'utilisateur initie une recharge de 60000 XAF (100 USD au taux 600). Il est redirigé vers Fapshi. Avant qu'il ne paie, le taux passe à 650 (par décision admin). Le webhook arrive et la conversion utilise le nouveau taux. |
| **Impact** | Si le taux utilisé à la confirmation est différent du taux à l'initiation, le montant crédité au wallet ne correspond pas au montant attendu par l'utilisateur. |
| **Mitigation** | Le montant en USD est fixé à la création du `payment_intent`. Le taux est un snapshot (capturé dans `payment_intent.metadata.xafRate`). La conversion est faite une fois à la création, pas à la confirmation. Fapshi travaille en XAF (le montant envoyé à Fapshi est en XAF). La confirmation lit `payment_intent.amountCents` et crédite ce montant, sans reconversion. |
| **Difficulté** | Faible. C'est une question de design : fixer le montant USD à la création, pas à la confirmation. |

### Edge Case 8 — Connexion perdue après débit wallet mais avant confirmation provider

| Aspect | Détail |
|--------|--------|
| **Scénario** | `holdEscrow` débite le wallet (écrit une `wallet_ledger_entry`) et crée l'escrow. Mais avant que `initiateActivation` ait appelé l'API SMS Online Pro, le client perd la connexion. L'utilisateur voit son solde réduit mais aucune activation créée. |
| **Impact** | Fonds bloqués sans service rendu. Aucune activation pour réclamer le refund. |
| **Mitigation** | Pattern Outbox : 1. Créer l'escrow avec `status='pending'` (pas 'held'). 2. Appeler le provider. 3. Si succès, passer l'escrow à `'held'`. Si échec, rembourser (rollback). L'utilisateur voit une transaction "pending" dans le ledger. Un scheduler nettoie les escrows `pending` de plus de 5 minutes. |
| **Difficulté** | Haute. Change l'ordre des opérations. Actuellement `holdEscrow` fait tout dans la même mutation. Il faut séparer "réservation" et "confirmation". |

### Edge Case 9 — Deux recharges simultanées du même utilisateur

| Aspect | Détail |
|--------|--------|
| **Scénario** | L'utilisateur ouvre deux onglets et initie deux recharges de 10€ chacune. Les deux créent un `payment_intent`. L'utilisateur paie les deux via Fapshi. Les deux webhooks arrivent presque simultanément. |
| **Impact** | Chaque `payment_intent` a sa propre `idempotencyKey`. Il n'y a pas de conflit direct. Les deux confirmations fonctionnent et créditent le wallet deux fois de 10€. C'est correct. |
| **Edge** | Si l'utilisateur n'a pas assez d'argent sur son compte bancaire pour les deux recharges, Fapshi peut rejeter la seconde. Le wallet ne doit pas être crédité pour la seconde. Fapshi gère ce cas (transaction FAILED). Le webhook échoue, le payment_intent passe à `failed`, pas de crédit. |
| **Mitigation** | Rien. Le flux est correct si chaque payment_intent est indépendant et idempotent. |
| **Difficulté** | Aucune. |

### Edge Case 10 — Admin qui supprime un utilisateur avec wallet non nul

| Aspect | Détail |
|--------|--------|
| **Scénario** | L'admin supprime un utilisateur qui a 50€ sur son wallet. La suppression utilise `ctx.db.delete(userId)` mais ne touche pas au wallet. |
| **Impact** | Orphelin financier : un wallet sans propriétaire. Les 50€ sont perdus dans le système sans possibilité de remboursement. |
| **Mitigation** | 1. Interdire la suppression d'utilisateur avec `wallet.balanceCents > 0` ou `escrows.status === 'held'`. 2. Forcer un remboursement avant suppression. 3. Si suppression forcée, créer une entry ledger "write-off" avec référence admin. |
| **Difficulté** | Faible. Guard dans la mutation de suppression. |

### Edge Case 11 — Paiement initié, utilisateur ferme le navigateur

| Aspect | Détail |
|--------|--------|
| **Scénario** | L'utilisateur clique "Recharger" puis ferme le navigateur avant d'être redirigé vers Fapshi. Le `payment_intent` a été créé (status `pending`), l'idempotencyKey générée. |
| **Impact** | Payment_intent orphelin. Reste `pending` indéfiniment. |
| **Mitigation** | Scheduler `expireOrphanedPaymentIntents` : toutes les 5 minutes, `query('paymentIntents').withIndex('by_status', q => q.eq('status', 'pending')).filter(p => p.createdAt < Date.now() - 30min)`. Les passer à `expired`. Bonus : appeler l'API Fapshi `expirePay` pour annuler aussi côté provider. |
| **Difficulté** | Faible. Pattern existant dans `sms_provider.ts` (scheduler). |

### Edge Case 12 — Provider SMS accepte l'activation mais le wallet est insuffisant

| Aspect | Détail |
|--------|--------|
| **Scénario** | Race condition : `initiateActivation` vérifie `wallet.availableBalance >= maxPrice`, crée l'escrow. Mais entre la vérification et la création, une autre mutation (recharge credit) arrive aussi sur le même wallet. |
| **Impact** | Conflit OCC. Convex retry la mutation automatiquement. La seconde exécution vérifie à nouveau le solde — safe. |
| **Mitigation** | Rien. OCC de Convex gère. |
| **Difficulté** | Aucune. |

### Edge Case 13 — Refund alors que le provider SMS a déjà complété l'activation

| Aspect | Détail |
|--------|--------|
| **Scénario** | L'utilisateur réclame un refund après avoir reçu le SMS. `cancelActivation` appelle `setStatus(8)` sur SMS Online Pro qui refuse (activation déjà complétée). |
| **Impact** | Impossible d'annuler côté provider. Mais l'escrow peut être refundé côté Convex si on le décide (geste commercial). |
| **Mitigation** | Séparer l'annulation métier (escrow) de l'appel provider. Si `setStatus(8)` échoue, logguer l'erreur et continuer le refund si la politique l'autorise. L'activité reste tracée dans `provider_operations`. |
| **Difficulté** | Faible. C'est un choix métier. |

---

## 4. "No backward compat" — Tout ce qui doit être supprimé sans retour possible

### 4.1 Tables Convex (suppression complète)

| Table | Raison de la suppression | Risque |
|---|---|---|
| `comptes` | Remplacée par `wallets` + `escrows`. Le pattern compte comptable avec code string (`411-user`, `471-escrow`) est remplacé par des tables dédiées avec relations explicites. | Perte d'historique si les données ne sont pas migrées vers `wallet_ledger_entries`. |
| `pieces` | Remplacée par `wallet_ledger_entries`. Les pièces étaient un grouping artificiel (une recharge = 1 pièce = 2 lignes) qui n'existe plus. | Perte de la notion de "transaction groupée". Les nouvelles entries sont individuelles mais liées par `referenceId`. |
| `lignes` | Remplacée par `wallet_ledger_entries`. Même raison. Les lignes individuelles deviennent des entrées immuables sans UPDATE. | Aucun si la migration préserve la traçabilité. |
| `purchases` | Remplacée par `payment_intents` (flux Fapshi) + `orders` (historique). Le modèle purchase mélangeait trop de responsabilités. | Perte des recharges historiques si non migrées vers `orders`. |
| `packages` | Table morte. CRUD inutilisé. `purchase.packageId` vaut toujours `'recharge'`. | Aucun. |
| `users.balanceUsd` | Champ redondant avec `wallets.balanceCents`. Source de divergence. | Aucun si toutes les lectures sont migrées vers `api.wallets.getBalance`. |
| `users.hasMadeDeposit` | Champ non utilisé dans le frontend (aucune référence trouvée en phase 2). | Aucun, mais vérifier que le frontend n'en dépend pas dans une condition cachée. |

### 4.2 Modules Convex (suppression complète)

| Module | Remplacement | Risque |
|---|---|---|
| `convex/purchases.ts` (507 lignes) | `convex/payment_intents.ts` + `convex/orders.ts` | Les fonctions `initiateDirectPay`, `verifyPurchase`, `handlePaymentSuccess` n'existent plus. Tout le frontend qui les appelle doit migrer. |
| `convex/comptabilite.ts` (251 lignes) | `convex/wallet.ts` + `convex/ledger.ts` | `createPiece`, `creditCompte`, `debitCompte`, `getMyMouvements`, `getMouvements`, `getAdminComptes`, `getAdminPieces`, `backfillComptes` — tous supprimés. |
| `convex/packages.ts` (69 lignes) | Rien. Suppression pure. | Les query keys admin doivent retirer `adminKeys.packages`. |
| `convex/margins.ts` (64 lignes) | Conserver mais découpler de `comptabilite`. | Non supprimé — seulement les imports/usage de comptabilite.ts doivent être remplacés. |
| `convex/promo_codes.ts` (76 lignes) | Conserver. N'a pas besoin de suppression. Les codes promo référencent `payment_intents` au lieu de `purchases`. | Non supprimé. |

### 4.3 Fichiers frontend (suppression/modification lourde)

| Fichier | Action | Risque |
|---|---|---|
| `src/components/purchases/hooks/use-purchases.ts` | Supprimer ou réécrire complètement | Tous les consommateurs (6 composants) doivent migrer vers les nouveaux hooks wallet. |
| `src/components/purchases/hooks/use-activations.ts` | Conserver les fonctions activation, remplacer la logique escrow par les nouveaux hooks escrow | Les anciennes mutations `completeActivation` et `cancelActivation` doivent être réécrites pour appeler les nouveaux escrows. |
| `src/components/purchases/hooks/index.ts` | Réécrire (barrel export vers nouveaux hooks) | Tous les imports de ce fichier dans le codebase doivent être mis à jour. |
| `src/components/admin/hooks/use-admin-queries.ts` | Supprimer les hooks `useAdminComptes`, `useAdminPieces`, `useAdminPurchases` | Les vues admin qui les utilisent doivent migrer. |
| `src/components/recharge/step-topup.tsx` | Réécrire (<200 lignes) avec nouveau flux payment_intents | Doit utiliser `useCreatePaymentIntent` au lieu de `useInitiateDirectPay`. |
| `src/components/recharge/recharge-drawer.tsx` | Adapter au nouveau flux | Changement d'API. |
| `src/components/wallet/wallet-page-shell.tsx` | Adapter aux nouveaux hooks wallet/ledger | Changement des types de données (TransactionItem → WalletLedgerEntry). |
| `src/components/wallet/wallet-purchase-history.tsx` | Supprimer ou remplacer par `useOrders()` | Dépendait de `api.purchases.getPurchases`. |
| `src/components/my-space/purchase-panel.tsx` | Réécrire (<200 lignes) pour utiliser le nouveau flux escrow | Vérification solde via wallet, hold escrow, puis initiate activation. |
| `src/components/my-space/activation-detail.tsx` | Adapter pour utiliser les nouveaux hooks escrow | `completeActivation` et `cancelActivation` doivent référencer les nouvelles mutations. |
| `src/components/admin/accounting/admin-accounting.tsx` | Supprimer | Remplacé par `admin-wallets.tsx` + `admin-ledger.tsx` (nouveaux composants à créer). |
| `src/components/admin/purchases/admin-purchases.tsx` | Supprimer | Remplacé par `admin-payment-intents.tsx` + `admin-orders.tsx`. |
| `src/routes/payment/result.tsx` | Réécrire pour utiliser `verifyPaymentIntent` au lieu de `useVerifyPurchase` | Ne plus lire le statut depuis l'URL. |
| `src/components/recharge/payment-methods.ts` | Supprimer ou remplacer | Constantes hardcodées → API-driven. |

### 4.4 Éléments frontend supprimables sans remplacement

| Élément | Raison |
|---|---|
| `PendingPaymentBanner` | Retourne déjà `null`. Code mort. |
| `WalletPaymentMethods` | Mock hardcodé. Remplacé par API dynamique ou supprimé. |
| `WalletBalanceBreakdown` | Placeholder vide. |
| `TransactionRow` | Redondant avec `WalletTransactionItem`. |
| `XAF_RATE = 600` | Supprimer de tous les fichiers. Remplacer par appel API ou config backend. |

---

## 5. Impacts Downstream

### 5.1 Consommateurs frontend

| Hook legacy | Consommateurs | Nouveau hook |
|---|---|---|
| `useBalance()` | `WalletPageShell`, `PurchasePanel`, `Navigation`, `RechargeDrawer`, `StepTopup` | `useWalletBalance()` |
| `useMouvements()` | `WalletPageShell`, `WalletTransactionList` | `useWalletLedger()` |
| `usePurchases()` | `WalletPurchaseHistory` | `useOrders()` |
| `useInitiateDirectPay()` | `RechargeDrawer` | `useCreatePaymentIntent()` |
| `useVerifyPurchase()` | `PaymentResult` | `useVerifyPaymentIntent()` |
| `useCancelPurchase()` | `PaymentResult` | `useCancelPaymentIntent()` |
| `useAdminPurchases()` | `AdminPurchases` | `useAdminPaymentIntents()` |
| `useAdminComptes()` | `AdminAccounting` | `useAdminWallets()` |
| `useAdminPieces()` | `AdminAccounting` | `useAdminLedger()` |
| `useAdminActivations()` | `AdminActivations` | Conserver (inchangé) |

### 5.2 Tests

**Aucun test automatisé trouvé** dans tout le périmètre paiement/wallet/escrow. C'est le plus gros risque de la refonte.

Recommandations minimales :
1. **Migration tests** : tester chaque phase widen/migrate/narrow sur une copie de prod
2. **Mutation tests unitaires** : tester chaque mutation idempotente avec double appel
3. **Race condition tests** : tester webhook + callback simultanés (possible en Convex avec `ctx.scheduler.runAfter(0, ...)`)
4. **Integration test** : cycle complet recharge → wallet → escrow → capture/refund

### 5.3 Types Convex

Les types générés automatiquement par `npx convex codegen` vont changer :
- `Doc<'comptes'>` → `Doc<'wallets'>` + `Doc<'escrows'>`
- `Doc<'pieces'>` → `Doc<'wallet_ledger_entries'>`
- `Doc<'lignes'>` → supprimé
- `Doc<'purchases'>` → `Doc<'payment_intents'>` + `Doc<'orders'>`
- `Doc<'packages'>` → supprimé
- `Doc<'users'>` → `balanceUsd` et `hasMadeDeposit` supprimés

Toute référence à ces types dans les composants frontend ou hooks doit être mise à jour. Le compilateur TypeScript détectera la plupart des erreurs, mais les références indirectes (passées comme `any`, castées, ou dans des commentaires) peuvent passer inaperçues.

### 5.4 Query keys et invalidations

| Factory existante | Remplacée par |
|---|---|
| `purchaseKeys.all` | `walletKeys.all` |
| `purchaseKeys.balance()` | `walletKeys.balance()` |
| `purchaseKeys.mouvements()` | `walletKeys.transactions()` |
| `purchaseKeys.purchases()` | `walletKeys.orders()` |
| `activationKeys.all` | Conserver (étendu avec escrow keys) |
| `adminKeys.all` | Conserver (étendu avec wallet/ledger keys) |

Invalidations critiques :
- `createPaymentIntent` → `walletKeys.all`
- `confirmPaymentIntent` (webhook) → `walletKeys.balance()`, `walletKeys.transactions()`
- `holdEscrow` → `walletKeys.balance()`, `escrowKeys.all`
- `releaseEscrow`/`refundEscrow` → `walletKeys.balance()`, `walletKeys.transactions()`, `escrowKeys.all`

### 5.5 Scheduler Convex

Les `scheduler.runAfter` actuels dans `sms_provider.ts` pointent vers des mutations qui utilisent `comptabilite.ts`. Pendant la migration :
1. Phase widen : les jobs schedulés existants (qui appellent `refundEscrow`, `completeActivationAccounting` legacy) continuent de fonctionner sur les anciennes tables.
2. Phase migrate : après déploiement des nouvelles fonctions, les nouveaux jobs schedulés doivent pointer vers les nouvelles mutations.
3. Risque : les jobs déjà en file d'attente avant le déploiement appelleront l'ancien code. Solution : drainer les jobs existants avant le déploiement final (attendre TTL max des jobs = 5 minutes), ou rendre les anciennes mutations capables d'écrire aussi dans les nouvelles tables (dual write).

### 5.6 HTTP routes (webhook)

`convex/http.ts` expose `POST /fapshi-webhook`. Dans la refonte :
1. Phase widen : `/fapshi-webhook` reste actif mais écrit aussi dans `payment_intents` en dual write.
2. Phase narrow : déprécier `/fapshi-webhook`, créer `/payment/webhook` avec dispatch par gateway.
3. Le path `/payment/webhook` doit être configuré dans le dashboard Fapshi. Coordonner le changement pour éviter une fenêtre sans webhook.

### 5.7 Actions Convex

`initiateDirectPay` est une **action** (pas une mutation), ce qui est correct car elle appelle une API externe (Fapshi). Dans la refonte :
- `createPaymentIntent` doit être une action (appelle Fapshi `initiate-pay`)  
- MAIS la création du document `payment_intent` doit être faite dans une `internalMutation` appelée depuis l'action
- Pattern : `action` → `ctx.runMutation(internalCreatePaymentIntent, args)` → appelle Fapshi → `ctx.runMutation(internalConfirmProviderOperation, result)`

Contrainte : les actions Convex n'ont PAS accès à `ctx.auth.getUserIdentity()`.
- Solution 1 : l'action reçoit le `userId` vérifié depuis la mutation qui l'a schedulée
- Solution 2 : l'action appelle `ctx.runMutation` qui a l'identity (mais non, les actions n'ont pas l'identity non plus)
- Solution 3 (recommandée) : l'action reçoit un `token` JWT/Bearer et le vérifie côté serveur

**Recommandation** : Garder le pattern actuel où le frontend appelle directement l'action avec `userId` dérivé de l'auth frontend. Dans l'action, vérifier que le `userId` correspond à l'utilisateur courant via un `ctx.runQuery` qui utilise `ctx.auth.getUserIdentity()`... mais les actions n'ont pas non plus accès à `runQuery` avec auth. 

**Solution finale** : Créer une mutation `initiatePayment` qui : 1) crée le `payment_intent` (status `created`), 2) schedule une action `executePaymentProviderCall` avec l'ID du payment_intent. L'action n'a pas besoin d'auth — elle reçoit l'ID en paramètre et lit le document. C'est le pattern "Transactional Outbox" : la mutation crée le document (avec auth), l'action exécute l'appel externe (sans auth, mais ne fait que lire le document qu'elle a reçu en paramètre).

---

## 6. Régressions Possibles lors de la Migration

### 6.1 Régression : perte de la notion "48h" dans le solde utilisateur

| Détail |
|--------|
| Le code actuel (`convex/users.ts`) a un concept d'accès "48h" où `getUserBalance` utilise `48h_credits` pour certains calculs. Si ce concept est perdu lors de la migration vers `wallets`, les utilisateurs avec des accès temporaires peuvent voir leur solde incorrect. |
| **Mitigation** | Analyser l'utilisation de `48h_credits` dans le code legacy avant migration. Si pertinent, ajouter un champ `lockedUntil` ou un mécanisme similaire dans `wallet_ledger_entries`. |

### 6.2 Régression : webhook Fapshi livré sur l'ancien endpoint pendant la bascule

| Détail |
|--------|
| Pendant la bascule de `/fapshi-webhook` vers `/payment/webhook`, Fapshi peut encore envoyer des webhooks sur l'ancien endpoint. Si l'ancien endpoint est supprimé trop tôt, les paiements ne sont pas confirmés. |
| **Mitigation** | Garder les deux endpoints actifs pendant toute la phase de migration. L'ancien endpoint appelle le nouveau handler. Déprécier seulement après confirmation qu'aucun webhook n'arrive plus sur l'ancien path. |

### 6.3 Régression : jobs scheduler qui pointent vers d'anciennes mutations

| Détail |
|--------|
| `sms_provider.ts` schedule des jobs avec `scheduler.runAfter(5000, api.sms_provider.pollActivation, { activationId })`. Si `pollActivation` n'est pas mis à jour pour utiliser les nouvelles tables escrow, il échoue. |
| **Mitigation** | Mettre à jour `pollActivation` en premier (phase widen). Le faire écrire dans les DEUX systèmes. Puis basculer les jobs pour utiliser la nouvelle version. |

### 6.4 Régression : composants frontend qui lisent encore les anciens hooks

| Détail |
|--------|
| Si un composant frontend n'est pas mis à jour et continue d'appeler `useBalance()`, il recevra `undefined` après suppression de l'ancienne query. |
| **Mitigation** | Approche "feature flag" : les anciens hooks retournent une valeur par défaut ou redirigent vers les nouveaux hooks pendant la migration. Vérifier avec `grep -r "useBalance\|useMouvements\|usePurchases\|useInitiateDirectPay\|useVerifyPurchase"` pour trouver tous les consommateurs avant la suppression. |

### 6.5 Régression : données historiques mal migrées

| Détail |
|--------|
| Les migrations `@convex-dev/migrations` peuvent échouer pour certains documents (format inattendu, userId manquant, montant NaN). Un document non migré = donnée perdue. |
| **Mitigation** | Log détaillé de chaque document migré. Rapport de fin de migration avec nombre de succès/échecs. Validations : `sum(anciens soldes) === sum(nouveaux soldes)`. |

### 6.6 Régression : double comptage si migration et nouveau flux cohabitent

| Détail |
|--------|
| Pendant la phase de dual write, une recharge existante est traitée par l'ancien flux (crédite `comptes`) ET le nouveau flux (crédite `wallets`). L'utilisateur voit son solde doubler. |
| **Mitigation** | Le dual write ne doit PAS être activé pour les mutations financières. Le pattern correct est : 1) ancien flux traite normalement, 2) migration backfill lit les données existantes et les copie dans le nouveau système. Pas de double écriture active. Les nouvelles mutations écrivent uniquement dans les nouvelles tables. |

### 6.7 Régression : perte de l'ordre chronologique des transactions

| Détail |
|--------|
| Les `pieces` actuelles ont un `datePiece` et les `lignes` un `dateLigne`. Si la migration vers `wallet_ledger_entries` ne préserve pas l'ordre, l'historique affiché à l'utilisateur est dans le désordre. |
| **Mitigation** | Utiliser `createdAt` comme timestamp de migration. Pour les entrées historiques, préserver le timestamp original dans un champ `originalDate`. L'index `by_wallet` avec `order("desc")` sur `createdAt` donne l'ordre chronologique. |

### 6.8 Régression : admin perd l'accès aux données historiques

| Détail |
|--------|
| Si l'admin veut consulter les comptes d'il y a 6 mois après suppression des tables legacy, les données sont dans les nouvelles tables mais l'interface admin n'existe pas encore. |
| **Mitigation** | Créer les nouvelles vues admin AVANT la suppression des anciennes. Overlap : les deux vues coexistent, l'admin peut basculer. |

---

## 7. Stratégie de Migration Détaillée

### 7.1 Phase Widen (déploiement 1)

**Objectif** : Ajouter les nouvelles tables sans toucher aux anciennes. Le code existant continue de fonctionner.

| Étape | Fichiers | Action | Risque |
|---|---|---|---|
| 1.1 | `convex/schema.ts` | Ajouter `wallets`, `wallet_ledger_entries`, `payment_intents`, `escrows`, `orders`, `provider_operations` | Aucun (ajout seulement) |
| 1.2 | `convex/schema.ts` | Marquer `users.balanceUsd` comme `v.optional()` (deprecated) | Les lectures qui attendent un `number` doivent gérer `undefined` |
| 1.3 | `convex/wallet.ts` | Créer module : `getBalance`, `getLedger`, `creditWallet` (internalMutation), `debitWallet` (internalMutation) | Nouveau code inutilisé |
| 1.4 | `convex/payment_intents.ts` | Créer module : `create`, `confirm`, `verify`, `cancel`, `list`, `listAll` | Nouveau code inutilisé |
| 1.5 | `convex/escrows.ts` | Créer module : `hold`, `release`, `refund`, `getByActivation` (internalMutations) | Nouveau code inutilisé |
| 1.6 | `convex/orders.ts` | Créer module : `create`, `list`, `listAll` | Nouveau code inutilisé |
| 1.7 | `convex/provider_operations.ts` | Créer module : `log`, `getByReference` | Nouveau code inutilisé |
| 1.8 | `convex/http.ts` | Ajouter `POST /payment/webhook` (handler générique provisoire) | Doit coexister avec `/fapshi-webhook` |
| 1.9 | `convex/config.ts` (nouveau) | Table `exchange_rates` ou config pour le taux XAF/USD | Nouveau code inutilisé |
| 1.10 | `npx convex deploy` | Déploiement des nouvelles tables + modules | Aucun (safe) |

**Vérification widen** :
- [ ] Toutes les nouvelles tables existent avec leurs indexes
- [ ] Les anciennes tables sont intactes
- [ ] Le frontend continue de fonctionner (utilise encore les anciens hooks)
- [ ] `npx convex deploy` passe sans erreur
- [ ] Le webhook `/fapshi-webhook` fonctionne toujours

### 7.2 Phase Migrate (déploiement 2)

**Objectif** : Migrer les données actives des anciennes tables vers les nouvelles.

**Ordre des migrations** (critique : activations en cours en premier) :

#### Migration 2.1 : Escrows actifs (priorité haute)

| Aspect | Détail |
|---|---|
| **Source** | `comptes(471-{activationId})` dans `pieces/lignes` où l'activation correspondante a un statut actif. |
| **Cible** | `escrows` avec `status: 'held'` |
| **Risque** | Si cette migration échoue, les activations en cours ne peuvent pas être complétées/remboursées après la bascule. |
| **Algorithme** | Pour chaque activation active (`awaiting_number`, `awaiting_sms`, `sms_received`) : 1) Trouver l'escrow dans `pieces(471-{activationId})` 2) Lire le montant depuis `lignes` 3) Créer `escrows(userId, activationId, amountCents, status='held')` 4) Vérifier qu'il n'y a pas de doublon. |
| **Vérification** | `count(activations actives) === count(escrows(held))` |

#### Migration 2.2 : Wallets

| Aspect | Détail |
|---|---|
| **Source** | `comptes(411-{userId}).solde` pour chaque utilisateur |
| **Cible** | `wallets` avec `balanceCents = Math.round(solde * 100)` |
| **Risque** | Un utilisateur sans `compte(411)` n'a pas de wallet. Créer un wallet vide par défaut. |
| **Algorithme** | Pour chaque `id` unique extrait de `comptes.code` (pattern `411-{userId}`) : 1) Créer `wallets(userId, balanceCents, currency='USD')` 2) Si aucun compte 411, créer wallet avec `balanceCents: 0`. |
| **Vérification** | `sum(comptes(411-*).solde * 100) === sum(wallets.balanceCents)` |

#### Migration 2.3 : Wallet ledger entries (historique des transactions)

| Aspect | Détail |
|---|---|
| **Source** | `lignes` liées aux comptes `411-user` (historique des mouvements wallet) |
| **Cible** | `wallet_ledger_entries` |
| **Risque** | Volume potentiel. Pagination obligatoire. |
| **Algorithme** | Pour chaque `ligne` : 1) Déterminer le type (credit/debit → type enum) 2) Déterminer la référence (pieceId → payment_intent, activation, etc.) 3) Créer l'entry ledger 4) Calculer `balanceAfterCents` récursivement (ou depuis `soldeApres` du legacy). |
| **Vérification** | Le dernier `balanceAfterCents` de chaque wallet === `wallets.balanceCents` |

#### Migration 2.4 : Payment intents (purchases réussies)

| Aspect | Détail |
|---|---|
| **Source** | `purchases` avec `status === 'SUCCESSFUL'` ou `'confirmed'` |
| **Cible** | `payment_intents` avec `status: 'succeeded'` |
| **Risque** | Faible (données historiques). Le `transId` Fapshi est peut-être absent. |
| **Algorithme** | Pour chaque purchase réussie : 1) Créer `payment_intents(userId, amountCents=round(priceXaf/600), status='succeeded', idempotencyKey=transId)` 2) Créer `order(userId, type='recharge', paymentIntentId=..., amountCents=..., status='completed')`. |
| **Vérification** | `count(purchases réussies) === count(payment_intents(succeeded))` |

#### Migration 2.5 : Orders (historique des recharges)

| Aspect | Détail |
|---|---|
| **Source** | `purchases` (toutes, pas seulement réussies) |
| **Cible** | `orders` |
| **Risque** | Mapping des statuts : `PENDING → pending`, `SUCCESSFUL/confirmed → completed`, `FAILED/EXPIRED → cancelled`. |
| **Algorithme** | Map statut + créer `orders`. |
| **Vérification** | `count(purchases) === count(orders)` |

**Vérification globale migration** :
- [ ] `sum(wallets.balanceCents) + sum(escrows(held).amountCents) === sum(comptes(411).solde * 100)` (conservation valeur)
- [ ] Toute activation active a un escrow associé
- [ ] Aucun wallet orphelin (sans utilisateur correspondant)
- [ ] Aucune `wallet_ledger_entry` sans wallet parent

### 7.3 Phase Narrow (déploiement 3)

**Objectif** : Basculer les flux vers les nouvelles tables, supprimer les anciennes.

#### 7.3.1 Bascule backend

| Étape | Fichiers | Action | Risque |
|---|---|---|---|
| 3.1 | `convex/purchases.ts` | Réécrire les fonctions appelées par les actions webhook/callback pour utiliser `payment_intents` et `orders`. Ne plus toucher `comptes/pieces/lignes`. | Si un webhook Fapshi arrive sur l'ancien handler, il n'écrit plus dans les tables legacy. Mais les données legacy ont déjà été migrées, donc la cohérence est maintenue par migration (pas par dual write). |
| 3.2 | `convex/sms_provider.ts` | Remplacer les appels à `comptabilite.ts` par les nouvelles fonctions escrow. `completeActivationAccounting` → `releaseEscrow`. `refundEscrow` → `refundEscrow` (nouveau). | Les jobs schedulés existants pointent encore vers l'ancien code. Solution : drainer les jobs avant (attendre 5 min après déploiement). |
| 3.3 | `convex/activations.ts` (ou sms_provider.ts) | Mettre à jour `initiateActivation`, `completeActivation`, `cancelActivation` pour utiliser les nouvelles mutations wallet/escrow. | Risque de régression sur le flux SMS complet. Tester avec une activation réelle. |
| 3.4 | `convex/http.ts` | Supprimer `/fapshi-webhook`. Garder `/payment/webhook` comme seul endpoint. | Si Fapshi envoie encore sur l'ancien endpoint (cache DNS, proxy), les webhooks sont perdus. **Coordonner avec le changement de l'URL de webhook dans le dashboard Fapshi.** |
| 3.5 | `convex/webhook.ts` (nouveau) | Créer handler de webhook générique qui dispatche par `gateway`. |

#### 7.3.2 Bascule frontend

| Étape | Composants | Action | Risque |
|---|---|---|---|
| 3.6 | Hooks wallet | Créer `src/components/wallet/hooks/use-wallet.ts` avec `walletKeys` factory + hooks | Aucun (nouveau code). |
| 3.7 | Routes wallet | Mettre à jour `wallet.tsx` et composants wallet pour utiliser les nouveaux hooks | L'UI wallet change pendant que l'utilisateur l'utilise. Coordonner avec déploiement backend. |
| 3.8 | Route recharge | Réécrire `recharge-drawer.tsx`, `step-topup.tsx`, `step-method.tsx` pour utiliser `useCreatePaymentIntent` | L'utilisateur ne peut pas recharger pendant la fenêtre de déploiement. |
| 3.9 | Route my-space | Réécrire `purchase-panel.tsx` et `activation-detail.tsx` pour utiliser les nouveaux hooks escrow | Les activations en cours doivent continuer à fonctionner. |
| 3.10 | Admin | Créer nouveaux composants admin (wallets, ledger, payment_intents, orders). Supprimer l'ancien accounting. | L'admin perd temporairement l'accès aux données historiques si les nouvelles vues ne sont pas prêtes. |

#### 7.3.3 Suppression définitive

| Étape | Fichiers | Action |
|---|---|---|
| 3.11 | `convex/schema.ts` | Supprimer `comptes`, `pieces`, `lignes`, `purchases`, `packages` du schéma |
| 3.12 | `convex/schema.ts` | Supprimer `users.balanceUsd`, `users.hasMadeDeposit` |
| 3.13 | `convex/comptabilite.ts` | Supprimer le fichier |
| 3.14 | `convex/purchases.ts` | Supprimer le fichier |
| 3.15 | `convex/packages.ts` | Supprimer le fichier |
| 3.16 | Hooks frontend | Supprimer `use-purchases.ts`, `use-purchases-deprecated.ts`, etc. |
| 3.17 | Composants admin | Supprimer `admin-accounting.tsx`, `admin-purchases.tsx` |
| 3.18 | `npx convex deploy --type=forceWithSchemaChanges` | Déploiement final avec suppression des tables |

**Vérification narrow** :
- [ ] Aucune référence à `comptes`, `pieces`, `lignes`, `purchases`, `packages` dans le code
- [ ] Tous les composants frontend utilisent les nouveaux hooks
- [ ] Le webhook Fapshi arrive sur le nouveau endpoint
- [ ] Les activations en cours peuvent être complétées/remboursées
- [ ] L'admin voit les nouvelles interfaces

### 7.4 Post-migration : vérifications d'intégrité

| Vérification | Query | Action si échec |
|---|---|---|
| Conservation valeur | `sum(wallets.balanceCents) + sum(escrows(held).amountCents) === sum(comptes(411).solde * 100)` | Alerter, ne pas supprimer les tables legacy |
| Double idempotencyKey | `wallet_ledger_entries` group by `idempotencyKey` having count > 1 | Corriger les doublons |
| Escrow orphelin | `escrows(held)` left join `activations` where activation null | Refund automatique |
| Wallet orphelin | `wallets` left join `users` where user null | Créer audit log |
| Balance négative | `wallets` where `balanceCents < 0` | Alerter admin |
| Total deposits vs total spends | `sum(payment_intents.succeeded.amountCents) - sum(escrows(captured).amountCents) - sum(wallets.balanceCents) - sum(escrows(held).amountCents) === 0` | Écart = bug |

### 7.5 Risques de la stratégie

| Risque | Probabilité | Impact | Mitigation |
|---|---|---|---|
| Échec de migration d'un escrow actif | Moyenne | Critique | Tester migration sur staging avec données de prod. Migration en dry-run d'abord. |
| Perte d'un webhook pendant la bascule | Faible | Élevé | Garder les deux endpoints HTTP actifs pendant 24h. Logger tout webhook reçu. |
| Incohérence wallet pendant le narrow | Faible | Critique | Arrêt du service si détecté. Rollback immédiat vers phase widen. Prévoir script de rollback. |
| Oubli de migration d'un type de `piece` | Faible | Moyen | Log chaque document migré. Revue manuelle des types de `comptes.code` avant migration. |
| Régression sur le calcul des marges | Faible | Élevé | Tester `releaseEscrow` avec calcul de marge avant bascule. Comparer avec ancien calcul. |
| Frontend legacy non migré | Faible | Moyen | `grep` exhaustif avant suppression des anciens hooks. Feature flag "useNewWallet" pour tester. |

---

*Rapport généré par agent deep-analysis — Phase 4 du workflow TEMPLATE.md.*
*Prochaine étape : Phase 5 — Plan complet (steps atomiques).*
