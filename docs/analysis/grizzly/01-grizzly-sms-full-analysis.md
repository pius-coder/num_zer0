# Rapport d'Analyse : Grizzly SMS (num_zer0)

## Résumé Exécutif

Grizzly SMS est **le fournisseur SMS unique et central** de l'application num_zer0. 
Toute la logique métier — des prix aux activations en passant par les webhooks — dépend de Grizzly.
Il n'y a **pas de fournisseur alternatif actif** dans le code ; le routing provider est un 
"singleton" qui pointe toujours vers Grizzly.

---

## 1. Architecture Générale

```
Client (UI) 
  → Pages/appels API 
    → ActivationService / PricingResolverService / ProviderRoutingService
      → GrizzlyClient (singleton, BaseService)
        → https://api.grizzlysms.com/stubs/handler_api.php
```

Tous les services qui interagissent avec Grizzly importent `getGrizzlyClient` depuis
`src/services/grizzly/index.ts`.

---

## 2. Fichiers et Lignes : Références Complètes

### 2.1 Service Grizzly Core (src/services/grizzly/)

| Fichier | Lignes clés | Description |
|---------|-------------|-------------|
| `src/services/grizzly/index.ts` | 1-23 | Re-export du singleton `getGrizzlyClient()` et tous les types |
| `src/services/grizzly/client.ts` | 1-164 | `class GrizzlyClient extends BaseService` — API wrapper complet |
| `src/services/grizzly/activation.ts` | 1-160 | Fonctions pures `getNumberV2`, `setStatus`, `getStatusV1/V2`, `getBalance` |
| `src/services/grizzly/types.ts` | 1-130 | Tous les types Grizzly (activation, pricing, filtres, pagination) |
| `src/services/grizzly/utils.ts` | 1-120+ | Utilitaires: `flattenPricesV3`, `filterPricesV3`, `paginate` |
| `src/services/grizzly/cache.ts` | - | `TTLCache` (cache interne du client) |

#### `src/services/grizzly/client.ts` — Détail des lignes

```
L31:     class GrizzlyClient extends BaseService
L37-38:  prefix: 'grizzly', http: baseUrl: 'https://api.grizzlysms.com/stubs/handler_api.php'
L41:     assert GRIZZLY_API_KEY not configured
L48-50:  checkError() — vérifie les codes d'erreur texte brut
L71:     getNumberV2() → délègue à activation.ts
L77:     setStatus() → délègue à activation.ts
L82:     getStatusV2() → délègue à activation.ts
L86:     getStatusV1() → délègue à activation.ts
L94:     getBalance() → délègue à activation.ts
L94-110: getServicesList() → fetch + cache 'grizzly_services'
L111-130: getCountries() → fetch + cache 'grizzly_countries'
L135-164: getRawPricesV3(), searchPricesV3(), getPricesV3All(), getPricesV3()
```

#### `src/services/grizzly/activation.ts` — Détail

```
L11:     GRIZZLY_ERRORS constant (8 codes d'erreur)
L25:     checkTextError() — lève grizzly_no_balance si NO_BALANCE
L33:     lève grizzly_api_error pour les autres codes
L58-75:  getNumberV2() — getNumberV2 + parse JSON
L91-105: setStatus() — setStatus + mapping réponse
L116-125: getStatusV2() — getStatus + parse JSON
L130-145: getStatusV1() — getStatus + parse text
L150-160: getBalance() — parse "ACCESS_BALANCE:123.45"
```

### 2.2 Types Grizzly (`src/services/grizzly/types.ts`)

```
L3-10:  GrizzlyGetNumberOptions
L11-15: GrizzlyActivationStatus (union type)
L17-25: GrizzlyActivation
L27:    GrizzlySetStatusCode (8 | -1 | 1 | 3 | 6)
L29-32: GrizzlySetStatusResponse
L34-42: GrizzlyActivationStatusV2
L43-51: GrizzlyActivationStatusV1
L52-55: GrizzlyServiceItem {code, name}
L57-65: GrizzlyCountryItem {id, rus, eng, chn}
L66-74: GrizzlyPriceRow
L76-85: PriceV3Entry, PricesV3Raw
L87-93: FlatPriceV3Row
L95-106: PaginationOptions, PaginatedResult<T>
L108-130: Filter options (PriceV3FilterOptions, etc.)
```

### 2.3 Services consommateurs de Grizzly

