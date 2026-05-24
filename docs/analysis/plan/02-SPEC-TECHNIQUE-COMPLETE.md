# Spécification Technique Complète — Migration SMS Online Pro

**Version :** 1.0  
**Branche :** `v2`  
**Statut :** BLUEPRINT (0 ligne de code modifiée)

---

## 0. Résumé des Correspondances

### Pays (Grizzly → SMS Online Pro)
Les codes pays utilisent le **même standard sms-activate** (entiers).
Exemples : 41=Cameroon, 31=South Africa, 4=Philippines, 6=Indonesia.

**Différences :**
- Grizzly: 199 pays (manque 0=Russia, 13=Israel, etc.)
- SMS Online Pro: 190 pays (dont 0=Russia)
- ~95% compatibles sans mapping

### Services (Grizzly → SMS Online Pro)
Les codes services sont **identiques** pour la plupart des services courants :
`wa` (WhatsApp), `tg` (Telegram), `fb` (Facebook), `ig` (Instagram), `vk` (VKontakte),
`ok` (Odnoklassniki), `vi` (Viber), `go` (Google), `am` (Amazon), `tw` (Twitter/X),
`sn` (Snapchat), `wb` (Weibo), `ym` (Yandex), etc.

**Différences :**
- Grizzly: 2067 services
- SMS Online Pro: 2023 services (dont 73 actifs au Cameroun)
- Les services rares peuvent avoir des codes différents

---

## 1. Nouveau Client : SmsOnlineProClient

### 1.1 Structure des Fichiers

```
src/services/sms-online-pro/
├── index.ts          ← Singleton + exports
├── client.ts         ← Classe principale (extends BaseService)
├── activation.ts     ← Méthodes d'activation
├── pricing.ts        ← Méthodes de prix
├── rent.ts           ← Rent API (location)
├── types.ts          ← Types et interfaces
├── utils.ts          ← Utilitaires (filtres, pagination)
└── cache.ts          ← Cache TTL (réutilisable depuis grizzly/)
```

### 1.2 Types (`types.ts`)

```typescript
// ─── Options de Commande ─────────────────────────────────────────────────

export interface SmsOnlineProGetNumberOptions {
  service: string
  country?: string
  maxPrice?: number
  phoneException?: string
  operator?: string     // NOUVEAU : opérateur spécifique
  ref?: string          // NOUVEAU : referral ID
}

// ─── Activation ──────────────────────────────────────────────────────────

export interface SmsOnlineProActivation {
  activationId: number
  phoneNumber: string
  activationCost: number
  currency: number        // ISO 4217 (840=USD)
  countryCode: string
  canGetAnotherSms: boolean
  activationTime: string
  activationOperator: string | null  // NOUVEAU
}

export type SmsOnlineProActivationStatus = 'ACCESS_READY' | 'ACCESS_RETRY_GET' | 'ACCESS_ACTIVATION' | 'ACCESS_CANCEL'

export type SmsOnlineProSetStatusCode = 1 | 3 | 6 | 8

export interface SmsOnlineProSetStatusResponse {
  status: SmsOnlineProActivationStatus
  raw: string
}

export type SmsOnlineProStatusV1 =
  | 'STATUS_WAIT_CODE'
  | 'STATUS_CANCEL'
  | 'STATUS_OK'
  | { remainingSeconds: number }

export interface SmsOnlineProStatusV2 {
  verificationType: number
  sms: {
    dateTime: string
    code: string
    text: string
  } | null
}

// ─── Prix ────────────────────────────────────────────────────────────────

export interface SmsOnlineProPriceEntry {
  cost: number       // Note: "cost" pas "price" comme Grizzly
  count: number
  physicalCount?: number
}

export type SmsOnlineProPricesRaw = Record<string, Record<string, SmsOnlineProPriceEntry>>

// ─── Opérateurs ─────────────────────────────────────────────────────────

export interface SmsOnlineProOperatorsResponse {
  status: 'success'
  countryOperators: Record<string, string[]>
}

// ─── Top Countries ──────────────────────────────────────────────────────

export interface SmsOnlineProTopCountry {
  country: number
  count: number
  price: number
  retail_price: number
}

// ─── Rent API ───────────────────────────────────────────────────────────

export interface SmsOnlineProRentOrder {
  id: number
  endDate: string
  number: string
}

export interface SmsOnlineProRentStatus {
  service: string
  currency: number
  quantity: string
  values: Record<string, {
    phoneFrom: string
    text: string
    service: string
    date: string
  }>
}

export interface SmsOnlineProRentList {
  status: 'success'
  values: Record<string, { id: string; phone: string }>
}

export interface SmsOnlineProRentServicesAndCountries {
  countries: Record<string, number>
  operators: Record<string, string>
  services: Record<string, {
    cost: number
    retail_cost: string
    quant: { current: number; total: number }
    search_name: string
  }>
  realHours: number
  currency: number
}

export interface SmsOnlineProRentInfo {
  price: number
  currency: number
  maxHours: number
  history?: Record<string, {
    createdDate: string
    price: string
    hours: number
  }>
}
```

