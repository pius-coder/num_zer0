---
date: 2026-06-02
topic: "SMS Online Pro Integration"
status: validated
---

## Problem Statement

Users browse virtual phone number services (WhatsApp, Telegram, etc.) and see static pricing — but no actual number provisioning happens. Clicking "Acheter" just opens the recharge drawer. We need to connect this to **sms-online.pro** so users get real phone numbers and SMS verification codes.

`SMSONLINEPRO_API_KEY` is already declared in `.env.example` — the provider was chosen but never integrated.

## Key Insight from User Research

The user has actually used sms-online.pro. The real flow is:

1. Select service → Select country → Purchase page with pricing details
2. **Max Price** slider: higher max price = more available numbers. Default shows the base retail price.
3. **Rental time**: the number is "rented" for a period. During that rental, if SMS expires, user can request another code.
4. **Quantity indicator**: shows how many numbers are available at each price point.

**The UX principle:** By default, show ONLY the simple price. No maxPrice, no operator, no rental time. Only if the simple flow fails (no SMS after waiting), THEN reveal the advanced settings with explanations.

## Constraints

- **No webhooks** — sms-online.pro is request-response only. We must poll for SMS.
- **Convex actions required** — external HTTP calls must use `action` functions. But **caller pattern is: mutation → schedules action**, not frontend → action directly.
- **Pricing in USD** — sms-online.pro uses USD (ISO 4217 code 840). Our data uses USD too (`priceEur` in `data.ts` is actually USD despite the name). No currency conversion needed — both systems are in USD.
- **Country code mismatch** — sms-online.pro uses numeric country codes (e.g. 33 for France). Our app uses ISO codes (FR). Need a mapping table.
- **Must coexist with existing 3-step wizard** — the wizard stays, but "Acheter" now does something real.
- **Follow existing patterns** — Fapshi integration pattern (private fetch wrappers, actions for HTTP, mutations for DB) is the established convention.
- **Fix EUR/USD naming inconsistency** — `priceEur` in `data.ts` is actually USD, and `eurToXaf()` is actually USD→XAF. This needs to be corrected as part of this integration to avoid confusion.
- **Escrow pattern** — money must be held in escrow (`471-escrow`) during activation. User balance is deducted upfront but not recognized as revenue until the activation succeeds.
- **3 concurrent activations max** — cap at 3 simultaneous activations per user.

## Approach

**Use `getNumberV2`** instead of `getNumber` — V2 returns JSON (`activationId`, `phoneNumber`, `activationCost`, `canGetAnotherSms`, `activationTime`, `activationOperator`) which is cleaner and gives us the `canGetAnotherSms` flag needed for the rental flow.

**Backend-driven polling** — NOT frontend polling. The Convex scheduler (`ctx.scheduler.runAfter`) polls the provider from the server. The frontend subscribes reactively via `useQuery`.

**Escrow pattern** — money is held in `471-escrow` during activation. Released to revenue on success, refunded to user on failure.

**Three-phase rollout:**
1. **Core backend** — Fix EUR→USD naming in `data.ts`, schema + Convex mutation/actions using V2 API + country mapping + accounting
2. **Client integration** — progressive disclosure UI + reactive `useQuery` subscription
3. **Polish** — admin dashboards, edge cases, automated tests

The system treats **activations as first-class records** in a new `activations` Convex table.

## Architecture

```
┌───────────────────────────┐      ┌───────────────────┐      ┌──────────────────┐
│  React UI                 │      │  Convex            │      │  sms-online.pro  │
│                           │      │                    │      │  REST API        │
│  ┌─────────────────────┐  │      │  ┌──────────────┐  │      │  /handler_api.php│
│  │useMutation(         │  │      │  │ initiate     │  │      │                  │
│  │ initiateActivation) │──│──────│─▶│ Activation   │  │      │  getNumberV2     │
│  └──────────┬──────────┘  │      │  │ (mutation)   │  │      │  getStatus       │
│             │             │      │  └──────┬───────┘  │      │  setStatus       │
│             │ return {id}  │      │         │          │      │  getPrices       │
│             ▼             │      │         │ schedule  │      │  getBalance      │
│  ┌─────────────────────┐  │      │         ▼          │      │                  │
│  │useQuery(            │  │      │  ┌──────────────┐  │      └──────────────────┘
│  │ getActivation, {id}) │◀─│──◀──│─│  pollActivate │──────HTTP───────────▶
│  │                     │  │      │  │ (internal    │◀─────response─────────
│  │ (réactif via        │  │      │  │  action)     │  │
│  │  WebSocket Convex)  │  │      │  └──────┬───────┘  │
│  └─────────────────────┘  │      │         │          │
│                           │      │         ▼          │
│                           │      │  ┌──────────────┐  │
│                           │      │  │ updateActi-  │  │
│                           │      │  │ vation       │  │
│                           │      │  │ (internal    │  │
│                           │      │  │  mutation)   │  │
│                           │      │  └──────┬───────┘  │
│                           │      │         │          │
│                           │      │  ┌──────▼───────┐  │
│                           │      │  │  DB:         │  │
│                           │      │  │  activations │  │
│                           │      │  │  comptes     │  │
│                           │      │  │  pieces/lignes│  │
│                           │      │  └──────────────┘  │
└───────────────────────────┘      └───────────────────┘
```

