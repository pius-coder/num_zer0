# Phase 6 — Revue du plan

## Vue d'ensemble
- Steps: 7, Ordre: **OK** (casser → rebrancher → nettoyer)

## Step 1 — Nettoyer les prix statiques de `COUNTRIES`
- ✓ Couvre exactement ce qui doit être supprimé : 83 entrées, `usdToXaf`, `priceUsd`, `priceXaf`, `flag`
- ✓ Résultat vérifiable : `COUNTRIES` = `{ iso, code, name, phonePrefix }[]`
- ✓ Impacts compilation listés correctement (4 références dans `my-space-page.tsx`, tests)
- ⚠️ `CountryPrice` conserve son nom alors qu'il ne représente plus un "price". La contrainte "no backward compat" autoriserait un rename en `Country`, mais ce n'est pas bloquant — le nom reste syntaxiquement correct.

## Step 2 — Réécrire `CountryList` pour afficher les prix via l'API
- ✓ Résultat vérifiable : `CountryList` utilise `useTopCountries(service.id)`, plus de `c.priceXaf`
- ✓ Gère `isLoading`, `isError`, `isEmpty` — couvre les états de la donnée API
- ✓ Suppression de l'import `COUNTRIES` de la ligne 6 documentée
- ✗ **Matching fragile par `countryText`** : la plan note le risque (L34) mais ne propose pas de fallback si le nom API ne matche aucun `COUNTRIES[n].name`. Ex: API renvoie "United States of America" mais `COUNTRIES` a "United States". **Correction** : ajouter un fallback — si match échoue, afficher le pays sans enrichissement (pas de flag, pas de phonePrefix) plutôt que de casser la recherche ou l'affichage.
- ✗ **Perte de la liste complète des 83 pays** : `getTopCountries` retourne uniquement les pays les plus populaires pour un service, pas les 83. Le plan remplace silencieusement une liste exhaustive par une liste partielle sans le mentionner comme une rupture majeure. **Correction** : soit documenter que la liste n'affiche plus que les top pays (comportement attendu avec "no backward compat"), soit mixer `useTopCountries` avec un fallback `COUNTRIES` pour les pays non couverts, soit utiliser `usePrices` par lot.
- ⚠️ Si un `TopCountryResult.countryText` ne matche aucun `COUNTRIES[n].name`, le pays apparaît sans `iso`/`code`/`phonePrefix` → le flag via `flagcdn.com` (L469) casse (URL `/${c.code}.png` invalide) et la recherche par phonePrefix ne fonctionne plus. Ce cas n'est pas discuté.
- ✓ **Signature `CountryList`** : le plan dit de remplacer la prop `countries` par un appel interne. Il faut supprimer `countries: CountryPrice[]` du paramètre (L427) et ne plus passer `countries={COUNTRIES}` à l'appel (L125). Le plan mentionne l'import mais pas explicitement la suppression de la prop — c'est implicite mais mérite d'être explicité.

## Step 3 — Brancher `PurchaseOptionsInline` sur le prix API uniquement
- ✓ Toutes les suppressions listées : L509, L529, fallback statique, commentaire
- ✓ `basePrice` devient `apiPrice?.cost ?? null` — pas de fallback trompeur
- ✓ Guarde `if (!basePrice)` avant les tiers — "Prix non disponible"
- ✓ Loading/error states via `isFetching`/`isError` de `usePrices`
- ✗ **Mise à jour de `maxPrice` non spécifiée** : L509 remplace `useState(country.priceUsd)` par `useState(0)`. Le plan dit "La value sera mise à jour quand apiPrice arrive" mais ne dit PAS comment. Il faut un `useEffect` qui met `setMaxPrice(apiPrice.cost)` quand `apiPrice` change, sinon le stepper affiche 0 jusqu'à interaction manuelle. **Correction** : ajouter `useEffect(() => { if (apiPrice?.cost) setMaxPrice(apiPrice.cost) }, [apiPrice?.cost])` ou initialiser `maxPrice` à `apiPrice?.cost ?? 0` dans le state avec une mise à jour réactive.
- ✓ **`handleBuy` doit vérifier `basePrice`** : mentionné, OK.
- ✗ **CTA désactivé sans prix** : le plan dit "Bloquer le CTA si pas de prix" mais ne précise pas si le bouton est désactivé ou masqué. À clarifier dans la phase d'exécution (désactiver + message est la meilleure UX).
- ⚠️ Edge case `isoToNumeric` retourne `null` pour un `country.iso` valide : `usePrices` reçoit un ISO non mappé dans `sms_countries.ts`. La convex query retourne `{}`, `apiPrice` = `null`, `basePrice` = `null`, la guarde s'enclenche. **L'edge case est géré par transitivité** — OK.

