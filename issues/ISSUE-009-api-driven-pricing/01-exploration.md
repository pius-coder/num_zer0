# Phase 1 — Exploration (sortie brute des agents)

> **Issue:** ISSUE-009-api-driven-pricing
> **Date:** 2026-06-05
> **Agents utilisés:** 3 explore (parallèle)
> **Méthode:** chaque agent écrit sa section, le coordinateur fusionne

---

## Agent 1 — Mapping des prix statiques (priceUsd / priceXaf / usdToXaf / CountryPrice)

### Tableau de mapping

| Fichier | Intervalle | Rôle |
|---|---|---|
| `C:\Users\pc\num_zer0\src\components\services\data.ts` | L8-L13 — CountryPrice interface | **Source de vérité (type)** — interface sans priceUsd/priceXaf/flag (décalage type vs données constaté) |
| `C:\Users\pc\num_zer0\src\components\services\data.ts` | L664-L748 — COUNTRIES array (84 entrées) | **Source de vérité (données)** — chaque entrée a priceUsd, priceXaf, flag en plus des champs de l'interface |
| `C:\Users\pc\num_zer0\src\components\services\data.ts` | L665-L747 — usdToXaf(...) appelé 83 fois | **Source de vérité (conversion)** — fonction usdToXaf utilisée mais **introuvable** dans le code (définition manquante) |
| `C:\Users\pc\num_zer0\src\components\services\data.ts` | L750-L752 — getCountryByIso() | **Helper** — cherche dans COUNTRIES par ISO |
| `C:\Users\pc\num_zer0\src\components\services\data.ts` | L754-L756 — getServiceBySlug() | **Helper** — cherche dans SERVICES par slug (hors scope prix) |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L6-L7 — imports SERVICES, COUNTRIES, Service, CountryPrice | **Consommateur** — importe les données statiques |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L31 — CountryPrice dans le type union view | **Consommateur** — type CountryPrice pour l'état du panel |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L118 — view.country.priceXaf dans openPanel('topup', ...) | **Consommateur** — transmet priceXaf statique comme montant de recharge |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L125 — countries={COUNTRIES} passé au composant CountryList | **Consommateur** — transmet le tableau statique |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L212, L308, L822 — COUNTRIES.find(...) pour afficher activations | **Consommateur** — lookup pays pour les activations en cours/passées |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L427-L428 — countries: CountryPrice[] prop de CountryList | **Consommateur** — typage du composant |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L478 — c.priceXaf.toLocaleString('fr-FR') dans CountryList | **Consommateur** — affichage du prix XAF dans l'UI |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L497 — country: CountryPrice prop de PurchaseOptionsInline | **Consommateur** — typage du composant |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L509 — useState(country.priceUsd) | **Consommateur** — maxPrice initialisé depuis le prix statique USD |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L529 — apiPrice?.cost ?? country.priceUsd | **Consommateur** — fallback vers le prix statique USD si pas de données API |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L754 — country: CountryPrice prop de PurchaseConfirmation | **Consommateur** — typage du composant |
| `C:\Users\pc\num_zer0\src\components\wallet\wallet-purchase-history.tsx` | L52 — formatXaf(p.priceXaf) | **Hors scope (topup)** — p.priceXaf vient de la DB purchases, pas de CountryPrice |
| `C:\Users\pc\num_zer0\src\type\purchase.ts` | L5 — Package.priceXaf: number | **Source de vérité (type package)** — prix d'un package de recharge |
| `C:\Users\pc\num_zer0\src\type\purchase.ts` | L20 — CreatePurchaseResponse.purchase.priceXaf: number | **Source de vérité (type purchase)** — prix dans la réponse de création |
| `C:\Users\pc\num_zer0\convex\schema.ts` | L34 — packages.priceXaf: v.number() | **Source de vérité (DB schema — packages)** |
| `C:\Users\pc\num_zer0\convex\schema.ts` | L41 — purchases.priceXaf: v.number() | **Source de vérité (DB schema — purchases)** |
| `C:\Users\pc\num_zer0\convex\purchases.ts` | L174-L185 — internalCreatePurchase args/insert priceXaf | **Hors scope (topup)** — écrit le prix dans la DB purchases |
| `C:\Users\pc\num_zer0\convex\purchases.ts` | L89, L125, L421, L428, L433, L439, L468, L480 — purchase.priceXaf usage | **Hors scope (topup)** — utilise le prix depuis la DB (conversion XAF->USD, libellé) |
| `C:\Users\pc\num_zer0\convex\purchases.ts` | L332 — priceXaf: finalAmount dans directTopup | **Hors scope (topup)** — montant calculé pour le topup |
| `C:\Users\pc\num_zer0\convex\sms_provider.ts` | L69-L70, L107, L113, L125-L126 — priceUsd (variable locale) | **Hors scope (activation)** — priceUsd est une variable locale depuis args.maxPrice, pas de CountryPrice |
| `C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts` | L2 — import de usdToXaf, COUNTRIES, getCountryByIso, SERVICES | **Tests** — importe les données statiques et la fonction manquante |
| `C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts` | L4-L28 — describe('usdToXaf') (5 tests) | **Tests** — test de la conversion USD->XAF (définition manquante) |
| `C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts` | L31-L53 — describe('COUNTRIES') (3 tests) | **Tests** — vérifie structure, prix, et relation priceXaf = usdToXaf(priceUsd) |
| `C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts` | L56-L65 — describe('getCountryByIso') (2 tests) | **Tests** — helper lookup |
| `C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts` | L67-L73 — describe('SERVICES') (1 test) | **Tests** — vérification de base (hors scope prix) |
| `C:\Users\pc\num_zer0\scripts\add_phone_prefix.mjs` | L22-L25 — regex sur priceUsd/priceXaf dans data.ts | **Outil de maintenance** — script qui transformait les entrées COUNTRIES |
| `C:\Users\pc\num_zer0\scripts\generate_services.mjs` | (aucune référence aux prix) | **Hors scope** — génère uniquement le tableau SERVICES |
| `C:\Users\pc\num_zer0\src\components\layout\docs\BOTTOM-NAV.md` | L75 — { amount: country.priceXaf } dans la doc | **Hors scope (documentation)** — documente l'usage du priceXaf statique |

