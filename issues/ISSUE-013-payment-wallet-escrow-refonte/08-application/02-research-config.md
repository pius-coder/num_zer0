# Research: Configuration Centralisée du Taux XAF/USD

**Date:** 2026-06-08
**Objectif:** Déterminer le pattern optimal pour centraliser le taux de change XAF/USD (actuellement 600) dans le cadre de la refonte paiement/wallet/escrow (ISSUE-013)

---

## 1. Sources Consultées

| Source | URL | Contenu clé |
|--------|-----|-------------|
| Env vars (déclaration) | https://docs.convex.dev/production/environment-variables | `env: {}` dans `convex.config.ts`, génération typed `env` import depuis `_generated/server`, validateurs supportés |
| Env vars (CLI) | https://docs.convex.dev/cli/overview#environnement-variables | `npx convex env set <name> <value>`, `npx convex env list`, `npx convex env remove` |
| Env vars (déclaration détaillée) | https://docs.convex.dev/production/environment-variables#declaring-env-vars-in-convexconfigts | `env: { KEY: v.string() }` dans `defineApp()`, génération automatique du type, validation au deploy |
| Query functions | https://docs.convex.dev/functions/query-functions | `query({ args: {}, handler: () => constant })`, pas de DB nécessaire pour retourner une constante |
| Project config | https://docs.convex.dev/production/project-configuration | `convex.json`, déploiements dev/prod |
| Best practices | https://docs.convex.dev/understanding/best-practices | Préférer helper functions, pas de `Date.now()` dans les queries, éviter les `.collect()` non bornés |
| Convex `env` (typed) | https://docs.convex.dev/production/environment-variables#accessing-env-vars-via-the-env-import | `import { env } from './_generated/server'` — type-safe, préféré à `process.env` |
| convex-env (lib tierce) | https://github.com/jsadoski-rockhall/convex-env | Alternative `createEnv()` avec validation runtime, mais le pattern natif Convex suffit |
| Codebase: convex.config.ts | `/home/ubuntu/num_zer0/convex/convex.config.ts` | Définit `defineApp()`, utilise `@convex-dev/better-auth`, **aucun `env: {}` déclaré** |
| Codebase: .env | `/home/ubuntu/num_zer0/.env` | Contient `CONVEX_SELF_HOSTED_URL`, `VITE_CONVEX_URL`, `SMSONLINEPRO_API_KEY` — **pas de XAF_RATE** |
| Codebase: schema.ts | `/home/ubuntu/num_zer0/convex/schema.ts` | Table `payment_intents` avec champ `xafRate: v.number()` déjà présent |
| Codebase: users.ts | `/home/ubuntu/num_zer0/convex/users.ts:4` | `const XAF_TO_USD = 600` + helper `xafToUsd()` |
| Codebase: purchases.ts | `/home/ubuntu/num_zer0/convex/purchases.ts` | 5 occurrences de `/ 600` (hardcodé) |
| Codebase: my-space/constants.ts | `/home/ubuntu/num_zer0/src/components/my-space/constants.ts:59` | `export const XAF_USD_RATE = 600` (frontend) |

---

## 2. Pattern Recommandé: Env Var + Helper Centralisé

### 2.1 Comparaison des approches

| Approche | Avantages | Inconvénients | Recommandé ? |
|----------|-----------|---------------|:---:|
| **Constante hardcodée** (actuel) | Simple, 0 coût, 0 dépendance | Impossible à changer sans déploiement, duplication, pas de différentiation dev/prod | ❌ |
| **Table `exchangeRates`** | Modifiable sans déploiement (via mutation admin), historique, multi-devises | Overhead DB, latence query, complexité inutile pour un taux quasi-fixe, risque OCC si écriture fréquente | ❌ |
| **Env var Convex (`env` typed)** | Changeable sans déploiement (`npx convex env set`), type-safe, valeurs différentes dev/prod, 0 overhead DB, pattern natif Convex | Nécessite de setter la var sur chaque déploiement, pas d'historique | ✅ |
| **`process.env`** | Simple, pas besoin de déclaration | Pas de type safety, pas de validation au deploy | ❌ |
| **Constante + CI/CD** | Simple, versionné | Changement = déploiement + CI, pas de différenciation dev/prod | ❌ |