## Step 4 — Corriger le montant de topup suggéré
- ✓ L118 : `view.country.priceXaf` supprimé
- ✓ Alternatives proposées (valeur fixe, 0, suppression du paramètre)
- ✓ Résultat vérifiable : plus aucune référence à `priceXaf` dans `openPanel('topup', ...)`
- ⚠️ La décision entre `openPanel('topup', { amount: 10 })`, `openPanel('topup', { amount: 0 })`, ou `openPanel('topup')` est laissée ouverte. Ce n'est pas un problème pour le plan mais l'exécutant devra trancher.

## Step 5 — Nettoyer les tests
- ✓ Suppression de `usdToXaf` de l'import L2
- ✓ Suppression des deux `describe` blocks obsolètes (L4-29, L31-54)
- ✓ Conservation des `describe('getCountryByIso')` et `describe('SERVICES')` — OK, ils ne référencent pas les champs supprimés
- ✓ Résultat vérifiable : `data.test.ts` passe sans référence à `usdToXaf`, `priceUsd`, `priceXaf`, `flag`

## Step 6 — Mettre à jour la doc
- ✓ L75 de `BOTTOM-NAV.md` modifiée
- ✓ Résultat vérifiable : l'exemple ne référence plus `country.priceXaf`

## Step 7 — Validation finale
- ✓ Lint, TypeScript, Build, Tests — tous vérifiables
- ✓ Mention des autres appelants de `COUNTRIES.find(...)` (ServiceList, HistoryView, ActivationDetail) qui lisent `.iso`/`.name` seulement — OK, ils passent
- ⚠️ La validation TypeScript mentionne `npx tsc --noEmit`. Vérifier aussi que le type `CountryPrice` importé dans `my-space-page.tsx` L7 n'est pas utilisé comme type de retour après les changements de Step 2 (il n'est plus le type de la prop `countries`). OK.

## Résumé
- **Points OK**: 7 steps, ordre correct, tous les fichiers impactés dans l'analyse sont couverts (data.ts, my-space-page.tsx, data.test.ts, BOTTOM-NAV.md), "no backward compat" respecté, edge cases API majoritairement gérés, contrainte "pas de fallback statique" bien implémentée.
- **Problèmes bloquants**: Aucun bloquant, mais deux points critiques :
  1. **Step 2** : Le matching `countryText` → `COUNTRIES[n].name` sans fallback peut produire des entrées sans `code` → URL du flag cassée + recherche inopérante. Risque réel si les locales API diffèrent des locales du code.
  2. **Step 3** : L'absence de `useEffect` pour synchroniser `maxPrice` avec `apiPrice?.cost` laisse le stepper afficher `$0.00` après le chargement des données, forçant l'utilisateur à cliquer le stepper pour voir le prix réel.
- **Éléments manquants**:
  - Step 2 ne mentionne pas que la liste passe de 83 pays à "top N" — différence UX majeure non documentée
  - Step 2 ne spécifie pas explicitement la suppression de `countries` des props et du JSX parent (implicite mais à expliciter pour éviter l'oubli)
  - Step 3 ne spécifie pas le mécanisme de mise à jour de `maxPrice` lorsque `apiPrice` se charge
- **NOTE FINALE**: **À MODIFIER** — les deux problèmes critiques (matching countryText, sync maxPrice) doivent être résolus dans le plan avant exécution, mais la structure globale est saine et le scope est correctement délimité.
