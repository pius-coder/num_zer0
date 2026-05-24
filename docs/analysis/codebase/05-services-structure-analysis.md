# Rapport d'Analyse : Structure des Services SMS (num_zer0)

## Résumé

Les services SMS sont définis via trois couches :
1. **Static Registry** — Fichiers JSON avec 2067 services et 199 pays provenant de Grizzly
2. **Catalog Service** — Wrapper TypeScript qui indexe les données statiques 
3. **Base de Données** — Tables de mapping, overrides de prix, et règles de prix

Les prix fonctionnent en **Shadow Pricing** : le prix par défaut est calculé à partir 
du prix Grizzly × un multiplicateur fixe, avec possibilité de surcharge (override) admin.

---

## 1. Static Registry (Données Grizzly)

### Fichiers

```
public/registry/
├── grizzly-services.json       (712 KB, 2067 services)
├── grizzly-countries.json      (50 KB, 199 pays)
├── grizzly-summary.json        (2 KB, métadonnées extraction)
└── grizzly-countries-summary.json  (188 B)
```

### Format d'un service (`grizzly-services.json`)

```json
{
  "provider": "grizzlysms",
  "extractedAt": "2026-03-28T21:16:05.928Z",
  "total": 2067,
  "services": [
    {
      "externalId": "wa",
      "slug": "whatsapp",
      "name": "Whatsapp",
      "grizzlyId": 62,
      "iconId": 228,
      "iconLocalPath": "/assets/services/wa.webp"
    }
  ]
}
```

### Format d'un pays (`grizzly-countries.json`)

```json
{
  "countries": [
    {
      "externalId": "78",
      "slug": "france",
      "name": "France",
      "iconLocalPath": "/assets/countries/78.webp"
    }
  ]
}
```

**Note :** Les IDs externes sont ceux de Grizzly (ex: "78" pour la France, "wa" pour WhatsApp).

---

## 2. Catalog Service

### Fichier : `src/common/catalog/services.meta.ts`

Construit des registres en mémoire à partir des JSON statiques :

```typescript
export interface ServiceMeta {
  externalId: string       // Code Grizzly (ex: "wa")
  slug: string              // Slug interne (ex: "whatsapp")
  name: string
  nameFr: string
  nameEn: string
  category: ServiceCategory
  icon: string              // Chemin local
  grizzlyId: number
  iconId: number
}

export interface CountryMeta {
  externalId: string       // ID Grizzly (ex: "78")
  slug: string              // Slug (ex: "france")
  name: string
  icon: string
  iconId: number
}
```

### Fonctions d'accès :

| Fonction | Retour |
|----------|--------|
| `getServiceMeta(externalId)` | ServiceMeta par ID Grizzly |
| `getServiceBySlug(slug)` | ServiceMeta par slug |
| `getAllServices()` | Tous les services |
| `getServicesByCategory(cat)` | Services filtrés par catégorie |
| `searchServices(query)` | Recherche textuelle |
| `getCountryMeta(externalId)` | CountryMeta par ID Grizzly |
| `getCountryBySlug(slug)` | CountryMeta par slug |
| `getCountryByIso(isoCode)` | CountryMeta par ID (même que externalId) |
| `getAllCountries()` | Tous les pays |
| `searchCountries(query)` | Recherche textuelle |

### Catégories : `src/common/catalog/categories.ts`

```typescript
export type ServiceCategory = 
  | 'social' | 'messaging' | 'dating' | 'utility' | 'entertainment'
  | 'gaming' | 'finance' | 'transport' | 'shopping' | 'other'
```

La fonction `categorize(slug)` attribue une catégorie basée sur des mots-clés.

Le fichier `src/component/numbers/category-constants.ts` ajoute :
- `CATEGORY_COLORS` — Couleurs par catégorie
- `CATEGORY_LABELS` — Libellés français
- `HOT_SERVICES` — Liste des services populaires (whatsapp, telegram, etc.)

---

## 3. Base de Données — Tables de Services

### `src/database/schemas/services.ts`

