# SMS Providers API - Complete Analysis & Implementation Guide

**Date:** 2026-05-29  
**Status:** Phase 0 - API Documentation Complete  
**Next:** Test with real API keys

---

## Executive Summary

After analyzing all three provider APIs, I've confirmed:

1. ✅ **SMS Online Pro** - Full documentation received, **COMPATIBLE with Grizzly pattern**
2. ✅ **Tiger SMS** - Documentation complete, **SIMPLIFIED version** of the pattern
3. ✅ **Grizzly SMS** - Reference implementation available in `main` branch

**Key Finding:** SMS Online Pro and Grizzly SMS are nearly identical. Tiger SMS is a simplified variant. All three can share a common interface with provider-specific adapters.

---

## 1. SMS Online Pro API - Complete Documentation

### Base Configuration
- **Base URL**: `https://sms-online.pro/stubs/handler_api.php`
- **Authentication**: `api_key` parameter (GET or POST)
- **Currency**: USD (ISO 4217 code 840)
- **Documentation**: 18 pages (11 activation + 7 rent)

### 1.1 Core Activation Actions

#### `getNumber` (V1 - Plain Text)
```
?action=getNumber&api_key=$key&service=$service&country=$country
  &ref=$ref&phoneException=$phoneException&maxPrice=$maxPrice&operator=$operator
```

**Response:** `ACCESS_NUMBER:$id:$phone`

**Errors:** WRONG_MAX_PRICE, BAD_ACTION, BAD_SERVICE, BAD_KEY, ERROR_SQL, BANNED, WRONG_EXCEPTION_PHONE, NO_BALANCE_FORWARD

---

#### `getNumberV2` (V2 - JSON) ⭐ RECOMMENDED
```
?action=getNumberV2&api_key=$key&service=$service&country=$country
  &ref=$ref&phoneException=$phoneException&maxPrice=$maxPrice&operator=$operator
```

**Response:**
```json
{
  "activationId": 123456,
  "phoneNumber": "79295******",
  "activationCost": 7.50,
  "currency": 840,
  "countryCode": "0",
  "canGetAnotherSms": "1",
  "activationTime": "2025-05-14 11:10:42",
  "activationOperator": null
}
```

**Additional Error:** ORDER_ALREADY_EXISTS

---

#### `setStatus` - Change Activation Status
```
?action=setStatus&api_key=$key&status=$status&id=$id
```

**Status Codes:**
- `1` - Confirm ready (SMS sent to service)
- `3` - Request another code (free retry)
- `6` - Complete activation (success)
- `8` - Cancel (refund)

**Responses:** ACCESS_READY, ACCESS_RETRY_GET, ACCESS_ACTIVATION, ACCESS_CANCEL

**Errors:** EARLY_CANCEL_DENIED (<2min), NO_ACTIVATION, BAD_STATUS, BAD_ACTION

---

#### `getStatus` - Check Activation Status
```
?action=getStatus&api_key=$key&id=$id
```

**Responses:**
- `STATUS_WAIT_CODE` - Waiting for SMS
- `STATUS_CANCEL` - Cancelled
- `STATUS_OK:$code` - ✅ Code received
- `STATUS_WAIT_RETRY:$code` - Waiting for new code

---

#### `getBalance` - Account Balance
```
?action=getBalance&api_key=$key
```

**Response:** `ACCESS_BALANCE:$amount`

---

### 1.2 Catalog Actions

#### `getNumbersStatus` - Stock by Service
```
?action=getNumbersStatus&api_key=$key&country=$country
```

**Response:**
```json
{
  "fb": 523,
  "wa": 35235,
  "tg": 46346,
  "ig": 3434
}
```

---

#### `getPrices` - Pricing by Country/Service
```
?action=getPrices&api_key=$key&country=$country&service=$service
```

**Response:**
```json
{
  "187": {
    "wa": {
      "cost": 0.15,
      "count": 25,
      "physicalCount": 20
    }
  }
}
```

**Note:** Cost is a NUMBER (not string), includes `physicalCount` field

---

#### `getOperators` - Available Operators
```
?action=getOperators&api_key=$key&country=$country
```