**Key architectural rule:** The frontend NEVER calls the sms-online.pro API directly. It calls a Convex **mutation** which schedules a backend **action** to do the HTTP call. The frontend subscribes to the DB document reactively via `useQuery`.

## Key Components

### 1a. Fix EUR→USD Naming — `src/components/services/data.ts`

The existing code has a naming inconsistency that must be fixed:

| Current (misleading) | Should be |
|----------------------|-----------|
| `priceEur: number` | `priceUsd: number` |
| `eurToXaf(priceEur)` | `usdToXaf(priceUsd)` |

**Impact:** This field is used in `my-space-page.tsx`, purchase confirmation, etc. All references to `priceEur`/`eurToXaf` need renaming.

**Why now:** sms-online.pro's `getPrices` returns USD (`"retail_cost": 3.63`). If we keep the confusing `priceEur` name, we risk treating provider prices as EUR and double-converting. Fix the naming before wiring the provider.

### 1b. Country Code Mapping — `convex/sms-countries.ts`

sms-online.pro uses **numeric country codes**. Our app uses **ISO codes**. We need a mapping:

```typescript
// sms-online.pro numeric code → our ISO code
export const SMS_COUNTRY_MAP: Record<number, string> = {
  1: 'US', 7: 'RU', 20: 'EG', 27: 'ZA',
  33: 'FR', 34: 'ES', 39: 'IT', 40: 'RO',
  41: 'CH', 43: 'AT', 44: 'GB', 45: 'DK',
  46: 'SE', 47: 'NO', 48: 'PL', 49: 'DE',
  81: 'JP', 82: 'KR', 84: 'VN', 86: 'CN',
  91: 'IN', 212: 'MA', 213: 'DZ', 216: 'TN',
  220: 'GM', 221: 'SN', 222: 'MR', 223: 'ML',
  224: 'GN', 225: 'CI', 226: 'BF', 227: 'NE',
  228: 'TG', 229: 'BJ', 230: 'MU', 231: 'LR',
  232: 'SL', 233: 'GH', 234: 'NG', 235: 'TD',
  236: 'CF', 237: 'CM', 238: 'CV', 239: 'ST',
  240: 'GQ', 241: 'GA', 242: 'CG', 243: 'CD',
  244: 'AO', 245: 'GW', 246: 'IO', 247: 'AC',
  248: 'SC', 249: 'SD', 250: 'RW', 251: 'ET',
  252: 'SO', 253: 'DJ', 254: 'KE', 255: 'TZ',
  256: 'UG', 257: 'BI', 258: 'MZ', 260: 'ZM',
  261: 'MG', 262: 'RE', 263: 'ZW', 264: 'NA',
  265: 'MW', 266: 'LS', 267: 'BW', 268: 'SZ',
  269: 'KM', 290: 'SH', 291: 'ER', 297: 'AW',
  298: 'FO', 299: 'GL', 350: 'GI', 351: 'PT',
  352: 'LU', 353: 'IE', 354: 'IS', 355: 'AL',
  356: 'MT', 357: 'CY', 358: 'FI', 359: 'BG',
  370: 'LT', 371: 'LV', 372: 'EE', 373: 'MD',
  374: 'AM', 375: 'BY', 376: 'AD', 377: 'MC',
  378: 'SM', 379: 'VA', 380: 'UA', 381: 'RS',
  382: 'ME', 385: 'HR', 386: 'SI', 387: 'BA',
  389: 'MK', 420: 'CZ', 421: 'SK', 423: 'LI',
  501: 'BZ', 502: 'GT', 503: 'SV', 504: 'HN',
  505: 'NI', 506: 'CR', 507: 'PA', 508: 'PM',
  509: 'HT', 590: 'GP', 591: 'BO', 592: 'GY',
  593: 'EC', 594: 'GF', 595: 'PY', 596: 'MQ',
  597: 'SR', 598: 'UY', 599: 'AN', 670: 'TL',
  672: 'NF', 673: 'BN', 674: 'NR', 675: 'PG',
  676: 'TO', 677: 'SB', 678: 'VU', 679: 'FJ',
  680: 'PW', 681: 'WF', 682: 'CK', 683: 'NU',
  685: 'WS', 686: 'KI', 687: 'NC', 688: 'TV',
  689: 'PF', 690: 'TK', 691: 'FM', 692: 'MH',
  850: 'KP', 852: 'HK', 853: 'MO', 855: 'KH',
  856: 'LA', 880: 'BD', 886: 'TW', 960: 'MV',
  961: 'LB', 962: 'JO', 963: 'SY', 964: 'IQ',
  965: 'KW', 966: 'SA', 967: 'YE', 968: 'OM',
  970: 'PS', 971: 'AE', 972: 'IL', 973: 'BH',
  974: 'QA', 975: 'BT', 976: 'MN', 977: 'NP',
  992: 'TJ', 993: 'TM', 994: 'AZ', 995: 'GE',
  996: 'KG', 998: 'UZ',
}

export const ISO_TO_SMS: Record<string, number> = {}
for (const [code, iso] of Object.entries(SMS_COUNTRY_MAP)) {
  ISO_TO_SMS[iso] = Number(code)
}
```