### Constat important — usdToXaf introuvable

- src/__tests__/services/data.test.ts ligne 2 importe usdToXaf depuis @/components/services/data.
- src/components/services/data.ts utilise usdToXaf() dans chaque entrée de COUNTRIES (lignes 665-747).
- Pourtant, usdToXaf n'est **ni défini ni exporté** nulle part dans data.ts ni dans aucun fichier du projet (recherche regex sur tout le workspace : function usdToXaf, const usdToXaf, usdToXaf =).

**Impact** : le fichier data.ts et les tests référencent une fonction qui n'existe pas.

### Notes supplémentaires

1. **Décalage interface vs données** : CountryPrice (L8-L13) déclare seulement iso, code, name, phonePrefix. Les entrées COUNTRIES (L665-L747) ont en plus priceUsd, priceXaf, flag. Soit l'interface est incomplète, soit TypeScript est contourné via un as ou un cast implicite.
2. **Contexte topup vs activation** : Le priceXaf dans wallet-purchase-history.tsx et convex/purchases.ts appartient au flux **topup/recharge** (achat de crédit), pas au flux **activation SMS**.
3. **sms_provider.ts** utilise priceUsd comme nom de variable locale, mais c'est une coïncidence sémantique.

---

## Agent 2 — Mapping du flow API sms_provider

### Carte complète du flow API sms-online.pro