**Response:**
```json
{
  "status": "success",
  "countryOperators": {
    "1": ["kyivstar", "vodafone", "life", "lycamobile", "mts"],
    "2": ["tele2", "beeline", "activ", "kcell"]
  }
}
```

---

#### `getTopCountriesByService` - Top Countries for Service
```
?action=getTopCountriesByService&api_key=$key&service=$service&freePrice=$bool
```

**Response:**
```json
{
  "0": {
    "country": 0,
    "count": 43575,
    "price": 15.00,
    "retail_price": 30.00
  }
}
```

---

### 1.3 Rent API (7 endpoints)

SMS Online Pro has a complete rental system for long-term numbers:

1. `getRentNumber` - Rent a number (2-72 hours)
2. `continueRentNumber` - Extend rental
3. `getRentStatus` - Get messages received
4. `setRentStatus` - Finish/cancel rental
5. `getRentServicesAndCountries` - Available services/countries
6. `getRentList` - List active rentals
7. `continueRentInfo` - Rental extension info

**Out of scope for v1** - Can be added later if needed.

---

### 1.4 Services & Countries

- **Services:** 644 active codes (wa, tg, ig, fb, vk, ok, etc.)
- **Countries:** 186 numeric codes (0=RU, 1=UA, 2=KZ, 41=CM, 187=CM in some mappings)
- **Sprite:** 2035 service icons available

---

## 2. Tiger SMS API - Complete Documentation

### Base Configuration
- **Base URL**: `https://api.tiger-sms.com/stubs/handler_api.php`
- **Authentication**: `api_key` parameter
- **Currency**: RUB (Russian Rubles)
- **Rate Limiting**: Yes - "Too Many Requests (429)"

### 2.1 Available Actions

#### `getBalance`
```
?action=getBalance&api_key=$key
```
**Response:** `ACCESS_BALANCE:92.20`

---

#### `getNumber` (NO V2 variant)
```
?action=getNumber&api_key=$key&service=$service&country=$country
  &ref=$ref&maxPrice=$maxPrice&providerIds=$ids&exceptProviderIds=$ids&activationType=$type
```

**Response:** `ACCESS_NUMBER:$id:$phone`

**Note:** Only plain text format, no JSON variant

---

#### `getStatus` (NO V2 variant)
```
?action=getStatus&api_key=$key&id=$id
```

**Responses:**
- `STATUS_WAIT_CODE`
- `STATUS_WAIT_RETRY`
- `ACCESS_CANCEL`
- `STATUS_OK:$code`

---

#### `setStatus`
```
?action=setStatus&api_key=$key&status=$status&id=$id
```

Same status codes as SMS Online Pro (1, 3, 6, 8)

---

#### `getPrices`
```
?action=getPrices&api_key=$key&service=$service&country=$country
```

**Response:**
```json
{
  "185": {
    "wa": {
      "cost": "12.50",
      "count": 150
    }
  }
}
```

**Note:** Cost is a STRING in RUB (different from SMS Online Pro)

---

#### `getProviders`
```
?action=getProviders&api_key=$key&service=$service&country=$country
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Provider Name",
    "numbers_count": 50,
    "delivery_percent": 98,
    "number_lifetime": 1200
  }
]
```

---

### 2.2 UNAVAILABLE Actions

These return `BAD_ACTION`:
- ❌ `getNumberV2`
- ❌ `getStatusV2`
- ❌ `getCountries`
- ❌ `getServicesList`
- ❌ `getNumbersStatus`
- ❌ `getTopCountriesByService`
- ❌ `getOperators`

---

## 3. Grizzly SMS API - Reference Implementation

### Base Configuration
- **Base URL**: `https://api.grizzlysms.com/stubs/handler_api.php`
- **Currency**: USD
- **Implementation:** Available in `main` branch

### 3.1 Available Actions (from code)

#### `getNumberV2` ✅
Returns full JSON activation object (same structure as SMS Online Pro)

#### `setStatus` ✅
Status codes: 1, 3, 6, 8, -1

#### `getStatusV2` ✅
Returns JSON with SMS details

#### `getStatusV1` (action: `getStatus`) ✅
Returns plain text status

#### `getBalance` ✅
Returns `ACCESS_BALANCE:$amount`