### 2. Database Schema — `activations` table

New table in `convex/schema.ts`:

| Field | Type | Purpose |
|-------|------|---------|
| `userId` | `string` (indexed) | Who requested the activation |
| `service` | `string` | Service code (wa, tg, fb, etc.) |
| `country` | `string` | ISO country code |
| `providerId` | `number` (unique, indexed) | Activation ID from sms-online.pro (from V2 response) |
| `phoneNumber` | `string` | The virtual number assigned |
| `status` | `union` | `pending` → `awaiting_sms` → `sms_received` → `completed` / `cancelled` / `expired` |
| `maxPrice` | `number` | What maxPrice was used (default = retail price) |
| `operator` | `optional string` | Selected operator if any |
| `smsCode` | `optional string` | The verification SMS code |
| `canGetAnotherSms` | `boolean` | From V2 response — whether another SMS can be requested |
| `rentEndTime` | `optional number` | When the rental window ends (from V2 `activationTime` + estimated window) |
| `providerCost` | `number` | What sms-online.pro charged (USD) |
| `priceCharged` | `number` | What we charged the user (XAF) |
| `createdAt` | `number` | Timestamp |
| `updatedAt` | `number` | Timestamp |

Indexes: `by_userId`, `by_providerId`, `by_status`, `by_userId_status`

### 3. Convex Module — `convex/sms-provider.ts`

**Private HTTP wrappers** (follow Fapshi pattern):

```typescript
const API_BASE = 'https://sms-online.pro/stubs/handler_api.php'

async function smsProGet(params: Record<string, string>): Promise<string> {
  const apiKey = process.env.SMSONLINEPRO_API_KEY!
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', apiKey)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  return res.text() // V1 returns text, V2 returns JSON — both are text/plain
}

async function smsProGetJson(params: Record<string, string>): Promise<any> {
  const text = await smsProGet(params)
  return JSON.parse(text) // For V2 endpoints that return JSON
}
```

**Functions:**

| Function | Type | Caller | HTTP Call | DB Effect |
|----------|------|--------|-----------|-----------|
| `initiateActivation` | **mutation** (public) | Frontend `useMutation` | None | Vérifie solde, crée activation, met en escrow, schedule `pollActivation` |
| `pollActivation` | **internalAction** | `ctx.scheduler.runAfter` | `getNumberV2` / `getStatus` | Update activation doc via `internalMutation` |
| `updateActivation` | **internalMutation** | L'action `pollActivation` | None | Patch l'activation + met à jour la comptabilité |
| `requestAnotherSms` | **mutation** (public) | Frontend `useMutation` | `setStatus(id, 3)` | Reset à `awaiting_sms` |
| `completeActivation` | **mutation** (public) | Frontend `useMutation` | `setStatus(id, 6)` | Libère l'escrow → revenue + provider |
| `cancelActivation` | **mutation** (public) | Frontend `useMutation` | `setStatus(id, 8)` | Libère l'escrow → remboursement utilisateur |
| `getActivation` | **query** (public) | Frontend `useQuery` (réactif) | None | Lecture doc activation — Convex push les màj |
| `getNumberQuantity` | **query** (public) | Frontend `useQuery` | `getNumbersStatus(country)` | Aucun — lecture seule |
| `getTopCountries` | **query** (public) | Frontend `useQuery` | `getTopCountriesByService` | Aucun — lecture seule |
| `getMyActivations` | **query** (public) | Frontend `useQuery` | None | Liste des activations de l'utilisateur |
| `syncPrices` | **action** (admin) | Manuel / cron | `getPrices(country, service)` | Update pricing en DB |

