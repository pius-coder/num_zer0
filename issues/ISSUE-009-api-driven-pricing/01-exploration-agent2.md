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

---

### Fonctions API-driven (deja bonnes)

Toutes les fonctions suivantes dans `convex/sms_provider.ts` appellent deja directement l API sms-online.pro :

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