#### `getServicesList` ✅
Returns JSON with services array

#### `getCountries` ✅
Returns JSON array/object of countries

#### `getPricesV3` ✅
Returns nested JSON with provider details

---

## 4. API Compatibility Matrix

| Feature | Grizzly SMS | SMS Online Pro | Tiger SMS |
|---------|-------------|----------------|-----------|
| **Base URL** | api.grizzlysms.com | sms-online.pro | api.tiger-sms.com |
| **Currency** | USD | USD | RUB |
| **getNumberV2** | ✅ JSON | ✅ JSON | ❌ (use getNumber text) |
| **getNumber** | Unknown | ✅ Text | ✅ Text |
| **setStatus** | ✅ (1,3,6,8,-1) | ✅ (1,3,6,8) | ✅ (1,3,6,8) |
| **getStatusV2** | ✅ JSON | ❌ (use getStatus) | ❌ (use getStatus) |
| **getStatus** | ✅ Text | ✅ Text | ✅ Text |
| **getBalance** | ✅ | ✅ | ✅ |
| **getPrices** | getPricesV3 | getPrices | getPrices |
| **Price format** | Nested + providers | {cost:num, count, physicalCount} | {cost:string, count} |
| **getCountries** | ✅ | ✅ (via getTopCountries) | ❌ |
| **getServicesList** | ✅ | ❌ | ❌ |
| **getNumbersStatus** | Unknown | ✅ | ❌ |
| **getOperators** | Unknown | ✅ | ❌ |
| **getProviders** | Unknown | Unknown | ✅ |
| **getTopCountriesByService** | Unknown | ✅ | ❌ |
| **Rent API** | Unknown | ✅ (7 endpoints) | Unknown |

---

## 5. Implementation Strategy - REVISED

### 5.1 Common Interface (Thin Abstraction)

```typescript
interface ProviderClient {
  readonly code: "grizzly_sms" | "sms_online_pro" | "tiger_sms"
  readonly currency: "USD" | "RUB"
  
  // Core activation operations - MUST implement
  getBalance(): Promise<{ amount: number; currency: "USD" | "RUB" }>
  
  requestNumber(options: {
    service: string
    country: string
    maxPrice?: number
    operator?: string
  }): Promise<{
    activationId: string
    phoneNumber: string
    activationCost: number
    activationCostUsd: number  // normalized
    activationTime?: string
    activationOperator?: string
  }>
  
  checkStatus(activationId: string): Promise<{
    status: "waiting" | "received" | "cancelled" | "retry"
    smsCode?: string
    smsText?: string
    smsDateTime?: string
  }>
  
  setStatus(
    activationId: string,
    action: "ready" | "retry" | "complete" | "cancel"
  ): Promise<{ status: string }>
  
  // Catalog operations - MAY return null if not supported
  getPrices(country?: string, service?: string): Promise<PriceMap>
  
  listCountries(): Promise<Country[]> | null
  
  listServices(): Promise<Service[]> | null
  
  getStockStatus(country: string): Promise<Record<string, number>> | null
  
  getOperators(country: string): Promise<string[]> | null
}
```

### 5.2 Provider-Specific Adapters

#### Grizzly SMS Adapter
- Use `getNumberV2` (JSON)
- Use `getStatusV2` (JSON) for rich data
- Use `getPricesV3` (nested)
- Use `getServicesList` and `getCountries`
- Currency: USD (no conversion)

#### SMS Online Pro Adapter
- Use `getNumberV2` (JSON) - **SAME as Grizzly**
- Use `getStatus` (text) - parse response
- Use `getPrices` (simple format)
- Use `getTopCountriesByService` + `getNumbersStatus` for catalog
- Use `getOperators` for operator filtering
- Currency: USD (no conversion)

#### Tiger SMS Adapter
- Use `getNumber` (text) - parse `ACCESS_NUMBER:id:phone`
- Use `getStatus` (text) - parse response
- Use `getPrices` (simple format, cost as string)
- Use `getProviders` for provider info
- **Derive countries from getPrices keys** (no getCountries)
- **Derive services from getPrices keys** (no getServicesList)
- Currency: RUB → **convert to USD** using exchange rate

### 5.3 Currency Normalization