#### `initiateActivation` (mutation) — Le point d'entrée

```
Frontend (useMutation) ──▶ mutation ──▶ DB + schedule action
```

Étapes détaillées :
1. **Auth** → récupérer `userId`
2. **Valider les entrées** → vérifier que le service/country sont valides
3. **Vérifier le solde** → `comptes` table, code `411-{userId}`, solde ≥ priceUsd
4. **Vérifier la limite** → compter les activations en cours (`awaiting_sms`), max 3
5. **CRÉDITER le compte client** (il dépense) :
   - Pièce : `{sens: 'credit', compteCode: '411-{userId}', montant: priceUsd}` → `debitCompte` → solde -= priceUsd
6. **DÉBITER l'escrow** (argent séquestré) :
   - Pièce : `{sens: 'debit', compteCode: '471-escrow', montant: priceUsd}` → `creditCompte` → solde += priceUsd
   - Pièce complète : statut `'en_attente'`, référence = `activationId`
7. **Créer le doc activation** dans la table `activations` avec status `awaiting_number`
8. **Scheduler** `pollActivation` via `ctx.scheduler.runAfter(0, internal.sms.pollActivation, { activationId })`

#### `pollActivation` (internalAction) — Le polling server-side

```
Scheduled ──▶ action ──▶ HTTP getNumberV2 / getStatus ──▶ runMutation updateActivation
               │                                              │
               └── si encore en attente ──▶ reschedule dans 3s
```

Étapes :
1. **Lire l'activation** via `ctx.runQuery(internal.sms.getActivation, { activationId })`
2. **Si déjà complétée/annulée** → stop (ne pas reschedule)
3. **Si pas encore de numéro** (premier run) :
   - HTTP `getNumberV2(service, country, maxPrice?, operator?)`
   - Si succès → `ctx.runMutation(updateActivation, { providerId, phoneNumber, ... })`
   - Si `NO_NUMBERS` → `ctx.runMutation(updateActivation, { status: 'no_numbers' })` + cancel escrow
   - Si `WRONG_MAX_PRICE:$min` → `ctx.runMutation(updateActivation, { status: 'max_price_too_low', minPrice })`
4. **Si en attente de SMS** :
   - HTTP `getStatus(id=providerId)`
   - `STATUS_WAIT_CODE` → `ctx.scheduler.runAfter(3000, 'pollActivation', { activationId })`
   - `STATUS_OK:code` → `ctx.runMutation(updateActivation, { status: 'sms_received', smsCode: code })` → stop
   - `STATUS_WAIT_RETRY:code` → `ctx.runMutation(updateActivation, { status: 'sms_received', smsCode: code })`
   - `STATUS_CANCEL` → `ctx.runMutation(updateActivation, { status: 'cancelled' })` + refund escrow
5. **Timeout** : si `createdAt` > 15 min → cancel + refund

#### `updateActivation` (internalMutation) — Écriture DB utilisée par l'action

```typescript
export const updateActivation = internalMutation({
  args: {
    activationId: v.id('activations'),
    patch: v.object({
      status: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      providerId: v.optional(v.number()),
      smsCode: v.optional(v.string()),
      providerCost: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
    }),
  },
  handler: async (ctx, args) => {
    // Patch le document activation
    await ctx.db.patch(args.activationId, { ...args.patch, updatedAt: Date.now() })
  },
})
```

#### `completeActivation` (mutation) — Libération de l'escrow

1. HTTP `setStatus(providerId, 6)` → libère le numéro chez le provider
2. **Marquer l'activation** `completed`
3. **Libérer l'escrow** en répartissant les fonds :
   - Pièce "Activation réussie" (statut: `validee`)
   - `{sens: 'credit', compteCode: '471-escrow', montant: priceUsd}` → escrow ↓
   - `{sens: 'debit', compteCode: '702-sms-marge', montant: margin}` → notre marge ↑
   - `{sens: 'debit', compteCode: '471-fournisseur', montant: providerCost}` → dette fournisseur ↑
4. Pièce originale de mise en escrow marquée `validee`

#### `cancelActivation` (mutation) — Remboursement

1. HTTP `setStatus(providerId, 8)` → annule chez le provider
2. **Marquer l'activation** `cancelled`
3. **Rembourser via l'escrow** :
   - Pièce "Annulation activation" (statut: `validee`)
   - `{sens: 'credit', compteCode: '471-escrow', montant: priceUsd}` → escrow ↓
   - `{sens: 'debit', compteCode: '411-{userId}', montant: priceUsd}` → utilisateur ↑ (remboursé)