| Fichier | Intervalle | Role |
|---|---|---|
| `convex/sms_provider.ts` | 1-13 | Imports, constantes API |
| `convex/sms_provider.ts` | 16-24 | smsProGet() wrapper HTTP GET privé |
| `convex/sms_provider.ts` | 26-33 | smsProGetJson() wrapper HTTP GET + JSON.parse |
| `convex/sms_provider.ts` | 37-40 | getUserId() helper auth |
| `convex/sms_provider.ts` | 44-137 | initiateActivation (mutation) coeur activation |
| `convex/sms_provider.ts` | 141-278 | pollActivation (internalAction) polling loop |
| `convex/sms_provider.ts` | 282-311 | internalUpdateActivation (internalMutation) |
| `convex/sms_provider.ts` | 315-320 | internalGetActivation (internalQuery) |
| `convex/sms_provider.ts` | 324-354 | refundEscrow (internalMutation) |
| `convex/sms_provider.ts` | 358-409 | completeActivation (mutation) |
| `convex/sms_provider.ts` | 413-456 | cancelActivation (mutation) |
| `convex/sms_provider.ts` | 460-498 | requestAnotherSms (mutation) |
| `convex/sms_provider.ts` | 502-516 | getActivation (query) |
| `convex/sms_provider.ts` | 520-532 | getMyActivations (query) |
| `convex/sms_provider.ts` | 536-560 | getNumberQuantity (query) **API-driven** |
| `convex/sms_provider.ts` | 564-585 | getTopCountries (query) **API-driven** |
| `convex/sms_provider.ts` | 589-615 | syncPrices (action) **API-driven** admin-only |
| `convex/sms_provider.ts` | 621-648 | getOperators (query) **API-driven** |
| `convex/sms_provider.ts` | 654-679 | getPrices (query) **API-driven** |
| `src/components/purchases/hooks/use-activations.ts` | 6-14 | activationKeys query keys |
| `src/components/purchases/hooks/use-activations.ts` | 16-21 | useActivation() hook |
| `src/components/purchases/hooks/use-activations.ts` | 23-25 | useMyActivations() hook |
| `src/components/purchases/hooks/use-activations.ts` | 27-36 | useInitiateActivation() mutation |
| `src/components/purchases/hooks/use-activations.ts` | 38-47 | useCompleteActivation() mutation |
| `src/components/purchases/hooks/use-activations.ts` | 49-58 | useCancelActivation() mutation |
| `src/components/purchases/hooks/use-activations.ts` | 60-69 | useRequestAnotherSms() mutation |
| `src/components/purchases/hooks/use-activations.ts` | 71-76 | useNumberQuantity(country) hook |
| `src/components/purchases/hooks/use-activations.ts` | 78-83 | useTopCountries(service) hook |
| `src/components/purchases/hooks/use-activations.ts` | 85-90 | useOperators(country) hook |
| `src/components/purchases/hooks/use-activations.ts` | 92-97 | usePrices(country, service?) hook |
| `src/type/sms_activation.ts` | 6 | GetOperatorsResult type |
| `src/type/sms_activation.ts` | 13 | GetPricesResult type |
| `src/type/sms_activation.ts` | 16-35 | SmsActivation interface |
| `src/type/sms_activation.ts` | 37-45 | SmsActivationStatus union statuts |
| `src/type/sms_activation.ts` | 47-52 | InitiateActivationInput type |
| `src/type/sms_activation.ts` | 54-57 | GetNumberQuantityResult type |
| `src/type/sms_activation.ts` | 59-64 | TopCountryResult type |
| `src/type/sms_activation.ts` | 66-70 | SmsProviderError type |
| `src/components/spa/my-space-page.tsx` | 497 | country: CountryPrice param |
| `src/components/spa/my-space-page.tsx` | 504 | useOperators(country.iso) |
| `src/components/spa/my-space-page.tsx` | 505 | useNumberQuantity(country.iso) |
| `src/components/spa/my-space-page.tsx` | 506 | usePrices(country.iso, service.id) |
| `src/components/spa/my-space-page.tsx` | 509 | setMaxPrice(country.priceUsd) **prix statique** |
| `src/components/spa/my-space-page.tsx` | 516-529 | Calcul apiPrice + fallback |
| `src/components/spa/my-space-page.tsx` | 529 | basePrice = apiPrice?.cost ?? country.priceUsd |
| `src/components/services/data.ts` | 8-13 | CountryPrice interface **type incomplet** |
| `src/components/services/data.ts` | 664-748 | COUNTRIES **84 entrees statiques** |
| `src/components/services/data.ts` | 750-752 | getCountryByIso() lookup statique |
| `convex/sms_countries.ts` | 8-46 | SMS_COUNTRY_MAP mapping numerique vers ISO |
| `convex/sms_countries.ts` | 49-52 | ISO_TO_SMS mapping ISO vers numerique |
| `convex/sms_countries.ts` | 55-57 | numericToIso() utilitaire |
| `convex/sms_countries.ts` | 60-62 | isoToNumeric() utilitaire |
| `src/__tests__/convex/sms_countries.test.ts` | 1-73 | Tests SMS_COUNTRY_MAP et conversions |
| `src/__tests__/services/data.test.ts` | 31-53 | Tests COUNTRIES (prix statiques a migrer) |
| `scripts/test_sms_provider.mjs` | 1-93 | Script de test des endpoints API |
| `src/components/purchases/hooks/index.ts` | 1-24 | Barrel export des hooks |