```typescript
class CurrencyConverter {
  private rubToUsdRate: number  // from PricingConfig
  
  normalize(amount: number, from: "USD" | "RUB"): number {
    if (from === "USD") return amount
    return amount / this.rubToUsdRate  // RUB → USD
  }
}
```

Rate stored in `PricingConfig` table:
- `rub_to_usd_rate` = 90 (1 USD = 90 RUB, approximate)
- Updated manually by admin when needed

---

## 6. Plugin Architecture - Final Design

```
packages/plugins/sms-providers/
  package.json
  tsconfig.json
  src/
    index.ts                    # Main exports
    
    core/
      types.ts                  # ProviderClient interface + shared types
      base-client.ts            # Abstract base with retry, cache, error handling
      currency.ts               # Currency conversion utilities
      errors.ts                 # Error sentinels + custom errors
    
    providers/
      grizzly-sms.ts           # GrizzlyClient extends BaseClient
      sms-online-pro.ts        # SmsOnlineProClient extends BaseClient
      tiger-sms.ts             # TigerSmsClient extends BaseClient
    
    registry.ts                # getProvider(code), listProviders()
    anonymizer.ts              # Provider name anonymization
    
    mappings/
      countries.ts             # Static country ID mappings
      services.ts              # Static service code mappings
```

### 6.1 Key Files

#### `src/core/types.ts`
```typescript
export interface ProviderClient {
  // ... (interface from 5.1)
}

export interface ProviderConfig {
  code: string
  baseUrl: string
  apiKey: string
  currency: "USD" | "RUB"
}

export const ERROR_CODES = [
  'BAD_KEY',
  'NO_NUMBERS',
  'NO_ACTIVATION',
  'BAD_SERVICE',
  'BAD_STATUS',
  'BAD_ACTION',
  'ERROR_SQL',
  'NO_BALANCE',
  'EARLY_CANCEL_DENIED',
  'ORDER_ALREADY_EXISTS',
  // ... etc
] as const
```

#### `src/core/base-client.ts`
```typescript
export abstract class BaseProviderClient implements ProviderClient {
  protected config: ProviderConfig
  protected cache: TTLCache
  
  constructor(config: ProviderConfig) {
    this.config = config
    this.cache = new TTLCache(60_000) // 1min default
  }
  
  protected async fetch(params: Record<string, any>): Promise<string> {
    // HTTP fetch with retry, timeout, error checking
  }
  
  protected checkError(text: string): void {
    // Check for error sentinels
  }
  
  // Abstract methods that each provider must implement
  abstract requestNumber(options: any): Promise<any>
  abstract checkStatus(id: string): Promise<any>
  // ... etc
}
```

#### `src/providers/sms-online-pro.ts`
```typescript
export class SmsOnlineProClient extends BaseProviderClient {
  readonly code = "sms_online_pro"
  readonly currency = "USD"
  
  async requestNumber(options: RequestNumberOptions) {
    // Use getNumberV2 (JSON response)
    const params = {
      api_key: this.config.apiKey,
      action: 'getNumberV2',
      service: options.service,
      country: options.country,
      maxPrice: options.maxPrice,
      operator: options.operator,
    }
    
    const text = await this.fetch(params)
    this.checkError(text)
    
    const data = JSON.parse(text)
    return {
      activationId: String(data.activationId),
      phoneNumber: data.phoneNumber,
      activationCost: Number(data.activationCost),
      activationCostUsd: Number(data.activationCost), // already USD
      activationTime: data.activationTime,
      activationOperator: data.activationOperator,
    }
  }
  
  async checkStatus(activationId: string) {
    // Use getStatus (text response)
    const params = {
      api_key: this.config.apiKey,
      action: 'getStatus',
      id: activationId,
    }
    
    const text = await this.fetch(params)
    this.checkError(text)
    
    // Parse: STATUS_WAIT_CODE | STATUS_OK:code | STATUS_CANCEL | STATUS_WAIT_RETRY:code
    if (text === 'STATUS_WAIT_CODE') {
      return { status: 'waiting' as const }
    }
    if (text === 'STATUS_CANCEL') {
      return { status: 'cancelled' as const }
    }
    if (text.startsWith('STATUS_OK:')) {
      const code = text.split(':')[1]
      return { status: 'received' as const, smsCode: code }
    }
    if (text.startsWith('STATUS_WAIT_RETRY:')) {
      const code = text.split(':')[1]
      return { status: 'retry' as const, smsCode: code }
    }
    
    throw new Error(`Unexpected status: ${text}`)
  }
  
  // ... implement other methods
}
```

