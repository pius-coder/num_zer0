# Phase 2 — Lecture ciblée

## Fichier 1: `src/components/services/data.ts` (756 lignes)

- **Lignes 1-6**: Interface `Service` — `id`, `slug`, `name`, `category`. Définitions statiques minimales.
- **Lignes 8-13**: Interface `CountryPrice` — `iso`, `code`, `name`, `phonePrefix`. **Absence notable** : pas de `priceUsd` ni `priceXaf` dans l'interface, alors que le tableau `COUNTRIES` (L664-748) contient ces deux champs sur chaque entrée. C'est une **incohérence** : les objets du tableau ont des propriétés supplémentaires non typées, ou l'interface devrait être étendue.
- **Lignes 15-660**: Tableau `SERVICES` (646 entrées). Chaque entrée a `id`, `slug`, `name`, `category`. Catégories : `social` (14), `ecommerce` (11), `delivery` (10), `finance` (8), `dating` (6), `streaming` (3), `gaming` (2), `professional` (5), `other` (~580+). Aucun prix associé.
- **Lignes 664-748**: Tableau `COUNTRIES` — **83 entrées** effectives (l'énoncé dit 84). Chaque entrée a : `iso`, `code`, `name`, `priceUsd`, `priceXaf`, `phonePrefix`, `flag`. Tous les `priceXaf` sont calculés via `usdToXaf(priceUsd)`.
- **BUG CRITIQUE L664-748**: La fonction `usdToXaf` est appelée pour chaque entrée du tableau `COUNTRIES`, mais **elle n'est ni définie ni importée nulle part dans `data.ts`**. Le test (`data.test.ts:2`) l'importe depuis `@/components/services/data`, ce qui implique qu'elle **devrait** y être exportée. Une recherche regex `function usdToXaf|const usdToXaf` sur tout le workspace ne retourne rien (confirmé par `01-exploration.md`). Soit elle a été supprimée accidentellement, soit elle est définie de manière globale et invisible — auquel cas l'import dans le test est cassé (`ReferenceError`).
- **Lignes 750-752**: Fonction `getCountryByIso(iso: string): CountryPrice | undefined` — simple `Array.find` sur `COUNTRIES` par `.iso`.
- **Lignes 754-756**: Fonction `getServiceBySlug(slug: string): Service | undefined` — simple `Array.find` sur `SERVICES` par `.slug`.

### Observations supplémentaires
- La plage de prix : `priceUsd` va de 0.20 (IN) à 0.70 (CH). Les prix XAF résultants sont dérivés au module.
- `CountryPrice` n'a pas `priceUsd`/`priceXaf` dans son interface TypeScript, mais le tableau en contient. Soit l'interface manque de champs, soit les objets du tableau sont en surplus — les deux constituent une **incohérence de typage** silencieuse (le compilateur ne lève pas d'erreur car les propriétés supplémentaires sont autorisées par défaut en TS si pas de vérification stricte).
- Pas de `as const` sur les tableaux — ils sont mutables, ce qui est un risque.

---

## Fichier 2: `src/components/spa/my-space-page.tsx` (1044 lignes)

- **Lignes 1-7**: Imports — `SERVICES`, `COUNTRIES` importés depuis `@/components/services/data`. `Service`, `CountryPrice` importés comme types.
- **Lignes 12-23**: Hooks importés — `useBalance` (via `use-purchases.ts`), et `useOperators`, `usePrices`, `useNumberQuantity` (via `use-activations.ts`).
- **Lignes 27-32**: Type `PageView` — sum type : `services` | `history` | `countries` (avec `service: Service`) | `confirm` (avec `service` + `country: CountryPrice`) | `activation` (avec `activationId`).
- **Lignes 34-65**: Constantes — `STATUS_LABELS`, `STATUS_COLORS`, `isActiveStatus`, `RENTAL_OPTIONS`.
- **Lignes 69-141**: `MySpacePage` — composant principal. Switch sur `view.kind`. Pour `countries` (L121-129) : passe `COUNTRIES` (le tableau complet) à `CountryList`.
- **Lignes 420-485**: `CountryList` — reçoit `countries: CountryPrice[]`. Affiche une grille de boutons avec drapeau, nom, code ISO et **`c.priceXaf.toLocaleString('fr-FR')`** à L478. Utilise `country.code` pour l'URL du flag.
- **Lignes 489-741**: `PurchaseOptionsInline` — le composant d'achat principal. Reçoit `country: CountryPrice` (avec `priceUsd`).
  - L504-506 : **Appels API en parallèle** : `useOperators(country.iso)`, `useNumberQuantity(country.iso)`, `usePrices(country.iso, service.id)`.
  - L512-514 : `operatorList` déduit de `operatorsData` (string[]). `availableCount` déduit de `quantityData?.[service.id]`.
  - L518-526 : Extraction du prix API depuis `pricesData` — itère sur les clés du premier niveau (numeric country codes), cherche `pricesData[countryKey][service.id]`.
  - L529 : `basePrice = apiPrice?.cost ?? country.priceUsd` — **fallback sur `country.priceUsd`** si l'API ne retourne rien.
  - L531-535 : `tiers` — Standard (basePrice), Prioritaire (basePrice × 1.1), Premium (basePrice × 1.3).
  - L539-540 : `displayPrice = Math.max(selectedTier.price, maxPrice)` — stepper manuel peut surenchérir.
  - L544-561 : `handleBuy` — appelle `initiateActivation.mutateAsync` avec `service.id`, `country.iso`, `maxPrice: displayPrice`, `operator`.
  - L646 : Affichage prix en USD (`${tier.price.toFixed(4)}`) — pas en FCFA.
  - L671 : Affichage `displayPrice` en USD — pas en FCFA.
  - **Observation** : Le composant affiche exclusivement les prix en USD. `priceXaf` n'est utilisé que dans `CountryList` (affichage FCFA). Dans `PurchaseOptionsInline`, le prix de base vient de l'API (`apiPrice.cost`) ou de `country.priceUsd`.

- **Lignes 745-777**: `PurchaseConfirmation` — wrapper simple qui appelle `PurchaseOptionsInline`.
- **Lignes 781-1013**: `ActivationDetail` — détails d'une activation. Utilise `useActivation`, `useCompleteActivation`, `useCancelActivation`, `useRequestAnotherSms`.
  - L821-822 : Cherche `serviceObj` dans `SERVICES` et `countryInfo` dans `COUNTRIES`.
  - L930-942 : En cas d'erreur terminale, affiche un nouveau `PurchaseOptionsInline` pour réessayer.
- **Lignes 1015-1044**: `TimelineLine` — composant utilitaire d'affichage de statut.

### Références à priceUsd, priceXaf, COUNTRIES, CountryPrice
- `CountryPrice` utilisé comme type pour `country` prop dans `CountryList` (L427), `PurchaseOptionsInline` (L497), `PurchaseConfirmation` (L754).
- `COUNTRIES` passé intégralement à `CountryList` (L125).
- `COUNTRIES.find(...)` dans `ActivationDetail` (L822), `ServiceList` (L212), `HistoryView` (L308).
- `country.priceXaf` affiché dans `CountryList` (L478).
- `country.priceUsd` utilisé comme valeur par défaut de `maxPrice` (L509) et comme fallback de `basePrice` (L529).
- `view.country.priceXaf` utilisé pour le montant de recharge dans `PurchaseConfirmation` (L118).

---

## Fichier 3: `convex/sms_provider.ts` (681 lignes)

### Fonctions API

- **Lignes 536-560**: `getNumberQuantity` — **query Convex**
  - **Args**: `{ country: v.string() }` (ISO code)
  - **Comportement**: Convertit ISO → numeric via `isoToNumeric`, appelle API `getNumbersStatus` pour le pays
  - **Retour**: `Record<string, number>` (serviceCode → count), ou `{}` si erreur/pays invalide

- **Lignes 564-585**: `getTopCountries` — **query Convex**
  - **Args**: `{ service: v.string() }`
  - **Comportement**: Appelle API `getTopCountriesByService`
  - **Retour**: `TopCountryResult[]` (tableau parsé du JSON), ou `[]` si erreur
  - **Note**: pas de validation d'auth — tout le monde peut appeler

- **Lignes 621-648**: `getOperators` — **query Convex**
  - **Args**: `{ country: v.string() }` (ISO code)
  - **Comportement**: Convertit ISO → numeric, appelle API `getOperators`
  - **Retour**: `string[]` (noms des opérateurs), ou `[]` si erreur/pays invalide
  - **Note**: pas de validation d'auth

- **Lignes 654-679**: `getPrices` — **query Convex**
  - **Args**: `{ country: v.string(), service?: v.optional(v.string()) }`
  - **Comportement**: Convertit ISO → numeric, appelle API `getPrices`
  - **Retour**: `GetPricesResult` (`Record<string, Record<string, { cost: number; count: number }>>`), ou `{}` si erreur
  - **Note**: pas de validation d'auth

### Pattern commun aux 4 queries
- Toutes utilisent `process.env.SMSONLINEPRO_API_KEY` côté backend (Convex)
- Toutes attrapent les erreurs et retournent des valeurs par défaut vides (`{}` ou `[]`)
- Toutes convertissent ISO → numeric via `isoToNumeric` de `sms_countries.ts`
- **Aucune n'a de validation d'authentification** — accessibles à tous les utilisateurs (mais protégées par le fait que Convex queries ne sont appelables que depuis le client enregistré)

### Autres fonctions clés
- `initiateActivation` (L44-137) : mutation avec vérification d'auth, solde, limite concurrente, comptabilité, scheduling.
- `pollActivation` (L141-278) : internalAction avec polling, gestion des réponses API (`NO_NUMBERS`, `WRONG_MAX_PRICE`, `NO_BALANCE`, `BAD_KEY`, `STATUS_OK`, etc.).
- `syncPrices` (L589-615) : action admin pour synchroniser les prix.

---

## Fichier 4: `src/components/purchases/hooks/use-activations.ts` (98 lignes)

- **Lignes 1-4**: Imports — `useQuery`, `useMutation`, `useQueryClient` de TanStack Query ; `convexQuery`, `useConvexMutation` de `@convex-dev/react-query`.
- **Lignes 6-14**: `activationKeys` — factory de query keys pattern : `all`, `activation(id)`, `myActivations()`, `numberQuantity(country)`, `topCountries(service)`, `operators(country)`, `prices(country, service?)`.
- **Lignes 16-25**: `useActivation(id)` et `useMyActivations()` — wraps de `convexQuery` sur `api.sms_provider.getActivation` / `getMyActivations`.
- **Lignes 27-69**: Hooks mutation : `useInitiateActivation`, `useCompleteActivation`, `useCancelActivation`, `useRequestAnotherSms` — chacun avec `onSettled` invalidant les queries pertinentes.
- **Lignes 71-76**: `useNumberQuantity(country)` — **API-driven**
  - Args : `country` (string ISO)
  - Appelle `api.sms_provider.getNumberQuantity`
  - `enabled: country.length > 0`
- **Lignes 78-83**: `useTopCountries(service)` — **API-driven**
  - Appelle `api.sms_provider.getTopCountries`
  - `enabled: service.length > 0`
- **Lignes 85-90**: `useOperators(country)` — **API-driven**
  - Appelle `api.sms_provider.getOperators`
  - `enabled: country.length > 0`
- **Lignes 92-97**: `usePrices(country, service?)` — **API-driven**
  - Appelle `api.sms_provider.getPrices`
  - `enabled: country.length > 0`

### Pattern
Tous les hooks API-driven sont des `useQuery` avec `convexQuery` pointant vers les queries Convex dans `sms_provider.ts`. Ils sont activés conditionnellement sur `country.length > 0` ou `service.length > 0`. Aucun cache staleTime personnalisé — utilise les defaults de TanStack Query.

---

## Fichier 5: `src/type/sms_activation.ts` (70 lignes)

- **Lignes 1-6**: `GetOperatorsResult = string[]` — résultat parsé de l'API `getOperators` (juste les noms d'opérateurs extraits).
- **Lignes 8-13**: `GetPricesResult = Record<string, Record<string, { cost: number; count: number }>>` — clé = numeric country code, valeur = map service → { cost, count }.
- **Lignes 16-35**: Interface `SmsActivation` — 18 champs reflétant le document Convex `activations` côté client.
- **Lignes 37-45**: `SmsActivationStatus` — union de 8 littéraux : `awaiting_number`, `awaiting_sms`, `sms_received`, `completed`, `cancelled`, `expired`, `no_numbers`, `max_price_too_low`.
- **Lignes 47-52**: `InitiateActivationInput` — `service`, `country`, `maxPrice?`, `operator?`.
- **Lignes 54-57**: `GetNumberQuantityResult = Record<string, number>` — serviceCode → count.
- **Lignes 59-64**: `TopCountryResult` — `country` (numeric), `countryText`, `count`, `retailPrice`.
- **Lignes 66-70**: `SmsProviderError` — union d'erreurs avec `code`, `message`, `minPrice?`.

### Observations
- `GetPricesResult` utilise les numeric country codes comme clés, tandis que `usePrices` dans le composant passe `country.iso` (format alpha-2). La conversion ISO → numeric se fait dans la query Convex.
- Les types sont alignés avec les retours des APIs Convex.

---

## Fichier 6: `src/__tests__/services/data.test.ts` (74 lignes)

- **Lignes 1-2**: Importe `usdToXaf`, `COUNTRIES`, `getCountryByIso`, `SERVICES` depuis `@/components/services/data`.
- **Lignes 4-29**: Tests `usdToXaf` — **BUG** : la fonction n'existe pas dans le module source, les tests échoueront (`ReferenceError` ou `Import error`).
  - `usdToXaf(0.35)` → attend 730
  - `usdToXaf(0.75)` → attend 1492
  - `usdToXaf(2.0)` → attend 3312
  - Tests de boundary à 0.5 et 1.0
  - **Ces tests révèlent le comportement attendu** : marge de 500 pour les petits montants (< 0.5?), 1000 pour moyens, 2000 pour grands — mais le code source n'existe pas.
- **Lignes 31-54**: Tests `COUNTRIES` — vérifie que toutes les entrées ont `priceUsd > 0`, `priceXaf > 0`, `flag` truthy, et que `priceXaf === usdToXaf(priceUsd)`.
- **Lignes 56-65**: Tests `getCountryByIso` — trouve `FR` → France, retourne `undefined` pour `XX`.
- **Lignes 67-74**: Tests `SERVICES` — vérifie présence de whatsapp, telegram, et au moins 10 entrées.

### Observations
- Le test est le **seul endroit qui documente le comportement attendu de `usdToXaf`**. On peut déduire la formule :
  - 0.35 → 730 → `Math.round(0.35 * 655.957 * ... )` avec marge ~500
  - 0.75 → 1492 → marge ~1000
  - 2.0 → 3312 → marge ~2000
  - **Formule probable** : `Math.round(usd * RATE) + margin` où RATE ≈ 655.957 (taux XAF/USD BEAC), avec marges progressives selon le montant.

---

## Fichier 7: `convex/sms_countries.ts` (62 lignes)

- **Lignes 8-46**: `SMS_COUNTRY_MAP: Record<number, string>` — mapping des codes numériques sms-online.pro vers ISO 3166-1 alpha-2. 172 entrées (codes 0-201, avec quelques trous : 12, 96, 106, 109, 110, 177, 182, 188, 190-195, 197-200).
- **Lignes 49-52**: `ISO_TO_SMS` — inverse du map, construit automatiquement par itération.
- **Lignes 55-57**: `numericToIso(numeric: number): string | null` — lookup direct dans `SMS_COUNTRY_MAP`.
- **Lignes 60-62**: `isoToNumeric(iso: string): number | null` — lookup dans `ISO_TO_SMS`.

### Observations
- Les codes numériques de sms-online.pro sont **séquentiels et arbitraires** (pas les indicatifs téléphoniques).
- Exemple : `FR` = 78, `US` = 187, `CM` = 41. Incohérent avec les codes téléphoniques.
- `ISO_TO_SMS` est construit avec `for...of` sur `Object.entries()`, ce qui est correct car `SMS_COUNTRY_MAP` est un objet simple (pas un `Map`).
- Le warning en commentaire L4-7 est clair et important : ne pas confondre avec les indicatifs téléphoniques.

---

## Synthèse des incohérences, bugs et patterns

| # | Fichier | Type | Description |
|---|---------|------|-------------|
| 1 | `data.ts` | **BUG** | `usdToXaf` appelé mais ni défini ni importé. Présence de l'import dans le test (qui échoue) |
| 2 | `data.ts:8-13` | **Incohérence** | `CountryPrice` n'a pas `priceUsd`/`priceXaf` dans l'interface, mais le tableau en contient |
| 3 | `data.ts` | **Code manquant** | La fonction `usdToXaf` n'existe pas — les tests en `data.test.ts` documentent le comportement attendu |
| 4 | `sms_countries.ts` | **Avertissement** | Codes sms-online.pro ≠ indicatifs téléphoniques ; bien documenté dans le commentaire |
| 5 | `sms_provider.ts` | **Pattern** | Les 4 queries API-driven n'ont pas de contrôle d'auth — accessibles à tout client |
| 6 | `my-space-page.tsx` | **UX** | Prix affichés en USD dans `PurchaseOptionsInline` (panneau achat) mais en FCFA dans `CountryList` (sélection pays) |
| 7 | `use-activations.ts` | **Pattern** | Tous les hooks API utilisent `convexQuery` avec `enabled` conditionnel, pas de staleTime surcharge |
| 8 | `sms_activation.ts` | **Cohérence** | Types alignés avec les retours API Convex, bonne couverture |