### 2.2 Décision: Env var typed dans `convex.config.ts`

**Justification:**

1. Le taux XAF/USD (600) n'est pas une donnée métier volatile — il change rarement (fixé par la BEAC, varie sur des mois/années). Une table DB serait du sur-engineering.
2. Une constante hardcodée force un déploiement complet pour changer le taux. Une env var permet un simple `npx convex env set XAF_USD_RATE 620 --prod`.
3. Les env vars Convex sont chiffrées au repos, typées, et validées au deploy. C'est le pattern recommandé par la doc Convex pour la configuration.
4. La table `payment_intents` a déjà un champ `xafRate: v.number()` — le taux est déjà persisté par transaction. C'est la bonne pratique (point-in-time snapshot). L'env var sert de **valeur par défaut courante**, pas de source unique historique.
5. **Cas où une table serait justifiée:** Si le taux change plusieurs fois par semaine ET que l'admin doit pouvoir le modifier via une UI sans accès au dashboard Convex. Dans ce cas, on pourrait ajouter une table `app_config` clé-valeur à l'étape 6-7 du plan.

---

## 3. Toutes les Occurrences du Taux XAF/USD dans le Codebase

### 3.1 Backend Convex

| Fichier | Ligne | Code actuel | Type |
|---------|-------|-------------|------|
| `convex/users.ts` | 4 | `const XAF_TO_USD = 600` | Constante module |
| `convex/users.ts` | 6-8 | `xafToUsd(xaf: number): number` | Helper function (utilise XAF_TO_USD) |
| `convex/purchases.ts` | 89 | `purchase.priceXaf / 600` | Hardcodé inline |
| `convex/purchases.ts` | 428 | `purchase.priceXaf / 600` | Hardcodé inline |
| `convex/purchases.ts` | 433 | `purchase.priceXaf / 600` | Hardcodé inline |
| `convex/purchases.ts` | 439 | `purchase.priceXaf / 600` | Hardcodé inline |
| `convex/purchases.ts` | 482 | `purchase.priceXaf / 600` | Hardcodé inline |

### 3.2 Frontend

| Fichier | Ligne | Code actuel | Type |
|---------|-------|-------------|------|
| `src/components/my-space/constants.ts` | 59 | `export const XAF_USD_RATE = 600` | Constante exportée |
| `src/components/my-space/index.ts` | 19 | `XAF_USD_RATE` | Barrel re-export |
| `src/components/my-space/country-list.tsx` | 7 | Import `XAF_USD_RATE` | Utilisation frontend |
| `src/components/my-space/country-list.tsx` | 27 | `getDefaultMarginXaf(tc.retailPrice) / XAF_USD_RATE` | Conversion dans le composant |
| `src/components/my-space/purchase-panel.tsx` | 4 | Import `XAF_USD_RATE` | Utilisation frontend |
| `src/components/my-space/purchase-panel.tsx` | 233 | `marginXaf / XAF_USD_RATE` | Conversion dans le composant |

### 3.3 Schéma (déjà préparé pour le nouveau système)

| Fichier | Ligne | Champ | Type | Note |
|---------|-------|-------|------|------|
| `convex/schema.ts` | 163 | `wallet_ledger_entries.metadata.xafRate` | `v.optional(v.number())` | Déjà prévu pour le nouveau ledger |
| `convex/schema.ts` | 186 | `payment_intents.xafRate` | `v.number()` | Déjà prévu pour chaque transaction |

---

## 4. Plan d'Implémentation Concret

### 4.1 Étape 1: Déclarer l'env var dans `convex.config.ts`

**Fichier:** `convex/convex.config.ts`

```ts
import { defineApp } from 'convex/server'
import betterAuth from '@convex-dev/better-auth/convex.config'

const app = defineApp({
  env: {
    XAF_USD_RATE: v.string(),
  },
})
app.use(betterAuth)

export default app
```

