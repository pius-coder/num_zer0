# Plan de Migration Complet : Grizzly SMS → SMS Online Pro

**Projet :** num_zer0  
**Date :** 23 Mai 2026  
**Auteur :** Orya  
**Statut :** PRÉ-PLANIFICATION (0 ligne de code modifiée)

---

## 1. Architecture Actuelle

```
Client React (Next.js 16 / Bun)
  → API Routes (App Router)
    → Services Métier
      → ActivationService       ← Orchestrateur principal
      → PricingResolverService  ← Prix (override → Grizzly × 2.5 × 650)
      → ProviderRoutingService  ← Routeur (1 seul provider: Grizzly)
      → CreditLedgerService     ← Holds / crédits
      → SyncService             ← Sync mappings & balances
      → GrizzlyClient           ← Client API SMS
    → Drizzle ORM → PostgreSQL
```

### GrizzlyClient (actuel)
- `Base { url: 'https://api.grizzlysms.com/stubs/handler_api.php' }`
- Auth: `api_key` paramètre requête
- Actions: `getNumberV2`, `setStatus`, `getStatusV1/V2`, `getBalance`
- Prix: `getPricesV3` → JSON pays/service/providers
- Cache TTL: 60s
- Retry: 3 tentatives max
- Timeout: 10s

---

## 2. Cible : SMS Online Pro

### SmsOnlineProClient (nouveau)
- `Base { url: 'https://sms-online.pro/stubs/handler_api.php' }`
- Auth: `api_key` paramètre requête
- Actions: `getNumberV2`, `setStatus`, `getStatusV1/V2`, `getBalance`
- Prix: `getPrices` → JSON pays/service
- SUPPLÉMENTAIRE: `getOperators`, `getTopCountriesByService`
- NOUVEAU: Rent API (7 endpoints)
- Cache TTL: 60s
- Retry: 3 tentatives max
- Timeout: 10s

### Différences clés
| Fonctionnalité | Grizzly | SMS Online Pro |
|---------------|---------|----------------|
| **getPricesV3** | ✅ Prix + providers | ❌ → **getPrices** (prix seulement) |
| **getOperators** | ❌ | ✅ Nouveau |
| **getTopCountriesByService** | ❌ | ✅ Nouveau |
| **getServicesList** | ✅ | ❌ (via docs api/js/script.js) |
| **getCountries** | ✅ | ❌ (via docs api/js/script.js) |
| **Rent API** | ❌ | ✅ 7 endpoints |
| **Multi-providers par prix** | ✅ | ❌ (SMS Online Pro = seul) |
| **Codes services** | 2414+ | 644+ (sprite: 2035 icônes) |
| **Codes pays** | ~188 (string) | 186 (integer, 0..) |
| **Statuts (setStatus)** | 1,3,6,8,-1 | 1,3,6,8 (pas de -1?) |
| **Currency** | USD (implicite) | USD (ISO 4217: 840) |

---

## 3. Fichiers à Modifier

### 3.1. REMPLACER — Client SMS
- `src/services/grizzly/client.ts` → `src/services/sms-online-pro/client.ts`
- `src/services/grizzly/activation.ts` → `src/services/sms-online-pro/activation.ts`  
- `src/services/grizzly/types.ts` → `src/services/sms-online-pro/types.ts`
- `src/services/grizzly/utils.ts` → `src/services/sms-online-pro/utils.ts`
- `src/services/grizzly/index.ts` → `src/services/sms-online-pro/index.ts`
- `src/services/grizzly/cache.ts` → Conservé (réutilisable)

### 3.2. SUPPRIMER (ancien Grizzly)
- `src/services/grizzly/` (tout le dossier après migration)

### 3.3. MODIFIER — Services métier
- `src/services/activation.service.ts` — Changer `getGrizzlyClient()` → `getSmsOnlineProClient()`
- `src/services/pricing-resolver.service.ts` — `getPricesV3` → `getPrices`, ajuster calcul
- `src/services/provider-routing.service.ts` — Simplifier (provider unique)
- `src/services/sync.service.ts` — Nouveau provider, nouvelles mappings

### 3.4. MODIFIER — Configuration
- `src/config/env.ts` — `GRIZZLY_API_KEY` → `SMSONLINEPRO_API_KEY`
- `.env.example` — Mettre à jour

### 3.5. MODIFIER — Base de données
- `src/database/schemas/services.ts` — Ajuster `provider` table / mappings
- `public/registry/` — Nouvelles données service/pays
- `scripts/` — Scripts de migration DB

### 3.6. MODIFIER — Pages Admin
- `app/[locale]/(admin)/admin/providers/` — Interface nouveau provider
- `app/[locale]/(admin)/admin/services/` — Afficher icônes sprite SMS Online Pro
- `app/[locale]/(admin)/admin/price-rules/` — Nouvelle structure prix
- Dashboard / logs / etc.

