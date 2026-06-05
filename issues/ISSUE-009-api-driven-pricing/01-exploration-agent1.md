## Agent 1 — Mapping des prix statiques

### Tableau de mapping

| Fichier | Intervalle | Rôle |
|---|---|---|
| C:\Users\pc\num_zer0\src\components\services\data.ts | L8-L13 — CountryPrice interface | **Source de vérité (type)** — interface sans priceUsd/priceXaf/flag (décalage type vs données constaté) |
| C:\Users\pc\num_zer0\src\components\services\data.ts | L664-L748 — COUNTRIES array (84 entrées) | **Source de vérité (données)** — chaque entrée a priceUsd, priceXaf, flag en plus des champs de l'interface |
| C:\Users\pc\num_zer0\src\components\services\data.ts | L665-L747 — usdToXaf(...) appelé 83 fois | **Source de vérité (conversion)** — fonction usdToXaf utilisée mais **introuvable** dans le code (définition manquante) |
| C:\Users\pc\num_zer0\src\components\services\data.ts | L750-L752 — getCountryByIso() | **Helper** — cherche dans COUNTRIES par ISO |
| C:\Users\pc\num_zer0\src\components\services\data.ts | L754-L756 — getServiceBySlug() | **Helper** — cherche dans SERVICES par slug (hors scope prix) |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L6-L7 — imports SERVICES, COUNTRIES, Service, CountryPrice | **Consommateur** — importe les données statiques |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L31 — CountryPrice dans le type union view | **Consommateur** — type CountryPrice pour l'état du panel |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L118 — view.country.priceXaf dans openPanel('topup', ...) | **Consommateur** — transmet priceXaf statique comme montant de recharge |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L125 — countries={COUNTRIES} passé au composant CountryList | **Consommateur** — transmet le tableau statique |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L212, L308, L822 — COUNTRIES.find(...) pour afficher activations | **Consommateur** — lookup pays pour les activations en cours/passées |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L427-L428 — countries: CountryPrice[] prop de CountryList | **Consommateur** — typage du composant |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L478 — c.priceXaf.toLocaleString('fr-FR') dans CountryList | **Consommateur** — affichage du prix XAF dans l'UI |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L497 — country: CountryPrice prop de PurchaseOptionsInline | **Consommateur** — typage du composant |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L509 — useState(country.priceUsd) | **Consommateur** — maxPrice initialisé depuis le prix statique USD |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L529 — apiPrice?.cost ?? country.priceUsd | **Consommateur** — fallback vers le prix statique USD si pas de données API |
| C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx | L754 — country: CountryPrice prop de PurchaseConfirmation | **Consommateur** — typage du composant |
| C:\Users\pc\num_zer0\src\components\wallet\wallet-purchase-history.tsx | L52 — formatXaf(p.priceXaf) | **Hors scope (topup)** — p.priceXaf vient de la DB purchases, pas de CountryPrice |
| C:\Users\pc\num_zer0\src\type\purchase.ts | L5 — Package.priceXaf: number | **Source de vérité (type package)** — prix d'un package de recharge |
| C:\Users\pc\num_zer0\src\type\purchase.ts | L20 — CreatePurchaseResponse.purchase.priceXaf: number | **Source de vérité (type purchase)** — prix dans la réponse de création |
| C:\Users\pc\num_zer0\convex\schema.ts | L34 — packages.priceXaf: v.number() | **Source de vérité (DB schema — packages)** |
| C:\Users\pc\num_zer0\convex\schema.ts | L41 — purchases.priceXaf: v.number() | **Source de vérité (DB schema — purchases)** |
| C:\Users\pc\num_zer0\convex\purchases.ts | L174-L185 — internalCreatePurchase args/insert priceXaf | **Hors scope (topup)** — écrit le prix dans la DB purchases |
| C:\Users\pc\num_zer0\convex\purchases.ts | L89, L125, L421, L428, L433, L439, L468, L480 — purchase.priceXaf usage | **Hors scope (topup)** — utilise le prix depuis la DB (conversion XAF->USD, libellé) |
| C:\Users\pc\num_zer0\convex\purchases.ts | L332 — priceXaf: finalAmount dans directTopup | **Hors scope (topup)** — montant calculé pour le topup |
| C:\Users\pc\num_zer0\convex\sms_provider.ts | L69-L70, L107, L113, L125-L126 — priceUsd (variable locale) | **Hors scope (activation)** — priceUsd est une variable locale depuis args.maxPrice, pas de CountryPrice |
| C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts | L2 — import de usdToXaf, COUNTRIES, getCountryByIso, SERVICES | **Tests** — importe les données statiques et la fonction manquante |
| C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts | L4-L28 — describe('usdToXaf') (5 tests) | **Tests** — test de la conversion USD->XAF (définition manquante) |
| C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts | L31-L53 — describe('COUNTRIES') (3 tests) | **Tests** — vérifie structure, prix, et relation priceXaf = usdToXaf(priceUsd) |
| C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts | L56-L65 — describe('getCountryByIso') (2 tests) | **Tests** — helper lookup |
| C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts | L67-L73 — describe('SERVICES') (1 test) | **Tests** — vérification de base (hors scope prix) |
| C:\Users\pc\num_zer0\scripts\add_phone_prefix.mjs | L22-L25 — regex sur priceUsd/priceXaf dans data.ts | **Outil de maintenance** — script qui transformait les entrées COUNTRIES |
| C:\Users\pc\num_zer0\scripts\generate_services.mjs | (aucune référence aux prix) | **Hors scope** — génère uniquement le tableau SERVICES |
| C:\Users\pc\num_zer0\src\components\layout\docs\BOTTOM-NAV.md | L75 — { amount: country.priceXaf } dans la doc | **Hors scope (documentation)** — documente l'usage du priceXaf statique |

### Constat important — usdToXaf introuvable

- src/__tests__/services/data.test.ts ligne 2 importe usdToXaf depuis @/components/services/data.
- src/components/services/data.ts utilise usdToXaf() dans chaque entrée de COUNTRIES (lignes 665-747).
- Pourtant, usdToXaf n'est **ni défini ni exporté** nulle part dans data.ts ni dans aucun fichier du projet (recherche regex sur tout le workspace : function usdToXaf, const usdToXaf, usdToXaf =).

**Impact** : le fichier data.ts et les tests référencent une fonction qui n'existe pas. Cela casse la compilation et les tests. C'est un bug bloquant pour l'ISSUE-009 — la fonction doit être ré-instantiee ou le code doit être migré avant toute utilisation.

### Notes supplémentaires

1. **Décalage interface vs données** : CountryPrice (L8-L13) déclare seulement iso, code, name, phonePrefix. Les entrées COUNTRIES (L665-L747) ont en plus priceUsd, priceXaf, flag. Soit l'interface est incomplète, soit TypeScript est contourné via un as ou un cast implicite.

2. **Contexte topup vs activation** : Le priceXaf dans wallet-purchase-history.tsx et convex/purchases.ts appartient au flux **topup/recharge** (achat de crédit), pas au flux **activation SMS**. Ces fichiers ne sont pas impactés par le remplacement des prix statiques CountryPrice.

3. **sms_provider.ts** utilise priceUsd comme nom de variable locale, mais c'est une coïncidence sémantique — la valeur vient de args.maxPrice (paramètre d'activation), pas du tableau COUNTRIES.
