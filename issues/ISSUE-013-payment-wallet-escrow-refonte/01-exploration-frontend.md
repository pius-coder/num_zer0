# Phase 1 — Exploration Frontend
## ISSUE-013-payment-wallet-escrow-refonte — Refonte no-legacy paiement/wallet/escrow/comptabilité

**Date:** 2026-06-08
**Agent:** explore (frontend)
**Contexte:** Refonte complète sans backward compatibility — remplacer le legacy payment/wallet/escrow/accounting par une implémentation API-driven moderne.

---

## Périmètre couvert

Ce rapport couvre **uniquement les fichiers frontend** (React/TypeScript) dans les zones:
- `src/components/purchases/hooks/*`
- `src/components/recharge/*`
- `src/components/wallet/*`
- `src/routes/payment/result.tsx`
- `src/routes/(app)/recharge.tsx`
- `src/routes/(app)/wallet.tsx`
- `src/components/my-space/purchase-panel.tsx`
- `src/components/my-space/activation-detail.tsx`
- `src/components/admin/accounting/admin-accounting.tsx`
- `src/components/admin/purchases/admin-purchases.tsx`
- `src/components/admin/hooks/use-admin-queries.ts`
- `docs/` feature pertinents
- `issues/TEMPLATE.md`
- `AGENTS.md`

---

## 1. Fichiers cartographiés

### 1.1 Purchases Hooks — Query/Mutation wrappers

#### `/home/ubuntu/num_zer0/src/components/purchases/hooks/use-purchases.ts`
- **Intervalles:** L1-L68 (fichier complet)
- **Rôle:** React Query key factory (`purchaseKeys`) + hooks pour balance, mouvements, purchases, promo code, et mutations de paiement direct. Point d'entrée unique pour toutes les queries liées aux achats/balance côté frontend.
- **Hooks exposés:**
  - `useBalance()` (L12-L14) → `api.users.getUserBalance`
  - `useMouvements()` (L16-L18) → `api.comptabilite.getMyMouvements`
  - `usePurchases()` (L20-L22) → `api.purchases.getPurchases`
  - `useValidatePromoCode(code)` (L24-L29) → `api.purchases.validatePromoCode`
  - `useInitiateDirectPay()` (L31-L42) → mutation `api.purchases.initiateDirectPay`
  - `useVerifyPurchase()` (L44-L55) → mutation `api.purchases.verifyPurchase`
  - `useCancelPurchase()` (L57-L67) → mutation `api.purchases.cancelPurchase`
- **Query keys:** `purchaseKeys.all` (L6), `purchaseKeys.purchases()` (L7), `purchaseKeys.balance()` (L8), `purchaseKeys.mouvements()` (L9)
- **Risques:**
  - Tous les hooks pointent vers des fonctions Convex legacy (`api.purchases.*`, `api.comptabilite.*`, `api.users.getUserBalance`) — chaque wrapper devra être réécrit ou supprimé.
  - Les invalidations `onSettled` sont groupées (purchases, balance, mouvements) — à revoir si le nouveau modèle change la structure des query keys.
  - `useInitiateDirectPay` utilise `useConvexAction` (action, pas mutation) — divergence de pattern.

#### `/home/ubuntu/num_zer0/src/components/purchases/hooks/use-activations.ts`
- **Intervalles:** L1-L141 (fichier complet)
- **Rôle:** Query key factory (`activationKeys`) + hooks pour toutes les opérations liées aux activations SMS. Gère le cycle de vie complet des activations (initiation, complétion, annulation, re-SMS) + requêtes métier (prix, opérateurs, quantités).
- **Hooks exposés:**
  - `useActivation(id)` (L16-L21) → `api.sms_provider.getActivation`
  - `useMyActivations()` (L23-L25) → `api.sms_provider.getMyActivations`
  - `useInitiateActivation()` (L27-L36) → mutation `api.sms_provider.initiateActivation`
  - `useCompleteActivation()` (L38-L47) → mutation `api.sms_provider.completeActivation`
  - `useCancelActivation()` (L49-L58) → mutation `api.sms_provider.cancelActivation`
  - `useRequestAnotherSms()` (L60-L69) → mutation `api.sms_provider.requestAnotherSms`
  - `useNumberQuantity(country)` (L71-L79) → action `api.sms_provider.getNumberQuantity`
  - `useTopCountries(service)` (L81-L89) → action `api.sms_provider.getTopCountries`
  - `useOperators(country)` (L91-L99) → action `api.sms_provider.getOperators`
  - `usePrices(country, service?)` (L101-L109) → action `api.sms_provider.getPrices`
  - `useRentPriceList(country, service)` (L111-L119) → action `api.sms_provider.getRentPriceList`
  - `useFreePrices(country, service)` (L121-L129) → action `api.sms_provider.getFreePrices`
  - `useInitiateRentalActivation()` (L131-L139) → mutation `api.sms_provider.initiateRentalActivation`
