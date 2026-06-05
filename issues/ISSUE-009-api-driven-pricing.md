# Issue: Remplacer les prix statiques du CountryPrice par les prix API (no backward compat)

**Date:** 2026-06-05
**Priorité:** Haute
**Statut:** Ouvert
**Composant(s):** `src/components/services/data.ts`, `src/components/spa/my-space-page.tsx`, `src/components/purchases/hooks/use-activations.ts`, `src/type/sms_activation.ts`, `convex/sms_provider.ts`, `src/__tests__/services/data.test.ts`
**Signalé par:** afreeserv
**Contrainte:** **No backward compatibility — full reimplementation, API-driven pricing.**

---

## Phase 1 — Exploration (sortie des agents)

> 3 agents `explore` lancés en parallèle. Sortie brute (path + line interval + rôle).

### Agent 1 — Mapping des prix statiques (priceUsd / priceXaf / usdToXaf / CountryPrice)

| Fichier | Intervalle | Rôle |
|---|---|---|
| `C:\Users\pc\num_zer0\src\components\services\data.ts` | L1-L26 (interfaces + usdToXaf), L28-L672 (SERVICES), L677-L761 (COUNTRIES + priceUsd/priceXaf), L763-L769 (helpers) | **Source de vérité** des prix statiques |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L6-L7 (imports), L31 (type), L118 (priceXaf topup), L125, L212, L308, L422, L427, L428, L434, L439, L497, L754, L478 (display), L509 (maxPrice state), L529 (fallback) | Consommateur principal |
| `C:\Users\pc\num_zer0\src\components\wallet\wallet-purchase-history.tsx` | L52 | `p.priceXaf` — **DOMAINE DIFFÉRENT** (topup purchase, à NE PAS toucher) |
| `C:\Users\pc\num_zer0\src\type\purchase.ts` | L5, L20 | `Package.priceXaf` / `Purchase.priceXaf` — **TOPUP**, hors scope |
| `C:\Users\pc\num_zer0\convex\schema.ts` | L34, L41 | `packages.priceXaf` / `purchases.priceXaf` — **TOPUP**, hors scope |
| `C:\Users\pc\num_zer0\convex\purchases.ts` | L89, L125, L174, L185, L332, L421, L428, L433, L439, L468, L480 | Topup/conversion, hors scope |
| `C:\Users\pc\num_zer0\convex\sms_provider.ts` | L69-L70, L107, L113, L125-L126 | Lit `priceUsd` des args (déjà API-driven côté mutation) |
| `C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts` | L2, L4-L51, L67-L72 | Tests sur les prix statiques — à supprimer |
| `C:\Users\pc\num_zer0\scripts\add_phone_prefix.mjs` | L24, L25 | Migration script — référence commentée |
| `C:\Users\pc\num_zer0\scripts\generate_services.mjs` | L3, L6, L85, L91, L103, L104, L116, L121 | Génère `SERVICES`, à voir |
| `C:\Users\pc\num_zer0\src\components\layout\docs\BOTTOM-NAV.md` | L75 | Doc — exemple `country.priceXaf` à mettre à jour |

### Agent 2 — Mapping du flow API sms_provider

| Fichier | Intervalle | Rôle |
|---|---|---|
| `C:\Users\pc\num_zer0\convex\sms_provider.ts` | L1-L681 (complet), `smsProGet` L16-L24, `smsProGetJson` L26-L33, `getNumberQuantity` L536-L560, `getTopCountries` L564-L586, `syncPrices` L589-L616, `getOperators` L621-L649, `getPrices` L654-L681 | Module principal Convex |
| `C:\Users\pc\num_zer0\src\components\purchases\hooks\use-activations.ts` | L1-L98, `useNumberQuantity` L71, `useTopCountries` L78, `useOperators` L85, `usePrices` L92 | Hooks React Query |
| `C:\Users\pc\num_zer0\src\type\sms_activation.ts` | L1-L70, `GetOperatorsResult` L6, `GetPricesResult` L13, `GetNumberQuantityResult` L54, `TopCountryResult` L59 | Types client |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | `useOperators` L504, `useNumberQuantity` L505, `usePrices` L506 — `useTopCountries` n'est PAS consommé | SPA consumer |
| `C:\Users\pc\num_zer0\convex\sms_countries.ts` | L1-L62, `SMS_COUNTRY_MAP` L8, `numericToIso` L55, `isoToNumeric` L60 | Mapping ISO ↔ numeric |
| `C:\Users\pc\num_zer0\src\__tests__\convex\sms_countries.test.ts` | L1-L73 | Tests mapping |
| `C:\Users\pc\num_zer0\scripts\test_sms_provider.mjs` | L1-L93 | Smoke tests HTTP |