### 1.3 Activation Module (`activation.ts`)

```typescript
import type { BaseService } from '../base.service'
import type {
  SmsOnlineProActivation,
  SmsOnlineProActivationStatus,
  SmsOnlineProGetNumberOptions,
  SmsOnlineProSetStatusCode,
  SmsOnlineProSetStatusResponse,
  SmsOnlineProStatusV1,
  SmsOnlineProStatusV2,
} from './types'

// Identique à Grizzly mais avec adresse API différente
// URL: https://sms-online.pro/stubs/handler_api.php
// Mêmes actions: getNumberV2, setStatus, getStatusV1, getStatusV2, getBalance

export async function getNumberV2(
  base: BaseService,
  apiKey: string,
  options: SmsOnlineProGetNumberOptions
): Promise<SmsOnlineProActivation>

export async function setStatus(
  base: BaseService,
  apiKey: string,
  activationId: number,
  status: SmsOnlineProSetStatusCode
): Promise<SmsOnlineProSetStatusResponse>

export async function getStatusV2(
  base: BaseService,
  apiKey: string,
  activationId: number
): Promise<SmsOnlineProStatusV2>

export async function getStatusV1(
  base: BaseService,
  apiKey: string,
  activationId: number
): Promise<SmsOnlineProStatusV1>

export async function getBalance(
  base: BaseService,
  apiKey: string
): Promise<number>
```

### 1.4 Pricing Module (`pricing.ts`)

```typescript
// getPrices au lieu de getPricesV3
// Format retour: { "country": { "service": { cost, count, physicalCount } } }
// Différence: pas de providerIds dans la réponse
// Champ "cost" au lieu de "price"

export async function getPrices(
  base: BaseService,
  apiKey: string,
  country?: string,
  service?: string
): Promise<SmsOnlineProPricesRaw>

export async function getOperators(
  base: BaseService,
  apiKey: string,
  country: string
): Promise<SmsOnlineProOperatorsResponse>

export async function getTopCountriesByService(
  base: BaseService,
  apiKey: string,
  service: string,
  freePrice?: boolean
): Promise<Record<string, SmsOnlineProTopCountry>>
```

### 1.5 Client Principal (`client.ts`)

```typescript
class SmsOnlineProClient extends BaseService {
  private cache: TTLCache
  private _apiKey: string

  constructor(apiKey: string, cacheTtlMs = 60_000)
  
  // Activation
  async getNumberV2(options: SmsOnlineProGetNumberOptions): Promise<SmsOnlineProActivation>
  async setStatus(activationId: number, status: SmsOnlineProSetStatusCode): Promise<SmsOnlineProSetStatusResponse>
  async getStatusV2(activationId: number): Promise<SmsOnlineProStatusV2>
  async getStatusV1(activationId: number): Promise<SmsOnlineProStatusV1>
  async getBalance(): Promise<number>
  
  // Prix & Opérateurs
  async getPrices(country?: string, service?: string): Promise<SmsOnlineProPricesRaw>
  async getOperators(country: string): Promise<SmsOnlineProOperatorsResponse>
  async getTopCountriesByService(service: string, freePrice?: boolean): Promise<Record<string, SmsOnlineProTopCountry>>
  
  // Utilitaires
  async searchPrices(filters?: { country?, service?, minCost?, maxCost?, minCount? }): Promise<any[]>
  clearCache(): void
}
```

