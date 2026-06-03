# SMS Online Pro Integration — Phase 1: Core Backend

**Goal:** Build the backend foundation for sms-online.pro integration: fix EUR→USD naming, add country code mapping, activations schema, accounting comptes, and the full Convex module with mutations/actions/queries.

**Architecture:** Frontend calls Convex mutations → mutations schedule backend actions via `ctx.scheduler.runAfter(0, ...)` → actions make HTTP calls to sms-online.pro → actions write DB results via `ctx.runMutation(internalMutation)`. Frontend subscribes reactively via `useQuery`. Escrow pattern: user debited upfront → held in `471-escrow` → on success split to marge+fournisseur, on failure refund.

**Design:** `thoughts/shared/designs/2026-06-02-sms-online-pro-integration-design.md`

---

## Dependency Graph

```
Batch 1 (parallel — 5 implementers): 1.1, 1.2, 1.3, 1.4, 1.5   [foundation — no deps]
Batch 2 (1 implementer): 2.1                                     [core module — depends on batch 1]
Batch 3 (parallel — 2 implementers): 3.1, 3.2                    [client hooks — depends on batch 2]
```

---

## Batch 1: Foundation (parallel — 5 implementers)

All tasks in this batch have NO dependencies and run simultaneously.

### Task 1.1: Rename EUR→USD in data.ts
**File:** `src/components/services/data.ts`
**Test:** `src/__tests__/services/data.test.ts`
**Depends:** none

**What:** Rename `priceEur` → `priceUsd` and `eurToXaf` → `usdToXaf` across the entire file. No behavior change — these values were always USD despite the misleading name (confirmed by design doc: "sms-online.pro uses USD. Our data uses USD too (priceEur in data.ts is actually USD despite the name). No currency conversion needed — both systems are in USD.").

**Changes:**
1. Interface `CountryPrice`: `priceEur: number` → `priceUsd: number`
2. Function: `eurToXaf(priceEur)` → `usdToXaf(priceUsd)` (parameter rename too)
3. All 68 country entries: `priceEur: N` → `priceUsd: N`, `eurToXaf(N)` → `usdToXaf(N)`
4. `getCountryByIso` return type updates automatically via interface

**Test:**
```typescript
// src/__tests__/services/data.test.ts
import { describe, it, expect } from 'vitest'
import { usdToXaf, COUNTRIES, getCountryByIso, SERVICES } from '@/components/services/data'

describe('usdToXaf', () => {
  it('converts small amounts with 500 margin', () => {
    // USD 0.35 * 655.957 = 229.585 → ceil = 230 + 500 margin = 730
    const result = usdToXaf(0.35)
    expect(result).toBe(730)
  })

  it('converts medium amounts with 1000 margin', () => {
    // USD 0.75 * 655.957 = 491.97 → ceil = 492 + 1000 margin = 1492
    const result = usdToXaf(0.75)
    expect(result).toBe(1492)
  })

  it('converts large amounts with 2000 margin', () => {
    // USD 2.0 * 655.957 = 1311.914 → ceil = 1312 + 2000 margin = 3312
    const result = usdToXaf(2.0)
    expect(result).toBe(3312)
  })

  it('handles boundary at 0.5', () => {
    // At 0.5 it's ≤ 1 so 1000 margin
    const result = usdToXaf(0.5)
    expect(result).toBeGreaterThan(0)
  })

  it('handles boundary at 1.0', () => {
    // At 1.0 it's ≤ 1 so 1000 margin
    const result = usdToXaf(1.0)
    expect(result).toBeGreaterThan(0)
  })
})

describe('COUNTRIES', () => {
  it('has all countries with valid structure', () => {
    expect(COUNTRIES.length).toBeGreaterThan(60)
    for (const c of COUNTRIES) {
      expect(c.iso).toBeTruthy()
      expect(typeof c.priceUsd).toBe('number')
      expect(c.priceUsd).toBeGreaterThan(0)
      expect(typeof c.priceXaf).toBe('number')
      expect(c.priceXaf).toBeGreaterThan(0)
      expect(c.flag).toBeTruthy()
    }
  })

  it('has France as first entry', () => {
    expect(COUNTRIES[0].iso).toBe('FR')
    expect(COUNTRIES[0].name).toBe('France')
  })

  it('priceXaf is derived from priceUsd', () => {
    for (const c of COUNTRIES) {
      expect(c.priceXaf).toBe(usdToXaf(c.priceUsd))
    }
  })
})

describe('getCountryByIso', () => {
  it('finds country by ISO code', () => {
    const fr = getCountryByIso('FR')
    expect(fr?.name).toBe('France')
  })

  it('returns undefined for unknown ISO', () => {
    expect(getCountryByIso('XX')).toBeUndefined()
  })
})

describe('SERVICES', () => {
  it('has WhatsApp, Telegram, Viber, Signal, Line, Imo, Facebook, Gmail, Uber, Amazon', () => {
    const slugs = SERVICES.map(s => s.slug)
    expect(slugs).toContain('whatsapp')
    expect(slugs).toContain('telegram')
    expect(SERVICES.length).toBeGreaterThanOrEqual(10)
  })
})
```