#### `src/providers/tiger-sms.ts`
```typescript
export class TigerSmsClient extends BaseProviderClient {
  readonly code = "tiger_sms"
  readonly currency = "RUB"
  
  async requestNumber(options: RequestNumberOptions) {
    // Use getNumber (text response: ACCESS_NUMBER:id:phone)
    const params = {
      api_key: this.config.apiKey,
      action: 'getNumber',
      service: options.service,
      country: options.country,
      maxPrice: options.maxPrice,
    }
    
    const text = await this.fetch(params)
    this.checkError(text)
    
    // Parse: ACCESS_NUMBER:12345:79001234567
    const [prefix, id, phone] = text.split(':')
    if (prefix !== 'ACCESS_NUMBER') {
      throw new Error(`Unexpected response: ${text}`)
    }
    
    // Get price from getPrices to calculate cost
    const prices = await this.getPrices(options.country, options.service)
    const priceRub = prices[options.country]?.[options.service]?.cost || 0
    const priceUsd = this.convertToUsd(priceRub)
    
    return {
      activationId: id,
      phoneNumber: phone,
      activationCost: priceRub,
      activationCostUsd: priceUsd,
    }
  }
  
  private convertToUsd(rubAmount: number): number {
    // Get rate from config or use default
    const rate = 90 // 1 USD = 90 RUB
    return rubAmount / rate
  }
  
  async listCountries(): Promise<Country[]> | null {
    // Tiger SMS doesn't have getCountries
    // Derive from getPrices keys
    const prices = await this.getPrices()
    const countryIds = Object.keys(prices)
    
    // Map to static country names
    return countryIds.map(id => ({
      id,
      name: COUNTRY_NAMES[id] || `Country ${id}`,
    }))
  }
  
  // ... implement other methods
}
```

#### `src/registry.ts`
```typescript
const providers = new Map<string, ProviderClient>()

export function registerProvider(client: ProviderClient) {
  providers.set(client.code, client)
}

export function getProvider(code: string): ProviderClient {
  const provider = providers.get(code)
  if (!provider) {
    throw new Error(`Provider not found: ${code}`)
  }
  return provider
}

export function listProviders(): ProviderClient[] {
  return Array.from(providers.values())
}
```

#### `src/anonymizer.ts`
```typescript
const PROVIDER_DISPLAY = {
  grizzly_sms: { letter: 'A', name: 'Provider A', color: '#3B82F6' },
  sms_online_pro: { letter: 'B', name: 'Provider B', color: '#10B981' },
  tiger_sms: { letter: 'C', name: 'Provider C', color: '#F59E0B' },
}

export function anonymizeProvider(code: string) {
  return PROVIDER_DISPLAY[code] || { letter: '?', name: 'Unknown', color: '#6B7280' }
}
```

---

## 7. Phase 0 Verification - Action Items

### 7.1 Test SMS Online Pro API

```bash
# Set API key
API_KEY="<from .env>"

# Test balance
curl "https://sms-online.pro/stubs/handler_api.php?api_key=$API_KEY&action=getBalance"

# Test prices
curl "https://sms-online.pro/stubs/handler_api.php?api_key=$API_KEY&action=getPrices&country=187"

# Test stock status
curl "https://sms-online.pro/stubs/handler_api.php?api_key=$API_KEY&action=getNumbersStatus&country=187"

# Test operators
curl "https://sms-online.pro/stubs/handler_api.php?api_key=$API_KEY&action=getOperators&country=187"

# Test top countries
curl "https://sms-online.pro/stubs/handler_api.php?api_key=$API_KEY&action=getTopCountriesByService&service=wa"
```

### 7.2 Test Tiger SMS API