**Note:** On utilise `v.string()` (pas `v.number()`) car les env vars Convex sont toujours des strings au niveau du déploiement. La conversion en nombre se fera dans le helper.

### 4.2 Étape 2: Créer un helper centralisé

**Créer le fichier:** `convex/lib/rates.ts`

```ts
import { env } from '../_generated/server'

export function getXafToUsdRate(): number {
  const rate = parseInt(env.XAF_USD_RATE, 10)
  if (isNaN(rate) || rate <= 0) {
    throw new Error(`Invalid XAF_USD_RATE env var: ${env.XAF_USD_RATE}`)
  }
  return rate
}

export function xafToUsd(xaf: number): number {
  const rate = getXafToUsdRate()
  return Math.round((xaf / rate) * 100) / 100
}
```

**Alternative plus simple (sans validation à chaque appel):**

```ts
import { env } from '../_generated/server'

export const XAF_TO_USD_RATE = parseInt(env.XAF_USD_RATE, 10)
export const XAF_TO_USD_RATE_NUM = isNaN(XAF_TO_USD_RATE) ? 600 : XAF_TO_USD_RATE

export function xafToUsd(xaf: number): number {
  return Math.round((xaf / XAF_TO_USD_RATE_NUM) * 100) / 100
}
```

**Note:** Les exports basés sur `env` sont résolus au moment du déploiement de la fonction, pas à chaque appel. Utiliser `parseInt` une fois en haut du module est plus performant que dans le helper.

### 4.3 Étape 3: Supprimer l'ancienne constante et les hardcodages

| Fichier | Modification |
|---------|-------------|
| `convex/users.ts:4` | Supprimer `const XAF_TO_USD = 600`, importer `xafToUsd` depuis `./lib/rates` |
| `convex/users.ts:6-8` | Supprimer `xafToUsd()` function (déplacée dans `rates.ts`) |
| `convex/purchases.ts:89` | Remplacer `/ 600` par appel à `xafToUsd(priceXaf)` |
| `convex/purchases.ts:428` | Remplacer `/ 600` par appel à `xafToUsd(priceXaf)` |
| `convex/purchases.ts:433` | Remplacer `/ 600` par appel à `xafToUsd(priceXaf)` |
| `convex/purchases.ts:439` | Remplacer `/ 600` par appel à `xafToUsd(priceXaf)` |
| `convex/purchases.ts:482` | Remplacer `/ 600` par appel à `xafToUsd(priceXaf)` |
| `src/components/my-space/constants.ts:59` | Supprimer `XAF_USD_RATE = 600` — **le frontend ne doit pas connaître le taux** |

### 4.4 Étape 4: Frontend — Exposer le taux via une query Convex

**Créer:** `convex/rates.ts` (query publique)

```ts
import { query } from './_generated/server'
import { getXafToUsdRate } from './lib/rates'

export const getXafUsdRate = query({
  args: {},
  handler: () => {
    return getXafToUsdRate()
  },
})
```

**Côté frontend:** Remplacer l'import de `XAF_USD_RATE` constant par un hook React Query:

```ts
// Dans country-list.tsx et purchase-panel.tsx
import { useQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api'

// Dans le composant:
const { data: xafRate } = useQuery(convexQuery(api.rates.getXafUsdRate, {}))
const rate = xafRate ?? 600 // fallback pour éviter problème de rendu
```

### 4.5 Étape 5: Setter la variable d'environnement

```bash
# Dev
npx convex env set XAF_USD_RATE 600

# Prod
npx convex env set XAF_USD_RATE 600 --prod
```

### 4.6 Ordre des modifications recommandé