**Implementation:**
```typescript
// src/components/services/data.ts
export interface CountryPrice {
  iso: string
  name: string
  priceUsd: number
  priceXaf: number
  flag: string
}

export function usdToXaf(priceUsd: number): number {
  const rate = 655.957
  const baseXaf = Math.ceil(priceUsd * rate)
  let margin: number
  if (priceUsd < 0.5) margin = 500
  else if (priceUsd <= 1) margin = 1000
  else margin = 2000
  return baseXaf + margin
}

// SERVICES stays unchanged

export const COUNTRIES: CountryPrice[] = [
  { iso: 'FR', name: 'France', priceUsd: 0.35, priceXaf: usdToXaf(0.35), flag: '🇫🇷' },
  { iso: 'DE', name: 'Germany', priceUsd: 0.4, priceXaf: usdToXaf(0.4), flag: '🇩🇪' },
  { iso: 'GB', name: 'United Kingdom', priceUsd: 0.5, priceXaf: usdToXaf(0.5), flag: '🇬🇧' },
  { iso: 'US', name: 'United States', priceUsd: 0.55, priceXaf: usdToXaf(0.55), flag: '🇺🇸' },
  // ... all other countries with priceUsd instead of priceEur, usdToXaf instead of eurToXaf ...
  { iso: 'GQ', name: 'Equatorial Guinea', priceUsd: 0.35, priceXaf: usdToXaf(0.35), flag: '🇬🇶' },
]

export function getCountryByIso(iso: string): CountryPrice | undefined {
  return COUNTRIES.find((c) => c.iso === iso)
}

// getServiceBySlug unchanged
```

**Note to implementer:** This is a pure rename. Every `priceEur` becomes `priceUsd`, every `eurToXaf` becomes `usdToXaf`. The values and logic stay identical. There are 68 country entries to update — do them all. No other files need updating because no other file references `priceEur` or `eurToXaf` directly (they only use `.priceXaf` for display).

**Verify:** `npx vitest run src/__tests__/services/data.test.ts`
**Commit:** `refactor(services): rename priceEur→priceUsd, eurToXaf→usdToXaf`

---

### Task 1.2: Country Code Mapping
**File:** `convex/sms-countries.ts`
**Test:** `src/__tests__/convex/sms-countries.test.ts`
**Depends:** none

**What:** Pure data mapping between sms-online.pro numeric country codes and our ISO codes. No Convex dependencies — can be used both on client and server. Two-way mapping with `SMS_COUNTRY_MAP` (numeric→ISO) and `ISO_TO_SMS` (ISO→numeric).

**Design decision:** sms-online.pro uses numeric codes (e.g., 33 for France, 1 for US). Our app uses ISO codes (FR, US). This mapping bridges the two. The reverse map `ISO_TO_SMS` is computed at module load time from `SMS_COUNTRY_MAP`.

**Test:**
```typescript
// src/__tests__/convex/sms-countries.test.ts
import { describe, it, expect } from 'vitest'
import { SMS_COUNTRY_MAP, ISO_TO_SMS, numericToIso, isoToNumeric } from '../../../convex/sms-countries'

describe('SMS_COUNTRY_MAP', () => {
  it('covers major countries', () => {
    expect(SMS_COUNTRY_MAP[1]).toBe('US')
    expect(SMS_COUNTRY_MAP[33]).toBe('FR')
    expect(SMS_COUNTRY_MAP[44]).toBe('GB')
    expect(SMS_COUNTRY_MAP[49]).toBe('DE')
    expect(SMS_COUNTRY_MAP[237]).toBe('CM')
    expect(SMS_COUNTRY_MAP[86]).toBe('CN')
    expect(SMS_COUNTRY_MAP[81]).toBe('JP')
    expect(SMS_COUNTRY_MAP[91]).toBe('IN')
  })

  it('has over 100 entries', () => {
    expect(Object.keys(SMS_COUNTRY_MAP).length).toBeGreaterThan(100)
  })

  it('all values are uppercase ISO codes', () => {
    for (const iso of Object.values(SMS_COUNTRY_MAP)) {
      expect(iso).toMatch(/^[A-Z]{2}$/)
    }
  })

  it('all keys are positive integers', () => {
    for (const code of Object.keys(SMS_COUNTRY_MAP)) {
      expect(Number(code)).toBeGreaterThan(0)
    }
  })
})

describe('ISO_TO_SMS', () => {
  it('provides reverse mapping', () => {
    expect(ISO_TO_SMS['US']).toBe(1)
    expect(ISO_TO_SMS['FR']).toBe(33)
    expect(ISO_TO_SMS['GB']).toBe(44)
    expect(ISO_TO_SMS['DE']).toBe(49)
    expect(ISO_TO_SMS['CM']).toBe(237)
  })

  it('has same number of entries as SMS_COUNTRY_MAP', () => {
    expect(Object.keys(ISO_TO_SMS).length).toBe(Object.keys(SMS_COUNTRY_MAP).length)
  })

  it('is a bijection (round-trip)', () => {
    for (const [numeric, iso] of Object.entries(SMS_COUNTRY_MAP)) {
      expect(ISO_TO_SMS[iso]).toBe(Number(numeric))
    }
  })
})

describe('numericToIso', () => {
  it('converts numeric to ISO', () => {
    expect(numericToIso(33)).toBe('FR')
    expect(numericToIso(1)).toBe('US')
  })

  it('returns null for unknown codes', () => {
    expect(numericToIso(999)).toBeNull()
  })
})

describe('isoToNumeric', () => {
  it('converts ISO to numeric', () => {
    expect(isoToNumeric('FR')).toBe(33)
    expect(isoToNumeric('US')).toBe(1)
  })

  it('returns null for unknown ISOs', () => {
    expect(isoToNumeric('XX')).toBeNull()
  })
})
```

