# Phase 3 — Recherche

## Doc API sms-online.pro

### URL consultée: https://sms-online.pro/docs/api/en/
- Index général listant toutes les méthodes API disponibles.
- Endpoints pertinents pour ISSUE-009 : `getPrices`, `getTopCountriesByService`, `getNumbersStatus`.
- Base URL : `https://sms-online.pro/stubs/handler_api.php` (GET ou POST, paramètre `api_key` obligatoire).

### URL consultée: https://sms-online.pro/docs/api/en/get_prices.html

**Structure de la requête :**
```
GET /stubs/handler_api.php?action=getPrices&api_key=$api_key&country=$country&service=$service
```
Paramètres optionnels : `$country` (code numérique), `$service` (slug du service).

**Structure de la réponse :**
```
{"Country":{"Service":{"cost":Cost,"count":Count}}}
```
- `Country` : clé = code numérique du pays (integer, ex: `78` pour France)
- `Service` : clé = slug du service (string, ex: `wa` pour WhatsApp)
- `cost` : prix en EUR (float)
- `count` : nombre de numéros disponibles (integer)

→ Signature TypeScript :
```ts
type GetPricesResult = Record<string, Record<string, { cost: number; count: number }>>
```
(Confirmé dans `src/type/sms_activation.ts:10-13`)

**Erreurs possibles :** `BAD_KEY`, `WRONG_COUNTRY`, `BAD_SERVICE`

### URL consultée: https://sms-online.pro/docs/api/en/get_top_countries_by_service.html

**Structure de la requête :**
```
GET /stubs/handler_api.php?action=getTopCountriesByService&api_key=$api_key&service=<service>&freePrice=<bool>
```
Paramètres requis : `$service` (slug). Optionnel : `freePrice` (bool).

