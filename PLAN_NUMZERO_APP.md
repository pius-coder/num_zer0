# Plan complet — App de revente de numéros SMS (XAF / Cameroun) sur Aura v3

> **Pour l'agent qui implémente plus tard :** ce document est un **plan**, pas du code. Il décrit l'architecture, le modèle de données, les opérations, les routes UI, les plugins communautaires à créer, les composants shadcn à utiliser, les env vars, et l'ordre d'exécution. Le code définitif sera écrit en suivant les patterns existants (`apps/app/src/operations/todos/*.operation.ts`, `packages/plugins/realtime/*`). Toutes les références de fichiers / fonctions citées ci-dessous **existent réellement** dans le repo (branche `v3`) ou dans `main` (sources à porter).

---

## 0. Contexte & contraintes posées par l'utilisateur
|---|---|
| Marché | Cameroun (XAF) — UI bilingue FR/EN, par défaut FR |
| Fournisseurs SMS | **SMS Online Pro** + **Tiger SMS** (comptes existants), Grizzly SMS optionnel |
| Marge | **+1500 XAF fixe par numéro vendu** (au-dessus du coût wholesale converti USD→XAF) |
| Sélection pays | **Drawer** (PAS un popup, PAS un input "237") |
| Choix fournisseur | Après login l'utilisateur choisit un fournisseur affiché en **nom anonyme "geek"** (« Provider A », « Provider B »…) — l'UI s'adapte à la config du provider sélectionné |
| Paiement | **Fapshi** (référence dans branche `main`), MTN MoMo + Orange Money + lien Fapshi |
| Architecture | **Tout en plugins Aura communautaires** (`packages/plugins/*`) — y compris Fapshi (jamais "officiel") |
| Dashboard utilisateur | Gestion des entrées/sorties de numéros, historique, solde, achats, retraits |
| Marketing/analytics | **Facebook Pixel (Meta Pixel) + Conversions API**, **WhatsApp click-to-chat tracking**, **event tracking** côté client, **stockage IP + UA + device fingerprint** — ciblage Afrique via Facebook Ads + WhatsApp (PAS d'email marketing) |
| Pages | Toutes les pages nécessaires (auth, exploration, dashboard, wallet, légales, admin) |
| UI | Maximum de composants **shadcn/ui** |

**Décision implicite confirmée par mining `main` :** l'application existe déjà en Next.js sur la branche `main` avec Drizzle + services classiques. Le présent plan **porte** ces services vers le framework Aura v3 (Prisma + `defineOperationFn` + plugins).

---

## 1. Architecture globale (vue d'ensemble)

```
apps/app/                                    ← TanStack Start front + Hono backend (déjà en place)
  src/
    operations/                              ← defineOperationFn(...) — query/mutate/action
      _services/                             ← helpers réutilisables (port des src/services/* de main)
      auth/                                  ← register, login, request-otp, verify-otp (téléphone)
      catalog/                               ← list-providers, list-countries, list-services
      activations/                           ← request, cancel, check-status, list, get
      wallet/                                ← get-balance, list-transactions
      topup/                                 ← create, initiate-fapshi, verify, list
      tracking/                              ← track-event (pixel + JSON beacon)
      admin/                                 ← list-users, adjust-credits, providers-health
    routes/                                  ← TanStack Router pages
    components/                              ← UI (largement port de src/component/numbers de main)
    aura.registry.ts                         ← imports _registry + plugins

packages/plugins/                            ← plugins communautaires (NON officiels)
  sms-providers/                             ← NOUVEAU plugin communautaire
    src/
      core/                                  ← interface ProviderClient + types partagés
      providers/
        sms-online-pro.ts                    ← implémentation handler_api.php
        tiger-sms.ts                         ← implémentation handler_api.php
        grizzly-sms.ts                       ← port de src/services/grizzly/client.ts
      anonymizer.ts                          ← mapping providerCode → "Provider A/B/..."
      index.ts                               ← getProvider(code) + listProviders()
  fapshi/                                    ← NOUVEAU plugin communautaire
    src/
      client.ts                              ← port de src/services/fapshi/client.ts (sandbox/live)
      types.ts                               ← port de src/services/fapshi/types.ts
      webhook.ts                             ← Hono router POST /webhooks/fapshi (signature x-fapshi-key)
      index.ts                               ← getFapshiClient() + registerFapshiWebhook(app)
  tracking/                                  ← NOUVEAU plugin communautaire
    src/
      pixel.ts                               ← endpoint GET /tracking/pixel.gif?e=...&u=...
      beacon.ts                              ← endpoint POST /tracking/event (CORS, no-cors fetch ok)
      store.ts                               ← écrit dans Prisma TrackingEvent
      index.ts                               ← registerTrackingRoutes(app)
  realtime/                                  ← déjà existant — réutilisé tel quel
```

**Pourquoi des plugins ?** L'utilisateur l'a explicitement demandé. Cela isole la logique tierce (3 providers SMS + 1 paiement + 1 analytics) du noyau Aura et permet de la re-publier sans toucher au framework. Chaque plugin suit exactement la convention de `packages/plugins/realtime/` (cf. `packages/plugins/realtime/package.json:1` : `@aura/realtime`, exports `./`, `./client`, `./server`).

---

## 2. Plugin `@aura/sms-providers` — l'abstraction critique

### 2.1 Pourquoi un seul plugin pour 3 providers

Les trois (SMS Online Pro, Tiger SMS, Grizzly) suivent le pattern **SMS-Activate `handler_api.php`** avec un noyau d'actions communes (`getNumberV2`, `setStatus`, `getStatusV2`, `getStatusV1`, `getBalance`) et les mêmes sentinelles d'erreur (`BAD_KEY`, `NO_NUMBERS`, `NO_ACTIVATION`, `BAD_SERVICE`, `BAD_STATUS`, `BAD_ACTION`, `ERROR_SQL`, `SERVICE_UNAVAILABLE_REGION`, `NO_BALANCE`). Voir `src/services/grizzly/client.ts` (branche `main`) pour la signature de référence.

#### Divergences confirmées en Phase 0 (curl réel, 2026-05-28)

| Point | Tiger SMS | SMS Online Pro |
|---|---|---|
| Base URL | `https://tiger-sms.com/stubs/handler_api.php` | `https://sms-online.pro/stubs/handler_api.php` (NB: pas `smsonlinepro.com`, DNS NXDOMAIN) |
| Devise des prix & balance | **RUB** (balance test = 92.20 RUB) | **USD** (balance test = 3.00 USD) |
| `getPrices` (sans `V3`) | OK — `{country: {service: {cost: "string", count: int}}}` (cost en chaîne) | OK — `{country: {service: {cost: number, count: int, physicalCount: int}}}` |
| `getCountries` | **BAD_ACTION** (indispo) | OK — `{<englishName>: {id, eng, visible, retry, rent, multiService}}` |
| `getServicesList` | BAD_ACTION | BAD_ACTION |
| `getNumbersStatus` | BAD_ACTION | OK — `{<serviceCode>: stockCount}` (dict plat) |
| `getTopCountriesByService` | BAD_ACTION | non testé |

#### Conséquences pour l'implémentation

- **Catalog source = `getPrices`**, **pas** `getServicesList` (indispo partout) ni `getCountries` Tiger. Le plugin dérive le catalogue services/pays en lisant les **clés** de la réponse `getPrices` (premier appel cache 5–15min).
- **Mapping ISO ↔ id externe** : table statique `ExternalCountryMapping` (cf. §3.1) pré-seedée à partir d'une liste connue (les ids SMS-Activate-style sont quasi-stables entre clones — ex. `185 = USA`, `187 = Cameroun`).
- **Normalisation devise** : chaque `ProviderClient` lit son `currency: "RUB" | "USD"` et expose les coûts **en USD interne**. Conversion via `PricingConfig.usd_to_xaf_rate` et `PricingConfig.rub_to_xaf_rate` (cf. §3.2). On ne mélange jamais RUB et USD au-dessus de la couche client.
- **Pas de webhook push** (ni Tiger ni SMS Online Pro n'en exposent visiblement) → polling `getStatusV2` toutes les 3–5s pendant la phase WAITING. Grizzly garde son webhook si on l'active plus tard.

> Sécurité : les deux clés API ont été échangées en clair dans le transcript Claude Code de la session de planification. Elles **doivent être régénérées** avant le go-live, et stockées uniquement dans `apps/app/.env` + `Provider.apiKeyCipher` chiffré (cf. §10).

### 2.2 Interface commune `ProviderClient`

```
interface ProviderClient {
  code: "sms_online_pro" | "tiger_sms" | "grizzly_sms"
  currency: "USD" | "RUB"                                  // devise native de la balance/prix renvoyés par le provider
  getNumberV2(input: { service: string; country: string; maxPrice?: number }): Promise<{
    activationId: number
    phoneNumber: string
    activationCostUsd: number                              // normalisé USD par le client (RUB → USD via taux interne si Tiger)
    activationOperator?: string
    activationTime: string
  }>
  setStatus(activationId: number, code: 1 | 3 | 6 | 8 | -1): Promise<{ status: string }>
  getStatusV2(activationId: number): Promise<{
    verificationType: string
    sms: { code: string; text: string; dateTime: string } | null
  }>
  getStatusV1(activationId: number): Promise<string | { remainingSeconds: number }>
  getBalance(): Promise<{ amount: number; currency: "USD" | "RUB" }>   // retourne brut + devise — la conversion XAF se fait dans l'operation
  getPrices(country?: string, service?: string): Promise<{
    [country: string]: { [service: string]: { priceUsd: number; count: number } }
  }>
  // Catalogues dérivés (lazily depuis getPrices, car getServicesList/getCountries sont indispos sur Tiger)
  listCountries(): Promise<Array<{ id: string; name?: string }>>       // Tiger: depuis ExternalCountryMapping ; SOP: depuis /getCountries
  listServices(country: string): Promise<Array<{ code: string }>>      // dérivé de getPrices(country)
}
```

Source de vérité du shape : `src/services/grizzly/types.ts` et `src/services/grizzly/client.ts` dans `main`. À copier dans `packages/plugins/sms-providers/src/providers/grizzly-sms.ts` puis à adapter par variantes pour les deux autres. **Le client encapsule la conversion devise** : opérations consommatrices voient toujours de l'USD.

### 2.3 Anonymisation des noms

`packages/plugins/sms-providers/src/anonymizer.ts` expose :

```
function anonymizeProvider(code: string): { displayName: string; letter: string; color: string }
```

Mapping côté DB dans `ProviderRegistry` (cf. §3) : `displayLetter` + `accentColor` stockés en base, gérés par l'admin. Côté front, **jamais** afficher `code` brut.

### 2.4 Sélection (routage) provider

Port de `src/services/provider-routing.service.ts` (`main`) en mode **utilisateur explicite** :
- L'utilisateur **choisit son provider après login** (cf. §4) — c'est la demande explicite.
- Conséquence : pas de scoring multi-provider ; on charge le `providerCode` du user (préférence stockée en `AuraUser.preferredProviderCode`) et on appelle directement ce client.
- L'admin peut désactiver un provider (`Provider.isActive`) → la sélection user filtre les inactifs.
- Pour la résilience, un fallback admin manuel reste possible (basculer un user du provider A vers B en cas d'incident).

---

## 3. Modèle de données Prisma (à ajouter à `apps/app/prisma/schema.prisma`)

> Le schéma existant contient déjà `AuraUser`, `AuraPhoneIdentity`, `AuraPasswordCredential`, `AuraSession`, `AuraOtp`, `AuraNotification`, `AuraAuditLog`, `AuraOutbox`. On ajoute :

### 3.1 Providers & catalogue

```prisma
model Provider {
  id            String   @id @default(cuid())
  code          String   @unique          // "sms_online_pro" | "tiger_sms" | "grizzly_sms"
  displayLetter String                    // "A", "B", "C"
  displayName   String                    // "Provider A" (anonyme)
  apiBaseUrl    String
  apiKeyCipher  String                    // AES-GCM encrypted, jamais en clair
  isActive      Boolean  @default(true)
  priority      Int      @default(1)
  currentBalanceUsd  Decimal? @db.Decimal(10, 4)
  balanceLastCheckedAt DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model ExternalServiceMapping {
  id              String  @id @default(cuid())
  providerId      String
  localSlug       String                  // "whatsapp", "telegram", "google"
  externalApiCode String                  // "wa", "tg", "go" (varie par provider)
  provider        Provider @relation(fields: [providerId], references: [id])
  @@unique([providerId, localSlug])
}

model ExternalCountryMapping {
  id                String  @id @default(cuid())
  providerId        String
  isoCode           String                // "CM", "FR"
  externalCountryId String                // "187" (Grizzly), peut différer
  provider          Provider @relation(fields: [providerId], references: [id])
  @@unique([providerId, isoCode])
}
```

Inspiré de `src/database/schemas/services.ts` (main).

### 3.2 Pricing — la marge fixe 1500 XAF

```prisma
model PricingConfig {
  id              String   @id @default(cuid())
  key             String   @unique        // "usd_to_xaf_rate", "fixed_margin_xaf"
  valueNumber     Float
  updatedAt       DateTime @updatedAt
}
```

Valeurs initiales seedées :
- `usd_to_xaf_rate` = 650 (modifiable admin)
- `fixed_margin_xaf` = **1500** (la marge fixée par l'utilisateur)

**Formule de prix final affichée à l'utilisateur :**
```
priceXaf = ceil(wholesaleUsd * usd_to_xaf_rate) + fixed_margin_xaf
```

Pas de système de crédits (contrairement à `main` qui utilise `creditPackage` / `creditPurchase` / `creditWallet`). L'utilisateur paie **en XAF directs** chaque activation depuis son solde XAF. Plus simple, plus lisible pour le marché camerounais.

### 3.3 Wallet en XAF (pas en crédits)

```prisma
model Wallet {
  id            String   @id @default(cuid())
  userId        String   @unique
  balanceXaf    Int      @default(0)       // entier XAF (pas de centimes)
  heldXaf       Int      @default(0)       // bloqué sur activations en cours
  totalToppedUp Int      @default(0)
  totalSpent    Int      @default(0)
  totalRefunded Int      @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  user          AuraUser @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model WalletTransaction {
  id            String   @id @default(cuid())
  userId        String
  walletId      String
  type          WalletTxnType                    // TOPUP | DEBIT | REFUND | HOLD | RELEASE_HOLD | ADJUSTMENT
  amountXaf     Int
  balanceAfter  Int
  activationId  String?
  topupId       String?
  description   String?
  createdAt     DateTime @default(now())
  @@index([userId, createdAt])
}

enum WalletTxnType {
  TOPUP
  DEBIT
  REFUND
  HOLD
  RELEASE_HOLD
  ADJUSTMENT
}
```

Inspiré de `src/database/schemas/credits.ts` (main) mais radicalement **simplifié** — pas de lots, pas d'expiration, pas de bonus/promo séparés (peut être ajouté plus tard si besoin).

### 3.4 Activations

```prisma
model Activation {
  id                    String   @id @default(cuid())
  userId                String
  providerId            String
  providerActivationId  String?                 // id renvoyé par le provider
  serviceSlug           String
  countryIso            String
  phoneNumber           String?
  smsCode               String?
  fullSmsText           String?
  state                 ActivationState @default(REQUESTED)
  priceXaf              Int                     // marge + wholesale au moment de l'achat
  wholesaleUsd          Decimal? @db.Decimal(10, 4)
  marginXaf             Int                     // 1500 (mais on stocke en dur pour audit historique)
  retryCount            Int      @default(0)
  failureReason         String?
  timerExpiresAt        DateTime?
  numberAssignedAt      DateTime?
  smsReceivedAt         DateTime?
  completedAt           DateTime?
  cancelledAt           DateTime?
  refundedAt            DateTime?
  createdAt             DateTime @default(now())
  updatedAt             DateTime @updatedAt
  user                  AuraUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider              Provider @relation(fields: [providerId], references: [id])
  @@index([userId, state, createdAt])
  @@index([providerId, providerActivationId])
}

enum ActivationState {
  REQUESTED
  WAITING
  RECEIVED
  COMPLETED
  EXPIRED
  CANCELLED
  CANCELLED_NO_REFUND
  FAILED
  REFUNDED
}
```

Port direct de `src/database/schemas/activations.ts` + `enums.ts` (main).

### 3.5 Top-ups Fapshi

```prisma
model Topup {
  id              String   @id @default(cuid())
  userId          String
  amountXaf       Int                                  // doit être >= 100 (limite Fapshi)
  paymentMethod   PaymentMethod                        // MTN_MOMO | ORANGE_MONEY | FAPSHI_LINK
  status          TopupStatus @default(INITIATED)
  fapshiTransId   String?
  checkoutUrl     String?
  externalId      String                               // idempotency = topup.id
  paidAt          DateTime?
  failedAt        DateTime?
  failureReason   String?
  ipAddress       String?
  userAgent       String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  user            AuraUser @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@index([userId, status, createdAt])
}

enum PaymentMethod { MTN_MOMO ORANGE_MONEY FAPSHI_LINK }
enum TopupStatus { INITIATED PAYMENT_PENDING SUCCESSFUL FAILED EXPIRED }
```

Inspiré de `src/database/schemas/credits.ts:creditPurchase` (main) — adapté en XAF direct.

### 3.6 Tracking (marketing / analytics)

```prisma
model TrackingEvent {
  id              String   @id @default(cuid())
  userId          String?                              // null si anonyme
  sessionId       String                               // cookie côté client
  name            String                               // "page_view", "buy_clicked", "topup_initiated"
  path            String?
  referrer        String?
  ipAddress       String?
  userAgent       String?
  deviceFingerprint String?
  countryIso      String?                              // résolu via GeoIP si dispo
  utmSource       String?
  utmMedium       String?
  utmCampaign     String?
  payload         Json?                                // props arbitraires
  createdAt       DateTime @default(now())
  @@index([userId, createdAt])
  @@index([name, createdAt])
  @@index([sessionId])
}

model TrackingPixelHit {
  id          String   @id @default(cuid())
  campaignId  String?
  ipAddress   String?
  userAgent   String?
  referer     String?
  createdAt   DateTime @default(now())
  @@index([campaignId, createdAt])
}
```

Ce sont **deux modèles distincts** :
- `TrackingEvent` : événements JSON envoyés via `navigator.sendBeacon` ou `fetch` no-cors depuis l'app (riche, structuré).
- `TrackingPixelHit` : impressions de pixel 1×1 GIF servies par le plugin (compatible avec les emails / réseaux qui n'exécutent pas de JS).

---

## 4. Auth (Cameroun-first)

### 4.1 Flow utilisateur

1. Page `/register` — saisie du **numéro Cameroun** uniquement : input `+237 6XX XXX XXX`, validation `/^(\+237)?[6][0-9]{8}$/` (regex Fapshi). Pas de pays au choix à l'inscription (mais le drawer plus tard sert pour le pays du **numéro SMS à acheter**, pas pour le profil).
2. OTP envoyé via WhatsApp (préféré) puis fallback SMS — le système OTP existe déjà : `AuraOtp` + `AuraPhoneIdentity`. Réutiliser `apps/app/src/operations/auth/*` quand on les écrit.
3. Création de `AuraUser` + `Wallet` (balance=0) + cookie session HMAC (déjà géré par Aura : `packages/aura/src/server/auth/`).
4. Redirection vers `/onboarding/choose-provider` — **étape obligatoire avant toute activation** : choix entre « Provider A » / « Provider B » avec carte explicative (countries dispo, services dispo, fiabilité affichée en %, sans nommer la marque). Le choix met à jour `AuraUser.preferredProviderCode`. L'utilisateur peut changer plus tard via Settings.

### 4.2 Pas de mot de passe à l'inscription (au choix)

Option recommandée : **OTP-only login** (pas de password). Plus simple sur mobile, moins de friction. L'utilisateur garde la session via cookie. Optionnel : mot de passe ajoutable depuis Settings pour login web rapide.

### 4.3 Helper phone

Port de `src/common/auth/phone-utils.ts` (main) dans `apps/app/src/lib/phone.ts` : `sanitizePhone`, `isValidPhone`, validation E.164.

---

## 5. Opérations Aura (`apps/app/src/operations/`)

Toutes suivent le pattern `defineOperationFn(name).query|mutate|action().input(zod).auth().handler(...)` — exemple existant : `apps/app/src/operations/todos/create.operation.ts:5`.

### 5.1 `catalog/*` (queries publiques, sans auth)

- `catalog.listProviders` — retourne `[{ code, displayLetter, displayName, accentColor, isActive }]` pour le picker.
- `catalog.listCountries` — retourne `[{ iso, name, available }]` selon le provider du user. Paginé via `useAuraPaginatedQuery` (cf. `packages/aura/src/client/paginated-query.ts:26`).
- `catalog.listServices` — `[{ slug, name, icon, priceXaf, availability }]` pour un (provider, country).
- `catalog.quotePrice` — `(serviceSlug, countryIso) → { priceXaf, wholesaleUsd, marginXaf, available }` — appelle le ProviderClient → calcule la marge.

### 5.2 `activations/*`

- `activations.request` (mutate, auth) — port de `ActivationService.request` (main). Étapes :
  1. Quote (réutilise `catalog.quotePrice`).
  2. Insert `Activation { state: REQUESTED }`.
  3. Hold XAF sur wallet (`WalletTransaction { type: HOLD }`).
  4. Provider.getNumberV2 → récupère phoneNumber + providerActivationId.
  5. Provider.setStatus(id, 1) — signal ACCESS_READY.
  6. Update `Activation { state: WAITING, phoneNumber, providerActivationId, timerExpiresAt: now+20min }`.
  7. Rollback à chaque étape (release hold, delete activation, setStatus(-1) provider).
- `activations.cancel` (mutate, auth) — `setStatus(id, -1 ou 8)` selon état, release hold si refund confirmé.
- `activations.checkSms` (action, auth, polling-friendly) — `getStatusV2(id)` → si sms reçu, update state=COMPLETED + debit hold.
- `activations.list` (query, auth, paginated) — historique avec filtres state/service/country/range.
- `activations.get` (query, auth) — détail.

### 5.3 `wallet/*`

- `wallet.getBalance` (query, auth) — `{ balanceXaf, heldXaf, totalToppedUp, totalSpent }`.
- `wallet.listTransactions` (query, auth, paginated).

### 5.4 `topup/*`

- `topup.create` (mutate, auth) — `(amountXaf, paymentMethod)` → insert Topup status=INITIATED, retourne `topupId`.
- `topup.initiateFapshi` (action, auth) — port de `PaymentPurchaseService.initiateFapshiPayment` (main) :
  - Appelle `fapshi.generateLink({ amount, email, externalId: topupId, redirectUrl: APP_URL/wallet?topup=topupId })`.
  - Update Topup avec `checkoutUrl` + `fapshiTransId`.
  - Retourne `{ checkoutUrl, transId }` → le front redirige.
- `topup.verify` (action, auth) — `getStatus(transId)` → si SUCCESSFUL, crédite le wallet (insert `WalletTransaction { type: TOPUP }` + update `Wallet.balanceXaf`).
- `topup.list` (query, auth, paginated).
- Webhook Fapshi → traité par le plugin (cf. §6.2), pas par une operation Aura — le webhook appelle directement `topup.verify` côté serveur via `ctx.runAction(...)`.

### 5.5 `tracking/*`

- `tracking.trackEvent` (mutate, optional auth — accepte les anonymes) — `(name, path, referrer, payload, sessionId)` → insert `TrackingEvent` enrichi avec `ctx.req.headers.get("x-forwarded-for")`, `user-agent`. **Pas de validation stricte du payload** — c'est du tracking, on accepte JSON arbitraire bornes raisonnables (max 4KB).

### 5.6 `admin/*` (auth admin, gated par `AuraUser.isAdmin`)

- `admin.providersHealth` — balance live + uptime + dernier check.
- `admin.adjustWallet` — debit/credit manuel d'un user avec note (insert `WalletTransaction { type: ADJUSTMENT }`).
- `admin.listUsers`, `admin.banUser`, `admin.viewTrackingFunnel`.

---

## 6. Plugins communautaires — détail

### 6.1 `@aura/sms-providers` (NOUVEAU)

| Fichier | Rôle |
|---|---|
| `src/index.ts` | exports `getProvider(code)`, `listProviders()`, `anonymizeProvider(code)` |
| `src/core/types.ts` | interface `ProviderClient`, error sentinels |
| `src/core/base-client.ts` | classe abstraite avec fetch + retry + cache (TTL configurable) |
| `src/providers/grizzly-sms.ts` | port direct de `src/services/grizzly/client.ts` (main) |
| `src/providers/sms-online-pro.ts` | **à valider Phase 0** — variantes URL/params |
| `src/providers/tiger-sms.ts` | **à valider Phase 0** |
| `src/anonymizer.ts` | déterministe sur `code` → letter A/B/C/D… |

Dependencies : aucune lourde. Juste `zod` (peer) pour valider les réponses HTTP. **Pas** de Hono côté plugin (ce sont des clients HTTP appelés depuis des operations Aura, pas des routes).

### 6.2 `@aura/fapshi` (NOUVEAU)

| Fichier | Rôle |
|---|---|
| `src/client.ts` | port de `src/services/fapshi/client.ts` (main) — `generateLink`, `directPay`, `getStatus`, `expire`, `search`, `sendPayout` |
| `src/types.ts` | port de `src/services/fapshi/types.ts` (main) |
| `src/webhook.ts` | exporte `fapshiWebhookRouter()` (Hono router) — POST `/webhooks/fapshi` |
| `src/index.ts` | `getFapshiClient()` (singleton avec env), `registerFapshiWebhook(app, { onSuccess, onFailure })` |

**Sécurité webhook (critique)** : `src/webhook.ts` vérifie `x-fapshi-key === env.AURA_FAPSHI_WEBHOOK_SECRET` (cf. `app/api/webhooks/fapshi/route.ts:23-29` dans main qui valide `secret !== env.INTERNAL_API_SECRET`). **Ne jamais** utiliser `FAPSHI_API_KEY` comme secret de webhook (notes dans la code source de main).

Wiring dans `apps/app/src/backend.ts` :
```
const app = await createAuraHonoApp()
addRealtimeRoutes(app)
app.route("/", fapshiWebhookRouter({
  onSuccess: ({ externalId }) => runAction("topup.verify", { topupId: externalId }),
  onFailure: ({ externalId, reason }) => runAction("topup.markFailed", { topupId: externalId, reason }),
}))
```

### 6.3 `@aura/tracking` (NOUVEAU) — Facebook + WhatsApp first

**Contexte marché Afrique** : l'acquisition se fait via **Facebook Ads** + **WhatsApp** (PAS email). Le tracking doit donc :
1. **Envoyer les events à Meta** (Facebook Pixel côté client + Conversions API côté serveur — Meta recommande les deux pour iOS 14.5+ et ad-blockers).
2. **Tracker les clics WhatsApp** (boutons "Contactez-nous sur WhatsApp", liens `wa.me/...`) avec UTM.
3. **Garder son propre store** (`TrackingEvent` Prisma) pour les funnels admin internes.

| Route | Méthode | Description |
|---|---|---|
| `/tracking/event` | POST | `sendBeacon`-compatible, body JSON `{ name, sessionId, payload }`. Écrit `TrackingEvent` **et** relaie vers Meta Conversions API server-side |
| `/tracking/pixel.gif` | GET | 1×1 GIF transparent pour tracking out-of-app (ex: lien WhatsApp partagé → utilisateur clique → on log avant redirect) |

**Côté client (helper exporté `@aura/tracking/client`)** :
```
mountMetaPixel(pixelId)             // injecte le snippet Meta Pixel <script>fbq(...)</script>
trackMetaEvent(name, params?)       // fbq('track', name, params) — events standards Meta (Purchase, Lead, AddToCart…)
trackEvent(name, payload?)          // notre propre tracking → sendBeacon /tracking/event
trackPageView(path)                 // raccourci → trackMetaEvent('PageView') + trackEvent('page_view')
trackWhatsAppClick(target, payload) // wrapper qui log AVANT le window.open(wa.me/…) avec utm injection
```

**Côté serveur — Meta Conversions API** :
Quand `operation activations.request` réussit, l'operation déclenche aussi un POST vers `https://graph.facebook.com/v18.0/{PIXEL_ID}/events?access_token={CAPI_TOKEN}` avec :
- `event_name: "Purchase"` (event standard Meta)
- `event_time`, `event_id` (dédup avec le client Pixel)
- `user_data` : `em` (hash SHA256 de l'email si dispo), `ph` (hash phone), `client_ip_address`, `client_user_agent`, `fbp` cookie, `fbc` cookie
- `custom_data` : `currency: "XAF"`, `value: priceXaf`, `content_ids: [activationId]`

C'est ce double envoi (Pixel client + CAPI server) qui permet de continuer à tracker même quand l'utilisateur bloque les scripts ou navigue depuis l'in-app browser Facebook (très courant en Afrique).

**Events Meta standards à utiliser** :
| Meta event | Quand | Custom params |
|---|---|---|
| `PageView` | Chaque nav | `path` |
| `CompleteRegistration` | OTP vérifié | `method: "phone"` |
| `Lead` | provider_chosen + onboarding fini | `content_category: providerCode` |
| `InitiateCheckout` | Click "Acheter" dans confirm sheet | `currency, value, content_ids` |
| `Purchase` | `activation_received` (SMS reçu) | `currency: "XAF", value: priceXaf, content_ids: [activationId]` |
| `AddPaymentInfo` | `topup.initiateFapshi` | `currency: "XAF", value: amountXaf` |

**WhatsApp click-to-chat** :
- Composant `<WhatsAppButton phone={SUPPORT_NUMBER} message={pretemplate} utm={...} />` qui :
  1. Appelle `trackEvent('whatsapp_click', { context, target })` + `trackMetaEvent('Contact')`.
  2. Construit l'URL `https://wa.me/237XXX?text=URLEncoded`.
  3. `window.open(url, '_blank')`.
- Boutons à placer sur : landing, error states (activation_failed → "besoin d'aide ? WhatsApp"), confirm sheet (support direct), header dashboard.

| Fichier | Rôle |
|---|---|
| `src/pixel.ts` | endpoint GET /tracking/pixel.gif (1×1) |
| `src/beacon.ts` | endpoint POST /tracking/event (CORS, no-cors fetch ok) |
| `src/meta.ts` | Meta Pixel client snippet + helper `trackMetaEvent` |
| `src/meta-capi.ts` | Conversions API server-side (POST graph.facebook.com) |
| `src/whatsapp.ts` | helper `trackWhatsAppClick` + composant `<WhatsAppButton>` |
| `src/store.ts` | écrit dans Prisma TrackingEvent + relaie vers Meta CAPI |
| `src/index.ts` | `registerTrackingRoutes(app)` + exports client |

### 6.4 `@aura/realtime` (EXISTANT, réutilisé)

Tout marche déjà avec le read-set tracking auto (`packages/aura/src/server/db-tracked.ts`). Les invalidations seront automatiques pour `Activation`, `Wallet`, `Topup`, etc. **Aucun travail nécessaire ici** — c'est ce qui rend l'UI super réactive sur ce projet.

---

## 7. Routes / Pages (TanStack Router)

| Path | Auth | Description | Composants shadcn principaux |
|---|---|---|---|
| `/` | public | Landing — pitch FR/EN, CTA register | `Button`, `Card`, `Badge`, `Carousel` |
| `/register` | public | Inscription téléphone +237 | `Form`, `Input`, `InputOTP`, `Button` |
| `/login` | public | Login OTP par téléphone | `Form`, `Input`, `InputOTP` |
| `/onboarding/choose-provider` | user | Picker provider anonyme (cartes A/B/C) | `Card`, `RadioGroup`, `Badge`, `Skeleton` |
| `/buy` | user | **Page principale** — picker service → drawer pays → confirm sheet | `Drawer`, `Sheet`, `Command` (search), `Avatar`, `Button` |
| `/buy/active/[activationId]` | user | Suivi activation en temps réel (number, SMS, timer) | `Card`, `Progress`, `Alert`, `Skeleton` |
| `/dashboard` | user | Vue d'ensemble — solde, activations en cours, dernières opérations | `Card`, `Tabs`, `Table`, `Badge` |
| `/dashboard/activations` | user | Historique des activations (filtres state/service/country, paginé) | `Table`, `DropdownMenu`, `DatePickerWithRange`, `Pagination` |
| `/wallet` | user | Solde + historique transactions + bouton "Top up" | `Card`, `Table`, `Tabs`, `Sheet` (topup) |
| `/wallet/topup` | user | Choix méthode (MTN MoMo / Orange Money / Lien Fapshi), input montant XAF | `RadioGroup`, `Input`, `Button`, `Drawer` |
| `/settings` | user | Profile, changer provider, langue FR/EN, ajouter mot de passe | `Form`, `Tabs`, `Switch`, `Select`, `Button` |
| `/help`, `/terms`, `/privacy`, `/legal` | public | Pages légales statiques | `Accordion`, `Separator` |
| `/admin` | admin | Dashboard admin (KPIs, providers health) | `Card`, `Chart`, `Table`, `Badge` |
| `/admin/users` | admin | Liste users + adjust wallet + ban | `Table`, `Dialog`, `Form` |
| `/admin/providers` | admin | Toggle providers, voir balance, mapping pays/services | `Switch`, `Table`, `Dialog` |
| `/admin/tracking` | admin | Funnel + events bruts | `Chart`, `Table`, `Tabs` |

**Pages structurelles** (composants partagés) :
- `<AppShell>` — sidebar mobile drawer + topbar avec balance live (utilise `useAuraQuery` sur `wallet.getBalance` → réactif automatiquement).
- `<TrackingProvider>` — composant racine qui appelle `mountTrackingPixel` + `trackPageView` à chaque navigation TanStack Router.

---

## 8. Composants UI clés (à porter / créer)

### 8.1 Le **drawer pays** — le point UX central

Port de `src/component/numbers/country-drawer.tsx` (main) → réécrit avec **shadcn `Drawer`** (Vaul) à la place du custom div+overlay. Garder :
- Search input filtrant par ISO + nom (input `Command`).
- Liste infinite scroll via `IntersectionObserver` + `useAuraPaginatedQuery` (cf. `packages/aura/src/client/paginated-query.ts`).
- Items avec drapeau (`/assets/countries/<iso>.webp`), nom, prix XAF (déjà calculé serveur), badge "Available" si stock > 0.
- Bouton "Acheter" qui passe à `<ConfirmSheet>` (shadcn `Sheet`).

### 8.2 La **confirm sheet** — confirmation d'achat

Port de `src/component/numbers/activation-sheet.tsx` (main) → réécrit avec shadcn `Sheet`. Trois phases (`confirm` | `waiting` | `code-received`) :
- `confirm` : récap service + pays + prix XAF (gros), bouton "Confirmer".
- `waiting` : numéro affiché en monospace, timer 20min, bouton "Copier", bouton "Annuler & Rembourser" (gris). Polling toutes les 5s via `activations.checkSms` OU mieux : **abonnement realtime** automatique sur `Activation:<id>` (cf. §6.4).
- `code-received` : SMS code en gros, animation success, bouton "Copier".

### 8.3 Le **provider picker**

Carte par provider :
- Lettre géante (A/B/C) en couleur d'accent.
- Stats anonymes : "120+ pays", "98% uptime sur 30j", "Délai moyen 12s".
- **Aucune mention de la marque réelle** côté UI utilisateur.

### 8.4 Inventaire shadcn (composants à installer)

```
button, card, badge, input, form, label, select, radio-group, checkbox,
drawer, sheet, dialog, alert, alert-dialog, tabs, tab, table, dropdown-menu,
command, popover, sonner (toast), avatar, separator, skeleton, progress,
input-otp, pagination, accordion, switch, calendar, date-picker, chart,
breadcrumb, scroll-area, tooltip
```

---

## 9. Marketing / analytics — Facebook Ads + WhatsApp (Afrique)

> **Pas d'email marketing.** Tout le funnel est : **Facebook Ads (Meta Pixel + Conversions API)** + **WhatsApp** (deep-links `wa.me/...`, click-to-chat, broadcasts via WhatsApp Business). Le tracking interne sert à alimenter Meta CAPI et à mesurer ce que les ads ne voient pas.

### 9.1 Stack tracking

| Couche | Outil | Pourquoi |
|---|---|---|
| Pixel browser | **Meta Pixel** (`fbq`) | Tracking events standards, retargeting Facebook Ads |
| Server CAPI | **Meta Conversions API** (graph.facebook.com) | Capture les events que le Pixel rate (ad-blockers, iOS 14.5+, in-app browser FB) — critique en Afrique où beaucoup naviguent dans l'app Facebook |
| Stockage interne | `TrackingEvent` (Prisma) | Funnels admin, audit, debug |
| WhatsApp | `<WhatsAppButton>` + tracking pre-click | Support, conversion via chat, growth virale |

### 9.2 Events à instrumenter (double envoi Pixel + CAPI + interne)

| Internal event | Meta standard event | Quand | Payload |
|---|---|---|---|
| `page_view` | `PageView` | Chaque nav TanStack Router | `{ path, referrer, utm_* }` |
| `signup_started` | — | Submit register form | `{ phonePrefix }` |
| `signup_completed` | `CompleteRegistration` | OTP vérifié | `{ userId, method: "phone" }` |
| `provider_chosen` | `Lead` | Onboarding fini | `{ providerCode, content_category }` |
| `country_drawer_opened` | — | User ouvre drawer | `{ serviceSlug }` |
| `country_selected` | — | Click pays | `{ countryIso, priceXaf }` |
| `buy_confirm_clicked` | `InitiateCheckout` | Click "Confirmer" sheet | `{ currency: "XAF", value: priceXaf, content_ids: [serviceSlug] }` |
| `activation_requested` | — | mutate `activations.request` ok | `{ activationId }` |
| `activation_received` | **`Purchase`** | SMS reçu (la vraie conversion) | `{ currency: "XAF", value: priceXaf, content_ids: [activationId] }` |
| `activation_cancelled` | — | User annule | `{ activationId, reason }` |
| `topup_initiated` | `AddPaymentInfo` | mutate `topup.create` | `{ currency: "XAF", value: amountXaf, method }` |
| `topup_succeeded` | — (déjà compté dans Purchase à l'activation) | webhook Fapshi SUCCESSFUL | `{ topupId, amountXaf }` |
| `topup_failed` | — | webhook FAILED/EXPIRED | `{ topupId, reason }` |
| `whatsapp_click` | `Contact` | Click bouton WhatsApp | `{ context: "support"|"buy_help"|"hero_cta", target: phoneNumber }` |
| `whatsapp_referral_landed` | — | Land avec `?utm_source=whatsapp` | `{ utm_campaign }` |

**Choix de la conversion principale** : `Purchase` au moment où le **SMS est reçu** (activation réussie), pas au top-up. Raison : un top-up sans activation n'est pas une conversion business. Si on optimise les Facebook Ads sur `Purchase`, l'algo apprendra à cibler les vrais clients SMS.

**Dédup Pixel ↔ CAPI** : chaque event a un `event_id` UUID généré côté client, envoyé identique aux deux. Meta dédupe automatiquement.

### 9.3 WhatsApp comme canal de conversion

| Placement | Action |
|---|---|
| Hero landing `/` | Bouton "Discutez sur WhatsApp" sous le CTA principal — capture les indécis |
| Footer toutes pages | Bouton support WhatsApp permanent |
| Error states (activation failed, topup failed) | "Besoin d'aide ? Contactez-nous sur WhatsApp" — récupère les utilisateurs frustrés |
| Confirm sheet (`/buy` waiting phase) | Petit lien "Problème ? WhatsApp" — réduit le churn pendant l'attente SMS |
| `/wallet/topup` | "Difficultés avec le paiement ? WhatsApp" |
| Receipt / activation success | "Partager sur WhatsApp" (growth virale, deep-link avec `?utm_source=whatsapp_share&ref=userId`) |

**Numéro WhatsApp Support** : variable d'env `SUPPORT_WHATSAPP_NUMBER` (E.164, ex `237677...`).

**Templates de messages pre-remplis** (URL `wa.me/.../?text=...`) :
- Support général : "Bonjour, j'ai besoin d'aide avec NumZero. Mon ID utilisateur : {userId}"
- Aide achat : "J'ai un problème avec mon achat (activation {activationId})"
- Aide paiement : "Mon paiement n'est pas validé (topup {topupId})"

### 9.4 IP & device fingerprint (enrichissement CAPI)

- `ipAddress` : `c.req.header("x-forwarded-for")?.split(",")[0]` — fiable via cloudflared.
- `userAgent` : `c.req.header("user-agent")`.
- `fbp` cookie : `_fbp` posé par Meta Pixel automatiquement, à relire et envoyer en CAPI.
- `fbc` cookie : `_fbc` posé quand le user vient d'une ad Facebook (paramètre `fbclid` dans l'URL) — **critique** pour la dédup et l'attribution.
- `deviceFingerprint` : skip v1, ajouter en v2 si besoin.

### 9.5 GeoIP (déjà gratuit via Cloudflare)

Header `cf-ipcountry` envoyé automatiquement par cloudflared → écrit dans `TrackingEvent.countryIso`. Utilisable pour segmenter le funnel admin (CM vs CI vs SN vs autres).

### 9.6 Funnel admin (`/admin/tracking`)

```
ad_click (utm) → page_view → signup_completed → provider_chosen → 
country_selected → buy_confirm_clicked → activation_received (= Purchase)
```

Calculé par window function SQL sur `TrackingEvent` (groupé par `sessionId` puis par `userId` une fois loggué). Vue séparée pour le canal **WhatsApp** : `whatsapp_referral_landed → signup_completed → activation_received` pour mesurer le ROI du canal viral.

### 9.7 Cookies (RGPD light)

Banner cookies obligatoire (composant shadcn `Alert` flottant) qui demande consentement avant de charger le Meta Pixel. Si refusé, on garde uniquement le tracking interne `TrackingEvent` (legitimate interest — analytique propre, pas tiers).

---

## 10. Environnement (variables)

### Côté backend (`apps/app/.env`)

| Variable | Description | Exemple |
|---|---|---|
| `DATABASE_URL` | Postgres | `postgresql://...` |
| `AURA_APP_URL` | Origin frontend (CORS) | `https://numzero.globalimex.online` |
| `AURA_INTERNAL_SECRET` | HMAC + CSRF (déjà existant) | random 32 bytes |
| `AURA_FAPSHI_API_USER` | Fapshi API user | (fourni par Fapshi) |
| `AURA_FAPSHI_API_KEY` | Fapshi API key | (fourni par Fapshi) |
| `AURA_FAPSHI_ENV` | `sandbox` ou `live` | `live` |
| `AURA_FAPSHI_WEBHOOK_SECRET` | Validation webhook Fapshi | random 32 bytes |
| `AURA_SMS_ONLINE_PRO_API_KEY` | clé SMS Online Pro | (compte user — déjà fourni, à mettre dans `apps/app/.env`) |
| `AURA_TIGER_SMS_API_KEY` | clé Tiger SMS | (compte user — déjà fourni, à mettre dans `apps/app/.env`) |
| `AURA_GRIZZLY_API_KEY` | clé Grizzly (optionnel) | (compte user) |
| `AURA_PROVIDER_ENCRYPTION_KEY` | AES-GCM key pour chiffrer `Provider.apiKeyCipher` | random 32 bytes |
| `META_PIXEL_ID` | ID Meta Pixel (côté serveur pour CAPI) | numérique, fourni par Business Manager |
| `META_CAPI_ACCESS_TOKEN` | Token Conversions API (généré dans Events Manager) | jamais exposé côté client |
| `META_TEST_EVENT_CODE` | Test code Meta CAPI (dev only, ex `TEST12345`) | retiré en prod |
| `VITE_META_PIXEL_ID` | Même ID, baked côté client pour `fbq('init')` | identique à `META_PIXEL_ID` |
| `SUPPORT_WHATSAPP_NUMBER` | Numéro WhatsApp support (E.164 sans `+`, ex `237677123456`) | utilisé par `<WhatsAppButton>` |
| `WHATSAPP_TOKEN` / `SMS_TOKEN` | OTP delivery (à compléter selon provider OTP existant) | — |

### Côté frontend (`apps/app/.env.local` — `VITE_*` baked at build)

| Variable | Description |
|---|---|
| `VITE_AURA_URL` | Backend URL (déjà `https://realtime-numzero.globalimex.online`) |
| `VITE_AURA_WS_URL` | WebSocket URL (déjà `wss://realtime-numzero.globalimex.online/ws`) |
| `VITE_TRACKING_ENABLED` | `1` ou `0` |
| `VITE_META_PIXEL_ID` | ID Meta Pixel pour `fbq('init')` côté client |
| `VITE_SUPPORT_WHATSAPP` | Numéro WhatsApp support visible pour `<WhatsAppButton>` (E.164 sans `+`) |

---

## 11. Ordre d'exécution (phases)

### PHASE 0 — Vérification APIs providers (CRITIQUE, ~2h)

**Avant tout code**, l'agent doit :
- `curl` chaque provider avec une clé valide pour confirmer : URL exacte, params, format réponse `getPricesV3`, format des codes pays/services, présence ou non d'un webhook push.
- Documenter dans `packages/plugins/sms-providers/README.md` les divergences trouvées (l'utilisateur les a annoncées).

Sans cette étape, le code des providers sera spéculatif et cassera en runtime.

### PHASE 1 — Backend foundations (~1 jour)

1. Schéma Prisma : ajouter §3.1 → §3.6, `prisma generate`, `prisma migrate dev --name init-numzero`.
2. Plugin `@aura/sms-providers` — port Grizzly d'abord (référence connue), squelettes pour les 2 autres.
3. Plugin `@aura/fapshi` — port direct de `src/services/fapshi/client.ts` (main).
4. Plugin `@aura/tracking` — routes + helpers client.
5. Operations `catalog/*` et `wallet/*` (les plus simples, queries).
6. `bun x tsc --noEmit` sur `packages/aura`, `packages/plugins/*`, `apps/app` — zéro erreur.

### PHASE 2 — Activation flow (~1 jour)

1. Operations `activations/request|cancel|checkSms|list|get`.
2. Webhook Fapshi câblé dans `backend.ts`.
3. Operations `topup/*`.
4. Test E2E via dashboard Aura : `bun run dev` → call manuel `topup.create` → `topup.initiateFapshi` → ouvrir checkoutUrl Fapshi sandbox → vérifier webhook → vérifier crédit wallet.

### PHASE 3 — Front public + auth (~1 jour)

1. Routes `/`, `/register`, `/login`, `/onboarding/choose-provider`.
2. Composants `AppShell`, `TrackingProvider`.
3. `mountTrackingPixel` + `trackPageView` câblés.

### PHASE 4 — Buy flow (~1 jour)

1. Route `/buy` + drawer pays (port + shadcnification) + confirm sheet.
2. Route `/buy/active/[activationId]` — observe l'activation via `useAuraQuery` (réactif auto via le tracking read-set).
3. Verify : 2 onglets, achat sur l'un → l'autre **n'invalide pas** (filtre par read-key `Activation:<id>` propre au user).

### PHASE 5 — Dashboard user (~1 jour)

1. `/dashboard`, `/dashboard/activations`, `/wallet`, `/wallet/topup`, `/settings`.
2. Toutes les tables paginated via `useAuraPaginatedQuery` (cf. `packages/aura/src/client/paginated-query.ts:26`).

### PHASE 6 — Admin (~1/2 jour)

1. Routes `/admin/*`, gating via `AuraUser.isAdmin`.
2. Funnel SQL `/admin/tracking`.

### PHASE 7 — Pages légales + i18n FR/EN (~1/2 jour)

1. Pages statiques `/terms`, `/privacy`, `/legal`, `/help`.
2. i18n : lib `i18next` ou nuqs-locale ; FR par défaut, EN en switch.

### PHASE 8 — Production hardening (~1 jour)

1. Chiffrement réel des `Provider.apiKeyCipher` (AES-GCM avec `AURA_PROVIDER_ENCRYPTION_KEY`).
2. Rate limiting sur `/aura/*` (déjà fait dans `hono-app.ts:43`).
3. Logs structurés + alertes balance provider faible.
4. Backup Postgres.
5. Test Fapshi en mode `live` (premier vrai paiement à 100 XAF).

---

## 12. Décisions à valider avec l'utilisateur AVANT le code

| Question | Pourquoi c'est ouvert |
|---|---|
| **Wallet XAF direct vs. système de crédits ?** | Le plan propose XAF direct (plus simple). Mais `main` utilise des crédits avec lots/bonus/expiration. Si on veut promos/bonus first-purchase plus tard, crédits serait mieux. |
| **OTP-only login vs. mot de passe optionnel** | Le plan propose OTP-only. Confirmer ou ajouter password obligatoire ? |
| **Le choix provider est-il bloquant à l'onboarding, ou skippable ?** | Le plan dit bloquant. Plus simple côté code (toutes les operations supposent `user.preferredProviderCode != null`). |
| **i18n dès la v1 ou plus tard ?** | Tout est en FR dans le plan ; phase 7 active EN. |
| **Device fingerprint v1 ou plus tard ?** | Externe (`@fingerprintjs/fingerprintjs`), ajoute du JS. Probablement plus tard. |
| **Politique de remboursement annulation** | Si Grizzly renvoie `ACCESS_CANCEL` on rembourse. Si erreur réseau ? Le plan propose `cancelled_no_refund` par défaut (protège la marge). Confirmer. |

---

## 13. Récapitulatif des sources mining (branche `main`)

Fichiers à **porter** dans le nouveau code :
- `src/services/grizzly/{client,activation,types,utils,cache}.ts` → `packages/plugins/sms-providers/src/providers/grizzly-sms.ts`
- `src/services/fapshi/{client,types}.ts` → `packages/plugins/fapshi/src/{client,types}.ts`
- `src/services/activation.service.ts` → `apps/app/src/operations/activations/*` + `apps/app/src/operations/_services/activation-service.ts`
- `src/services/payment-purchase.service.ts` → `apps/app/src/operations/topup/*` (adapté XAF direct, pas de crédits)
- `src/services/provider-routing.service.ts` → simplifié (user choisit son provider, pas de scoring)
- `src/database/schemas/{activations,services,enums}.ts` → §3 Prisma (adapté Prisma au lieu de Drizzle)
- `app/api/webhooks/fapshi/route.ts` → `packages/plugins/fapshi/src/webhook.ts` (en Hono au lieu de Next.js)
- `src/component/numbers/{country-drawer,activation-sheet,service-explorer}.tsx` → `apps/app/src/components/buy/*` (réécrits shadcn)
- `src/common/auth/phone-utils.ts` → `apps/app/src/lib/phone.ts`

Fichiers à **ne PAS porter** :
- Système de crédits (`creditPackage`, `creditLot`, `creditHold`) — remplacé par wallet XAF direct.
- `pricing-resolver.service.ts`, `pricing.service.ts` — la formule devient triviale (`wholesaleXaf + 1500`).
- `fraud.service.ts` — out of scope v1 (à reprendre en phase 2 produit).
- `economics-config.service.ts` — réduit à 2 clés (`usd_to_xaf_rate`, `fixed_margin_xaf`) dans `PricingConfig`.

---

## 14. Risques et notes

1. **Spec providers non confirmée** — c'est le risque #1. Phase 0 est obligatoire (cf. §11). Sans `curl` réel, le code SMS Online Pro / Tiger SMS sera de la conjecture.
2. **Fapshi sandbox vs live** — le plan utilise sandbox pendant le dev. Le switch en live exige une vraie clé + montant min 100 XAF + `redirectUrl` whitelist côté Fapshi.
3. **Realtime sur `Wallet:<id>` + `Activation:<id>`** — déjà géré automatiquement par le tracking read-set (cf. `packages/aura/src/server/db-tracked.ts`). Mais à **vérifier** : la première fois qu'une mutation passe, observer dans `/aura/dashboard` que les read-keys remontent bien depuis `provider.tsx` (`useEffect` ligne 56-61 de `packages/aura/src/client/provider.tsx`).
4. **Marge fixe en XAF vs. multiplicative** — l'utilisateur dit 1500 XAF fixe. À garder en config (`PricingConfig.fixed_margin_xaf`) pour ajustement futur sans déploiement code.
5. **Conformité KYC Cameroun / Fapshi** — Fapshi peut exiger un KYC opérateur pour montants > X. À clarifier en phase 8.

---

## 15. Hors-scope explicite (v1)

- Système de parrainage (referral) — `src/database/schemas/referral.ts` dans main.
- Programme VIP / tiers — `userRoleEnum: ['user', 'admin', 'super_admin', 'agent']` dans main.
- Notifications push (web push / Firebase) — `AuraNotification` existe déjà, mais push out of v1.
- Mode hors-ligne / PWA.
- Support multi-pays utilisateur (l'app sert le Cameroun en v1 ; le drawer pays concerne le **numéro acheté**, pas le profil user).