| Fichier | Lignes | Pattern |
|---------|--------|---------|
| `src/services/activation.service.ts` | 8, 64, 127-136, 140, 157, 169, 256, 269, 355, 360, 435 | `getGrizzlyClient()` utilisé en activation |
| `src/services/pricing-resolver.service.ts` | 4-5, 18-23, 56-59, 101-131, 174 | Shadow pricing via Grizzly |
| `src/services/provider-routing.service.ts` | 5, 26-27, 93-98 | Sélection Grizzly comme seul provider |
| `src/services/sync.service.ts` | 4, 22-32, 76 | Sync des mappings/balance |
| `src/services/__mocks__/grizzly.ts` | 1-75 | Mock complet pour les tests |
| `src/services/__mocks__/fixtures.ts` | 1-52 | Fixtures de test (countries, services) |
| `src/services/__mocks__/db.ts` | 47-54 | Mock DB avec providerId='grizzly' |
| `src/services/base.service.ts` | 25-26, 53-54, 350 | Codes erreur Grizzly_NO_BALANCE/LOW_BALANCE |

### 2.4 Routes API liées à Grizzly

| Fichier | Route | Usage Grizzly |
|---------|-------|---------------|
| `app/api/webhooks/grizzly/route.ts` | `POST /api/webhooks/grizzly` | Webhook Grizzly (SMS reçu, annulation) |
| `app/api/admin/countries/route.ts` | `GET /api/admin/countries` | `getGrizzlyClient().getCountries()` |
| `app/api/client/services/[slug]/countries/route.ts` | `GET` | Via `PricingResolverService` → `GrizzlyClient` |
| `app/api/client/services/[slug]/providers/route.ts` | `GET` | Via `ProviderRoutingService` → `GrizzlyClient` |
| `app/api/client/services/route.ts` | `GET` | Liste services (priceOverride, pas Grizzly direct) |

### 2.5 Pages Frontend liées à Grizzly (transitivement)

Toutes les pages de numéros/services utilisent des hooks React Query qui appellent 
les API ci-dessus, donc transitivement Grizzly. Pas d'import direct de Grizzly 
dans les composants React.

### 2.6 Environnement

```
src/config/env.ts:15  GRIZZLY_API_KEY: z.string().min(1)
src/config/env.ts:66  GRIZZLY_API_KEY: process.env.GRIZZLY_API_KEY
```

### 2.7 Schémas de base de données liés

| Table | Fichier | Colonnes clés |
|-------|---------|---------------|
| `provider` | `src/database/schemas/services.ts` | `id='prov_grizzly'`, `code='grizzly'`, API key, balance |
| `external_service_mapping` | `src/database/schemas/services.ts` | Mappe slug local ↔ code API Grizzly |
| `external_country_mapping` | `src/database/schemas/services.ts` | Mappe iso → externalId Grizzly |
| `sms_activation` | `src/database/schemas/activations.ts` | `providerId='grizzly'`, `providerActivationId` |

### 2.8 Migrations SQL

```
drizzle/migrations/0002_shadow_pricing.sql  — tables price_override, price_rule
drizzle/migrations/0004_recreate_hold_table.sql  — credit_hold
drizzle/migrations/0005_activation_id_not_null.sql
```

### 2.9 Documentation et Plans

| Fichier | Contenu |
|---------|---------|
| `.sisyphus/plans/grizzly-shadow-pricing.md` | Plan détaillé de l'intégration Shadow Pricing |
| `.sisyphus/drafts/activation-flow-fix.md` | Détails du flow d'activation Grizzly |
| `.sisyphus/notepads/fix-activation-flow/decisions.md` | Décisions: hold → Grizzly → setStatus(1) |
| `.sisyphus/notepads/fix-activation-flow/learnings.md` | Apprentissages sur l'API Grizzly |
| `docs/payments/providers.mdx` | Documentation des providers |

### 2.10 Données statiques Grizzly (registry)

| Fichier | Taille | Contenu |
|---------|--------|---------|
| `public/registry/grizzly-services.json` | 712 KB | 2067 services Grizzly avec icons |
| `public/registry/grizzly-countries.json` | 50 KB | 199 pays Grizzly |
| `public/registry/grizzly-summary.json` | 2 KB | Résumé extraction |
| `public/registry/grizzly-countries-summary.json` | 188 B | Résumé pays |

---

## 3. Flux de Données Détaillé

### 3.1 Activation (Purchase Flow)