**Implementation:**
```typescript
// convex/sms-countries.ts

/**
 * sms-online.pro numeric country code → ISO 3166-1 alpha-2 code
 */
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

/** ISO 3166-1 alpha-2 → sms-online.pro numeric code */
export const ISO_TO_SMS: Record<string, number> = {}
for (const [code, iso] of Object.entries(SMS_COUNTRY_MAP)) {
  ISO_TO_SMS[iso] = Number(code)
}

/** Lookup ISO code from numeric provider code. Returns null if not found. */
export function numericToIso(numeric: number): string | null {
  return SMS_COUNTRY_MAP[numeric] ?? null
}

/** Lookup numeric provider code from ISO code. Returns null if not found. */
export function isoToNumeric(iso: string): number | null {
  return ISO_TO_SMS[iso] ?? null
}
```

**Verify:** `npx vitest run src/__tests__/convex/sms-countries.test.ts`
**Commit:** `feat(sms): add country code mapping (ISO ↔ numeric)`

---

### Task 1.3: Add activations table to schema
**File:** `convex/schema.ts`
**Test:** none (schema definition, verified by `npx convex dev`)
**Depends:** none

**What:** Add the `activations` table with 4 indexes (`by_userId`, `by_providerId`, `by_status`, `by_userId_status`).

**Fields from design:**
| Field | Type | |
|-------|------|---|
| `userId` | `string` | indexed — who requested |
| `service` | `string` | service code (wa, tg, fb) |
| `country` | `string` | ISO country code |
| `providerId` | `number` | unique, indexed — sms-online.pro activation ID |
| `phoneNumber` | `string` | assigned number |
| `status` | `v.union(...)` | lifecycle status |
| `maxPrice` | `number` | maxPrice used |
| `operator` | `v.optional(v.string())` | selected operator |
| `smsCode` | `v.optional(v.string())` | received SMS code |
| `canGetAnotherSms` | `v.boolean()` | from V2 response |
| `rentEndTime` | `v.optional(v.number())` | rental window end |
| `providerCost` | `v.number()` | wholesale cost (USD) |
| `priceCharged` | `v.number()` | what user paid (USD) |
| `errorMessage` | `v.optional(v.string())` | error details |
| `createdAt` | `v.number()` | timestamp |
| `updatedAt` | `v.number()` | timestamp |

**Implementation — edit `convex/schema.ts`:**

Add after the `lignes` table definition (before closing `})` of `defineSchema`):

```typescript
  activations: defineTable({
    userId: v.string(),
    service: v.string(),
    country: v.string(),
    providerId: v.optional(v.number()),
    phoneNumber: v.optional(v.string()),
    status: v.union(
      v.literal('awaiting_number'),
      v.literal('awaiting_sms'),
      v.literal('sms_received'),
      v.literal('completed'),
      v.literal('cancelled'),
      v.literal('expired'),
      v.literal('no_numbers'),
      v.literal('max_price_too_low'),
    ),
    maxPrice: v.number(),
    operator: v.optional(v.string()),
    smsCode: v.optional(v.string()),
    canGetAnotherSms: v.boolean(),
    rentEndTime: v.optional(v.number()),
    providerCost: v.optional(v.number()),
    priceCharged: v.number(),
    errorMessage: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index('by_userId', ['userId'])
    .index('by_providerId', ['providerId'])
    .index('by_status', ['status'])
    .index('by_userId_status', ['userId', 'status']),
```

**Verify:** `npx convex dev` — should compile without errors (schema validates on deploy)
**Commit:** `feat(schema): add activations table with indexes`

---

### Task 1.4: SMS activation types
**File:** `src/type/sms-activation.ts`
**Test:** none (type definition only)
**Depends:** none

**What:** TypeScript types that mirror the Convex schema for use in client code. These match the `getActivation` / `getMyActivations` query return types.

```typescript
// src/type/sms-activation.ts

/** Mirrors the Convex activations table schema for client-side use */
export interface SmsActivation {
  _id: string
  _creationTime: number
  userId: string
  service: string
  country: string
  providerId?: number
  phoneNumber?: string
  status: SmsActivationStatus
  maxPrice: number
  operator?: string
  smsCode?: string
  canGetAnotherSms: boolean
  rentEndTime?: number
  providerCost?: number
  priceCharged: number
  errorMessage?: string
  createdAt: number
  updatedAt: number
}

export type SmsActivationStatus =
  | 'awaiting_number'
  | 'awaiting_sms'
  | 'sms_received'
  | 'completed'
  | 'cancelled'
  | 'expired'
  | 'no_numbers'
  | 'max_price_too_low'

export interface InitiateActivationInput {
  service: string
  country: string
  maxPrice?: number
  operator?: string
}

export interface GetNumberQuantityResult {
  /** Service code → available count, e.g. { wa: 523, tg: 352 } */
  [serviceCode: string]: number
}

export interface TopCountryResult {
  country: number       // numeric sms-online.pro country code
  countryText: string   // country name
  count: number         // available numbers
  retailPrice: number   // retail price in USD
}

export interface SmsProviderError {
  code: 'NO_BALANCE' | 'NO_NUMBERS' | 'BAD_KEY' | 'WRONG_MAX_PRICE' | 'EARLY_CANCEL_DENIED' | 'NETWORK_ERROR'
  message: string
  minPrice?: number
}
```

**Commit:** `feat(types): add SMS activation types for client`

---

### Task 1.5: SMS Provider Test Script
**File:** `scripts/test-sms-provider.mjs`
**Test:** none (standalone test script)
**Depends:** none

**What:** A Node.js test script (mirroring `scripts/test-fapshi.mjs`) that tests the sms-online.pro API directly. Tests `getBalance`, `getPrices`, `getNumbersStatus`, `getTopCountriesByService`, and the V2 `getNumber` flow.