4. Pièce originale de mise en escrow marquée `annulee`

#### `requestAnotherSms` (mutation)

1. Lire l'activation → vérifier `status === 'sms_received'` ou `'sms_expired'`
2. Vérifier que `canGetAnotherSms === true` (champ du V2 response)
3. HTTP `setStatus(providerId, 3)`
4. Marquer activation `awaiting_sms`
5. Scheduler un nouveau `pollActivation` dans 3s

### 4. Accounting & Escrow — `convex/comptabilite.ts` (extensions)

Aucune nouvelle table nécessaire. On utilise les comptes existants avec de nouveaux codes :

| Compte | Libellé | Nature | Rôle |
|--------|---------|--------|------|
| `411-{userId}` | `Client {userId}` | Existant | Solde disponible de l'utilisateur |
| `471-escrow` | `Séquesterre SMS` | **Nouveau** | Argent bloqué pendant une activation |
| `702-sms-marge` | `Marge activation SMS` | **Nouveau** | Notre marge (prix retail − coût provider) |
| `471-fournisseur` | `Dette fournisseur SMS` | **Nouveau** | Ce qu'on doit à sms-online.pro |
| `701-recharge` | `Produit recharges` | Existant | Revenue des recharges |

#### Cycle de vie complet de l'argent

```
RECHARGE (existant) :
  Débit  411-user       +$5.00  → solde utilisateur ↑
  Crédit 701-recharge   +$5.00  → revenue enregistré

ACTIVATION (nouveau) :
  Étape 1 — Mise en escrow (dans initiateActivation, mutation):
    Crédit  411-user       -$3.00  → solde utilisateur ↓ (il dépense)
    Débit   471-escrow     +$3.00  → argent séquestré

  Étape 2a — Succès (dans completeActivation, mutation):
    Crédit  471-escrow     -$3.00  → escrow libéré
    Débit   702-sms-marge  +$1.00  → notre marge (3$ - 2$)
    Débit   471-fournisseur+$2.00  → dette envers le provider

  Étape 2b — Échec / Annulation (dans cancelActivation):
    Crédit  471-escrow     -$3.00  → escrow libéré
    Débit   411-user       +$3.00  → utilisateur remboursé (intégralement)
```

#### Création des comptes

Au premier lancement, `ensureCompte` crée les comptes s'ils n'existent pas :

```typescript
// Dans initiateActivation
await ctx.runMutation(internal.comptabilite.ensureCompte, {
  code: '471-escrow',
  libelle: 'Séquesterre SMS',
})
await ctx.runMutation(internal.comptabilite.ensureCompte, {
  code: '702-sms-marge',
  libelle: 'Marge activation SMS',
})
await ctx.runMutation(internal.comptabilite.ensureCompte, {
  code: '471-fournisseur',
  libelle: 'Dette fournisseur SMS',
})
```

Ces comptes sont créés une fois et réutilisés pour toutes les transactions.

#### Détail des pièces comptables

**Pièce 1 — Mise en séquestre** (dans `initiateActivation`):
```
{
  libelle: "Mise en séquestre activation {activationId}",
  statut: "en_attente",        // ← PAS "validee"
  reference: activationId,
  lignes: [
    { compteCode: "411-{userId}", sens: "credit", montant: priceUsd },
    { compteCode: "471-escrow",   sens: "debit",  montant: priceUsd },
  ]
}
```

**Pièce 2a — Succès** (dans `completeActivation`):
```
{
  libelle: "Activation {activationId} réussie",
  statut: "validee",
  reference: activationId,
  lignes: [
    { compteCode: "471-escrow",   sens: "credit", montant: priceUsd },
    { compteCode: "702-sms-marge",sens: "debit",  montant: marginUsd },
    { compteCode: "471-fournisseur", sens: "debit", montant: providerCostUsd },
  ]
}
```
+ Pièce 1 marquée `validee`

**Pièce 2b — Annulation** (dans `cancelActivation`):
```
{
  libelle: "Annulation activation {activationId}",
  statut: "validee",
  reference: activationId,
  lignes: [
    { compteCode: "471-escrow", sens: "credit", montant: priceUsd },
    { compteCode: "411-{userId}", sens: "debit", montant: priceUsd },
  ]
}
```
+ Pièce 1 marquée `annulee`

#### Vérification de solde

Dans `initiateActivation` (mutation), avant tout :