### Fonctions API-driven (deja bonnes)

| Fonction | Type | Endpoint API | Lignes |
|---|---|---|---|
| `getNumberQuantity` | query | `getNumbersStatus` | 536-560 |
| `getTopCountries` | query | `getTopCountriesByService` | 564-585 |
| `syncPrices` | action | `getPrices` | 589-615 |
| `getOperators` | query | `getOperators` | 621-648 |
| `getPrices` | query | `getPrices` | 654-679 |

### Fonctions qui utilisent encore des donnees statiques (a migrer)

| Emplacement | Donnee statique | Lignes |
|---|---|---|
| `data.ts` interface `CountryPrice` | `priceUsd` absent du type | 8-13 |
| `data.ts` tableau `COUNTRIES` | 84 entrees `priceUsd` hardcode | 664-748 |
| `data.ts` `getCountryByIso()` | Lit depuis COUNTRIES statique | 750-752 |
| `my-space-page.tsx` `setMaxPrice(...)` | Prix defaut statique | 509 |
| `my-space-page.tsx` fallback `country.priceUsd` | Fallback statique | 529 |
| `data.test.ts` validation `priceUsd` | Tests statiques a migrer | 31-53 |

### Flux des donnees pricing (actuel)

1. Selection service/pays dans `CountryList` (depuis COUNTRIES statique)
2. `PurchaseOptionsInline` appelle 3 hooks API-driven:
   - `useOperators` vers getOperators
   - `useNumberQuantity` vers getNumbersStatus
   - `usePrices` vers getPrices
   - `apiPrice` extrait de getPrices
   - Fallback: `apiPrice?.cost ?? country.priceUsd` (statique)
   - Default input: `setMaxPrice(country.priceUsd)` (statique)
3. Confirmation vers initiateActivation avec maxPrice

### Problemes identifies pour ISSUE-009

1. `CountryPrice` interface incomplete (l.8-13) — priceUsd/priceXaf/flag non declares
2. 84 prix hardcodes dans COUNTRIES (l.664-748)
3. `country.priceUsd` valeur defaut meme si API dispo (l.509)
4. Fallback statique empeche detection manque API (l.529)
5. Tests statiques a migrer (data.test.ts l.36-51)
6. Aucun etat loading/error pour usePrices — echec silencieux

---

## Agent 3 — Tests / schema / config / docs

### Rapport d'exploration