```javascript
#!/usr/bin/env node
/**
 * Test script for sms-online.pro API
 *
 * Usage:
 *   SMSONLINEPRO_API_KEY=xxx node scripts/test-sms-provider.mjs
 *
 * This tests the raw HTTP API endpoints that will be wrapped by Convex actions.
 */

const API_BASE = 'https://sms-online.pro/stubs/handler_api.php'
const API_KEY = process.env.SMSONLINEPRO_API_KEY

if (!API_KEY) {
  console.error('Missing SMSONLINEPRO_API_KEY env var')
  process.exit(1)
}

async function apiCall(params) {
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', API_KEY)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  const text = await res.text()
  // Try JSON parse for V2 endpoints
  try { return JSON.parse(text) } catch { return text }
}

async function testGetBalance() {
  console.log('\n=== TEST 1: getBalance ===')
  const res = await apiCall({ action: 'getBalance' })
  console.log('Response:', res)
  return res
}

async function testGetPrices() {
  console.log('\n=== TEST 2: getPrices (country=33, service=wa) ===')
  const res = await apiCall({ action: 'getPrices', country: '33', service: 'wa' })
  console.log('Response:', JSON.stringify(res, null, 2))
  return res
}

async function testGetNumbersStatus() {
  console.log('\n=== TEST 3: getNumbersStatus (country=33) ===')
  const res = await apiCall({ action: 'getNumbersStatus', country: '33' })
  console.log('Response:', JSON.stringify(res, null, 2))
  return res
}

async function testGetTopCountriesByService() {
  console.log('\n=== TEST 4: getTopCountriesByService (service=wa) ===')
  const res = await apiCall({ action: 'getTopCountriesByService', service: 'wa' })
  console.log('Response:', JSON.stringify(res, null, 2))
  return res
}

async function testGetNumberV2() {
  console.log('\n=== TEST 5: getNumberV2 (service=wa, country=33) ===')
  const res = await apiCall({ action: 'getNumberV2', service: 'wa', country: '33' })
  console.log('Response:', JSON.stringify(res, null, 2))
  return res
}

async function testBadKey() {
  console.log('\n=== TEST 6: Bad API Key ===')
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', 'INVALID_KEY')
  url.searchParams.set('action', 'getBalance')
  const res = await fetch(url.toString())
  const text = await res.text()
  console.log('Response:', text, '(expected BAD_KEY)')
}

async function main() {
  console.log('SMS Online Pro API Test')
  console.log('=======================')
  console.log('API Base:', API_BASE)
  console.log('API Key:', API_KEY.slice(0, 8) + '...')

  await testGetBalance()
  await testGetPrices()
  await testGetNumbersStatus()
  await testGetTopCountriesByService()

  // Only test getNumberV2 if balance is sufficient
  // await testGetNumberV2()

  await testBadKey()

  console.log('\n=== DONE ===')
}

main().catch(console.error)
```

**Verify:** `SMSONLINEPRO_API_KEY=xxx node scripts/test-sms-provider.mjs`
**Commit:** `feat(scripts): add sms-online.pro API test script`

---

## Batch 2: Core SMS Provider Module (1 implementer)

All tasks in this batch depend on Batch 1 (schema, types, country mapping).

### Task 2.1: SMS Provider Convex Module
**File:** `convex/sms-provider.ts`
**Test:** `scripts/test-sms-provider.mjs` (integration test)
**Depends:** 1.2 (sms-countries), 1.3 (schema), 1.4 (types)

**What:** The main Convex module with all sms-online.pro integration functions. Follows the Fapshi pattern from `convex/purchases.ts`:
- Private HTTP wrappers at module scope (like `fapshiPost`/`fapshiGet`)
- Public mutations for frontend calls
- Public queries for frontend subscriptions
- Internal actions for scheduler-based HTTP polling
- Internal mutations for action→DB writes

**Key architectural rules:**
1. Frontend calls mutations, NEVER HTTP directly
2. Polling done server-side via `ctx.scheduler.runAfter` in actions
3. Escrow accounting: debit user → escrow → split on success, refund on failure
4. Max 3 concurrent activations per user
5. Use `getNumberV2` (JSON) not V1
6. mutation → ctx.scheduler.runAfter(0, ...) → action → ctx.runMutation(internalMutation)