#### `provider`
| Colonne | Type | Description |
|---------|------|-------------|
| id | text | PK (ex: 'prov_grizzly') |
| code | text | Code unique (ex: 'grizzly') |
| name | text | Nom lisible |
| apiBaseUrl | text | URL API |
| apiKeyEncrypted | text | Clé API chiffrée |
| priority | integer | Ordre (1=le plus haut) |
| isActive | boolean | Actif ou non |
| currentBalanceUsd | numeric | Solde actuel |
| balanceLastCheckedAt | timestamp | Dernière vérif |

#### `external_service_mapping`
| Colonne | Type | Description |
|---------|------|-------------|
| id | text | PK |
| localSlug | text | Slug interne |
| providerId | text | FK → provider |
| externalApiCode | text | Code chez le provider |

#### `external_country_mapping`
| Colonne | Type | Description |
|---------|------|-------------|
| id | text | PK |
| isoCode | text | Code ISO pays |
| providerId | text | FK → provider |
| externalCountryId | text | ID chez le provider |

---

## 4. Gestion des Prix

### 4.1 Tables de Prix

#### `price_override` (Shadow Pricing)
```typescript
{
  serviceSlug: string    // ex: "whatsapp"
  countryIso: string     // ex: "78" (France selon Grizzly)
  priceCredits: integer  // Prix en crédits (override)
  floorCredits: integer? // Prix plancher optionnel
  note: string?          // Raison de l'override
}
```

**Contrainte :** Unique (serviceSlug, countryIso)

#### `price_rule` (Legacy — encore utilisé dans admin API)
```typescript
{
  serviceSlug: string
  countryIso: string
  priceCredits: integer
  floorCredits: integer
  baselineWholesaleUsd: numeric
  lowStockThreshold: integer
  lowStockMultiplierPct: integer
  cachedAvailability: integer
  isActive: boolean
}
```

**Note :** `price_rule` semble être l'ancien système, encore référencé par
`app/api/admin/services/route.ts` mais `price_override` est le nouveau système.

### 4.2 Shadow Pricing — Logique

**Fichier :** `src/services/pricing-resolver.service.ts`

```typescript
async resolvePrice(serviceSlug, countryIso) {
  // 1. Check override
  const override = await db.select().from(priceOverride)
    .where(eq(serviceSlug) AND eq(countryIso))
  
  if (override) return override.priceCredits

  // 2. Map slug to Grizzly external code
  const serviceMeta = getServiceBySlug(serviceSlug)
  const grizzlyServiceCode = serviceMeta?.externalId ?? serviceSlug  // "whatsapp" → "wa"

  // 3. Fetch from Grizzly API
  const entry = await grizzly.getPricesV3(countryIso, grizzlyServiceCode)

  // 4. Compute: rawPriceUSD × 2.5 × 650
  const priceCredits = Math.ceil(entry.price * 2.5 * 650)
}
```

**Le multiplicateur :**
- `2.5` = Marge (250% du prix Grizzly)
- `650` = Taux de conversion USD → FCFA (approx)
- Résultat en crédits (arrondi au supérieur)

### 4.3 Résolution de prix pour affichage client

**Route API :** `GET /api/client/services/[slug]/countries`

1. `PricingResolverService.resolvePricesForService(slug)`
2. Pour chaque pays Grizzly + chaque override
3. Enrichi avec `CountryMeta` (nom, icône)
4. Trié par prix croissant

---

## 5. Organisation Pays/Opérateurs

### 5.1 Hiérarchie

```
Grizzly API (getCountries) → 199 pays
  └── Static Registry (JSON) → 199 pays avec icônes
       └── Catalog Service (in memory)
            ├── getAllCountries()
            └── getCountryByIso("78") → { name: "France", icon: "/assets/countries/78.webp" }
```

### 5.2 Grizzly Country IDs

Les IDs des pays chez Grizzly ne sont **pas des codes ISO standard** :
- France = `"78"` (pas "FR")
- USA = `"187"` (pas "US")
- Inde = `"22"` (pas "IN")

Le champ `externalId` dans le registry correspond à l'ID Grizzly.

### 5.3 Opérateurs

Les opérateurs (MTN, Orange, etc.) ne sont **pas modélisés individuellement**.
Grizzly gère les opérateurs en interne via plusieurs providers dans `getPricesV3`.
Le `ProviderInfo` dans les types Grizzly contient `provider_id` mais ce n'est pas 
mappé dans la base de données num_zer0.

---

## 6. Flux de Données Complet