1. `convex/lib/rates.ts` (créer le helper centralisé)
2. `convex/convex.config.ts` (déclarer l'env var)
3. `convex/rates.ts` (créer la query publique pour le frontend)
4. `convex/users.ts` (remplacer constante par import)
5. `convex/purchases.ts` (remplacer 5 occurrences)
6. `src/components/my-space/constants.ts` (supprimer la constante frontend)
7. `src/components/my-space/country-list.tsx` (utiliser la query)
8. `src/components/my-space/purchase-panel.tsx` (utiliser la query)
9. `npx convex env set XAF_USD_RATE 600` (dev + prod)
10. `npx convex deploy` (vérifier typecheck + lint avant)

---

## 5. Risques de Chaque Approche

### 5.1 Env var (approche choisie)

| Risque | Probabilité | Mitigation |
|--------|:-----------:|------------|
| **Env var non définie** ⇢ `parseInt('')` = `NaN` ⇢ crash | Low | Fallback à 600 ou vérification au démarrage dans le helper |
| **Changement de taux sans prévenir** ⇢ comportement inattendu | Medium | Logger un warning admin, notifier les mutations en cours |
| **Frontend sans taux** ⇢ affichage cassé | Medium | Fallback côté frontend, query dédiée avec stale time raisonnable |
| **Race condition** ⇢ mutation lit l'ancien taux pendant qu'on le change | Low | Le taux est lu au début de chaque mutation, atomique dans celle-ci |
| **Oubli de setter sur un nouveau déploiement** ⇢ crash | Low | Le helper lance une erreur explicite si `NaN` ou absent |

### 5.2 Table `exchangeRates`

| Risque | Probabilité | Mitigation |
|--------|:-----------:|------------|
| **Overhead inutile** pour un taux quasi-fixe | High | Pas de mitigation — c'est la nature du pattern |
| **OCC conflicts** si écriture fréquente (admin change le taux) | Low | Mais évitable avec une table clé-valeur simple |
| **Lecture DB à chaque conversion** | Medium | Cache côté Convex (mais Convex n'a pas de cache applicatif natif) |
| **Complexité inutile** pour Step 2 | High | Surcharge cognitive pour une feature future hypothétique |

### 5.3 Constante hardcodée (actuelle, à abandonner)

| Risque | Probabilité | Mitigation |
|--------|:-----------:|------------|
| **Impossible à changer sans déploiement** | Certain | Déploiement complet (frontend + backend) |
| **Duplication** entre backend et frontend | Certain | Risque de désynchro |
| **Pas de différenciation dev/prod** | Certain | Impossible de tester un nouveau taux en dev d'abord |

---

## 6. Impact sur les Nouvelles Tables (wallets, escrows, payment_intents)

Les tables déjà créées dans Step 1 intègrent le taux correctement:

- **`payment_intents.xafRate`** (`v.number()`) — le taux est déjà snapshoté par transaction. C'est la valeur réelle utilisée pour le calcul, PAS une référence à l'env var.
- **`wallet_ledger_entries.metadata.xafRate`** (`v.optional(v.number())`) — déjà prévu pour tracer le taux au moment de l'opération.

**Principe:** L'env var `XAF_USD_RATE` est la **valeur courante**. Chaque transaction snapshot le taux dans `payment_intents.xafRate` et optionnellement dans `wallet_ledger_entries.metadata.xafRate`. C'est le pattern "point-in-time rate snapshot" standard en finance.

### 6.1 Flux de conversion dans le nouveau système

```
Admin set XAF_USD_RATE=600 via npx convex env set
                         │
                         ▼
            env.XAF_USD_RATE (Convex runtime)
                         │
                         ▼
            convex/lib/rates.ts :: getXafToUsdRate()
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         purchases.ts  users.ts   rates.ts (query)
              │          │          │
              ▼          ▼          ▼
         Snapshot dans  Solde     Frontend
         payment_intents           (via React Query)
         .xafRate
```

---

## 7. Conclusion

**Pattern retenu:** Env var Convex typée (`env.XAF_USD_RATE` déclarée dans `convex.config.ts`) + helper centralisé dans `convex/lib/rates.ts` + query publique `convex/rates.ts` pour le frontend.

**Pas de table `exchangeRates`** pour l'instant — ce serait du sur-engineering pour un taux qui change au mieux quelques fois par an. Si le besoin évolue (taux multi-devises, modification via UI admin), on pourra ajouter une table `app_config` plus tard sans breaking change.

**7 fichiers à modifier**, **1 fichier à créer** (`convex/lib/rates.ts`), **1 query à créer** (`convex/rates.ts`). Effort estimé: 30-45 minutes.