### Agent 3 — Tests / schema / config / docs

| Fichier | Intervalle | Rôle |
|---|---|---|
| `C:\Users\pc\num_zer0\src\__tests__\services\data.test.ts` | L1-L74 | Tests prix statiques — **à supprimer** |
| `C:\Users\pc\num_zer0\src\__tests__\convex\sms_countries.test.ts` | L1-L73 | Tests mapping — **à garder** |
| `C:\Users\pc\num_zer0\convex\schema.ts` | L121 total | Schema Convex (priceXaf = topup, hors scope) |
| `C:\Users\pc\num_zer0\.env.example` | L73 | `SMSONLINEPRO_API_KEY` |
| `C:\Users\pc\num_zer0\convex\_generated\api.d.ts` | L17, L18, L34, L35 | Auto-generated, **hors scope** |
| `C:\Users\pc\num_zer0\ARCHITECTURE.md` | L71, L181, L192, L201, L240 | Doc archi — pas de refactor immédiat |
| `C:\Users\pc\num_zer0\src\components\spa\docs\` | **N'EXISTE PAS** | Pas de docs lifecycle pour SPA |

**Agents utilisés:** 3 (1 explore × static prices, 1 explore × API flow, 1 explore × tests+config)

---

## Phase 2 — Lecture ciblée (résumé du code lu)

### `src/components/services/data.ts` (769 lignes)
- **L8-L16** : interface `CountryPrice` avec `priceUsd`, `priceXaf` (statiques). À supprimer.
- **L18-L26** : fonction `usdToXaf()` — conversion USD→FCFA avec marge. À supprimer.
- **L28-L672** : tableau `SERVICES` (645 entrées) — statique, à garder (les services sont des codes du provider, ils ne changent pas par service).
- **L677-L761** : tableau `COUNTRIES` (84 pays) avec `priceUsd` et `priceXaf` hardcodés. → les champs `priceUsd`/`priceXaf`/`flag` à supprimer ; `iso`, `code`, `name`, `phonePrefix` à garder.
- **L763-L765** : `getCountryByIso` — à garder.
- **L767-L769** : `getServiceBySlug` — à garder.
- **Insight clé** : les prix varient par **combinaison service+pays** (cf. `getPrices` API), pas par pays seul. Donc le `priceUsd` par pays est structurellement faux.

### `src/components/spa/my-space-page.tsx` (1044 lignes)
- **L6** : `import { SERVICES, COUNTRIES } from '@/components/services/data'`
- **L118** : `onRecharge={() => openPanel('topup', { amount: view.country.priceXaf })}` — appel de topup basé sur un prix statique (faux).
- **L125** : `countries={COUNTRIES}` passé à `CountryList`.
- **L212, L308, L822** : `COUNTRIES.find((c) => c.iso === ...)` pour résoudre l'affichage (nom + code pays).
- **L420-L485** : composant `CountryList` — affiche `c.priceXaf.toLocaleString('fr-FR') FCFA` à L478. **Prix affiché mais on n'a pas encore sélectionné le service**, donc ce prix est trompeur.
- **L478** : `<span>{c.priceXaf.toLocaleString('fr-FR')} FCFA</span>` — affichage à remplacer par un placeholder "—" + skeleton ou un appel API groupé.
- **L504-L506** : `useOperators`, `useNumberQuantity`, `usePrices(country.iso, service.id)` — déjà API-driven.
- **L509** : `useState(country.priceUsd)` — initial value du `maxPrice` stepper. Devrait venir de `apiPrice?.cost`.
- **L518-L526** : calcul `apiPrice` depuis `pricesData` (boucle sur les clés). Logique correcte mais fragile.
- **L529** : `basePrice = apiPrice?.cost ?? country.priceUsd` — fallback API-first, mais si pas d'API, fallback faux (statique).
- **L531-L535** : 3 tiers Standard / Prioritaire (×1.1) / Premium (×1.3) — multiplication de marge.

### `convex/sms_provider.ts` (681 lignes)
- **L654-L679** : `getPrices` query — `Record<string, Record<string, { cost: number; count: number }>>`. OK, déjà bon.
- **L621-L649** : `getOperators` — OK.
- **L536-L560** : `getNumberQuantity` — OK.
- **L564-L586** : `getTopCountries` — **non consommé** dans l'UI actuelle. À évaluer : supprimer ou garder ?
- **L589-L616** : `syncPrices` (action admin) — utilise `smsProGetJson` directement. OK.

### `src/components/purchases/hooks/use-activations.ts` (98 lignes)
- **L71-L97** : 4 hooks `useNumberQuantity` / `useTopCountries` / `useOperators` / `usePrices`. Tous OK.
- **L13** : `prices: (country, service?)` query key factory. OK.

### `src/type/sms_activation.ts` (70 lignes)
- Types bien définis. Aucun changement de type requis, sauf éventuellement nettoyage des types devenus inutiles.

### Tests `src/__tests__/services/data.test.ts` (74 lignes)
- **L4-L29** : tests `usdToXaf` — **à supprimer** (fonction supprimée).
- **L31-L53** : tests `COUNTRIES.priceUsd` / `priceXaf` — **à supprimer**.
- **L56-L65** : tests `getCountryByIso` — **à garder**.
- **L67-L74** : tests `SERVICES` — **à garder**.

---

## Phase 3 — Recherche (sources consultées)

### Doc API sms-online.pro (récupérée via webfetch)
- **https://sms-online.pro/docs/api/en/** : Index de toutes les méthodes. Source unique : `https://sms-online.pro/stubs/handler_api.php?action=...&api_key=...`.
- **https://sms-online.pro/docs/api/en/get_prices.html** : `getPrices` — `{"Country":{"Service":{"cost":Cost,"count":Count}}}`. Prix = combinaison pays+service. **Confirme la root cause : pas de prix par pays seul.**
- **https://sms-online.pro/docs/api/en/get_top_countries_by_service.html** : `getTopCountriesByService` — renvoie pour UN service, la liste des pays avec `{country, count, price, retail_price}`. **Utile pour la sélection de pays** (affiche le prix par pays pour un service donné).
- **https://sms-online.pro/docs/api/en/get_numbers_status.html** : `getNumbersStatus` — `{"wa": 523, "tg": 35235}` — nombre de numéros dispo par service pour UN pays.