```typescript
const compte = await ctx.db
  .query('comptes')
  .withIndex('by_code', (q) => q.eq('code', `411-${userId}`))
  .unique()

if (!compte || compte.solde < priceUsd) {
  throw new ConvexError('Solde insuffisant')
}
```

#### Pourquoi l'escrow ?

| Sans escrow | Avec escrow |
|-------------|-------------|
| On débite l'utilisateur directement → si échec on doit annuler la pièce | L'argent est en attente → l'utilisateur voit son solde baisser immédiatement |
| Revenue enregistré trop tôt (avant que le service soit livré) | Revenue comptabilisé seulement à la confirmation |
| Remboursement = écriture d'annulation complexe | Remboursement = simple transfert escrow → utilisateur |
| Aucune visibilité sur l'argent "en cours" | Le solde de `471-escrow` donne le montant total engagé |

### 5. Progressive Disclosure UI — `ActivationFlow` Component

The key UX innovation: **show simple by default, reveal advanced only on failure.**

```
Step 1: Service selection
┌────────────────────────────────────┐
│  Choisissez un service              │
│                                     │
│  ┌──────┐ ┌──────┐ ┌──────┐       │
│  │Whats │ │Tele  │ │Viber │       │
│  │App   │ │gram  │ │      │       │
│  │social│ │social│ │social│       │
│  └──────┘ └──────┘ └──────┘       │
│  ...                               │
└────────────────────────────────────┘

Step 2: Country selection (with quantity)
┌────────────────────────────────────┐
│  WhatsApp                          │
│  Rechercher un pays...             │
│                                     │
│  🇫🇷 France               1 234 pcs │
│  🇬🇧 United Kingdom          523 pcs│
│  🇺🇸 United States         3 542 pcs│
│  🇨🇲 Cameroon                89 pcs │
│  ...                               │
└────────────────────────────────────┘

  The quantity ("X pcs") comes from getNumbersStatus(country).
  It shows how many numbers are available NOW for this service+country.
  This helps the user pick a country with good availability.

Step 3: Purchase page
┌────────────────────────────────────┐
│  WhatsApp · France                 │
│  🇫🇷                              │
│                                     │
│  Prix: 1 500 FCFA                  │
│  1 234 numéros disponibles         │
│                                     │
│  Top pays pour WhatsApp:           │
│  🇺🇸 US     3 542 pcs  - 2.50$    │
│  🇬🇧 UK       523 pcs  - 2.00$    │
│  🇨🇲 CM        89 pcs  - 1.50$    │
│                                     │
│  [🏁 Lancer l'activation]         │
└────────────────────────────────────┘

  Top countries come from getTopCountriesByService(service).
  Shown as a suggestion strip — user can tap to switch country.

Step 4: Waiting for SMS (simple view)
┌────────────────────────────────────┐
│  📞 +33 7 80 73 62 25         [📋]│
│                                     │
│  ⏳ En attente du SMS...           │
│  (30 secondes écoulées)            │
│                                     │
│  [🔄 Vérifier le SMS]             │
└────────────────────────────────────┘

Step 5: SMS received
┌────────────────────────────────────┐
│  📞 +33 7 80 73 62 25         [📋]│
│                                     │
│  ✅ Code reçu !                    │
│  ┌──────────────┐                  │
│  │  123-456     │  [📋 Copier]    │
│  └──────────────┘                  │
│                                     │
│  [✓ Valider l'activation]          │
└────────────────────────────────────┘

Step 6: Advanced settings (shown if no SMS after ~60s)
┌────────────────────────────────────┐
│  ❌ SMS pas reçu ?                 │
│                                     │
│  ▶ Paramètres avancés              │
│     (déplier pour plus d'options)  │
│                                     │
│  ┌────────────────────────────────┐│
│  │ Prix maximum: 3.90$ (+0.50$)  ││
│  │ Plus le prix max est élevé,    ││
│  │ plus vous avez de chances      ││
│  │ d'obtenir un numéro.           ││
│  │                                ││
│  │ [=====●================]      ││
│  │ 3.90$                   8.00$ ││
│  │                                ││
│  │ Opérateur:                    ││
│  │ [Tous ▼]                      ││
│  │                                ││
│  │ Temps de location: 20 min     ││
│  │ Durant cette période, vous    ││
│  │ pouvez redemander un SMS.     ││
│  │                                ││
│  │ [🔁 Relancer avec ces options]││
│  └────────────────────────────────┘│
└────────────────────────────────────┘

Step 7: SMS expired — request another
┌────────────────────────────────────┐
│  📞 +33 7 80 73 62 25         [📋]│
│                                     │
│  ⚠ Le code a expiré               │
│  Vous êtes toujours dans la        │
│  période de location.              │
│                                     │
│  [🔄 Renvoyer un nouveau SMS]     │
└────────────────────────────────────┘
```