```
Client Browser
  └─ service-grid-item.tsx (affiche icône + nom + pays count)
     └─ ServiceItem { slug, name, category, icon, hasPrices, countryCount }
        └─ GET /api/client/services → enrichi avec priceOverride stats

Client clique sur un service
  └─ country-drawer.tsx (liste des pays avec prix)
     └─ GET /api/client/services/[slug]/countries
        └─ PricingResolverService.resolvePricesForService(slug)
           ├── priceOverride (DB) → si présent, prioritaire
           └── Grizzly.getPricesV3All() → calcul: ceil(price * 2.5 * 650)

Client clique sur un pays
  └─ ActivationService.request() → activation via Grizzly
     └─ PricingResolverService.resolvePrice(slug, countryIso)
```

---

## 7. Problèmes Identifiés

### 🔴 Critique
1. **Correspondance ID pays** — Les IDs Grizzly (78, 187, etc.) sont utilisés comme
   `countryIso` partout. Ce n'est pas un standard ISO. Confusion possible.
2. **Multiplicateur hardcodé** — `× 2.5 × 650` dans `pricing-resolver.service.ts`.
   Impossible à modifier sans déploiement.
3. **Legacy price_rule** — Utilisé dans `app/api/admin/services/route.ts` alors que
   le nouveau système utilise `price_override`. Incohérence.

### 🟡 Important
4. **Static registry volumineux** — 712 KB chargé en mémoire au démarrage.
   2067 services dont beaucoup inutiles pour l'utilisateur final.
5. **Sync incomplète** — `full-service-sync.ts` existe mais référence `prov_grizzly`
   comme providerId alors que le code utilise `'grizzly'`.
6. **Catégorisation basique** — `categorize()` est basée sur des mots-clés simples.
   Certains services peuvent être mal catégorisés.

### 🟢 Observations
7. **Shadow Pricing bien implémenté** — Les overrides sont prioritaires, avec
   fallback Grizzly. Bon équilibre entre performance et flexibilité.
8. **Memoisation promise** — `fetchWithCoalescing()` évite les appels Grizzly
   concurrents pour le même (pays, service).
9. **Cache Grizzly** — TTL de 60s sur les prix Grizzly. Pas de cache distribué.

---

## 8. Fichiers Concernés — Liste Complète

### Données statiques
```
public/registry/grizzly-services.json
public/registry/grizzly-countries.json
public/registry/grizzly-summary.json
public/registry/grizzly-countries-summary.json
```

### Catalog
```
src/common/catalog/services.meta.ts
src/common/catalog/categories.ts
src/common/catalog/index.ts
```

### Schémas DB
```
src/database/schemas/services.ts
src/database/schemas/activations.ts
src/database/schemas/enums.ts
```

### Services
```
src/services/pricing-resolver.service.ts
src/services/pricing-resolver.service.test.ts
src/services/pricing.service.ts
src/services/activation.service.ts
src/services/activation.service.test.ts
src/services/provider-routing.service.ts
src/services/sync.service.ts
```

### Routes API
```
app/api/client/services/route.ts
app/api/client/services/[slug]/countries/route.ts
app/api/client/services/[slug]/providers/route.ts
app/api/admin/services/route.ts
app/api/admin/services/[slug]/route.ts
app/api/admin/countries/route.ts
app/api/admin/countries/[iso]/overrides/route.ts
```

### Composants UI
```
src/component/numbers/service-grid-item.tsx
src/component/numbers/service-list-item.tsx
src/component/numbers/service-explorer.tsx
src/component/numbers/service-search-bar.tsx
src/component/numbers/service-skeleton.tsx
src/component/numbers/country-drawer.tsx
src/component/numbers/country-drawer-header.tsx
src/component/numbers/country-list-item.tsx
src/component/numbers/country-search-input.tsx
src/component/numbers/country-flag.tsx
src/component/numbers/country-skeleton.tsx
src/component/numbers/category-constants.ts
src/component/numbers/category-filter-pills.tsx
```

### Pages
```
app/[locale]/(main)/my-space/page.tsx
app/[locale]/(main)/my-space/loading.tsx
app/[locale]/(main)/my-space/error.tsx
app/[locale]/(main)/numbers/page.tsx
```

### Scripts
```
scripts/full-service-sync.ts
scripts/recalculate-prices.ts
```
