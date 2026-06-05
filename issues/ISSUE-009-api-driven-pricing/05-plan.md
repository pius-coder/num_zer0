# Phase 5 — Plan complet

## Ordre d'exécution

**Supprimer le faux → créer le système de marges → brancher l'API → nettoyer**. On casse la compilation volontairement au Step 1 pour forcer la réécriture, on ajoute le système de marges paramétrable en Step 2 (indépendant, ne casse rien), puis on rebranche les consommateurs, et on finit par le nettoyage.

---

## Step 1 — Nettoyer les prix statiques de `COUNTRIES`

- **Fichiers**: `src/components/services/data.ts`
- **Actions**:
  - Supprimer `priceUsd`, `priceXaf`, `flag` de chaque entrée du tableau `COUNTRIES` (L665-748) — 83 objets à réduire à `{ iso, code, name, phonePrefix }`
  - Supprimer les 83 appels à `usdToXaf(...)` qui n'existent pas
  - L'interface `CountryPrice` (L8-13) reste inchangée — elle n'avait déjà pas ces champs, le contrat type est intact
- **Résultat**: `COUNTRIES` = mapping pays statique sans prix. `CountryPrice` = `{ iso, code, name, phonePrefix }`. Plus de référence à `usdToXaf` dans le fichier.
- **Impact compilation**: `my-space-page.tsx` casse sur 4 références : L118 (`.priceXaf`), L478 (`.priceXaf`), L509 (`.priceUsd`), L529 (`.priceUsd`). Les tests `data.test.ts` cassent sur `usdToXaf` import + assertions `priceUsd`/`priceXaf`.

---

## Step 2 — Créer le système de marges paramétrable (base pour le futur admin dashboard)

- **Fichiers**: `convex/margin_tiers.ts` (NOUVEAU), `convex/schema.ts` (MODIFIER), `convex/_generated/` (auto-régénéré)
- **Contexte**: Le futur dashboard admin doit permettre de voir toutes les directions (pays+service) dans un tableau avec recherche/filtre, et d'override les marges manuellement. On pose l'infrastructure maintenant, les defaults sont en place, le dashboard viendra plus tard.
- **Actions**:
  - Créer `convex/margin_tiers.ts` avec :
    - `DEFAULT_MARGIN_TIERS` — constantes, 3 paliers :
      - cost ≤ 0.5 USD → marge = 1000 FCFA
      - 0.5 < cost ≤ 1.0 USD → marge = 1500 FCFA
      - cost > 1.0 USD → marge = 2000 FCFA
    - Table `marginOverrides` (dans schema.ts) :
      - `countryIso: v.string()` — pays concerné
      - `serviceId: v.string()` — service concerné (ou `'*'` pour tous)
      - `marginXaf: v.number()` — marge en FCFA
      - `createdAt: v.number()`, `updatedAt: v.number()`
    - Index `by_country_service` sur `marginOverrides` pour lookup rapide
    - Query `getEffectiveMargin(args: { countryIso, serviceId, costUsd })` :
      1. Cherche un override exact (countryIso + serviceId) dans `marginOverrides`
      2. Si pas trouvé, cherche override générique (countryIso + serviceId='*')
      3. Si pas trouvé, applique le palier par défaut basé sur `costUsd`
      4. Retourne `{ marginXaf: number, source: 'override' | 'default' }`
  - Ajouter `marginOverrides` dans `convex/schema.ts` avec son index
  - Régénérer les types : `npx convex dev --once`
- **Résultat**: Une source de vérité centralisée pour les marges. Le futur admin pourra faire `npx convex dashboard` et éditer `marginOverrides` directement, ou via une future page admin. Les defaults couvrent 100% des cas tant que les overrides ne sont pas créés.
- **Note**: Ce step est indépendant — il ne casse rien, ne dépend de rien, peut être fait en parallèle.

---

## Step 3 — Réécrire `CountryList` pour afficher les prix via l'API