- **Query keys:** `activationKeys.all` (L7), `activationKeys.activation(id)` (L8), `activationKeys.myActivations()` (L9), etc.
- **Risques:**
  - Le hook `useCancelActivation` interagit avec l'escrow (annulation = remboursement) — toute refonte du système d'escrow doit impacter cette mutation.
  - `useCompleteActivation` consomme l'escrow (distribution 702-marge / 471-fournisseur) — critique pour la refonte comptable.
  - 7 hooks utilisent `useConvexAction` (non réactif) au lieu de `convexQuery` — divergence de pattern qui devra être harmonisée.

#### `/home/ubuntu/num_zer0/src/components/purchases/hooks/index.ts`
- **Intervalles:** L1-L27 (fichier complet)
- **Rôle:** Barrel export — réexporte tous les symbols de `use-purchases.ts` et `use-activations.ts`.
- **Risques:** Aucun direct — simple réexport. Devra être mis à jour si des hooks sont renommés/supprimés.

---

### 1.2 Recharge Feature

#### `/home/ubuntu/num_zer0/src/components/recharge/recharge-drawer.tsx`
- **Intervalles:** L1-L56 (fichier complet)
- **Rôle:** Drawer modal (bottom sheet) qui encapsule le flux de recharge en 2 étapes. Point d'entrée UI pour `useInitiateDirectPay`.
- **Flux:** Ouvre un Sheet → StepMethod (choix MTN/Orange) → StepTopUp (montant, téléphone, promo) → appelle `useInitiateDirectPay` → redirige vers l'URL de paiement.
- **Risques:**
  - `useInitiateDirectPay` est une mutation legacy qui sera remplacée — tout le drawer doit être rewired.
  - Utilise `authClient.signIn.anonymous()` directement (L23) — logique d'auth à extraire/remplacer.
  - `directPayMutation.mutateAsync` attend `{ amount, phone, medium, promoCode }` — la signature changera avec la nouvelle API.

#### `/home/ubuntu/num_zer0/src/components/recharge/step-topup.tsx`
- **Intervalles:** L1-L234 (fichier complet — dépasse 200 lignes, à refactorer)
- **Rôle:** Étape 2 du flux — formulaire montant + téléphone + promo + submit. Contient la logique UI de quick-select USD/XAF.
- **Risques:**
  - Dépasse 200 lignes (violation ESLint `max-lines`).
  - La validation du formulaire (`topUpSchema`, L12-L16) et le format des données envoyées (`amount, phone, medium, promoCode`) sont liés au système legacy.
  - Le taux XAF_RATE = 600 (L26) est hardcodé — devrait être une variable d'environnement ou un setting serveur.

#### `/home/ubuntu/num_zer0/src/components/recharge/step-method.tsx`
- **Intervalles:** L1-L57 (fichier complet)
- **Rôle:** Étape 1 du flux — sélection du moyen de paiement (MTN MoMo / Orange Money).
- **Risques:** Listes de méthodes limitées à 2 providers mobiles. L'issue demande une refonte `no-legacy` — ce composant devra probablement être remplacé par un sélecteur générique plus flexible.