### 1.6 Index (`index.ts`)

```typescript
import { SmsOnlineProClient } from './client'
import { env } from '@/config/env'

let _client: SmsOnlineProClient | null = null

export function getSmsOnlineProClient(): SmsOnlineProClient {
  if (!_client) {
    const apiKey = env.SMSONLINEPRO_API_KEY
    _client = new SmsOnlineProClient(apiKey, 60_000)
  }
  return _client
}

export { SmsOnlineProClient }
export type { ... } from './types'
```

---

## 2. Configuration & Environnement

### 2.1 Variables d'Environnement

**Remplacer** dans `src/config/env.ts` :
```typescript
// AVANT
GRIZZLY_API_KEY: z.string().min(1),

// APRÈS
SMSONLINEPRO_API_KEY: z.string().min(1),
```

**Dans `.env` / `.env.example`** :
```env
# AVANT
GRIZZLY_API_KEY=

# APRÈS  
SMSONLINEPRO_API_KEY=
```

### 2.2 Base URL
```typescript
// BaseService config
baseUrl: 'https://sms-online.pro/stubs/handler_api.php'
// (au lieu de 'https://api.grizzlysms.com/stubs/handler_api.php')
```

---

## 3. Modifications Services Métier

### 3.1 `src/services/activation.service.ts`