### Docs internes
- `AGENTS.md` (skill rules) : max 200 lignes, feature folder pattern, TanStack Query + Convex.
- `.agents/skills/tanstack-query-best-practices/SKILL.md` : query key factory pattern, `useQuery` + `convexQuery` intégration.
- `.agents/skills/convex-setup-auth/SKILL.md` : `ctx.auth.getUserIdentity()`.
- `convex/sms_countries.ts` (L1-L62) : déjà le mapping `isoToNumeric` / `numericToIso` — à réutiliser côté client pour la conversion ISO ↔ numeric.
- `src/components/spa/docs/` : **n'existe pas**, pas de CONTINUE.md / CHANGELOG.md / TODOS.md pour le feature SPA.

### Insights clés de la recherche
1. **L'API ne fournit PAS de prix par pays seul** — prix = service + pays. Afficher un prix dans `CountryList` est structurellement faux.
2. **`getTopCountriesByService`** est le bon endpoint pour afficher la liste de pays avec prix pour un service donné.
3. **`sms_countries.ts`** n'a pas de mapping inverse `numericToIso(country).name` — il faudra potentiellement enrichir le mapping avec le `name` ou réutiliser `getTopCountriesByService.countryText`.

---

## Phase 4 — Analyse profonde (root cause + edge cases)