```bash
# Set API key
API_KEY="<from .env>"

# Test balance
curl "https://api.tiger-sms.com/stubs/handler_api.php?api_key=$API_KEY&action=getBalance"

# Test prices
curl "https://api.tiger-sms.com/stubs/handler_api.php?api_key=$API_KEY&action=getPrices"

# Test providers
curl "https://api.tiger-sms.com/stubs/handler_api.php?api_key=$API_KEY&action=getProviders&country=185&service=wa"
```

### 7.3 Document Results

Create `/tmp/phase0-verification.json`:
```json
{
  "sms_online_pro": {
    "balance": "...",
    "prices_sample": "...",
    "stock_sample": "...",
    "operators_sample": "..."
  },
  "tiger_sms": {
    "balance": "...",
    "prices_sample": "...",
    "providers_sample": "..."
  }
}
```

---

## 8. Implementation Order

### Phase 0: Verification (NOW)
1. ✅ Documentation complete
2. ⏳ Test SMS Online Pro with real API key
3. ⏳ Test Tiger SMS with real API key
4. ⏳ Document actual responses

### Phase 1: Plugin Foundation
1. Create `packages/plugins/sms-providers/` structure
2. Implement `core/types.ts` + `core/base-client.ts`
3. Implement `core/currency.ts` + `core/errors.ts`
4. Create static mappings (`mappings/countries.ts`, `mappings/services.ts`)

### Phase 2: Provider Implementations
1. Implement `GrizzlyClient` (port from `main`)
2. Implement `SmsOnlineProClient` (based on docs + tests)
3. Implement `TigerSmsClient` (based on docs + tests)

### Phase 3: Registry & Utilities
1. Implement `registry.ts`
2. Implement `anonymizer.ts`
3. Write unit tests for each provider

### Phase 4: Integration
1. Wire into Aura operations (`apps/app/src/operations/catalog/*`)
2. Test end-to-end flow
3. Update Prisma schema with provider configs

---

## 9. Critical Decisions

### 9.1 Use V2 APIs Where Available
- SMS Online Pro: Use `getNumberV2` (JSON) instead of `getNumber` (text)
- Grizzly SMS: Use `getNumberV2` (JSON)
- Tiger SMS: Use `getNumber` (text only - no V2)

### 9.2 Currency Normalization Strategy
- All prices exposed to operations are in **USD**
- Tiger SMS RUB prices converted using `PricingConfig.rub_to_usd_rate`
- Exchange rate updated manually by admin (not real-time)

### 9.3 Catalog Fallbacks
- Tiger SMS: Derive countries/services from `getPrices` keys
- SMS Online Pro: Use `getTopCountriesByService` + `getNumbersStatus`
- Grizzly SMS: Use `getServicesList` + `getCountries`

### 9.4 Error Handling
- All providers share common error sentinels (BAD_KEY, NO_NUMBERS, etc.)
- Provider-specific errors mapped to common error types
- Retry logic in base client (3 attempts, exponential backoff)

---

## 10. Next Steps

1. **User provides API keys** (or grants permission to read .env files)
2. **Run Phase 0 verification tests**
3. **Create plugin structure** (`packages/plugins/sms-providers/`)
4. **Implement base client** with retry + cache + error handling
5. **Implement provider adapters** one by one
6. **Write unit tests** for each provider
7. **Integrate with Aura operations**

**BLOCKER REMOVED:** SMS Online Pro documentation is complete. Ready to proceed with implementation after API key testing.

---

## 11. Comparison with Plan Assumptions

| Plan Assumption | Reality | Impact |
|----------------|---------|--------|
| All use `getNumberV2` | Only Grizzly + SMS Online Pro | Tiger needs text parsing |
| All use `getStatusV2` | Only Grizzly | SMS Online Pro + Tiger use `getStatus` text |
| All use `getPricesV3` | Only Grizzly | Others use simpler `getPrices` |
| Tiger URL: `tiger-sms.com/stubs/` | Actually: `api.tiger-sms.com/stubs/` | Update config |
| No webhook support | Confirmed for all 3 | Polling required |
| SMS Online Pro similar to Grizzly | ✅ CONFIRMED - nearly identical | Easy to implement |

**Conclusion:** The plan's architecture is sound, but provider adapters need more variation than initially assumed. The common interface approach is correct.