```
1. ActivationService.request()
2.   PricingResolverService.resolvePrice()  → Grizzly.getPricesV3() ou override DB
3.   DB: INSERT smsActivation (state='requested')
4.   CreditLedgerService.holdCredits()
5.   GrizzlyClient.getNumberV2()  → obtient numéro
6.   GrizzlyClient.setStatus(id, 1)  → ACCESS_READY (obligatoire)
7.   DB: UPDATE smsActivation (state='waiting', phoneNumber, providerActivationId)
```

### 3.2 Shadow Pricing

```
PricingResolverService.resolvePrice(serviceSlug, countryIso)
  1. Check priceOverride table (DB)
  2. If not found → Grizzly.getPricesV3(country, serviceCode)
  3. Compute: priceCredits = ceil(rawPriceUSD × 2.5 × 650)
```

### 3.3 Annulation

```
ActivationService.cancelActivation(id)
  1. Check state (waiting/assigned only)
  2. Pick cancel code: -1 (waiting) or 8 (active)
  3. Grizzly.setStatus(providerActivationId, cancelCode)
  4. If ACCESS_CANCEL → grizzlyRefunded = true
  5. DB: state = 'cancelled' (refunded) or 'cancelled_no_refund'
  6. If refunded → CreditLedgerService.releaseHoldByActivationId()
```

### 3.4 Webhook Grizzly

```
POST /api/webhooks/grizzly
  Header: x-grizzly-secret || x-internal-webhook-secret → vérifié contre INTERNAL_API_SECRET
  Body: { activationId, status, phoneNumber?, smsCode? }
  
  status=3|6 + smsCode:
    → ActivationService.markSmsReceived()
    → CreditLedgerService.confirmHoldDebit()
  
  status=8|-1:
    → ActivationService.cancelActivation()
    → CreditLedgerService.releaseHold()
```

---

## 4. Points d'Attention et Problèmes Identifiés

### 🔴 Critique
1. **Grizzly est le seul provider** — `ProviderRoutingService` ne fait que Grizzly.
   Si Grizzly tombe, tout le service est en panne. Aucun fallback.
2. **Pas de SMSMan intégré** — L'env SMSMAN_API_KEY existe mais SMSMan n'est pas utilisé
   (`SMSMAN_API_KEY: z.string().optional()` mais jamais importé).
3. **Pricing dur en dur** — Multiplicateur `× 2.5 × 650` codé dans
   `PricingResolverService` (lignes 76, 145). Aucune configuration admin.
4. **Webhook sans signature** — Utilise `x-grizzly-secret` qui est en fait
   `INTERNAL_API_SECRET`. Pas de signature HMAC. Faible sécurité.

### 🟡 Important
5. **Cache pricing limité** — `GrizzlyClient` a un TTL de 60s (cache interne).
   Pas de persistance distributed (Redis). Redémarrage = cache vide.
6. **Mock incomplet** — `__mocks__/grizzly.ts` mocke `getNumber` et `setActivationStatus`
   mais le vrai client utilise `getNumberV2` et `setStatus`.
7. **Static registry volumineux** — 2067 services en JSON statique chargé en mémoire.
   Pourrait être optimisé avec une vraie base.
8. **Pas de rate limiting Grizzly** — Aucune protection côté client contre le
   rate limiting de l'API Grizzly.

### 🟢 Observation
9. **Prix overrides** — La table `price_override` permet de surcharger les prix
   Grizzly pour des couples service/pays spécifiques.
10. **Multi-langue** — Les messages d'erreur Grizzly sont en anglais seulement.

---

## 5. Fichiers Affectés si Changement de Provider

Si on devait ajouter/supprimer/modifier Grizzly comme provider :

### À Modifier
| Fichier | Changement |
|---------|------------|
| `src/services/grizzly/*` | Remplacer wrapper API |
| `src/services/provider-routing.service.ts` | Ajouter logique multi-providers |
| `src/services/activation.service.ts` | Adapter lifecycle provider |
| `src/services/pricing-resolver.service.ts` | Adapter source de prix |
| `src/config/env.ts` | Changer vars d'env |
| `src/services/__mocks__/grizzly.ts` | Mettre à jour les mocks |
| `src/database/schemas/services.ts` | Modifier provider |
| `app/api/webhooks/grizzly/route.ts` | Nouveau webhook |
| `public/registry/grizzly-*.json` | Nouveau registry |

### Pas de Changement
| Fichier | Raison |
|---------|--------|
| `src/services/credit-ledger.service.ts` | Logique wallet indépendante |
| `src/component/*` | Composants UI abstraits du provider |
| `src/hooks/*` | Hooks React Query abstraits |
| `app/[locale]/**` | Pages utilisateur abstraites |