### Root cause
**Le modèle de données `CountryPrice` mélange des métadonnées statiques (iso, code, name, phonePrefix, flag) avec des prix qui dépendent du couple (pays, service) et qui sont dynamiques.** Le provider API expose les prix UNIQUEMENT via `getPrices(country, service)` ou `getTopCountriesByService(service)` — pas de prix statique par pays.

Conséquences :
- `my-space-page.tsx:478` affiche un `c.priceXaf` trompeur dans `CountryList` (l'utilisateur n'a pas encore choisi de service).
- `my-space-page.tsx:118` passe `country.priceXaf` comme montant suggéré de topup — non lié à un achat réel.
- `my-space-page.tsx:509` initialise `maxPrice` avec `country.priceUsd` au lieu d'attendre l'API.
- `my-space-page.tsx:529` fallback statique sur un prix incorrect.

### Causes secondaires
- Le test `data.test.ts` valide des invariants qui n'ont plus de sens (le `priceXaf` n'est plus dérivé du `priceUsd` puisque le `priceUsd` n'existe plus).
- L'emoji `flag` est conservé alors qu'il y a un `code` ISO — incohérent avec la migration ISSUE-008 vers flagcdn (le `flag` emoji n'est pas utilisé en pratique dans `my-space-page.tsx` qui utilise `${FLAG_BASE}/${c.code}.png`).

### Edge cases à gérer dans la nouvelle implémentation
1. **API indisponible / clé manquante** : `getPrices` retourne `{}`. Le code doit afficher un état "prix indisponible" plutôt qu'utiliser un fallback statique trompeur.
2. **Service sans prix pour ce pays** : `apiPrice === null`. Afficher "Indisponible" et désactiver le bouton.
3. **Pays non couvert par l'API** (rare mais possible) : `numericToIso` retourne null. Le pays ne devrait pas apparaître.
4. **Chargement de la liste de pays** : si on veut afficher les prix dans `CountryList`, on doit soit :
   - **(a)** appeler `getTopCountriesByService(service)` qui renvoie la liste FILTRÉE des pays dispo pour CE service avec leur prix → on perd la liste statique de 84 pays.
   - **(b)** garder la liste statique et afficher "Sélectionner pour voir le prix" + skeleton lors du hover/click.
   - **(c)** appeler `getPrices(country)` pour chaque pays en batch (N+1 queries) — non viable.
5. **Convergence de la liste des pays** : aujourd'hui `COUNTRIES` est statique. Le provider n'a peut-être pas tous ces pays. **Décision** : afficher la liste dynamique du provider quand un service est sélectionné, et garder la liste statique pour les autres usages (affichage seul, e.g. compte/préférences).
6. **`useTopCountries` est mort** : exporté dans `use-activations.ts:78` mais jamais consommé. **Décision** : le brancher à `CountryList` pour avoir une liste API-driven par service.

### Si "no backward compat" demandé — legacy à supprimer
- Champ `priceUsd` dans `CountryPrice` → **SUPPRIMER**.
- Champ `priceXaf` dans `CountryPrice` → **SUPPRIMER**.
- Champ `flag` (emoji) dans `CountryPrice` → **SUPPRIMER** (doublon de `code` ; ISSUE-008 a déjà migré vers flagcdn).
- Fonction `usdToXaf` → **SUPPRIMER** (les prix en FCFA sont dérivés dynamiquement).
- Lignes 118, 478, 509, 529 de `my-space-page.tsx` qui référencent ces champs → **RÉÉCRIRE**.
- Tests `usdToXaf` (L4-L29) et `priceUsd/priceXaf` (L31-L53) de `data.test.ts` → **SUPPRIMER**.
- L'import `priceXaf` dans `data.test.ts` → **SUPPRIMER**.

**Ce qui NE doit PAS être supprimé** (séparation claire) :
- `convex/purchases.ts`, `src/type/purchase.ts`, `src/components/wallet/wallet-purchase-history.tsx` — leur `priceXaf` est celui des **recharges topup**, pas des activations. Domaine différent.
- `convex/sms_provider.ts` (les queries API sont déjà correctes).
- `sms_countries.ts`.

---

## Phase 5 — Plan complet (steps atomiques)

> Ordre : supprimer le faux → créer le système de marges → brancher l'API → nettoyer. Un commit = un step.

### Step 1 — Supprimer le faux (no backward compat) dans la source
- **Fichiers** : `src/components/services/data.ts`
- **Actions** :
  - Supprimer `priceUsd`, `priceXaf`, `flag` de l'interface `CountryPrice` (L13-L15).
  - Supprimer la fonction `usdToXaf` (L18-L26).
  - Pour chaque entrée de `COUNTRIES` (L677-L761) : supprimer les 3 champs `priceUsd`, `priceXaf`, `flag`. Garder `iso`, `code`, `name`, `phonePrefix`.
- **Résultat** : `CountryPrice = { iso, code, name, phonePrefix }`. `COUNTRIES` sans prix. Compilation cassée à l'étape suivante — c'est voulu.

### Step 2 — Créer le système de marges paramétrable (base pour le futur admin dashboard)
- **Fichiers** : `convex/margin_tiers.ts` (NOUVEAU), `convex/schema.ts` (MODIFIER)
- **Contexte** : Le futur dashboard admin doit permettre de voir toutes les directions (pays+service) avec recherche/filtre, et d'override les marges manuellement. On pose l'infrastructure maintenant.
- **Actions** :
  - Créer `convex/margin_tiers.ts` avec :
    - `DEFAULT_MARGIN_TIERS` — constantes, 3 paliers :
      - cost ≤ 0.5 USD → marge = 1000 FCFA
      - 0.5 < cost ≤ 1.0 USD → marge = 1500 FCFA
      - cost > 1.0 USD → marge = 2000 FCFA
    - Table `marginOverrides` (dans schema.ts) :
      - `countryIso: v.string()` — pays (ou `'*'` pour tous)
      - `serviceId: v.string()` — service (ou `'*'` pour tous)
      - `marginXaf: v.number()` — marge en FCFA
      - `createdAt: v.number()`, `updatedAt: v.number()`
    - Index `by_country_service` pour lookup rapide
    - Query `getEffectiveMargin(args: { countryIso, serviceId, costUsd })` :
      1. Cherche override exact (countryIso + serviceId)
      2. Si pas trouvé, cherche override générique (countryIso + '*')
      3. Si pas trouvé, applique le palier par défaut basé sur `costUsd`
      4. Retourne `{ marginXaf: number, source: 'override' | 'default' }`
  - Ajouter `marginOverrides` dans `convex/schema.ts` avec son index
  - Régénérer les types : `npx convex dev --once`
- **Résultat** : Source de vérité centralisée pour les marges. Le futur admin pourra override via la table `marginOverrides`. Les defaults couvrent 100% des cas.
- **Note** : Ce step est indépendant — ne casse rien, peut être fait en parallèle.

### Step 3 — Réécrire `CountryList` (my-space-page.tsx L420-L485) en API-driven
- **Fichiers** : `src/components/spa/my-space-page.tsx`
- **Actions** :
  - Connecter `useTopCountries(service.id)` dans `CountryList` (L420).
  - Remplacer la prop `countries: CountryPrice[]` par un appel interne `useTopCountries(service.id)`.
  - Supprimer `countries={COUNTRIES}` de l'appel parent L125.
  - Adapter le type de prop : remplacer `CountryPrice[]` par `TopCountryResult[]`.
  - Cross-référencer avec `COUNTRIES` (statique) pour récupérer `phonePrefix` et `code` ISO alpha-2 en se basant sur `countryText` (nom). **Si le nom API ne matche aucun `COUNTRIES[n].name`** : afficher le pays sans enrichissement (pas de flag, pas de phonePrefix) plutôt que de casser.
  - Pour chaque pays afficher `{retail_price} FCFA` (ou `price`) au lieu de `c.priceXaf` à L478.
  - Gérer le loading : skeleton rows pendant `isLoading`.
  - Gérer le cas vide : si `useTopCountries` renvoie `[]`, afficher "Aucun pays disponible pour ce service".
- **Résultat** : la liste de pays affiche les prix réels du provider, par service. La liste passe de 83 pays (statique) à "top N" (API) — rupture UX assumée (no backward compat).

### Step 4 — Brancher `PurchaseOptionsInline` (my-space-page.tsx L489-L741) sur API + marges
- **Fichiers** : `src/components/spa/my-space-page.tsx`, `convex/margin_tiers.ts`
- **Actions** :
  - **Remplacer les 3 paliers hardcodés** (Standard ×1, Prioritaire ×1.1, Premium ×1.3, L531-535) par un appel à `getEffectiveMargin`.
  - **L509** : remplacer `useState(country.priceUsd)` par `useState<number | null>(null)`. Ajouter un `useEffect` qui met `setMaxPrice(apiCost + margin)` quand les données API arrivent (correction reviewer).
  - **L529** : remplacer `apiPrice?.cost ?? country.priceUsd` par `apiPrice?.cost ?? null` — bloquer l'achat si null.
  - Si `apiPrice` est null : afficher "Prix indisponible, réessayez" et désactiver le bouton CTA.
  - Utiliser `isFetching` / `isError` de `usePrices()` pour spinner / message d'erreur.
- **Résultat** : Prix = API cost USD → XAF + marge configurable. Achat impossible sans prix API.

### Step 5 — Corriger le montant de topup suggéré (my-space-page.tsx L118)
- **Fichiers** : `src/components/spa/my-space-page.tsx`
- **Actions** :
  - L118 : remplacer `view.country.priceXaf` par `0` ou supprimer le paramètre `amount` — la recharge n'est pas liée à l'activation.
- **Résultat** : plus de référence à `priceXaf` dans le topup.

### Step 6 — Nettoyer le test legacy (data.test.ts)
- **Fichiers** : `src/__tests__\services\data.test.ts`
- **Actions** :
  - Supprimer le `describe('usdToXaf', ...)` (L4-L29).
  - Dans `describe('COUNTRIES')` (L31-L53) : supprimer les assertions sur `priceUsd` et `priceXaf`. Garder `iso` et `name`.
  - Garder `getCountryByIso` et `SERVICES`.
  - Mettre à jour l'import L2 : retirer `usdToXaf`.
- **Résultat** : tests alignés sur le nouveau modèle de données.

### Step 7 — Mettre à jour la doc `BOTTOM-NAV.md`
- **Fichiers** : `src/components/layout/docs/BOTTOM-NAV.md`
- **Actions** :
  - L75 : remplacer `openPanel('topup', { amount: country.priceXaf })` par `openPanel('topup')`.
- **Résultat** : doc à jour.

### Step 8 — Validation finale
- Lint + TypeScript + Build.
- Lancer `vitest` (au moins `data.test.ts` doit passer).
- Test manuel : naviguer Service → Country → Purchase → vérifier que le prix affiché = API cost + margin config.
- Vérifier le cas d'erreur : clé API absente → prix "indisponible" au lieu d'un chiffre faux.

---

## Phase 6 — Revue par 2 agents

> Revue à faire après rédaction (voir Phase 7 — validation).

---

## Phase 7 — Validation utilisateur

- [ ] Plan validé par l'utilisateur
- [ ] Revue agents validée par l'utilisateur
- [ ] GO pour application

---

## Description

[Voir Phase 4 pour la description complète du problème.]

**Observation:**
> `CountryPrice.priceUsd` et `CountryPrice.priceXaf` sont des valeurs statiques hardcodées dans `src/components/services/data.ts`. Le provider sms-online.pro expose ses prix UNIQUEMENT par combinaison (pays, service), jamais par pays seul. Conséquence : l'UI affiche des prix qui peuvent être faux (drift par rapport au provider), trompeurs (affichés avant choix du service) et structurellement incorrects (1 prix par pays pour N services).

**Attendu:**
> Suppression complète de `priceUsd` / `priceXaf` / `flag` de `CountryPrice`. Toute la tarification doit venir de l'API sms-online.pro via `useTopCountriesByService` (pour la liste de pays par service) et `usePrices(country, service)` (pour le prix exact dans la vue d'achat). UI adaptée : états de chargement, gestion d'erreur, désactivation du CTA si pas de prix.