### 6. Integration with Existing Wizard

The existing `my-space-page.tsx` 3-step wizard gets modified:

**Before (current):**
Select service → Select country → See price → "Acheter" → recharge drawer

**After:**
Select service → Select country → See price → "Acheter" → check balance
  ├── Sufficient → `initiateActivation` → show `ActivationFlow`
  └── Insufficient → recharge drawer (existing)

### 7. Client Hooks — `src/components/purchases/hooks/use-activations.ts`

| Hook | Purpose |
|------|---------|
| `useActivation(id)` | Query single activation — **réactif via WebSocket** (pas de polling coté client) |
| `useMyActivations()` | List user's activations |
| `useInitiateActivation()` | Mutation: appelle `initiateActivation` (création DB + schedule action) |
| `useRequestAnotherSms()` | Mutation: call setStatus(3) |
| `useCompleteActivation()` | Mutation: call setStatus(6) + libère l'escrow |
| `useCancelActivation()` | Mutation: cancel + refund via escrow |
| `useNumberQuantity(country)` | **Query:** `getNumbersStatus` — returns `{wa: 523, tg: 352}` for a country |
| `useTopCountries(service)` | **Query:** `getTopCountriesByService` — returns top countries with counts/prices |

**Key difference from Fapshi pattern:** No `useCheckSmsStatus` hook. Le polling est fait coté serveur via `ctx.scheduler.runAfter`. Le frontend reçoit les mises à jour automatiquement via la réactivité Convex de `useQuery`.

Follows the existing pattern from `use-purchases.ts`.  
The two queries are **non-mutating** — they fetch data for UI display without writing to DB.

## Data Flow

### Activation Lifecycle (Complete)

```
User                    System (Convex)              Provider
────                    ──────────────              ────────

Select service+country
                         Show price (default)
Click "Acheter"
                         check balance (comptes, 411-{userId})
                    [Insufficient]
                         → Recharge drawer
                    [Sufficient]
                         [MUTATION] initiateActivation
                           ├── débit utilisateur (solde -= priceUsd)
                           ├── crédit escrow (471-escrow += priceUsd)
                           ├── create activation doc (status: "awaiting_number")
                           └── schedule pollActivation (runAfter 0s)

Show "Attribution du numéro..."
                         [ACTION] pollActivation (exécution immédiate différée)
                           HTTP getNumberV2(service, country)
                             └─ JSON: {activationId, phone, cost, ...}
                           [runMutation] updateActivation
                             └─ patch: {providerId, phoneNumber, status: "awaiting_sms"}

[useQuery getActivation reçoit la màj]
Show phone number
                         [ACTION] pollActivation (scheduled 3s later)
                           HTTP getStatus(providerId)
                             └─ STATUS_WAIT_CODE
                           reschedule dans 3s

[useQuery — status toujours "awaiting_sms"]
Show "Waiting for SMS..."

[After 60s, no SMS]
Show "SMS not received?"
User expands advanced
  → increases maxPrice
  → selects operator
  → clicks "Relancer"
                         [MUTATION] cancelActivation(oldId)
                           ├── HTTP setStatus(oldProviderId, 8)
                           ├── refund escrow → 411-{userId}
                           └── patch status: "cancelled"
                         [MUTATION] initiateActivation
                           ├── evenements comptables
                           └── schedule new pollActivation

[useQuery reçoit nouveau doc]
Show new number
                         [ACTION] pollActivation
                           HTTP getStatus(providerId)
                             └─ STATUS_OK:123456
                           [runMutation] updateActivation
                             └─ patch: {smsCode: "123456", status: "sms_received"}

[useQuery reçoit smsCode]
Show SMS code
User copies code

[SMS expires before user used it]
User clicks "Renvoyer SMS"
                         [MUTATION] requestAnotherSms
                           HTTP setStatus(providerId, 3)
                           patch status: "awaiting_sms"
                           schedule pollActivation

[useQuery reçoit status "awaiting_sms"]
                         [ACTION] pollActivation
                           HTTP getStatus(providerId)
                             └─ STATUS_OK:789012
                           [runMutation] patch {smsCode, status}

[useQuery reçoit nouveau code]
Show new code
User copies code
Clicks "Valider"
                         [MUTATION] completeActivation
                           HTTP setStatus(providerId, 6)
                           ├── libère escrow → 702-sms-marge + 471-fournisseur
                           ├── patch status: "completed"
[useQuery — finished]
```