### 3.7. MODIFIER — Pages Client
- `src/component/numbers/` — Icônes services (sprite SMS Online Pro)
- `src/component/numbers/country-flag.tsx` — Drapeaux (nouveaux country codes)

---

## 4. Phases de Migration

### PHASE 0 — Préparation (BLOCKED)
**Avant toute modification de code**

- [ ] Dominique obtient un compte SMS Online Pro avec clé API
- [ ] On teste les appels API réels (getBalance, getNumberV2, getPrices)
- [ ] On récupère la vraie liste des services/pays depuis l'API
- [ ] On valide les correspondances de codes (services Grizzly → SMS Online Pro)
- [ ] Mapping complet services (644+) et pays (186)

### PHASE 1 — Client SMS Online Pro
**Fichiers :** `src/services/sms-online-pro/*`

- [ ] Créer `types.ts` — Types pour l'API SMS Online Pro
- [ ] Créer `activation.ts` — getNumberV2, setStatus, getStatusV1/V2, getBalance
- [ ] Créer `pricing.ts` — getPrices, getOperators, getTopCountriesByService
- [ ] Créer `client.ts` — Classe SmsOnlineProClient (extends BaseService)
- [ ] Créer `index.ts` — Singleton getter + exports
- [ ] Tests unitaires

**Différences avec Grizzly client :**
- `getPrices` au lieu de `getPricesV3` (format plat vs imbriqué)
- Pas de `providerIds` dans getNumberV2 (SMS Online Pro = provider unique)
- Ajout de `rent_time` optionnel
- `getOperators` → nouveau endpoint
- `getTopCountriesByService` → nouveau endpoint

### PHASE 2 — Intégration Services Métier
**Fichiers :** `src/services/*.service.ts`

- [ ] Modifier `activation.service.ts` :
  - Importer `getSmsOnlineProClient` au lieu de `getGrizzlyClient`
  - Vérifier que les statuts (1,3,6,8) sont identiques
  - Adapter la gestion des erreurs

- [ ] Modifier `pricing-resolver.service.ts` :
  - `getPrices` au lieu de `getPricesV3`
  - Ajuster le calcul du prix (actuellement: price × 2.5 × 650)
  - Ajouter source `getPrices` pour la disponibilité

- [ ] Modifier `provider-routing.service.ts` :
  - Supprimer la logique multi-provider
  - Simplifier (SMS Online Pro = seul provider)
  - Garder la vérification de solde

### PHASE 3 — Configuration & Environnement
**Fichiers :** `src/config/env.ts`, `.env.example`

- [ ] Remplacer `GRIZZLY_API_KEY` par `SMSONLINEPRO_API_KEY`
- [ ] Mettre à jour `.env.example`
- [ ] Ajouter `SMSONLINEPRO_BASE_URL` (optionnel, défaut: sms-online.pro)

### PHASE 4 — Sync & Registry
**Fichiers :** `src/services/sync.service.ts`, `public/registry/`

- [ ] Mettre à jour le sync service pour SMS Online Pro
- [ ] Générer les fichiers registry (services, pays, summary)
- [ ] Adapter les mappings DB (`externalServiceMapping`, `externalCountryMapping`)

### PHASE 5 — Admin Dashboard
**Fichiers :** Pages admin

- [ ] Provider admin → Interface SMS Online Pro (balance, stats)
- [ ] Services admin → Afficher les sprites SMS Online Pro
- [ ] Price rules → Nouveau format (sans multi-provider)
- [ ] Dashboard → Métriques du nouveau provider

### PHASE 6 — Interface Client
**Fichiers :** `src/component/numbers/*`

- [ ] Remplacer les icônes Grizzly (`/assets/services/*.webp`) par les sprites SMS Online Pro
- [ ] Mettre à jour le sélecteur de service
- [ ] Mettre à jour les drapeaux pays
- [ ] Adapter le paysage des prix affichés

### PHASE 7 — Migration Données
**Fichiers :** Scripts SQL

- [ ] Migrer `provider` table : Grizzly → SMS Online Pro
- [ ] Mettre à jour `externalServiceMapping`
- [ ] Mettre à jour `externalCountryMapping`
- [ ] Recalculer les prix (nouveau multiplicateur ?)
- [ ] Backup avant migration

### PHASE 8 — Tests
- [ ] Tester chaque endpoint API réellement
- [ ] Tester le flux complet: demande numéro → réception SMS → complétion
- [ ] Tester l'annulation
- [ ] Tester les prix
- [ ] Tester le sync
- [ ] Tester l'admin