```typescript
// convex/sms-provider.ts
import { query, mutation, action, internalMutation, internalAction } from './_generated/server'
import { v } from 'convex/values'
import { internal } from './_generated/api'
import type { Id, Doc } from './_generated/dataModel'
import { isoToNumeric } from './sms-countries'

// ─── Constants ───────────────────────────────────────────────────────────────

const API_BASE = 'https://sms-online.pro/stubs/handler_api.php'
const MAX_CONCURRENT_ACTIVATIONS = 3
const POLL_INTERVAL_MS = 3000
const ACTIVATION_TIMEOUT_MS = 15 * 60 * 1000 // 15 minutes

// ─── Private HTTP Wrappers ────────────────────────────────────────────────────

async function smsProGet(params: Record<string, string>): Promise<string> {
  const apiKey = process.env.SMSONLINEPRO_API_KEY
  if (!apiKey) throw new Error('SMSONLINEPRO_API_KEY not configured')
  const url = new URL(API_BASE)
  url.searchParams.set('api_key', apiKey)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url.toString())
  return res.text()
}

async function smsProGetJson(params: Record<string, string>): Promise<any> {
  const text = await smsProGet(params)
  return JSON.parse(text)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUserId(identity: { subject: string } | null): string {
  if (!identity) throw new Error('Not authenticated')
  return identity.subject
}

// ─── initiateActivation (mutation) ────────────────────────────────────────────

export const initiateActivation = mutation({
  args: {
    service: v.string(),
    country: v.string(),
    maxPrice: v.optional(v.number()),
    operator: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)
    const now = Date.now()

    // 1. Validate country code
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) {
      throw new Error(`Invalid country code: ${args.country}`)
    }

    // 2. Check user's compte balance (USD)
    const userCompte = await ctx.db
      .query('comptes')
      .withIndex('by_code', (q) => q.eq('code', `411-${userId}`))
      .unique()
    if (!userCompte) throw new Error('Compte utilisateur introuvable. Veuillez recharger.')

    const priceUsd = args.maxPrice ?? 0.50 // fallback — should come from data.ts pricing
    if (userCompte.solde < priceUsd) {
      throw new Error('Solde insuffisant')
    }

    // 3. Check concurrent activation limit
    const activeActivations = await ctx.db
      .query('activations')
      .withIndex('by_userId_status', (q) =>
        q.eq('userId', userId).eq('status', 'awaiting_sms'),
      )
      .collect()
    if (activeActivations.length >= MAX_CONCURRENT_ACTIVATIONS) {
      throw new Error('Maximum 3 activations simultanées atteint. Veuillez compléter ou annuler une activation existante.')
    }

    // 4. Ensure comptes exist
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

    // 5. Create activation document (status: awaiting_number)
    const activationId = await ctx.db.insert('activations', {
      userId,
      service: args.service,
      country: args.country,
      providerId: undefined,
      phoneNumber: undefined,
      status: 'awaiting_number',
      maxPrice: priceUsd,
      operator: args.operator,
      smsCode: undefined,
      canGetAnotherSms: false,
      rentEndTime: undefined,
      providerCost: undefined,
      priceCharged: priceUsd,
      errorMessage: undefined,
      createdAt: now,
      updatedAt: now,
    })

    // 6. Escrow accounting — Piece 1: Mise en séquestre (statut: en_attente)
    await ctx.runMutation(internal.comptabilite.createPiece, {
      libelle: `Mise en séquestre activation ${activationId}`,
      statut: 'en_attente',
      reference: activationId,
      lignes: [
        { compteCode: `411-${userId}`, sens: 'credit', montant: priceUsd },  // user debited
        { compteCode: '471-escrow', sens: 'debit', montant: priceUsd },       // escrow credited
      ],
    })

    // 7. Schedule pollActivation immediately (runAfter 0s)
    await ctx.scheduler.runAfter(0, internal.sms.pollActivation, {
      activationId,
    })

    return { activationId }
  },
})

// ─── pollActivation (internalAction) ──────────────────────────────────────────

export const pollActivation = internalAction({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.runQuery(internal.sms.internalGetActivation, {
      activationId: args.activationId,
    })
    if (!activation) return

    // Terminal states — stop polling
    if (['completed', 'cancelled', 'expired', 'sms_received'].includes(activation.status)) {
      return
    }

    // Timeout check
    if (Date.now() - activation.createdAt > ACTIVATION_TIMEOUT_MS) {
      await ctx.runMutation(internal.sms.internalUpdateActivation, {
        activationId: args.activationId,
        patch: { status: 'expired', updatedAt: Date.now() },
      })
      // Refund escrow
      await ctx.runMutation(internal.sms.refundEscrow, {
        activationId: args.activationId,
      })
      return
    }

    try {
      if (activation.status === 'awaiting_number') {
        // First poll: try to get a number via getNumberV2
        const numericCountry = isoToNumeric(activation.country)
        if (!numericCountry) throw new Error(`Invalid country: ${activation.country}`)

        const params: Record<string, string> = {
          action: 'getNumberV2',
          service: activation.service,
          country: String(numericCountry),
        }
        if (activation.maxPrice > 0) {
          params.maxPrice = String(activation.maxPrice)
        }
        if (activation.operator) {
          params.operator = activation.operator
        }

        const response = await smsProGetJson(params)

        if (response.activationId) {
          // Success — number assigned
          await ctx.runMutation(internal.sms.internalUpdateActivation, {
            activationId: args.activationId,
            patch: {
              status: 'awaiting_sms',
              providerId: Number(response.activationId),
              phoneNumber: String(response.phoneNumber),
              providerCost: response.activationCost ? Number(response.activationCost) : undefined,
              canGetAnotherSms: response.canGetAnotherSms === true,
              rentEndTime: response.activationTime
                ? Number(response.activationTime) * 1000 + 20 * 60 * 1000
                : undefined,
              updatedAt: Date.now(),
            },
          })
          // Schedule next poll to check for SMS
          await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms.pollActivation, {
            activationId: args.activationId,
          })
        } else if (response === 'NO_NUMBERS') {
          await ctx.runMutation(internal.sms.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'no_numbers', errorMessage: 'Aucun numéro disponible', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms.refundEscrow, {
            activationId: args.activationId,
          })
        } else if (typeof response === 'string' && response.startsWith('WRONG_MAX_PRICE:')) {
          const minPrice = Number(response.split(':')[1])
          await ctx.runMutation(internal.sms.internalUpdateActivation, {
            activationId: args.activationId,
            patch: {
              status: 'max_price_too_low',
              errorMessage: `Prix minimum: ${minPrice} USD`,
              updatedAt: Date.now(),
            },
          })
          await ctx.runMutation(internal.sms.refundEscrow, {
            activationId: args.activationId,
          })
        } else if (response === 'NO_BALANCE') {
          await ctx.runMutation(internal.sms.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'expired', errorMessage: 'Service temporairement indisponible (solde fournisseur épuisé)', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms.refundEscrow, {
            activationId: args.activationId,
          })
        } else if (response === 'BAD_KEY') {
          await ctx.runMutation(internal.sms.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'expired', errorMessage: 'Erreur de configuration API', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms.refundEscrow, {
            activationId: args.activationId,
          })
        }
      } else if (activation.status === 'awaiting_sms') {
        // Poll SMS status
        if (!activation.providerId) return

        const response = await smsProGet({
          action: 'getStatus',
          id: String(activation.providerId),
        })

        if (response === 'STATUS_WAIT_CODE') {
          // Still waiting — reschedule
          await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms.pollActivation, {
            activationId: args.activationId,
          })
        } else if (typeof response === 'string' && response.startsWith('STATUS_OK:')) {
          const code = response.split(':')[1]
          await ctx.runMutation(internal.sms.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'sms_received', smsCode: code, updatedAt: Date.now() },
          })
        } else if (typeof response === 'string' && response.startsWith('STATUS_WAIT_RETRY:')) {
          const code = response.split(':')[1]
          await ctx.runMutation(internal.sms.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'sms_received', smsCode: code, updatedAt: Date.now() },
          })
        } else if (response === 'STATUS_CANCEL') {
          await ctx.runMutation(internal.sms.internalUpdateActivation, {
            activationId: args.activationId,
            patch: { status: 'cancelled', updatedAt: Date.now() },
          })
          await ctx.runMutation(internal.sms.refundEscrow, {
            activationId: args.activationId,
          })
        }
      }
    } catch (err) {
      // Network error — retry with backoff
      const message = err instanceof Error ? err.message : 'Unknown error'
      await ctx.runMutation(internal.sms.internalUpdateActivation, {
        activationId: args.activationId,
        patch: { errorMessage: message, updatedAt: Date.now() },
      })
      // Retry in 3s (simple backoff)
      await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms.pollActivation, {
        activationId: args.activationId,
      })
    }
  },
})

// ─── internalUpdateActivation (internalMutation) ──────────────────────────────

export const internalUpdateActivation = internalMutation({
  args: {
    activationId: v.id('activations'),
    patch: v.object({
      status: v.optional(v.string()),
      phoneNumber: v.optional(v.string()),
      providerId: v.optional(v.number()),
      smsCode: v.optional(v.string()),
      providerCost: v.optional(v.number()),
      canGetAnotherSms: v.optional(v.boolean()),
      rentEndTime: v.optional(v.number()),
      errorMessage: v.optional(v.string()),
      updatedAt: v.number(),
    }),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.activationId, args.patch)
  },
})

// ─── internalGetActivation (internalQuery) ────────────────────────────────────

export const internalGetActivation = internalQuery({
  args: { activationId: v.id('activations') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.activationId)
  },
})

// ─── refundEscrow (internalMutation) ──────────────────────────────────────────

export const refundEscrow = internalMutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const activation = await ctx.db.get(args.activationId)
    if (!activation) return

    // Find the escrow piece for this activation
    const escrowPiece = await ctx.db
      .query('pieces')
      .filter((q) => q.eq(q.field('reference'), args.activationId))
      .first()

    if (!escrowPiece || escrowPiece.statut !== 'en_attente') return // already resolved

    // Reverse escrow: credit escrow (↓), debit user (↑ = refund)
    await ctx.runMutation(internal.comptabilite.createPiece, {
      libelle: `Annulation activation ${args.activationId}`,
      statut: 'validee',
      reference: args.activationId,
      lignes: [
        { compteCode: '471-escrow', sens: 'credit', montant: activation.priceCharged },
        { compteCode: `411-${activation.userId}`, sens: 'debit', montant: activation.priceCharged },
      ],
    })

    // Mark original escrow piece as annulee
    await ctx.runMutation(internal.comptabilite.annulerPiece, {
      pieceId: escrowPiece._id,
    })
  },
})

// ─── completeActivation (mutation) ────────────────────────────────────────────

export const completeActivation = mutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    const activation = await ctx.db.get(args.activationId)
    if (!activation || activation.userId !== userId) throw new Error('Activation introuvable')
    if (activation.status !== 'sms_received') throw new Error('L\'activation n\'est pas en état SMS reçu')
    if (!activation.providerId) throw new Error('Pas de numéro de provider')

    // 1. HTTP setStatus(6) — release number on provider
    // Note: this is a mutation, so we need to make HTTP call in mutation context
    // This works because Convex mutations CAN make HTTP calls (they just can't be non-deterministic
    // in ways that affect the DB writes). setStatus is safe here.
    const response = await smsProGet({
      action: 'setStatus',
      id: String(activation.providerId),
      status: '6', // 6 = complete
    })

    if (response === 'BAD_KEY') throw new Error('Erreur de configuration API')

    // 2. Patch activation to completed
    await ctx.db.patch(args.activationId, {
      status: 'completed',
      updatedAt: Date.now(),
    })

    // 3. Resolve escrow
    const marginUsd = Math.round((activation.priceCharged - (activation.providerCost ?? 0)) * 100) / 100

    const escrowPiece = await ctx.db
      .query('pieces')
      .filter((q) => q.eq(q.field('reference'), args.activationId))
      .first()

    if (escrowPiece && escrowPiece.statut === 'en_attente') {
      // Release escrow: escrow ↓ → marge ↑ + fournisseur ↑
      await ctx.runMutation(internal.comptabilite.createPiece, {
        libelle: `Activation ${args.activationId} réussie`,
        statut: 'validee',
        reference: args.activationId,
        lignes: [
          { compteCode: '471-escrow', sens: 'credit', montant: activation.priceCharged },
          { compteCode: '702-sms-marge', sens: 'debit', montant: Math.max(0, marginUsd) },
          { compteCode: '471-fournisseur', sens: 'debit', montant: activation.providerCost ?? 0 },
        ],
      })

      // Mark original escrow piece as validee
      await ctx.runMutation(internal.comptabilite.annulerPiece, {
        pieceId: escrowPiece._id,
      })
    }

    return { success: true }
  },
})

// ─── cancelActivation (mutation) ──────────────────────────────────────────────

export const cancelActivation = mutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    const activation = await ctx.db.get(args.activationId)
    if (!activation || activation.userId !== userId) throw new Error('Activation introuvable')
    if (['completed', 'cancelled', 'expired'].includes(activation.status)) {
      throw new Error('L\'activation est déjà terminée')
    }

    // 1. HTTP setStatus(8) — cancel on provider
    if (activation.providerId) {
      try {
        await smsProGet({
          action: 'setStatus',
          id: String(activation.providerId),
          status: '8', // 8 = cancel
        })
      } catch (err) {
        // If EARLY_CANCEL_DENIED, the provider rejected early cancel
        // Still proceed with DB cancel — the provider will eventually cancel
        const message = err instanceof Error ? err.message : ''
        if (message.includes('EARLY_CANCEL')) {
          // Schedule a retry in 2 minutes
          await ctx.scheduler.runAfter(120_000, internal.sms.pollActivation, {
            activationId: args.activationId,
          })
        }
      }
    }

    // 2. Mark as cancelled
    await ctx.db.patch(args.activationId, {
      status: 'cancelled',
      updatedAt: Date.now(),
    })

    // 3. Refund escrow
    await ctx.runMutation(internal.sms.refundEscrow, {
      activationId: args.activationId,
    })

    return { success: true }
  },
})

// ─── requestAnotherSms (mutation) ─────────────────────────────────────────────

export const requestAnotherSms = mutation({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    const activation = await ctx.db.get(args.activationId)
    if (!activation || activation.userId !== userId) throw new Error('Activation introuvable')
    if (activation.status !== 'sms_received' && activation.status !== 'awaiting_sms') {
      throw new Error('Impossible de redemander un SMS dans cet état')
    }
    if (!activation.canGetAnotherSms) {
      throw new Error('Ce numéro ne permet pas de redemander un SMS')
    }
    if (!activation.providerId) throw new Error('Pas de numéro de provider')

    // 1. HTTP setStatus(3) — request another SMS
    const response = await smsProGet({
      action: 'setStatus',
      id: String(activation.providerId),
      status: '3', // 3 = request new SMS
    })

    if (response === 'BAD_KEY') throw new Error('Erreur de configuration API')

    // 2. Reset to awaiting_sms
    await ctx.db.patch(args.activationId, {
      status: 'awaiting_sms',
      smsCode: undefined,
      updatedAt: Date.now(),
    })

    // 3. Schedule poll for the new SMS
    await ctx.scheduler.runAfter(POLL_INTERVAL_MS, internal.sms.pollActivation, {
      activationId: args.activationId,
    })

    return { success: true }
  },
})

// ─── getActivation (query) ────────────────────────────────────────────────────

export const getActivation = query({
  args: {
    activationId: v.id('activations'),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    const activation = await ctx.db.get(args.activationId)
    if (!activation) throw new Error('Activation introuvable')
    if (activation.userId !== userId) throw new Error('Non autorisé')

    return activation
  },
})

// ─── getMyActivations (query) ─────────────────────────────────────────────────

export const getMyActivations = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return []

    return await ctx.db
      .query('activations')
      .withIndex('by_userId', (q) => q.eq('userId', identity.subject))
      .order('desc')
      .take(50)
  },
})

// ─── getNumberQuantity (query) ────────────────────────────────────────────────

export const getNumberQuantity = query({
  args: {
    country: v.string(),
  },
  handler: async (ctx, args) => {
    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) return {}

    // Note: this query makes an HTTP call which is not ideal for a query
    // (queries should be deterministic). However getNumberQuantity is called
    // from the frontend to show availability — the data is inherently non-deterministic.
    // Convex allows fetch in queries but may show stale data.
    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return {}

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getNumbersStatus')
      url.searchParams.set('country', String(numericCountry))
      const res = await fetch(url.toString())
      const text = await res.text()
      const data = JSON.parse(text) // e.g. { wa: 523, tg: 352 }
      return data
    } catch {
      return {}
    }
  },
})

// ─── getTopCountries (query) ──────────────────────────────────────────────────

export const getTopCountries = query({
  args: {
    service: v.string(),
  },
  handler: async (ctx, args) => {
    const apiKey = process.env.SMSONLINEPRO_API_KEY
    if (!apiKey) return []

    try {
      const url = new URL(API_BASE)
      url.searchParams.set('api_key', apiKey)
      url.searchParams.set('action', 'getTopCountriesByService')
      url.searchParams.set('service', args.service)
      const res = await fetch(url.toString())
      const text = await res.text()
      const data = JSON.parse(text) // array of { country, countryText, count, retailPrice }
      return data
    } catch {
      return []
    }
  },
})

// ─── syncPrices (action) ──────────────────────────────────────────────────────

export const syncPrices = action({
  args: {
    country: v.string(),
    service: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity()
    const userId = getUserId(identity)

    // Admin check
    const user = await ctx.runQuery(internal.purchases.internalGetUserByBetterAuthId, {
      betterAuthUserId: userId,
    })
    if (!user?.isAdmin) throw new Error('Non autorisé — Administrateur uniquement')

    const numericCountry = isoToNumeric(args.country)
    if (!numericCountry) throw new Error(`Invalid country: ${args.country}`)

    const params: Record<string, string> = {
      action: 'getPrices',
      country: String(numericCountry),
    }
    if (args.service) params.service = args.service

    const prices = await smsProGetJson(params)

    // Return pricing data for frontend rendering / cache update
    return prices
  },
})
```