- **Fichiers**: `src/components/spa/my-space-page.tsx`
- **Actions**:
  - Importer `useTopCountries` depuis `@/components/purchases/hooks`
  - Remplacer la prop `countries: CountryPrice[]` (et son passage via `COUNTRIES` L125) par un appel interne `useTopCountries(service.id)`
  - Enrichir chaque `TopCountryResult` avec les données `COUNTRIES` : utiliser `countryText` pour matcher le nom dans `COUNTRIES` et récupérer `iso`, `code`, `phonePrefix` (nécessaire pour le flag et la recherche)
  - Supprimer la colonne `{c.priceXaf.toLocaleString('fr-FR')} FCFA` (L477-479) — la liste n'affiche plus de prix statique
  - Remplacer par `retailPrice` depuis l'API : afficher `top.retailPrice.toFixed(2)} USD` ou un indicateur de prix si le champ est présent
  - Gérer les états `isLoading` (skeleton/spinner), `isError` (message + country list sans prix), `isEmpty` (message "Aucun pays disponible")
  - Le paramètre `service` existe déjà dans `CountryList`, pas de changement de signature nécessaire côté appelant
  - Supprimer l'import de `COUNTRIES` de la ligne 6 (plus besoin dans `MySpacePage` après suppression de la prop L125)
- **Résultat**: `CountryList` auto-suffisant, affiche les pays et prix fournis par l'API `getTopCountriesByService`. Plus aucune dépendance à `COUNTRIES` depuis le parent.
- **Note technique**: le match par `countryText` suppose que `getTopCountries` retourne les noms dans la même locale que `COUNTRIES[n].name`. Vérifier la cohérence sur un échantillon de pays (FR, US, DE, CN).

---

## Step 4 — Brancher `PurchaseOptionsInline` sur le prix API + système de marges

- **Fichiers**: `src/components/spa/my-space-page.tsx`, `convex/margin_tiers.ts` (déjà créé Step 2)
- **Actions**:
  - **Remplacer les 3 paliers hardcodés** (Standard ×1, Prioritaire ×1.1, Premium ×1.3, L531-535) par un appel à `getEffectiveMargin` :
    - `finalPrice = convertUsdToXaf(apiPrice.cost) + effectiveMargin`
    - Les 3 tiers deviennent : Standard (margin par défaut), Prioritaire (margin ×1.2), Premium (margin ×1.5) — ou comme décidé métier
  - **L509** : Remplacer `useState(country.priceUsd)` par `useState<number | null>(null)` — plus de valeur par défaut statique. Ajouter un `useEffect` qui met `setMaxPrice(apiCost + effectiveMargin)` quand les données API arrivent (correction reviewer).
  - **L529** : Remplacer `apiPrice?.cost ?? country.priceUsd` par `apiPrice?.cost ?? null`. Si pas de prix API, `basePrice` est `null`.
  - **Conséquence L531-535** : Si `basePrice` est `null`, les `tiers` ne peuvent pas être calculés. Ajouter une guarde : `if (!basePrice) return <div>Prix non disponible</div>` avant la section tiers.
  - **Conséquence L544** : `handleBuy` doit vérifier que `basePrice` n'est pas `null` avant de pouvoir lancer l'achat. Bloquer le CTA si pas de prix.
  - **Conséquence L540** : `displayPrice` utilise `maxPrice` qui démarre à 0 — si `apiPrice` n'est pas encore chargé, `displayPrice` sera 0. Ajouter une guarde d'affichage : ne render que quand `basePrice` est défini.
  - **Loading/error states** : utiliser `isFetching` et `isError` de `usePrices()` pour afficher un spinner ou "Impossible de récupérer le prix" avec CTA désactivé.
  - **Supprimer le commentaire L528-529** "Use API price as base, fall back to country price from local data" — plus de fallback.
- **Résultat**: Prix calculé = API cost (USD) → XAF + marge configurable. Achat impossible sans prix API. Base pour le dashboard admin (les overrides de marges seront lus automatiquement).

---

