# Phase 4 — Analyse profonde

## Root cause

Le modèle `CountryPrice` est structurellement faux car les prix de l'API sms-online.pro dépendent du couple **pays + service**, pas du pays seul. L'API `getPrices` retourne une structure `Record<numericCountryCode, Record<serviceSlug, {cost, count}>>` — le prix varie à la fois par pays ET par service. Le modèle statique actuel (84 entrées dans `COUNTRIES`) assigne un prix unique par pays (`priceUsd`, `priceXaf`) quel que soit le service, ce qui est incorrect : par exemple WhatsApp et Telegram n'ont pas le même coût pour un même pays.

Le bug se manifeste en production car le fallback `apiPrice?.cost ?? country.priceUsd` (my-space-page.tsx:529) utilise toujours `country.priceUsd` comme valeur par défaut, ce qui donne **un prix potentiellement faux** quand l'API retourne `{}` (pays non couvert par l'API, service manquant, ou erreur réseau). L'utilisateur voit et paie un prix qui ne correspond pas au tarif réel du fournisseur.

## Causes secondaires

1. **Interface `CountryPrice` incohérente** (data.ts:8-13) : l'interface TS ne déclare pas `priceUsd`/`priceXaf`/`flag`, mais le tableau `COUNTRIES` contient ces champs (l.665-748). TypeScript ne lève pas d'erreur car les propriétés supplémentaires sont autorisées par défaut. C'est un décalage type-données qui a permis au code de grossir avec des champs non typés.

2. **Fonction `usdToXaf` absente** (data.ts:665-747) : chaque entrée `COUNTRIES` appelle `usdToXaf(priceUsd)` pour calculer `priceXaf`, mais cette fonction n'existe nulle part. Le fichier de test (data.test.ts:2) l'importe depuis `@/components/services/data` — cette importation provoque une erreur `ReferenceError` au runtime. Le test ne peut pas passer. Le fait qu'il n'ait pas été bloqué suggère que les tests ne sont pas exécutés en CI ou que `usdToXaf` a été supprimée accidentellement.

3. **Fallback statique silencieux** (my-space-page.tsx:529) : `apiPrice?.cost ?? country.priceUsd` traite l'absence de données API comme un cas normal en affichant le prix statique. Aucun indicateur visuel (loading, error) n'est présenté à l'utilisateur quand l'API est indisponible ou que le service n'a pas de prix. L'utilisateur achète donc potentiellement au mauvais prix sans le savoir.

4. **`useTopCountries` mort** (use-activations.ts:78-83) : le hook existe, est exporté dans le barrel (index.ts) mais n'est jamais appelé nulle part dans `my-space-page.tsx` ni ailleurs. Cela indique une fonctionnalité API disponible mais non branchée, ou un résidu de code abandonné.

## Edge cases à gérer

1. **API indisponible** : si `getPrices` retourne `{}` (timeout, clé API invalide, erreur réseau), `apiPrice` est `null` et `basePrice` tombe sur `country.priceUsd` — un prix obsolète et potentiellement incorrect. **Solution** : détecter l'état `isError` ou `isFetching` de `usePrices` et afficher un état "Prix indisponible" désactivant l'achat.

2. **Service sans prix** : l'API retourne des données pour le pays mais pas pour ce service spécifique (ex : l'API a des prix pour la France/WhatsApp mais pas pour France/Telegram). La boucle `for (const countryKey of Object.keys(pricesData))` ne trouvera pas `services[service.id]` et `apiPrice` sera `null` → fallback statique.

3. **Pays non couvert** : le pays existe dans `COUNTRIES` (data.ts) mais `isoToNumeric(args.country)` retourne `null` car le mapping `sms_countries.ts` n'a pas d'entrée pour cet ISO. `getPrices` retourne alors `{}` → fallback statique. **Solution** : soit enrichir `sms_countries.ts`, soit détecter le pays inconnu et le griser dans `CountryList`.

4. **Chargement liste pays** : `CountryList` affiche actuellement `c.priceXaf` (statique) pour chaque pays. Si on supprime `priceXaf`, la liste doit soit cacher le prix temporairement, soit charger les prix par lots depuis l'API — ce qui est coûteux (83 appels). **Solution** : ne pas afficher de prix dans `CountryList`, ou n'afficher un prix que pour le pays sélectionné dans `PurchaseOptionsInline`.

5. **`useTopCountries` mort** : hook exporté dans `src/components/purchases/hooks/index.ts`, query key factory créée (`activationKeys.topCountries`), mais aucune consommation. C'est soit un oubli, soit une feature API (`getTopCountriesByService`) qui n'a pas encore d'UI. À documenter ou supprimer.