#### `/home/ubuntu/num_zer0/src/components/recharge/payment-methods.ts`
- **Intervalles:** L1-L32 (fichier complet)
- **Rôle:** Configuration statique des méthodes de paiement disponibles (MTN MoMo, Orange Money). Chaque méthode a un id, label, desc, iconSrc, iconAlt, color, activeColor.
- **Risques:** Données hardcodées — la refonte doit rendre cette liste dynamique (API-driven ou configurable).

#### `/home/ubuntu/num_zer0/src/components/recharge/payment-method-card.tsx`
- **Intervalles:** L1-L62 (fichier complet)
- **Rôle:** Composant UI pour afficher une méthode de paiement avec icône, label, description et check.
- **Risques:** Dépend de `PaymentMethodIcon` et `PaymentMethodCheck` — composants legacy à garder/twister selon la refonte.

#### `/home/ubuntu/num_zer0/src/components/recharge/payment-method-icon.tsx`
- **Intervalles:** L1-L17 (fichier complet)
- **Rôle:** Affiche soit une icône Wallet (Lucide) soit une image (src/alt) selon `isWallet`.
- **Risques:** Le support wallet (`isWallet`) est partiel — l'escrow/payment refactoring pourrait nécessiter un vrai composant wallet.

#### `/home/ubuntu/num_zer0/src/components/recharge/payment-method-check.tsx`
- **Intervalles:** L1-L20 (fichier complet)
- **Rôle:** Check animé vert `#25D366` pour l'élément de méthode sélectionné.

#### `/home/ubuntu/num_zer0/src/components/recharge/recharge-trigger-button.tsx`
- **Intervalles:** L1-L38 (fichier complet)
- **Rôle:** Bouton flottant qui affiche le solde dans la navigation et ouvre le drawer de recharge.
- **Risques:** Utilise `useBottomNav` (store global) — dépendance à un pattern UI legacy.

#### `/home/ubuntu/num_zer0/src/components/recharge/index.ts`
- **Intervalles:** L1-L5 (fichier complet)
- **Rôle:** Barrel export pour la feature recharge.
- **Risques:** Simple réexport — mettra à jour si des composants sont renommés.

#### `/home/ubuntu/num_zer0/src/components/recharge/docs/CONTINUE.md`
- **Intervalles:** L1-L26
- **Rôle:** État actuel du composant recharge (style landing, palette orange, 2 étapes).
- **Risques:** Indique que le visual est en dev et que `URL search params` pour le step/method sont souhaités — la refonte devra trancher ce pattern.

#### `/home/ubuntu/num_zer0/src/components/recharge/docs/TODOS.md`
- **Intervalles:** L1-L11
- **Rôle:** Checklist des tâches — la plupart sont cochées (restyling fait).
- **Risques:** Le TODO sur `URL search params for step/method state` (non coché) est un pattern à intégrer dans la refonte.

#### `/home/ubuntu/num_zer0/src/components/recharge/docs/CHANGELOG.md`
- **Intervalles:** L1-L13
- **Rôle:** Historique des changements — restyling landing page effectué le 2026-06-03.

---