## Step 5 — Corriger le montant de topup suggéré

- **Fichiers**: `src/components/spa/my-space-page.tsx`
- **Actions**:
  - **L118** : `view.country.priceXaf` n'existe plus. Remplacer par un montant fixe (ex: 10) ou par `view.country.priceXaf ?? 10` pour ne pas casser la compilation.
  - Alternative : passer `0` (montant libre) et laisser l'utilisateur choisir son montant de recharge dans le panneau topup.
  - Ou : ne pas passer de montant du tout et supprimer le paramètre `amount` de `openPanel('topup', ...)` — la recharge n'est pas liée à l'activation.
- **Résultat**: Le bouton "Recharger" ouvre le panneau sans montant pré-rempli (ou avec une valeur par défaut arbitraire).

---

## Step 6 — Nettoyer les tests

- **Fichiers**: `src/__tests__/services/data.test.ts`
- **Actions**:
  - L2 : Supprimer `usdToXaf` de l'import (fonction supprimée)
  - L4-29 : Supprimer tout `describe('usdToXaf', ...)` — 5 tests à retirer
  - L31-54 : Supprimer tout `describe('COUNTRIES', ...)` — 3 tests à retirer (validations `priceUsd`, `priceXaf`, `flag`)
  - Conserver `describe('getCountryByIso', ...)` et `describe('SERVICES', ...)` — ils ne référencent pas les champs supprimés
- **Résultat**: Tests passent sans référence à des champs ou fonctions supprimés.

---

## Step 7 — Mettre à jour la doc

- **Fichiers**: `src/components/layout/docs/BOTTOM-NAV.md`
- **Actions**:
  - L75 : Remplacer `openPanel('topup', { amount: country.priceXaf })` par `openPanel('topup')` (ou `openPanel('topup', { amount: 0 })`)
- **Résultat**: L'exemple de la doc est cohérent avec le nouveau modèle sans `priceXaf`.

---

## Step 8 — Validation finale

- **Fichiers**: tous
- **Actions**:
  - Lint: `npx eslint src/` — vérifier qu'aucune référence résiduelle à `priceUsd`, `priceXaf`, `flag` dans les fichiers modifiés
  - TypeScript: `npx tsc --noEmit` — vérifier que le type `CountryPrice` est compatible partout (notamment les `COUNTRIES.find(...)` dans `ServiceList` L212, `HistoryView` L308, `ActivationDetail` L822 — ces appels ne lisent que `.iso`/`.name`, ils passent sans erreur)
  - Build: `npm run build` — vérifier que le bundle se construit
  - Tests: `npx vitest run src/__tests__/services/data.test.ts` — 2 describe blocks restants doivent passer
- **Résultat**: Code propre, typé, testé.

---

## Résumé des fichiers modifiés

| Step | Fichier | Nature |
|------|---------|--------|
| 1 | `src/components/services/data.ts` | Suppression données statiques |
| 2 | `convex/margin_tiers.ts` + `convex/schema.ts` | Système de marges paramétrable (base admin) |
| 3 | `src/components/spa/my-space-page.tsx` | CountryList API-driven |
| 4 | `src/components/spa/my-space-page.tsx` + `convex/margin_tiers.ts` | PurchaseOptionsInline avec marges + API |
| 5 | `src/components/spa/my-space-page.tsx` | Topup sans priceXaf |
| 6 | `src/__tests__/services/data.test.ts` | Tests obsolètes supprimés |
| 7 | `src/components/layout/docs/BOTTOM-NAV.md` | Doc corrigée |

## Fichiers NON modifiés (hors scope, confirmé)

- `src/components/landing/data/index.ts` — `COUNTRIES` différent (indépendant, marque-page)
- `src/components/landing/country-flags.tsx` — import depuis `./data` local
- `convex/purchases.ts`, `convex/schema.ts`, `src/type/purchase.ts` — domaine topup/recharge
- `src/components/wallet/*` — historique wallet, utilise `Package.priceXaf`