| Fichier | Intervalle | Rôle | Verdict |
|---|---|---|---|
| `C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts` | Lignes 1-74 (fichier complet) | Tests des prix statiques : `usdToXaf` (5 tests), `COUNTRIES` (3 tests), `getCountryByIso` (2 tests), `SERVICES` (1 test). Le test vérifie `priceUsd`, `priceXaf`, `flag` sur chaque entrée. | **À supprimer** — toute la logique de prix statique (usdToXaf, priceXaf, priceUsd dans COUNTRIES) est remplacée par l'API-driven pricing. Les tests `SERVICES` (lignes 67-73) et `getCountryByIso` (lignes 57-65) pourraient être gardés si ces fonctions survivent, mais dépendent de `data.ts` qui va changer. |
| `C:\Users\pc\num_zer0\src\__tests__\convex\sms_countries.test.ts` | Lignes 1-73 (fichier complet) | Tests de mapping pays (SMS_COUNTRY_MAP, ISO_TO_SMS, numericToIso, isoToNumeric). Ce mapping est un ID/numeric ↔ ISO code (ex. 33 → FR), **indépendant des prix**. | **À garder** — aucun lien avec les prix statiques. Mapping téléphonique pur, toujours nécessaire pour le provider SMS. |
| `C:\Users\pc\num_zer0\convex\schema.ts` | Lignes 31-37 (`packages` table) + lignes 38-55 (`purchases` table) | `priceXaf` dans `packages` (ligne 34) et `purchases` (ligne 41). `packages` concerne les forfaits de recharge (topup), pas l'activation SMS. **Hors scope** de ISSUE-009 (qui remplace les prix statiques des activations SMS). | **Hors scope** — `priceXaf` dans packages/purchases concerne le rechargement wallet (via Fapshi), pas les prix de service par pays. |
| `convex/schema.ts` (suite) | Lignes 90-121 (`activations` table) | Table des activations SMS. Champ `maxPrice` (ligne 106) et `priceCharged` (ligne 112) — ce sont les prix effectifs au moment de l'activation. | **À mettre à jour** — le flux de pricing API va définir `maxPrice` et `priceCharged`. Ces champs restent mais leur provenance change (API → plus de statique). |
| `C:\Users\pc\num_zer0\.env.example` | Lignes 70-73 (section SMSONLINEPRO) | Clé `SMSONLINEPRO_API_KEY` documentée. | **À garder** — toujours nécessaire pour appeler l'API SMSOnlinePro. |
| `C:\Users\pc\num_zer0\convex\_generated\api.d.ts` | N/A (auto-généré) | Types auto-générés par Convex. | **Hors scope** — régénéré automatiquement par `npx convex dev`. |
| `C:\Users\pc\num_zer0\ARCHITECTURE.md` | Lignes 198-201 (section "Service Activation Flow") | Décrit le pricing actuel : "EUR base rates → XAF markup formula". | **À mettre à jour** — cette section décrit le système de prix statique qui sera remplacé par l'API-driven pricing. |
| `C:\Users\pc\num_zer0\ARCHITECTURE.md` | Lignes 205-217 (section "Database Schema") | Liste les tables Convex. `packages`, `purchases` avec leurs index. | **Hors scope** — pas de changement de schéma pour l'instant. |
| `C:\Users\pc\num_zer0\src\components\spa\docs\` | **N'EXISTE PAS** | Le répertoire `docs/` n'existe pas dans `src/components/spa/`. | **À créer** — selon AGENTS.md, chaque feature doit avoir ses lifecycle docs. |

### Constat important — `usdToXaf` introuvable

- `src/__tests__/services/data.test.ts` ligne 2 importe `usdToXaf` depuis `@/components/services/data`.
- `src/components/services/data.ts` utilise `usdToXaf()` dans chaque entrée de `COUNTRIES` (lignes 665-747).
- Pourtant, `usdToXaf` n'est **ni défini ni exporté** nulle part dans `data.ts` ni dans aucun fichier du projet.

**Action recommandée :** dans le cadre d'ISSUE-009, cette fonction et son utilisation disparaîtront avec le passage à l'API.

### Interface `CountryPrice` incohérente

- L'interface `CountryPrice` (data.ts, lignes 8-13) ne déclare que `iso`, `code`, `name`, `phonePrefix`.
- Le tableau `COUNTRIES` (lignes 664-747) utilise aussi `priceUsd`, `priceXaf`, et `flag` — des champs qui ne sont pas dans l'interface.
- TypeScript devrait lever des erreurs. Ce bug préexistant sera résolu par la suppression des prix statiques.

### Résumé des actions

| Fichier | Action |
|---|---|
| `src/__tests__/services/data.test.ts` | Supprimer (tests de prix statiques obsolètes) |
| `src/__tests__/convex/sms_countries.test.ts` | Garder (aucun changement) |
| `convex/schema.ts` — packages/purchases | Hors scope |
| `convex/schema.ts` — activations | À mettre à jour (commentaire/documentation sur la provenance des prix) |
| `.env.example` | Garder (SMSONLINEPRO_API_KEY déjà présente) |
| `convex/_generated/api.d.ts` | Hors scope (auto-généré) |
| `ARCHITECTURE.md` lignes 198-201 | Mettre à jour la section pricing |
| `ARCHITECTURE.md` lignes 205-217 | Hors scope |
| `src/components/spa/docs/` | Créer le dossier avec CHANGELOG.md, CONTINUE.md, TODOS.md |