### 1.3 Wallet Feature

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-page-shell.tsx`
- **Intervalles:** L1-L55 (fichier complet)
- **Rôle:** Page principale du wallet. Orchestre l'affichage du solde, historique des transactions, et historique des recharges.
- **Dépendances critiques:**
  - `useBalance()` (L11) → `api.users.getUserBalance`
  - `useMouvements()` (L11) → `api.comptabilite.getMyMouvements`
  - `useBottomNav` → ouvre le panel recharge.
- **Mapping de données:** Transforme les mouvements (format Convex legacy `{id, libelle, date, montant, sens, soldeApres, statut}`) en `TransactionItem` (L17-L27).
- **Risques:**
  - Point d'entrée critique pour la refonte — consomme `api.comptabilite.getMyMouvements` (legacy comptable).
  - Le mapping L17-L27 suppose une structure de données qui changera avec la nouvelle API comptable.
  - `useBalance()` retourne `{balanceUsd: number}` — la refonte pourrait restructurer ce retour.

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-balance-card.tsx`
- **Intervalles:** L1-L89 (fichier complet)
- **Rôle:** Affiche le solde utilisateur en USD + boutons "Synchroniser" (sync) et "+ Recharger".
- **Risques:** `onSync` est un callback optionnel qui pourrait disparaître avec la refonte.

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-balance-total.tsx`
- **Intervalles:** L1-L36 (fichier complet)
- **Rôle:** Affiche le total du solde avec un loader — composant purement présentational.

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-balance-breakdown.tsx`
- **Intervalles:** L1-L31 (fichier complet)
- **Rôle:** Breakdown du solde — actuellement un placeholder avec juste un bouton "+ Recharger".
- **Risques:** Composant vide — à supprimer ou implémenter dans la refonte.

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-purchase-history.tsx`
- **Intervalles:** L1-L68 (fichier complet)
- **Rôle:** Affiche l'historique des recharges (achats) filtré (exclut `payment_pending`). Consomme `usePurchases()`.
- **Risques:** Dépend de `api.purchases.getPurchases` legacy. Le format attendu (`priceXaf`, `createdAt`, `status`) changera.

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-transaction-list.tsx`
- **Intervalles:** L1-L110 (fichier complet)
- **Rôle:** Liste générique des transactions (crédit/débit/solde) avec affichage responsive (mobile + desktop).
- **Risques:** Exporte `TransactionItem` (interface ligne L5-L15) — ce type est utilisé dans `wallet-page-shell.tsx` et potentiellement ailleurs. La refonte comptable changera cette interface.

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-transaction-tabs.tsx`
- **Intervalles:** L1-L26 (fichier complet)
- **Rôle:** Tabs de filtrage: "Tout", "Recharges", "Achats numéros". UI pure — pas de logique métier.

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-transaction-empty.tsx`
- **Intervalles:** L1-L21 (fichier complet)
- **Rôle:** État vide pour les listes de transactions. UI pure.

#### `/home/ubuntu/num_zer0/src/components/wallet/transaction-row.tsx`
- **Intervalles:** L1-L22 (fichier complet)
- **Rôle:** Ligne de transaction simple (label, date, montant FCFA). `amount >= 0` = vert, sinon rouge.