| Changement | Détail |
|-----------|--------|
| Import | `getGrizzlyClient()` → `getSmsOnlineProClient()` |
| Provider ID | `'grizzly'` → `'sms-online-pro'` |
| Paramètres getNumberV2 | Supprimer `providerIds` (inutile), ajouter `operator` optionnel |
| statut setStatus | -1 → 8 pour annulation (SMS Online Pro n'a pas -1) |
| checkCancellationStatus | Mêmes statuts V1 |

### 3.2 `src/services/pricing-resolver.service.ts`

| Changement | Détail |
|-----------|--------|
| Import | `getGrizzlyClient` → `getSmsOnlineProClient` |
| getPricesV3 | → `getPrices` (format différent) |
| getPricesV3All | → Nouvelle méthode `getPricesAll` qui agrège tous les pays |
| Calcul prix | Actuel: `price * 2.5 * 650` → **NOUVEAU: voir formule ci-dessous** |
| flattenPrices | Plus de providers dans le prix |

**NOUVELLE FORMULE DE PRIX (validée par Dominique) :**
```typescript
let priceCredits: number
if (entry.cost < 5) {
  priceCredits = Math.ceil(entry.cost * 650 + 4)
} else {
  priceCredits = Math.ceil(entry.cost * 650 + 2)
}
```

### 3.3 `src/services/provider-routing.service.ts`

**Simplification majeure :** Supprimer la logique multi-provider (fetchLiveBalance, updateProviderBalanceInDb, score). 
- Plus qu'un seul provider actif
- Vérifier simplement que le solde est suffisant
- Supprimer la table `providerBalanceLog` ou la garder pour historique

### 3.4 `src/services/sync.service.ts`

- Changer `getGrizzlyClient()` → `getSmsOnlineProClient()`
- `getServicesList` → Utiliser les données de l'API `getPrices` + `getNumbersStatus`
- `getCountries` → Utiliser les données de l'API `getPrices`

**NOUVEAU :** La liste des services vient des appels getPrices/getNumbersStatus, pas d'un endpoint getServicesList dédié.

---

## 4. Modifications Base de Données

### 4.1 Table `provider`
Mettre à jour l'enregistrement Grizzly :
```sql
UPDATE provider SET 
  code = 'sms-online-pro',
  name = 'SMS Online Pro',
  api_base_url = 'https://sms-online.pro/stubs/handler_api.php',
  api_key_encrypted = encrypt('8d2f00bbae6278c28623237a50ceb1b0')
WHERE code = 'grizzly';
```

### 4.2 Table `external_country_mapping`
Les codes pays sont identiques à ~95%. Mettre à jour les rares différences.

### 4.3 Table `external_service_mapping`
Les codes services sont identiques pour les services courants. Mettre à jour si nécessaire.

### 4.4 Table `price_rule`
Les anciens prix Grizzly doivent être recalculés avec la nouvelle formule.

---

## 5. Données Registry

### 5.1 Nouveaux fichiers

```
public/registry/
├── sms-online-pro-countries.json    ← 190 pays (depuis l'API live)
├── sms-online-pro-services.json     ← 2023 services (depuis l'API live)
└── sms-online-pro-summary.json      ← Résumé
```

### 5.2 Format (compatible avec l'existant)

```json
{
  "provider": "sms-online-pro",
  "generatedAt": "...",
  "total": 190,
  "countries": [
    {
      "externalId": "41",
      "slug": "cameroon",
      "name": "Cameroon"
    }
  ]
}
```

---

## 6. Icônes & UI

### 6.1 Services Icons
**Remplacer** le système d'icônes Grizzly (fichiers `.webp` locaux) par les **sprites CSS** de SMS Online Pro.

**Actuel :** `<img src="/assets/services/wa.webp">` (2067 fichiers webp, 4 Mo)
**Nouveau :** `<div class="svc svc-wa"></div>` avec CSS sprite (1 fichier PNG, 4.5 Mo)

**CSS :** `https://static.sms-online.pro/sprites/service-full.css`
**Sprite :** `https://static.sms-online.pro/sprites/service-full.png`

Migration des composants :
- `src/component/numbers/service-grid-item.tsx` 
- `src/component/numbers/service-list-item.tsx`
- `src/component/numbers/service-explorer.tsx`
- Pages admin des services

### 6.2 Countries Icons
**Actuel :** `<img src="/assets/countries/41.webp">` par pays
**Nouveau :** Conserver le système actuel ou utiliser `flag-icon-css` CDN

---

## 7. Pages Admin à Modifier

### 7.1 Provider Admin
- **Actuel :** Dashboard Grizzly (balance, stats, logs)
- **Nouveau :** Dashboard SMS Online Pro avec :
  - Balance live
  - Opérateurs par pays
  - Top countries par service
  - Stats Rent API

### 7.2 Services Admin
- Afficher les sprites SMS Online Pro
- Utiliser `.svc-xxx` CSS class

### 7.3 Price Rules
- Nouveau format (sans providers dans le prix)
- Recalcul avec la nouvelle formule

---

## 8. Suppressions

### 8.1 Fichiers à Supprimer (après migration validée)
- `src/services/grizzly/` (tout le dossier)
- `public/assets/services/*.webp` (2067 fichiers)
- `public/registry/grizzly-*.json`
- `GRIZZLY_API_KEY` de la config

### 8.2 À Conserver mais Désactiver
- `bun.lock` (mis à jour)
- `public/assets/countries/*.webp` (encore utilisés)

---

## 9. API Webhooks

### 9.1 Webhook Grizzly
**Fichier :** `app/api/webhooks/grizzly/route.ts`
→ Supprimer ou désactiver.

### 9.2 Nouveaux Webhooks ?
SMS Online Pro ne documente pas de webhooks. 
La réception des SMS se fait via polling `getStatus` (comme actuellement).

---

## 10. Erreurs & Compatibilité

### 10.1 Codes d'Erreur SMS Online Pro
| Erreur | Cause | Action |
|--------|-------|--------|
| BAD_KEY | Clé API invalide | Vérifier la clé |
| BAD_SERVICE | Service inconnu | Vérifier le mapping |
| BAD_ACTION | Action inconnue | Bug |
| BAD_STATUS | Statut invalide (1,3,6,8 seulement) | Vérifier le code |
| NO_ACTIVATION | ID d'activation inconnu | Activation peut-être expirée |
| NO_NUMBERS | Plus de numéros dispo | Essayer autre pays |
| NO_BALANCE | Solde insuffisant | Recharger |
| WRONG_COUNTRY | Pays invalide | Vérifier le code |
| WRONG_MAX_PRICE | Prix max trop bas | Augmenter |
| EARLY_CANCEL_DENIED | Annulation < 2min | Attendre |
| ERROR_SQL | Erreur serveur | Retry |
| SERVER_ERROR | Erreur serveur | Retry |
| BANNED | Compte bloqué temporairement | Attendre |
| ORDER_ALREADY_EXISTS | getNumberV2 déjà appelé | Nouvelle tentative |

### 10.2 Différences Grizzly → SMS Online Pro
1. ⚠️ **Pas de -1 dans setStatus** : Grizzly utilise -1 pour annulation avant ACCESS_READY. SMS Online Pro utilise 8 pour toutes les annulations. 
2. ⚠️ **getPrices vs getPricesV3** : SMS Online Pro n'a pas de `providers` dans les prix (provider unique)
3. ✅ **Mêmes statuts V1** : STATUS_WAIT_CODE, STATUS_CANCEL, STATUS_OK
4. ✅ **Mêmes réponses setStatus** : ACCESS_READY, ACCESS_RETRY_GET, ACCESS_ACTIVATION, ACCESS_CANCEL
5. ✅ **getNumberV2** : Même format JSON retour

### 10.3 Stratégie d'Annulation
```typescript
// Grizzly (ANCIEN)
if (state === 'waiting') await grizzly.setStatus(id, -1)  // Annulation immédiate
else if (state === 'active') await grizzly.setStatus(id, 8)  // Annulation normale

// SMS Online Pro (NOUVEAU)
// Les deux cas utilisent 8
await client.setStatus(id, 8)  // L'API refuse si < 2 min
```

---

## 11. Plan d'Exécution (détaillé)

### Phase 1 : Client SMS Online Pro (2 jours)
1. Créer `src/services/sms-online-pro/types.ts`
2. Créer `src/services/sms-online-pro/activation.ts`
3. Créer `src/services/sms-online-pro/pricing.ts`
4. Créer `src/services/sms-online-pro/client.ts`
5. Créer `src/services/sms-online-pro/index.ts`
6. Copier `cache.ts` depuis grizzly/

### Phase 2 : Intégration Services Métier (2 jours)
1. Modifier `activation.service.ts` (imports, providerId, annulation)
2. Modifier `pricing-resolver.service.ts` (nouvelle formule de prix)
3. Modifier `provider-routing.service.ts` (simplification)
4. Modifier `sync.service.ts` (nouveau provider)

### Phase 3 : Configuration (0.5 jour)
1. Modifier `src/config/env.ts`
2. Mettre à jour `.env.example`
3. Mettre à jour la table `provider` en DB

### Phase 4 : Registry & Mappings (1 jour)
1. Générer `sms-online-pro-countries.json`  
2. Générer `sms-online-pro-services.json`
3. Mettre à jour `externalServiceMapping`
4. Mettre à jour `externalCountryMapping`

### Phase 5 : Administration (2 jours)
1. Modifier pages admin providers
2. Modifier pages admin services
3. Modifier pages admin price-rules

### Phase 6 : UI & Icônes (2 jours)
1. Intégrer le sprite CSS dans le layout
2. Modifier ServiceGridItem / ServiceListItem
3. Supprimer les vieux fichiers .webp

### Phase 7 : Nettoyage (0.5 jour)
1. Supprimer `src/services/grizzly/`
2. Supprimer `public/assets/services/`
3. Supprimer les fichiers registry Grizzly

### Phase 8 : Tests (2 jours)
1. Test unitaire du client
2. Test flux complet d'activation
3. Test annulation
4. Test pricing

---

## 12. Risques et Mitigations

| Risque | Probabilité | Impact | Mitigation |
|--------|------------|--------|------------|
| -1 non supporté | Haute | Moyen | Utiliser 8 systématiquement |
| getServicesList inexistant | Haute | Faible | Utiliser getPrices + getNumbersStatus |
| Codes services différents | Moyenne | Moyen | Mapping explicite dans externalServiceMapping |
| Solde API bas ($4.99) | Haute | Moyen | Recharger avant les tests |
| Cache pricing obsolète | Faible | Faible | Cache TTL 60s |