**Key insight:** The frontend NEVER polls. It only calls mutations and subscribes via `useQuery`. All HTTP calls happen in actions, scheduled by mutations. The frontend is purely reactive.

### Pricing Flow

```
getPrices(country, service) — sms-online.pro returns:
{
  "33": {
    "wa": {
      "cost": 2.42,       // wholesale cost in USD
      "retail_cost": 3.63 // suggested retail in USD
    }
  }
}

Our system:
- Store wholesale cost (for margin calculation)
- Use our retail price as default maxPrice
- Provider price (retail_cost) is already in USD — compare directly
- Apply our margin on top of wholesale for user price (converted to XAF via `eurToXaf` which actually uses USD rate)
```

## Error Handling Strategy

| Scenario | Handling |
|----------|----------|
| Provider `NO_BALANCE` | Admin alert. Surface "Service temporairement indisponible." |
| Provider `NO_NUMBERS` | "Aucun numéro disponible pour ce pays/service. Essayez un autre pays ou augmentez le prix maximum." |
| Provider `WRONG_MAX_PRICE:$min` | "Le prix minimum est de $min USD." Show the min in advanced settings. |
| Provider `BAD_KEY` | Admin alert. "Erreur de configuration, contactez le support." |
| Insufficient user balance | Redirect to recharge drawer with pre-filled amount. |
| SMS not received after timeout | Show advanced settings panel (progressive disclosure). |
| Network error (fetch) | Retry 3x with exponential backoff (1s, 2s, 4s). Surface after. |
| `getStatus` returns `STATUS_CANCEL` | Mark as cancelled, refund if not already. |
| `setStatus(8)` returns `EARLY_CANCEL_DENIED` | Wait 2 min, then retry. Show timer to user. |

## Testing Strategy

**Phase 1 — Parser unit tests:**
- Test JSON response parsing for `getNumberV2`
- Test text response parsing for `getStatus`
- Test status codes: `STATUS_WAIT_CODE`, `STATUS_OK:$code`, `STATUS_WAIT_RETRY:$code`
- Test error responses: `NO_NUMBERS`, `NO_BALANCE`, `BAD_KEY`, `WRONG_MAX_PRICE`
- Test country code mapping (ISO ↔ numeric)

**Phase 2 — Manual integration test:**
- Run against sms-online.pro production with a small balance
- Test full flow: initiate → poll → receive → complete
- Test progressive disclosure: fail once, increase maxPrice, succeed
- Test `setStatus(3)`: receive SMS, let it expire, request another

**Phase 3 — Automated test script:**
- Create `scripts/test-sms-provider.mjs` mirroring `test-fapshi.mjs`
- Test `getBalance`, `getPrices`, `getNumberV2`, `getStatus`, `setStatus`
- Test `getNumbersStatus` — verify quantity data shape
- Test `getTopCountriesByService` — verify country ranking data

## Open Questions (Resolved)

1. **V1 vs V2 API**: ✅ Using `getNumberV2` — JSON response includes `canGetAnotherSms`, `activationCost`, `activationOperator`
2. **Pricing source**: Static pricing in `data.ts` (USD) as source of truth, with `syncPrices` action for manual refresh. sms-online.pro `getPrices` used for wholesale cost reference.
3. **Max Price default**: Default = our retail price. User can increase in advanced settings if no numbers available.
4. **Progressive disclosure**: Simple price by default. Advanced settings (maxPrice, operator, rental time) only shown after first failure.
5. **Request another SMS**: Via `setStatus(3)` — works during rental window. Check `canGetAnotherSms` from V2 response.
6. **Refund policy**: Auto-refund if SMS never arrives AND user didn't receive any code. Daily limit of 3 refunds per user.
7. **Concurrent activations**: Cap at 3 simultaneous per user initially.
8. **Number rental vs one-time**: One-time activations for v1. Rental API (getRentNumber, continueRentNumber) for v2.
9. **Escrow resolution**: Who resolves orphaned escrow? ✅ Two automatic paths — `completeActivation` (libère → marge + fournisseur) and `cancelActivation` (libère → remboursement). Timeout in `pollActivation` (15 min) auto-cancels. No orphaned escrow possible because all mutations that touch escrow are idempotent and called deterministically.
10. **How do we know `providerCost` before activation?** ✅ `getNumberV2` returns `activationCost` in the JSON response. This is the wholesale cost (sans marge). Stocké dans le doc activation → utilisé pour le split escrow dans `completeActivation`.
11. **Can `pollActivation` be retried if the action fails mid-way?** ✅ Oui. L'action lit l'état DB avant tout. Si elle échoue et est relancée, elle voit le statut actuel et continue. Idempotent — `getStatus` ne change pas l'état du provider.