#### `/home/ubuntu/num_zer0/src/components/wallet/pending-payment-banner.tsx`
- **Intervalles:** L1-L5 (fichier complet)
- **Rôle:** Bannière de paiement en attente — retourne `null` (désactivé). Placeholder pour une future fonctionnalité.
- **Risques:** À supprimer ou implémenter dans la refonte.

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-cta-footer.tsx`
- **Intervalles:** L1-L27 (fichier complet)
- **Rôle:** Footer avec bouton "Recharger des crédits" et lien "Parcourir les services".

#### `/home/ubuntu/num_zer0/src/components/wallet/payment-feedback-message.tsx`
- **Intervalles:** L1-L30 (fichier complet)
- **Rôle:** Message de feedback pendant le paiement avec indicateur visuel (pulsing dot). Utilisé par le drawer/flux de paiement.

#### `/home/ubuntu/num_zer0/src/components/wallet/payment-confirm-dialog.tsx`
- **Intervalles:** L1-L62 (fichier complet)
- **Rôle:** Dialogue "Avez-vous effectué le paiement ?" — proposé quand le callback de paiement n'arrive pas. Oui = `onPaid()`, Non = `onNotPaid()`.
- **Risques:** Logique de confirmation manuelle — à évaluer si pertinente dans la refonte.

#### `/home/ubuntu/num_zer0/src/components/wallet/wallet-payment-methods.tsx`
- **Intervalles:** L1-L36 (fichier complet)
- **Rôle:** Affiche les méthodes de paiement par défaut (MTN, Orange, Carte) avec données hardcodées.
- **Risques:** Données mockées — à remplacer par API dynamique.

#### `/home/ubuntu/num_zer0/src/components/wallet/index.ts`
- **Intervalles:** L1-L15 (fichier complet)
- **Rôle:** Barrel export pour la feature wallet.

---

### 1.4 Routes

#### `/home/ubuntu/num_zer0/src/routes/payment/result.tsx`
- **Intervalles:** L1-L171 (fichier complet)
- **Rôle:** Route `/payment/result?transId=...&status=...`. Page de callback après un paiement externe. Vérifie le statut du paiement via `useVerifyPurchase()` (legacy).
- **Logique:** Si `status=SUCCESSFUL` → appelle `verifyPurchase.mutate({ transId })` → redirige vers `/wallet`.
- **Risques:**
  - Point d'entrée critique pour le webhook de paiement. La refonte doit remplacer `useVerifyPurchase` (qui cible `api.purchases.verifyPurchase`).
  - Les statuts `SUCCESSFUL`, `FAILED`, `EXPIRED` sont des constantes de l'API legacy — à réviser.
  - `verifyPurchase.mutate` attend `{ transId }` — la signature changera.

#### `/home/ubuntu/num_zer0/src/routes/(app)/recharge.tsx`
- **Intervalles:** L1-L26 (fichier complet)
- **Rôle:** Route `/recharge` — page simple qui ouvre le drawer de recharge via `useBottomNav`.
- **Risques:** Très peu de logique — dépend de `useBottomNav`. La refonte pourrait supprimer cette route si le drawer est intégré ailleurs.

#### `/home/ubuntu/num_zer0/src/routes/(app)/wallet.tsx`
- **Intervalles:** L1-L7 (fichier complet)
- **Rôle:** Route `/wallet` — rend `<WalletPageShell />`. SSR: true.
- **Risques:** La page wallet entière dépends des hooks legacy (`useBalance`, `useMouvements`, `usePurchases`).

---

### 1.5 My-Space Components

#### `/home/ubuntu/num_zer0/src/components/my-space/purchase-panel.tsx`
- **Intervalles:** L1-L357 (fichier complet — dépasse 200 lignes, à refactorer)
- **Rôle:** Panneau d'achat principal dans my-space. Gère la sélection de service/pays/mode (unique/abonnement), opérateur, prix, et déclenche l'activation.
- **Dépendances critiques:**
  - `useInitiateActivation` (L197) → mutation d'activation (crée l'escrow)
  - `useInitiateRentalActivation` (L198) → mutation de location (crée aussi l'escrow)
  - `useOperators`, `useNumberQuantity`, `usePrices`, `useRentPriceList`, `useFreePrices` → queries de prix/disponibilité
- **Logique d'achat:**
  - `handleBuy` (L257-L294): Vérifie solde → `initiateActivation` ou `initiateRentalActivation` → appelle `onActivate(result.activationId)`.
  - `needsTopUp = balanceUsd < displayPrice` (L254) — comparaison de solde locale, gère le cas "pas assez d'argent".
- **Risques:**
  - Dépasse 200 lignes (357) — doit être refactoré.
  - Toutes les mutations sont legacy (`api.sms_provider.*`).
  - La logique de `needsTopUp` (L254) et `handleBuy` (L265-L268) est un duplicata de la logique serveur — refonte peut la simplifier en déléguant au backend.
  - Les `freePrices`, `rentPrices`, `prices` sont queries séparées → à fusionner ou optimiser.

#### `/home/ubuntu/num_zer0/src/components/my-space/activation-detail.tsx`
- **Intervalles:** L1-L132 (fichier complet)
- **Rôle:** Page de détail d'une activation SMS. Affiche le statut, le numéro, le code SMS, et les actions (compléter, re-SMS, annuler).
- **Dépendances critiques:**
  - `useCompleteActivation` (L22) → consomme l'escrow (distribution comptable)
  - `useCancelActivation` (L23) → rembourse l'escrow
  - `useRequestAnotherSms` (L24) → re-request SMS
  - `useBalance` (L20) → pour afficher le solde dans le `PurchasePanel` de réessai
  - `PurchasePanel` (L88-L91) → panneau de réessai quand l'activation est en erreur terminale
- **Risques:**
  - Le `handleAction` (L46-L52) est un wrapper générique qui ne gère pas bien les erreurs spécifiques à chaque mutation.
  - `useCompleteActivation` et `useCancelActivation` sont les deux mutations qui impactent directement l'escrow — toute refonte de l'escrow les impactera.
  - La logique de réessai (L85-L91) réaffiche `PurchasePanel` avec la même balance — pas de refresh automatique du solde.

---

### 1.6 Admin Feature

#### `/home/ubuntu/num_zer0/src/components/admin/accounting/admin-accounting.tsx`
- **Intervalles:** L1-L121 (fichier complet)
- **Rôle:** Module admin de comptabilité. Affiche 2 sections: "Comptes" (soldes des comptes comptables) et "Écritures" (pièces comptables).
- **Dépendances:**
  - `useAdminComptes()` (L10) → `api.comptabilite.getAllComptes`
  - `useAdminPieces()` (L55) → `api.comptabilite.getAllPieces`
- **Risques:**
  - Dépend entièrement du module Convex `comptabilite` legacy — toute refonte comptable (nouveau plan de comptes, nouvelles écritures) casse cette page.
  - Les types `any` (L40, L86) indiquent une absence de typage fort — la refonte devra typer ces retours.
  - La colonne "Référence" dans `PiecesSection` est optionnelle (`reference ?? '—'`) — pourrait être supprimée ou rendue obligatoire.

#### `/home/ubuntu/num_zer0/src/components/admin/purchases/admin-purchases.tsx`
- **Intervalles:** L1-L76 (fichier complet)
- **Rôle:** Module admin des achats. Tableau listant toutes les transactions avec statut, méthode, code promo.
- **Dépendances:**
  - `useAdminPurchases()` (L22) → `api.purchases.getAllPurchases`
- **Risques:**
  - Dépend de `api.purchases.getAllPurchases` legacy.
  - Les statuts `confirmed`, `failed`, `payment_pending` (L6-L9) sont des valeurs du modèle legacy.
  - Les colonnes `userId`, `priceXaf`, `paymentMethod`, `promoCode` sont les champs legacy — tout changement de schéma casse le tableau.

#### `/home/ubuntu/num_zer0/src/components/admin/hooks/use-admin-queries.ts`
- **Intervalles:** L1-L144 (fichier complet)
- **Rôle:** Query key factory `adminKeys` + 20 hooks React Query pour tous les modules admin.
- **Hooks pertinents pour l'issue:**
  - `useAdminPurchases()` (L26-L28) → `api.purchases.getAllPurchases`
  - `useAdminComptes()` (L34-L36) → `api.comptabilite.getAllComptes`
  - `useAdminPieces()` (L38-L40) → `api.comptabilite.getAllPieces`
- **Risques:**
  - 20 hooks dans un seul fichier — à surveiller pour la limite 200 lignes (144 OK pour l'instant).
  - Les hooks `useAdminComptes`, `useAdminPieces`, `useAdminPurchases` sont les 3 qui pointent vers la couche comptable/paiement legacy.
  - Une refonte du `adminKeys` factory pattern peut être nécessaire si les query keys changent.

#### `/home/ubuntu/num_zer0/src/components/admin/docs/CONTINUE.md`
- **Intervalles:** L1-L39
- **Rôle:** État actuel de l'admin dashboard. Mentionne que le module Accounting n'affiche pas les lignes détaillées par pièce.
- **Risques:** Le détail manquant par pièce comptable est un des objectifs de la refonte.

#### `/home/ubuntu/num_zer0/src/components/admin/docs/TODOS.md`
- **Intervalles:** L1-L35
- **Rôle:** Checklist — tout est coché pour la v1.0.0.
- **Risques:** Les améliorations futures listées (pagination, filtres, graphiques) sont hors scope de l'issue — attention à ne pas les inclure.

#### `/home/ubuntu/num_zer0/src/components/admin/docs/CHANGELOG.md`
- **Intervalles:** L1-L25
- **Rôle:** Création du dashboard admin v1.0.0 le 2026-06-05.

---

### 1.7 My-Space Docs

#### `/home/ubuntu/num_zer0/src/components/my-space/docs/CONTINUE.md`
- **Intervalles:** L1-L47
- **Rôle:** État actuel — refacto du monolithe SPA vers routes TanStack. Mentionne que le legacy SPA (`src/components/spa/my-space-page.tsx`) est toujours présent.
- **Risques:** Le fichier legacy SPA de 1162 lignes doit être supprimé (Step 8 du TODO) — la refonte `no-legacy` est l'occasion de le faire.

#### `/home/ubuntu/num_zer0/src/components/my-space/docs/TODOS.md`
- **Intervalles:** L1-L52
- **Rôle:** Checklist my-space. 36 tâches cochées, 6 en cleanup restant.
- **Risques:** Les 6 fichiers SPA legacy à supprimer (L36-L41) sont marqués comme cleanup — la refonte `no-legacy` peut les inclure.

#### `/home/ubuntu/num_zer0/src/components/my-space/docs/CHANGELOG.md`
- **Intervalles:** L1-L30
- **Rôle:** Historique des changements my-space (route fix, composants extraits, infrastructure).

---

### 1.8 Project-level Docs

#### `/home/ubuntu/num_zer0/issues/TEMPLATE.md`
- **Intervalles:** L1-L495 (fichier complet)
- **Rôle:** Template d'issue contenant le workflow obligatoire en 8 phases. Définit les règles de persistance, coordination multi-subagents, et format des rapports.
- **Risques:** La règle absolue (L6-L78) impose la lecture des docs avant le code. Le workflow (L82-L205) est contraignant — la phase 1 d'exploration (ce rapport) doit être suivie de 7 autres phases avant d'écrire du code.

#### `/home/ubuntu/num_zer0/AGENTS.md`
- **Intervalles:** L1-L232 (fichier complet)
- **Rôle:** Guide agent principal — définit la structure du projet, le pattern feature folder, les conventions hooks vs inline, et les pratiques Convex + React Query.
- **Points clés pour l'issue:**
  - **Max 200 lignes par fichier** — violation détectée dans `step-topup.tsx` (234) et `purchase-panel.tsx` (357).
  - **Feature folder pattern** — la refonte doit suivre `docs/ + hooks/ + composants + index.ts`.
  - **Mutation hooks avec `withOptimisticUpdate`** — pattern recommandé mais **aucun fichier exploré ne l'utilise actuellement** (les mutations sont basiques).
  - **Convex best practices** — ne jamais truster le client, utiliser `ctx.auth.getUserIdentity()` serveur.

---

## 2. Analyse des dépendances croisées

### 2.1 Dépendances Convex legacy (à remplacer)

| Convex function | Frontend consommateurs | Type |
|---|---|---|
| `api.users.getUserBalance` | `use-purchases.ts:useBalance`, `wallet-page-shell.tsx`, `activation-detail.tsx`, `purchase-panel.tsx` | Query |
| `api.comptabilite.getMyMouvements` | `use-purchases.ts:useMouvements`, `wallet-page-shell.tsx` | Query |
| `api.comptabilite.getAllComptes` | `use-admin-queries.ts:useAdminComptes`, `admin-accounting.tsx` | Query |
| `api.comptabilite.getAllPieces` | `use-admin-queries.ts:useAdminPieces`, `admin-accounting.tsx` | Query |
| `api.purchases.getPurchases` | `use-purchases.ts:usePurchases`, `wallet-purchase-history.tsx` | Query |
| `api.purchases.getAllPurchases` | `use-admin-queries.ts:useAdminPurchases`, `admin-purchases.tsx` | Query |
| `api.purchases.initiateDirectPay` | `use-purchases.ts:useInitiateDirectPay`, `recharge-drawer.tsx` | Mutation |
| `api.purchases.verifyPurchase` | `use-purchases.ts:useVerifyPurchase`, `payment/result.tsx` | Mutation |
| `api.purchases.cancelPurchase` | `use-purchases.ts:useCancelPurchase` | Mutation |
| `api.purchases.validatePromoCode` | `use-purchases.ts:useValidatePromoCode` | Query |
| `api.sms_provider.*` (13 functions) | `use-activations.ts` (13 hooks), `purchase-panel.tsx`, `activation-detail.tsx` | Queries + Mutations |

### 2.2 Données partagées (interfaces à harmoniser)

- **`TransactionItem`** (wallet-transaction-list.tsx L5-L15) ↔ mapping dans `wallet-page-shell.tsx` L17-L27
- **`PaymentMethod`** (step-method.tsx L6) ↔ utilisé dans `step-topup.tsx`, `payment-methods.ts`, `recharge-drawer.tsx`
- **Status values:** `payment_pending`, `confirmed`, `failed` (dans purchases) — utilisés dans `admin-purchases.tsx`, `wallet-purchase-history.tsx`
- **Status values:** `validee`, `annulee`, `en_attente` (dans mouvements/compta) — utilisés dans `wallet-transaction-list.tsx`

---

## 3. Risques globaux détectés

1. **Violation max-lines:** `step-topup.tsx` (234 lignes), `purchase-panel.tsx` (357 lignes) — à refactorer pendant la refonte.
2. **Absence de pattern `withOptimisticUpdate`:** Aucune mutation frontend n'utilise d'optimistic update — l'UX sera dégradée pendant les mutations si la refonte ne les ajoute pas.
3. **Types `any` dans admin:** `admin-accounting.tsx` (L40, L86), `admin-purchases.tsx` (L56) — la refonte doit typer correctement ces retours.
4. **Données hardcodées:** `payment-methods.ts` (méthodes), `wallet-payment-methods.tsx` (méthodes), `XAF_RATE` dans `step-topup.tsx` (L26) — à externaliser.
5. **Legacy SPA non supprimé:** `src/components/spa/my-space-page.tsx` (1162 lignes) toujours présent — opportunité de suppression dans la refonte `no-legacy`.
6. **Query keys dispersées:** `purchaseKeys` (use-purchases.ts), `activationKeys` (use-activations.ts), `adminKeys` (use-admin-queries.ts) — pas de factory unifiée. La refonte pourrait centraliser.
7. **`useConvexAction` vs `convexQuery`:** 7 hooks dans `use-activations.ts` utilisent `useConvexAction` au lieu de `convexQuery` — pattern non homogène à harmoniser.

---

## 4. Synthèse — fichiers à modifier dans la refonte

| Priorité | Fichier | Nature du changement |
|---|---|---|
| Critique | `use-purchases.ts` | Réécriture complète (nouveaux endpoints API) |
| Critique | `use-activations.ts` | Réécriture partielle (nouveaux endpoints + escrow) |
| Critique | `recharge-drawer.tsx` | Rewire mutation + nouveau flux paiement |
| Critique | `wallet-page-shell.tsx` | Nouveau data mapping |
| Critique | `payment/result.tsx` | Nouvelle logique de vérification |
| Haute | `purchase-panel.tsx` | Refactor + nouveau modèle d'achat |
| Haute | `activation-detail.tsx` | Nouveau modèle d'escrow |
| Haute | `admin-accounting.tsx` | Nouveau plan comptable |
| Haute | `admin-purchases.tsx` | Nouveau schéma purchase |
| Haute | `use-admin-queries.ts` | Mise à jour des points d'entrée legacy |
| Moyenne | `step-topup.tsx` | Refactor <200 lignes + nouveau flux |
| Moyenne | `step-method.tsx` | Nouveau sélecteur générique |
| Moyenne | `payment-methods.ts` | Remplacer par config dynamique |
| Moyenne | `wallet-purchase-history.tsx` | Nouveau schéma purchase |
| Moyenne | Paquets `wallet/*` restants | UI à maintenir/twister |
| Faible | `recharge-trigger-button.tsx` | UI pure, dépend de bottom-nav-store |
| Faible | `payment-feedback-message.tsx` | UI pure, peut rester |
| Faible | `payment-confirm-dialog.tsx` | UI pure, à évaluer |

---

*Rapport généré par subagent explore — Phase 1 du workflow TEMPLATE.md.*
*Prochaine étape: Phase 2 — Lecture ciblée du code (ouvrir `02-lecture.md`).*