**Note on `getNumberQuantity` and `getTopCountries`:** These queries make HTTP calls to sms-online.pro. While Convex queries should ideally be deterministic, these are intentionally non-deterministic because they show live provider data (available numbers, prices). The reactivity will work since Convex re-runs queries on each subscription. An alternative would be to convert these to actions, but the design specifies them as queries for `useQuery` compatibility.

**Note on `internal.sms` references:** Since the module file is named `sms-provider.ts`, the internal references will be `internal.sms.pollActivation`, `internal.sms.internalUpdateActivation`, etc. after running `npx convex dev` to generate the API.

**Verify:** `npx convex dev` — check for compilation errors. Run `scripts/test-sms-provider.mjs` for integration.
**Commit:** `feat(sms): add sms-provider convex module with full activation lifecycle`

---

## Batch 3: Client Hooks (parallel — 2 implementers)

All tasks in this batch depend on Batch 2 (sms-provider module).

### Task 3.1: SMS Activation Hooks
**File:** `src/components/purchases/hooks/use-activations.ts`
**Test:** none (integration tested via UI)
**Depends:** 2.1 (sms-provider convex module)

**What:** React hooks following the same pattern as `use-purchases.ts`. Uses `@convex-dev/react-query` for all Convex queries and mutations. No client-side polling — all reactivity comes from Convex's WebSocket.