---

## 5. Changements Détaillés par Fichier

### `src/services/sms-online-pro/types.ts`
```typescript
// Très similaire à Grizzly types
export interface SmsOnlineProGetNumberOptions {
  service: string
  country?: string
  maxPrice?: number
  operator?: string  // NOUVEAU !
}

export interface SmsOnlineProActivation {
  activationId: number
  phoneNumber: string
  activationCost: number
  currency: number      // ISO 4217 (840=USD)
  countryCode: string
  canGetAnotherSms: boolean
  activationTime: string
  activationOperator: string | null  // NOUVEAU !
}

// Prix: plus simple que Grizzly (pas de providers)
export interface SmsOnlineProPriceEntry {
  cost: number          // Note: "cost" pas "price"
  count: number
}

// Rent types (NOUVEAU)
export interface SmsOnlineProRentOrder {
  id: number
  endDate: string
  number: string
}
```

### `src/services/sms-online-pro/activation.ts`
```typescript
// Mêmes signatures que Grizzly, juste URL base et types différents
async function getNumberV2(base, apiKey, options) → SmsOnlineProActivation
async function setStatus(base, apiKey, activationId, status) → { status, raw }
async function getStatusV1(base, apiKey, activationId) → SmsOnlineProStatusV1
async function getStatusV2(base, apiKey, activationId) → SmsOnlineProStatusV2
async function getBalance(base, apiKey) → number
```

### `src/services/sms-online-pro/client.ts`
```typescript
class SmsOnlineProClient extends BaseService {
  constructor(apiKey: string)
  getNumberV2(options) → SmsOnlineProActivation
  setStatus(activationId, status) → { status, raw }
  getStatusV1(activationId) → SmsOnlineProStatusV1
  getStatusV2(activationId) → SmsOnlineProStatusV2
  getBalance() → number
  getPrices(country?, service?) → JSON
  getOperators(country) → { status, countryOperators }
  getTopCountriesByService(service, freePrice?) → JSON
  // Rent API (NOUVEAU)
  getRentNumber(service, country, rentTime, operator?) → SmsOnlineProRentOrder
  continueRentNumber(id, rentTime) → SmsOnlineProRentOrder
  getRentStatus(id, page?, size?) → RentStatus
  setRentStatus(id, status) → { status }
  getRentServicesAndCountries(rentTime, country) → RentServicesList
  getRentList() → { values }
  continueRentInfo(id, hours, needHistory?) → RentInfo
}
```

---

## 6. Questions en Suspens (avant implémentation)

1. **Clé API** → Besoin des credentials pour tester les vrais appels
2. **Codes services** → Mapping complet Grizzly → SMS Online Pro (644+ services)
3. **Codes pays** → Mapping Grizzly (string?) → SMS Online Pro (integer)
4. **setStatus(-1)** → Grizzly supporte -1 pour annulation immédiate. SMS Online Pro ?
5. **getServicesList / getCountries** → Pas documentés chez SMS Online Pro. Alternatives ?
6. **Multiplicateur de prix** → Actuellement 2.5 × 650. À conserver ou ajuster ?
7. **Rent API** → À intégrer ou non dans un premier temps ?
8. **Sprite icons** → 2035 icônes dans le sprite. Chargement depuis CDN ou hébergement local ?

---

## 7. Estimation Temps

| Phase | Description | Jours estimés |
|-------|-------------|---------------|
| 0 | Préparation (credentials, mapping) | BLOCKED |
| 1 | Client SMS Online Pro | 2 jours |
| 2 | Intégration services métier | 2 jours |
| 3 | Configuration & env | 0.5 jour |
| 4 | Sync & registry | 1 jour |
| 5 | Admin dashboard | 2 jours |
| 6 | Interface client | 2 jours |
| 7 | Migration données | 1 jour |
| 8 | Tests | 2 jours |
| **Total** | | **~12 jours** (après déblocage phase 0) |

---

## 8. Risques

1. **⚠️ API non documentée :** getServicesList et getCountries ne sont pas dans la doc officielle. Solution : les données sont dans le JS statique.
2. **⚠️ Codes services différents :** Même service peut avoir des codes différents (ex: "wa" vs "whatsapp"). Solution : mapping explicite.
3. **⚠️ -1 non supporté :** Grizzly supporte -1 pour annulation immédiate. SMS Online Pro n'a que 1,3,6,8. Solution : utiliser 8 pour toutes les annulations.
4. **⚠️ getPrices retourne des noms de champs différents :** "cost" au lieu de "price". Solution : adapter le parser.
5. **⚠️ Perte du multi-provider :** Grizzly permet plusieurs providers par prix. SMS Online Pro = un seul. Impact : simplification.