**Structure de la réponse :**
```json
{
  "0": { "country": 0, "count": 43575, "price": 15.00, "retail_price": 30.00 },
  "1": { "country": 1, "count": 12345, "price": 12.50, "retail_price": 25.00 }
}
```
- Clés numérotées (index du tableau JSON, pas l'ID pays)
- `country` : code numérique sms-online.pro
- `count` : nombre de numéros disponibles
- `price` : prix du provider (EUR)
- `retail_price` : prix de détail conseillé (EUR)

→ TypeScript :
```ts
interface TopCountryResult {
  country: number;       // numeric sms-online.pro code
  countryText?: string;  // nom du pays (pas documenté dans l'API mais présent dans les types)
  count: number;         // disponibilité
  price?: number;        // prix provider
  retailPrice?: number;  // prix conseillé
}
```
(Confirmé dans `src/type/sms_activation.ts:59-64`)

### URL consultée: https://sms-online.pro/docs/api/en/get_numbers_status.html

**Structure de la requête :**
```
GET /stubs/handler_api.php?action=getNumbersStatus&api_key=$api_key&country=$country
```
Paramètre : `$country` (code numérique sms-online.pro).

**Structure de la réponse :**
```json
{ "fb": 523, "wa": 35235, "tg": 46346, "ig": 3434 }
```
- Clés = slugs de services (ex: `wa` = WhatsApp, `tg` = Telegram, `ig` = Instagram, `fb` = Facebook)
- Valeurs = nombre de numéros disponibles (integer)

→ TypeScript :
```ts
type GetNumberQuantityResult = Record<string, number>
```
(Confirmé dans `src/type/sms_activation.ts:54-57`)

**Erreurs :** `BAD_KEY`, `SERVER_ERROR`

---

## Docs internes

### AGENTS.md — Conventions du projet

- **Feature Folder Pattern** : chaque feature dans `src/components/<feature>/` suit une structure :
  ```
  docs/          # Cycle de vie (CHANGELOG.md, CONTINUE.md, TODOS.md)
  hooks/         # Hooks complexes (Convex mutations, query factories, etc.)
  index.ts       # Barrel export
  <composant>.tsx # UI simple inline
  ```
- **Max 200 lignes par fichier** (ESLint `max-lines`, ignoré pour `routeTree.gen.ts` et les lignes vides/commentaires).
- **Hooks vs Inline** :
  - `hooks/` : Convex mutations avec `useConvexMutation` + `withOptimisticUpdate` + `useMutation` ; query key factories ; logique 3+ étapes.
  - Inline : composants purement UI/état local.
- **React Query + Convex** : Query descriptors pattern (`todoQueries.list()`), mutations avec `withOptimisticUpdate`.
- **Router + Query** : `QueryClient` créé par requête dans `router.tsx`, `defaultPreloadStaleTime: 0`, SSR hydration via `setupRouterSsrQueryIntegration`.
- **Convex auth** : Ne jamais truster le `userId` client — utiliser `ctx.auth.getUserIdentity()`.

### ARCHITECTURE.md — Sections pricing

- **L198-199** : Formule de pricing documentée :
  > EUR base rates → XAF markup formula: `ceil(priceEUR * 655.957) + margin`
- **Margin tiers** (L199) :
  - < 0.5€ → +500 XAF
  - ≤ 1.0€ → +1000 XAF
  - > 1.0€ → +2000 XAF
- **Services** : 10 supportés (WhatsApp, Telegram, Viber, Signal, etc.)
- **Countries** : 70+ supportés
- **SMS providers** (L227) : Virtual number provisioning via API keys dans `.env`
- **Env vars** (L241) : `SMSONLINEPRO_API_KEY` — clé API du provider

### .env.example — Variables d'environnement

- L73 : `SMSONLINEPRO_API_KEY=` — variable pour l'API sms-online.pro (prête à configurer)

### TanStack Query Best Practices (skill)

Patterns pertinents déjà suivis par le code :
- **Query Key Factories** (`qk-factory-pattern`) — utilisé dans `use-activations.ts` via `activationKeys`
- **Invalidate queries after mutations** (`mut-invalidate-queries`) — utilisé dans les hooks mutation avec `onSettled`
- **Optimistic updates** (`mut-optimistic-updates`) — pattern attendu mais pas encore implémenté pour les activations
- **StaleTime / caching** : actuellement pas de staleTime personnalisé — les queries API-driven utilisent les defaults

### Convex Auth Setup (skill)

- Ne jamais truster le `userId` client — toujours utiliser `ctx.auth.getUserIdentity()` côté serveur
- Queries actuelles de `sms_provider.ts` (getPrices, getTopCountries, etc.) **n'ont pas de validation d'auth** — accessibles à tout client Convex

### Fichier `convex/sms_countries.ts` — Mapping ISO ↔ Numeric

- **172 entrées** dans `SMS_COUNTRY_MAP` (codes 0-201 avec quelques trous : 12, 96, 106, 109, 110, 177, 182, 188, 190-195, 197-200 absents)
- Ce sont des codes **séquentiels arbitraires** du provider — PAS les indicatifs téléphoniques (ex: `FR` = 78, `US` = 187, `CM` = 41)
- Fonctions utilitaires : `numericToIso(numeric) → string | null`, `isoToNumeric(iso) → number | null`
- `ISO_TO_SMS` construit automatiquement par inversion

### `src/components/spa/docs/` — État

- **N'existe pas**. Le répertoire `docs/` manque dans `src/components/spa/` alors que le Feature Folder Pattern le requiert. 9 fichiers présents dans `spa/` sans docs/ (ni CHANGELOG, CONTINUE, TODOS).

---

## Insights clés

1. **Structure API getPrices** : `Record<numericCountryCode, Record<serviceSlug, {cost: number, count: number}>>` — le prix `cost` est en EUR. La conversion XAF se fait côté client selon la formule `ceil(cost * 655.957) + margin`.

2. **Mapping des pays** : Le bridge ISO↔numeric existe déjà dans `convex/sms_countries.ts` avec 172 entrées. Les fonctions `isoToNumeric`/`numericToIso` sont déjà utilisées par les queries Convex. Le mapping est essentiel car l'API sms-online.pro attend des codes numériques mais l'application utilise des codes ISO alpha-2.

3. **Prix API en EUR vs documentation EUR** : L'API retourne des prix en EUR (`cost`). ARCHITECTURE.md documente une formule `ceil(priceEUR * 655.957) + margin`. Les tests (`data.test.ts`) et les données statiques (`data.ts`) utilisent `priceUsd` mais avec la même formule et les mêmes marges — ce qui suggère que l'API retourne en fait des prix en EUR qui sont convertis avec ce taux.

4. **Formule complète = `Math.round(priceAPI * 655.957) + marginTier(priceAPI)`** :
   - Marges : < 0.5€ → +500, ≤ 1.0€ → +1000, > 1.0€ → +2000 XAF
   - La fonction `usdToXaf` est attendue par les tests mais **absente du code source** (BUG confirmé en Phase 2)

5. **Trois endpoints API clés identifiés** :
   - `getPrices` → prix par pays/service (`cost` EUR + `count`)
   - `getTopCountriesByService` → top pays pour un service (`country`, `count`, `price`, `retailPrice`)
   - `getNumbersStatus` → disponibilité par pays (`Record<serviceSlug, count>`)

6. **Queries Convex existantes mais non protégées** : `getPrices`, `getTopCountries`, `getNumbersStatus` sont des queries publiques (pas de `ctx.auth.getUserIdentity()`). Pour l'instant ce n'est pas bloquant car Convex restreint aux clients enregistrés, mais à améliorer.

7. **Le composant `spa/` manque de docs/ lifecycle** : Aucun CHANGELOG, CONTINUE, TODOS dans `src/components/spa/docs/` — à créer pour respecter le Feature Folder Pattern.

8. **Prix API vs prix statiques** : Le composant `PurchaseOptionsInline` utilise `apiPrice?.cost ?? country.priceUsd` comme fallback. L'API est prioritaire ; les `priceUsd`/`priceXaf` statiques de `data.ts` sont la valeur de repli. Un refresh automatique des prix depuis l'API remplacerait complètement les données statiques.