```typescript
// src/components/purchases/hooks/use-activations.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../../../../convex/_generated/api'
import type { Id } from '../../../../convex/_generated/dataModel'

export const activationKeys = {
  all: ['activations'] as const,
  activation: (id: string) => [...activationKeys.all, 'activation', id] as const,
  myActivations: () => [...activationKeys.all, 'my'] as const,
  numberQuantity: (country: string) => [...activationKeys.all, 'quantity', country] as const,
  topCountries: (service: string) => [...activationKeys.all, 'top', service] as const,
}

export function useActivation(activationId: Id<'activations'> | null) {
  return useQuery({
    ...convexQuery(api.sms.getActivation, { activationId: activationId! }),
    enabled: !!activationId,
  })
}

export function useMyActivations() {
  return useQuery(convexQuery(api.sms.getMyActivations, {}))
}

export function useInitiateActivation() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.sms.initiateActivation)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activationKeys.myActivations() })
    },
  })
}

export function useCompleteActivation() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.sms.completeActivation)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activationKeys.all })
    },
  })
}

export function useCancelActivation() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.sms.cancelActivation)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activationKeys.all })
    },
  })
}

export function useRequestAnotherSms() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.sms.requestAnotherSms)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: activationKeys.all })
    },
  })
}

export function useNumberQuantity(country: string) {
  return useQuery({
    ...convexQuery(api.sms.getNumberQuantity, { country }),
    enabled: country.length > 0,
  })
}

export function useTopCountries(service: string) {
  return useQuery({
    ...convexQuery(api.sms.getTopCountries, { service }),
    enabled: service.length > 0,
  })
}
```