---

## Analyse Root Cause

[Voir Phase 4 — section "Root cause".]

```text
// Code fautif actuel (my-space-page.tsx L478)
<span>{c.priceXaf.toLocaleString('fr-FR')} FCFA</span>

// Code fautif actuel (my-space-page.tsx L509)
const [maxPrice, setMaxPrice] = useState(country.priceUsd)

// Code fautif actuel (my-space-page.tsx L529)
const basePrice = apiPrice?.cost ?? country.priceUsd
```

---

## ✅ Prompt de Correction

```yaml
guidelines:
  - LIRE ce fichier ISSUE-009 complètement avant d'agir
  - LIRE les fichiers docs/ du composant (CONTINUE.md, TODOS.md, CHANGELOG.md) — s'ils existent
  - LIRE le code source COMPLET des fichiers listés en Phase 1 avant de modifier
  - CHERCHER les patterns existants (TanStack Query + Convex)
  - Ne modifier que les fichiers listés dans "Fichiers impactés"
  - Une seule responsabilité par commit (= un step)
  - TypeScript strict — pas de `any`
  - Pas de backward compat : tout l'ancien code mort doit être supprimé

steps:
  - Step 1: src/components/services/data.ts — nettoyer l'interface et les données
  - Step 2: convex/margin_tiers.ts + convex/schema.ts — système de marges paramétrable
  - Step 3: src/components/spa/my-space-page.tsx — CountryList API-driven via useTopCountries
  - Step 4: src/components/spa/my-space-page.tsx — PurchaseOptionsInline basé sur usePrices + margin system
  - Step 5: src/components/spa/my-space-page.tsx — topup amount sans priceXaf
  - Step 6: src/__tests__/services/data.test.ts — retirer tests obsolètes
  - Step 7: src/components/layout/docs/BOTTOM-NAV.md — mettre à jour l'exemple
  - Step 8: lint + typecheck + build + vitest

verification:
  - [ ] CountryList affiche les prix du provider, pas de valeur statique
  - [ ] CountryList gère l'état de chargement
  - [ ] PurchaseOptionsInline n'a aucun fallback sur priceUsd statique
  - [ ] Le bouton CTA est désactivé si pas de prix API
  - [ ] data.test.ts passe
  - [ ] Lint OK
  - [ ] TypeScript OK
  - [ ] Build OK
  - [ ] docs/ BOTTOM-NAV.md à jour
```