6. **Fallback trompeur** : `apiPrice?.cost ?? country.priceUsd` crée une illusion de prix correct. Si l'API est down, l'utilisateur voit un prix qui n'a pas été rafraîchi depuis la création de `COUNTRIES` (peut-être des mois). **Solution** : pas de fallback — soit le prix API est disponible, soit l'achat est désactivé avec un message clair.

## Si "no backward compat" demandé

### Ce qui DOIT être supprimé (définitivement)

- **`priceUsd`, `priceXaf`, `flag`** dans les entrées du tableau `COUNTRIES` (data.ts:665-748)
- **`usdToXaf`** : la fonction (inexistante) et tous ses appels
- **`flag`** : toutes les occurrences dans le tableau (le `flag` emoji est redondant avec l'URL `flagcdn.com`)
- **Fallback statique** : `apiPrice?.cost ?? country.priceUsd` et `useState(country.priceUsd)` dans `PurchaseOptionsInline` (my-space-page.tsx:509, 529)
- **Tests obsolètes** dans `data.test.ts` :
  - `describe('usdToXaf')` (l.4-29) — fonction supprimée
  - `describe('COUNTRIES')` validation prix (l.31-54) — prix supprimés
- **`country.priceXaf` passé à `openPanel('topup', ...)`** dans `PurchaseConfirmation` (my-space-page.tsx:118) — hors sujet pour l'activation
- **`c.priceXaf.toLocaleString(...)`** dans `CountryList` (my-space-page.tsx:478)

### Ce qui NE DOIT PAS être supprimé (domaine topup/recharge)

Les fichiers suivants utilisent `priceXaf` pour le flux **topup** (recharge de crédit via packages), pas pour l'activation SMS. Ils sont hors scope :

- `convex/purchases.ts` — `priceXaf` dans `internalCreatePurchase`, `directTopup`, etc. (paiement wallet)
- `src/type/purchase.ts` — `Package.priceXaf`, `CreatePurchaseResponse.purchase.priceXaf`
- `convex/schema.ts` — `packages.priceXaf` (L34), `purchases.priceXaf` (L41)
- `src/components/wallet/wallet-purchase-history.tsx` — `formatXaf(p.priceXaf)` (affichage historique)
- `convex/schema.ts` — `activations.priceCharged` (L112) reste car c'est le prix effectif de l'activation, pas le prix statique

## Impacts downstream

### CountryList (my-space-page.tsx:420-485)

- **Ne peut plus afficher de prix dans la liste** : plus de `priceXaf` statique → la colonne prix disparaît
- **Le type `countries` prop** ne peut plus être `CountryPrice[]` car `CountryPrice` n'aura plus de champ prix → créer un type `Country` sans prix, ou utiliser directement les données enrichies par l'API
- **Impact UX** : l'utilisateur ne voit plus le prix en FCFA avant de sélectionner un pays → perte d'info, mais plus correct (le prix dépend du service sélectionné)
- **Alternative** : ne pas afficher de prix dans la liste, ou afficher un indicateur "Prix disponible dans l'écran suivant"

### PurchaseOptionsInline (my-space-page.tsx:489-741)

- **Doit gérer `isFetching`** de `usePrices` (use-activations.ts:92) : afficher un spinner/skeleton pendant le chargement
- **Doit gérer `isError`** : afficher un message d'erreur et désactiver le bouton d'achat
- **Doit gérer prix null** : si `apiPrice` est `null`, ne pas afficher de paliers de prix, ne pas permettre l'achat
- **Suppression du `useState(country.priceUsd)`** (L509) : initialiser `maxPrice` à `apiPrice?.cost ?? 0` (ou `0` si pas de prix), ou ne pas fixer de maxPrice et afficher un input vide
- **Suppression du fallback** `apiPrice?.cost ?? country.priceUsd` (L529) : `basePrice` doit être `apiPrice?.cost` uniquement, avec gestion du cas `undefined`

### Topup montant suggéré (my-space-page.tsx:118)

- `view.country.priceXaf` transmis à `openPanel('topup', { amount: priceXaf })` ne peut plus exister
- **Impact** : l'utilisateur n'aura plus de montant de recharge pré-rempli depuis le prix de l'activation
- **Alternative** : utiliser `apiPrice` multiplié par le taux XAF dans `PurchaseOptionsInline` pour dériver un montant de recharge suggéré, ou demander un montant libre (la recharge n'est pas liée à l'activation en cours)

### Architecture de données

- `COUNTRIES` ne doit plus être une source de prix — uniquement un mapping ISO ↔ nom ↔ code pays ↔ phonePrefix
- `CountryPrice` doit être scindé en deux types :
  - `Country` : iso, code, name, phonePrefix (listage pays)
  - `PriceInfo` : cost en EUR, count (venant de l'API pour un pays+service donné)
- La conversion EUR → XAF (avec marge) reste pertinente côté client pour l'affichage, mais doit être une fonction utilitaire (conversion sans taux statique hardcodé)