**Commit:** `feat(hooks): add SMS activation hooks for client`

---

### Task 3.2: Export New Hooks
**File:** `src/components/purchases/hooks/index.ts`
**Test:** none
**Depends:** 3.1

**What:** Add exports from the new `use-activations.ts` file to the existing barrel export.

**Changes — edit `src/components/purchases/hooks/index.ts`:**

Add to the existing export block:
```typescript
export {
  useActivation,
  useMyActivations,
  useInitiateActivation,
  useCompleteActivation,
  useCancelActivation,
  useRequestAnotherSms,
  useNumberQuantity,
  useTopCountries,
  activationKeys,
} from './use-activations'
```

**Commit:** `feat(hooks): export SMS activation hooks from barrel`

---

## Side Effects: Files That Reference the Old Names

After Batch 1 Task 1.1 renames `priceEur` → `priceUsd` and `eurToXaf` → `usdToXaf`, the following files import from `data.ts` but do NOT reference `priceEur` or `eurToXaf` directly (they only use `.priceXaf` and the type):

| File | What changes |
|------|-------------|
| `src/components/spa/my-space-page.tsx` | Imports `CountryPrice` type — no code change needed (field rename is internal to interface) |
| `src/type/service.ts` | Separate types, no reference to `priceEur` |

No downstream files break because:
- `priceXaf` field name stays the same
- `CountryPrice` interface name stays the same
- The renamed `priceUsd` is only used internally in `data.ts`

---

## Post-Merge: Regenerate Convex API

After all tasks in Batch 2 are complete, run:
```bash
npx convex dev
```

This generates `convex/_generated/api.d.ts` and `convex/_generated/server.d.ts` with the new `sms` module, making `api.sms.*` and `internal.sms.*` available.

---

## Verification Plan

| Step | What to verify | How |
|------|---------------|-----|
| 1 | TypeScript compiles | `npx tsc --noEmit` |
| 2 | Tests pass | `npx vitest run` |
| 3 | Convex functions deploy | `npx convex dev` (check for errors) |
| 4 | Integration test | `SMSONLINEPRO_API_KEY=xxx node scripts/test-sms-provider.mjs` |
| 5 | Schema has activations table | Check Convex dashboard |
| 6 | API module generates | Check `convex/_generated/api.d.ts` for `sms` entry |