---

## Fichiers impactés

| Fichier | Action | Description |
|---|---|---|---|
| `src/components/services/data.ts` | MODIFIER | Supprimer `priceUsd`/`priceXaf`/`flag` de `CountryPrice` et des COUNTRIES ; supprimer `usdToXaf` |
| `convex/margin_tiers.ts` | CRÉER | Système de marges : 3 paliers par défaut (1000/1500/2000), table `marginOverrides`, query `getEffectiveMargin` |
| `convex/schema.ts` | MODIFIER | Ajouter table `marginOverrides` avec index `by_country_service` |
| `src/components/spa/my-space-page.tsx` | MODIFIER | CountryList API-driven (useTopCountries), PurchaseOptionsInline avec marges + API, topup sans priceXaf |
| `src/__tests__/services/data.test.ts` | MODIFIER | Retirer les tests sur prix statiques |
| `src/components/layout/docs/BOTTOM-NAV.md` | MODIFIER | Mettre à jour l'exemple `openPanel('topup', ...)` |

---

## Solution Appliquée

[À remplir après application]

**Commit:** `[hash]`
**Branche:** `[branche]`
**Date:** YYYY-MM-DD HH:mm

### Documentation préalable lue

- [ ] `convex/sms_countries.ts` — mapping ISO↔numeric (lu, OK)
- [ ] Code source des fichiers impactés — confirmé (lu en Phase 2)

### Changements

```
[description des changements]
```

### Fichiers modifiés

- [ ] `src/components/services/data.ts`
- [ ] `src/components/spa/my-space-page.tsx`
- [ ] `src/__tests__/services/data.test.ts`
- [ ] `src/components/layout/docs/BOTTOM-NAV.md`

### Vérification

- [ ] Docs lues avant de coder
- [ ] Test manuel OK
- [ ] Lint OK
- [ ] TypeScript OK
- [ ] Build OK
