# Phase 6 — Revue du code existant

## Fichier: `src/components/services/data.ts` (L1-756)

- ✓ Structure claire avec `Service` et `CountryPrice` interfaces, tableaux `SERVICES` et `COUNTRIES`, fonctions lookup `getCountryByIso` / `getServiceBySlug`. La séparation des responsabilités est logique.
- ✓ `SERVICES` contient 646 entrées bien catégorisées avec une nomenclature cohérente (`id` court, `slug` kebab-case, `name` lisible, `category` normalisée).
- ✗ **BUG BLOQUANT L665-747** : `usdToXaf(priceUsd)` est appelé 83 fois dans `COUNTRIES` mais la fonction n'est ni définie ni importée dans ce module. Le fichier plante au runtime (`ReferenceError`) dès que le module est chargé par `my-space-page.tsx` (L6) ou par le test (`data.test.ts:2`). Impossible d'importer ce module sans erreur fatale.
- ✗ **Incohérence de typage L8-13** : l'interface `CountryPrice` ne déclare pas `priceUsd`, `priceXaf`, `flag`, mais les 83 entrées du tableau contiennent ces champs. TypeScript ne lève pas d'erreur (excess properties + structural typing), mais le type est un mensonge : `CountryPrice` ne représente pas la structure réelle des données.
- ✗ **Mutabilité** : ni `SERVICES` ni `COUNTRIES` n'utilisent `as const`. Les tableaux sont mutables — un import malicieux ou une mutation accidentelle pourrait modifier les données globales.
- ⚠️ **Duplication flag emoji + flagcdn.com** : chaque entrée a un `flag` emoji codé en dur (ex: `'🇫🇷'`) redondant avec l'URL `flagcdn.com/${code}.png` utilisée côté UI. L'emoji n'est référencé nulle part dans le code UI (qui utilise l'URL CDN).
- ⚠️ **Granularité des prix statiques incorrecte** : chaque pays a un prix unique (`priceUsd`) quel que soit le service. En réalité, le prix API dépend du couple (pays, service). Les 83 `priceUsd` sont donc structurellement faux pour la plupart des combinaisons pays × service.

## Fichier: `src/components/spa/my-space-page.tsx` — CountryList (L420-485)

- ✓ Composant simple et bien structuré : filtrage local, grille responsive, affichage drapeau + nom + ISO + prix.
- ✓ Gestion de la recherche (filtre par nom ou indicatif téléphonique) — UX correcte.
- ✗ **BUG L478** : `c.priceXaf.toLocaleString('fr-FR')` — `priceXaf` n'existe pas dans l'interface `CountryPrice` (typage faux). Si `usdToXaf` était défini, le prix serait affiché ; mais comme `usdToXaf` est manquant, l'erreur se produit au niveau du module (plus haut), donc ce code n'est jamais atteint. Problème de fond : le prix par pays unique est faux (ne dépend pas du service).
- ✗ **Impossible à migrer tel quel** : si on supprime `priceXaf` du tableau, `CountryList` n'affiche plus de prix dans la liste. Ce n'est pas un bug mais une dépendance forte qui devra être retravaillée.
- ✓ Le filtrage `c.phonePrefix.replace('+', '').includes(q.replace('+', ''))` est correct et gère les saisies avec/sans `+`.
- ✓ Type `countries: CountryPrice[]` propre, callback `onSelect: (c: CountryPrice) => void` bien typé.

## Fichier: `src/components/spa/my-space-page.tsx` — PurchaseOptionsInline (L489-741)

- ✓ Architecture saine : 3 appels API en parallèle (`useOperators`, `useNumberQuantity`, `usePrices`), extraction du prix API, calcul de 3 paliers (Standard ×1, Prioritaire ×1.1, Premium ×1.3), stepper, dropdown opérateurs, sélecteur durée.
- ✓ Gestion de l'état `isPending` du bouton d'achat pour éviter les doubles soumissions.
- ✓ Le pattern de boucle `for (const countryKey of Object.keys(pricesData))` pour trouver le prix du service est correct compte tenu de la structure `Record<numericCode, Record<serviceId, {cost, count}>>`.
- ✗ **BUG SILENCIEUX L529** : `apiPrice?.cost ?? country.priceUsd` — fallback silencieux sur un prix statique potentiellement faux. Si l'API est down, l'utilisateur achète à un prix obsolète sans aucun indicateur visuel. Aucun loading/error state de `usePrices` n'est exploité.
- ✗ **BUG L509** : `useState(country.priceUsd)` — initialise le stepper avec un prix statique. Si l'API retourne un prix différent, le stepper part d'une valeur fausse (mais corrigée dès que l'utilisateur clique sur un palier). La valeur initiale devrait venir de l'API ou être `0`.
- ✗ **Pas de gestion d'erreur API** : `useOperators`, `useNumberQuantity`, `usePrices` sont appelés mais leurs états `isError`, `isFetching`, `isLoading` ne sont pas utilisés. Aucun spinner/skeleton ni message d'erreur.
- ✗ **Pas de staleTime** : `usePrices`, `useOperators`, `useNumberQuantity` utilisent les defaults TanStack Query (`staleTime: 0`, `gcTime: 5min`). Chaque fois que `PurchaseOptionsInline` est monté, toutes les données sont refetchées. Pourrait être optimisé avec un `staleTime` adapté.
- ✗ **Typage non strict** : `pricesData` et `quantityData` sont utilisés sans vérification d'existence sur `service.id` (L514 `quantityData?.[service.id]` est correct mais L523 `services?.[service.id]` pourrait être `undefined` silencieusement).
- ⚠️ **`useTopCountries`** est importé dans le barrel (`hooks/index.ts:21`) mais jamais consommé dans ce fichier ni ailleurs — code mort.
- ⚠️ **`usePrices` appelle `country.iso`** (format alpha-2), la query Convex le convertit en numeric — si `isoToNumeric` retourne `null`, l'API retourne `{}` et on tombe sur le fallback silencieux. Aucune alerte pour l'utilisateur.

## Fichier: `convex/sms_provider.ts` — getTopCountries (L564-585), getPrices (L654-679)

- ✓ Pattern try/catch propre avec retour valeurs par défaut (`[]` / `{}`) en cas d'erreur API.
- ✓ Utilisation correcte de `process.env.SMSONLINEPRO_API_KEY` via Convex env vars.
- ✓ Documentation des endpoints en commentaire avant chaque fonction.
- ✗ **Pas de validation d'authentification** sur les 4 queries : `getTopCountries`, `getOperators`, `getPrices`, `getNumberQuantity` — n'importe quel client peut les appeler. Risque faible car Convex est authentifié au niveau client, mais manque de défense en profondeur.
- ✗ **`getPrices` retourne un type non validé** : `JSON.parse(text) as Record<...>` — le `as` cast est un mensonge. Si l'API retourne un format inattendu, le cast masque l'erreur et propage des données potentiellement invalides au client.
- ✗ **`getTopCountries` retour `data` brut** (L580) : le retour de l'API est parsé et renvoyé tel quel sans validation de structure. Si l'API change de format, le client recevra un type inattendu.
- ✗ **`getNumberQuantity` et `getPrices` partagent le même pattern de conversion ISO→numeric** (via `isoToNumeric`). Si le pays n'est pas dans le mapping `sms_countries.ts`, la query retourne `{}` sans distinction entre "pays inconnu" et "API indisponible".
- ⚠️ **`syncPrices` (L589-615)** est une `action` avec vérification admin, mais les queries (`getPrices`, etc.) n'ont pas cette protection. Risque de fuite de données (clé API) via les queries (même si Convex cache `process.env`).
- ✓ **`getPrices`** filtre correctement par service optionnel (L671).

## Fichier: `src/components/purchases/hooks/use-activations.ts` — L71-97

- ✓ Pattern cohérent : tous les hooks suivent le même template `useQuery` avec `convexQuery` + `enabled` conditionnel.
- ✓ Query keys factory `activationKeys` bien définie pour l'invalidation ciblée.
- ✓ `enabled: country.length > 0` / `service.length > 0` — évite les appels API avec arguments vides.
- ✗ **Risque staleTime** : pas de `staleTime` personnalisé. Les données API sont refetchées à chaque montage du composant, ce qui est coûteux pour des données (prix, opérateurs) qui changent peu fréquemment.
- ✗ **`useTopCountries` (L78-83)** : hook fonctionnel mais jamais appelé n'importe où dans le codebase. Code mort exporté dans le barrel qui ajoute du bruit.
- ✗ **`usePrices` n'a pas de sélecteur** : les données brutes de l'API sont retournées sans transformation, ce qui force `PurchaseOptionsInline` à implémenter la logique d'extraction du prix (L518-526) en dur.
- ✓ Les hooks `useOperators` et `useNumberQuantity` s'intègrent proprement avec le pattern Convex + React Query.

## Fichier: `src/type/sms_activation.ts` (L1-70)

- ✓ Types bien définis et documentés avec des commentaires JSDoc qui décrivent la structure API.
- ✓ `SmsActivation` complète avec 18 champs reflétant le document Convex — bonne couverture.
- ✓ `SmsActivationStatus` union de 8 littéraux — exhaustif.
- ✓ `SmsProviderError` avec union de codes d'erreur et `minPrice` optionnel — bien pensé.
- ✗ **`GetPricesResult` pas assez précis** : `Record<string, Record<string, { cost: number; count: number }>>` est correct mais les clés ne sont pas documentées comme étant des numeric country codes. La conversion ISO → numeric est faite dans la query Convex mais ce couplage n'est pas évident à la lecture seule du type.
- ✗ **`TopCountryResult.country` typé `number`** (L60) — devrait être documenté comme "code pays sms-online.pro" (pas l'ISO, pas l'indicatif téléphonique). Le commentaire l'indique mais le nom du champ est ambigu.
- ✓ Aucune dépendance cyclique, pas de types morts (sauf `TopCountryResult` si `useTopCountries` reste mort).
- ✓ `InitiateActivationInput` propre avec tous les champs optionnels justifiés (`maxPrice?`, `operator?`).

## Fichier: `src/__tests__/services/data.test.ts` (L1-74)

- ✓ Tests bien structurés : 4 `describe` blocs logiques avec des intentions claires.
- ✓ **Seul endroit qui documente `usdToXaf`** : les tests contiennent les valeurs attendues (0.35 → 730, 0.75 → 1492, 2.0 → 3312) qui permettent de déduire la formule de conversion.
- ✗ **BUG BLOQUANT L2** : `import { usdToXaf, ... }` — `usdToXaf` n'existe pas dans `data.ts`. L'import échoue au niveau du module (avant même l'exécution du test). La suite entière ne peut pas s'exécuter.
- ✗ **`describe('usdToXaf')` L4-29** : tests qui ne peuvent jamais passer tant que la fonction n'existe pas dans le source. Les valeurs attendues (730, 1492, 3312) sont documentées mais non vérifiables.
- ✗ **`describe('COUNTRIES')` L31-54** : boucle sur `COUNTRIES` et vérifie `c.priceUsd`, `c.priceXaf`, `c.flag` — mais ces champs ne sont pas dans l'interface `CountryPrice`. Le typage est lâche, le test passe si les propriétés existent, mais c'est une assertion sur une structure non typée.
- ✗ **`priceXaf === usdToXaf(priceUsd)` L51** : appelle `usdToXaf` qui n'existe pas — si l'import échouait moins tôt, cette ligne planterait.
- ✓ La vérification `COUNTRIES.length > 60` (L33) est correcte (83 entrées).
- ✓ La vérification `getCountryByIso('FR').name === 'France'` et `getCountryByIso('XX') === undefined` sont propres.
- ✓ La vérification des slugs (whatsapp, telegram) est utile mais minimale.

## Résumé

### Points OK (à préserver)

- Architecture des hooks Convex + React Query propre et cohérente (`use-activations.ts`)
- Structure de composants bien séparée (CountryList, PurchaseOptionsInline, ActivationDetail) avec props typées
- Types `sms_activation.ts` complets et bien documentés
- Gestion des erreurs API dans les queries Convex (try/catch + valeurs par défaut)
- Conversion ISO ↔ numeric centralisée dans `sms_countries.ts`
- Pattern `enabled: country.length > 0` pour éviter les appels inutiles
- Tests bien structurés qui documentent le comportement attendu de `usdToXaf`

### Problèmes bloquants

1. **`usdToXaf` manquante (data.ts + data.test.ts)** — la fonction est appelée 83 fois mais n'existe pas. Le module est impossible à importer sans `ReferenceError`. Les tests sont cassés. **Priorité haute — à corriger avant toute migration**, soit en définissant la fonction, soit en supprimant les appels.
2. **Interface `CountryPrice` incohérente** — ne déclare pas `priceUsd`/`priceXaf`/`flag` mais le tableau les contient. Toute migration devra nettoyer ce décalage.
3. **Fallback silencieux sur prix statique** (my-space-page.tsx:529) — `apiPrice?.cost ?? country.priceUsd` masque les erreurs API. Les utilisateurs paient potentiellement un prix faux sans le savoir.
4. **Pas de gestion loading/error sur les hooks API** dans `PurchaseOptionsInline` — l'utilisateur ne voit aucun spinner ni état d'erreur quand `usePrices` / `useOperators` / `useNumberQuantity` sont en échec ou en chargement.

### Recommandations

1. **Avant la migration** : définir `usdToXaf` dans `data.ts` (en utilisant les valeurs de test comme spécification) ou supprimer tous les appels si la migration supprime `priceXaf` statique.
2. **Remplacer le fallback silencieux** par une gestion explicite : si `apiPrice` est `null` ou `undefined`, désactiver le bouton d'achat et afficher "Prix indisponible".
3. **Ajouter `staleTime`** de 5-10 minutes sur `usePrices`, `useOperators`, `useNumberQuantity` pour éviter les refetchs inutiles à chaque montage.
4. **Scinder `CountryPrice`** en deux types : `Country` (iso, code, name, phonePrefix) et `PriceInfo` (cost, count) venant de l'API, pour éliminer le décalage type-données.
5. **Ajouter un sélecteur** à `usePrices` pour extraire directement `{cost, count}` pour un service donné, plutôt que de faire l'extraction dans le composant.
6. **Supprimer ou justifier `useTopCountries`** — code mort qui ajoute de la dette technique.
7. **Ajouter un guard d'authentification** sur les 4 queries Convex API-driven (vérifier `ctx.auth.getUserIdentity()`).
8. **Valider le retour de l'API** dans `getPrices` et `getTopCountries` (utiliser un parseur/zod) au lieu du simple `as` cast.
9. **Supprimer le champ `flag` emoji** du tableau `COUNTRIES` (redondant avec `flagcdn.com`), ou l'ajouter à l'interface s'il est conservé.
10. **Corriger les tests** en premier lieu : soit définir `usdToXaf` comme point d'entrée pour valider la formule de conversion, soit supprimer les tests obsolètes si la migration supprime définitivement la fonction.
