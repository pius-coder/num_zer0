# Rapport d'Analyse Technique : SMS Online Pro API

## 🔍 Résumé Exécutif

**SMS Online Pro** (sms-online.pro) est un service de réception de SMS en ligne via des numéros virtuels. Le site est une **SPA React** (construite avec Vite) dont le contenu est rendu côté client. Le backend expose une API REST à l'adresse `/api`. Le service partage de nombreuses similitudes architecturales avec **Grizzly SMS** (grizzlysms.com) et le protocole historique **sms-activate**.

**Points clés :**
- ⚠️ Aucune documentation API publique officielle trouvée pour SMS Online Pro
- L'API a été reconstituée par analyse du code JavaScript du bundle frontend (`index-DdifeFfq.js`)
- L'API Grizzly SMS est **complètement documentée** et compatible avec le protocole sms-activate
- Les deux services semblent partager un backend similaire

---

## 1. SMS Online Pro — Architecture & Endpoints Reconstitués

### 1.1 Informations Générales

| Propriété | Valeur |
|---|---|
| Site web | https://sms-online.pro |
| Type d'app | React SPA (Vite) |
| API Base | `/api` (relative) |
| Fonction helper | `const hN = e => e.startsWith("http") ? e : \`\${aa}\${e}\`` où `aa = "/api"` |
| Authentification | Bearer token (JWT) stocké en `localStorage` |
| Client HTTP | Axios |
| Cache | React Query (TanStack Query) |
| Captcha | Cloudflare Turnstile |
| Support Telegram | `@sms_online_pro_Support_Bot`, `@smsonlinepro` |
| Analytics | Google Analytics (G-00TCHN52NC) |
| Erreurs | Sentry (configuration en niveau "moderate") |
| Partenaire | proxy-sale.pro |

### 1.2 Authentification

**Système de tokens :**
- `token` — JWT d'accès stocké dans `localStorage`
- `refreshToken` — Token de rafraîchissement stocké dans `localStorage`
- En-tête HTTP : `Authorization: Bearer ${token}`

**Endpoints :**
```
POST /api/auth/login_check     — Connexion (email, password, cfTurnstile)
POST /api/auth/token/refresh   — Rafraîchir le token (body: { refreshToken })
POST /api/auth/2fa_verify      — Vérification 2FA
GET  /api/auth/google          — Google OAuth (redirection)
GET  /api/auth/token?authId=X  — Échange du code Google OAuth contre un JWT
POST /api/auth/telegram/bot    — Lier un bot Telegram
POST /api/register             — Création de compte
POST /api/password/forgot      — Mot de passe oublié
POST /api/confirm/email        — Confirmation d'email
POST /api/bind/telegram        — Lier Telegram au compte
```

### 1.3 Endpoints API REST Reconstitués

#### Utilisateur & Compte
```
GET  /api/user              — Informations utilisateur + solde
PUT  /api/user/language     — Changer la langue
```

#### Commandes (Activations / SMS)
```
POST /api/order              — Créer une commande (achat de numéro)
GET  /api/order              — Liste des commandes (filtres: statuses, perPage)
POST /api/rent/order         — Créer une commande de location
PUT  /api/rent/order/complete — Compléter une location
PUT  /api/rent/order/cancel  — Annuler une location
```

#### Prix & Services
```
GET  /api/product/price/:id          — Prix d'un produit/service spécifique
PUT  /api/product/price/:id/update   — Mettre à jour un prix
GET  /api/free-price/prices          — Prix "free" (params: serviceUid)
GET  /api/rent/prices                — Prix de location (params: service, currency)
```

#### Favoris
```
POST   /api/favorite/product      — Ajouter un favori
DELETE /api/favorite/product/:id  — Supprimer un favori
GET    /api/favorite/products     — Liste des favoris
```

#### Administrateur
```
GET /admin/rent/order/list          — Liste des locations (admin)
GET /admin/rent/order/sms-messages  — Messages SMS des locations
GET /admin/user/all                 — Tous les utilisateurs
```

### 1.4 Système de Cache (React Query Keys)

L'analyse du code a révélé les clés de cache utilisées, qui décrivent le modèle de données :

```javascript
const TC = {
  USER: "user",
  USER_DETAILS: "user-details",
  USER_BALANCE: "user-balance",
  ORDERS_COUNT: "orders-count",
  ORDERS: "orders",
  ORDERS_PAGE: "orders-page",
  ORDERS_PAGE_INITIAL: "orders-page-initial",
  RENT_ORDERS: "rent-orders",
  NOTIFICATIONS: "notifications",
  COUNTRIES: "countries",
  SERVICES: "services",
  RENT_SERVICES: "rent-services",
  SERVICE_PRICES: "service-prices",
  RENT_PRICES: "rent-prices",
  FAVORITES: "favorites",
  ORDER_STATS: "order-stats",
  USER_STATS: "user-stats",
  PAYMENTS: "payments",
  TRANSACTIONS: "transactions",
  BALANCE: "balance",
  SETTINGS: "settings",
  USER_SETTINGS: "user-settings",
  ADMIN_SETTINGS: "admin-settings",
  WEBMASTER_PARTNER_STATS: "webmaster-partner-stats",
  WEBMASTER_PARTNER_INFO: "webmaster-partner-info",
  ORDER_PRICE: "order-price",
  ORDER_PRICE_TABLE: "order-price-table",
  ORDER_ADDITIONAL_PRICE: "order-additional-price",
  RENT_SMS_MESSAGES: "rent-sms-messages",
  PROMOS: "promos",
  LOGS: "logs",
  LIMITS: "limits",
  FREE_PRICE_SETTING: "free-price-setting"
}
```

### 1.5 Endpoints Sensibles (monitorés par Sentry)

```javascript
const bv = [
  "/api/order",
  "/api/rent/order",
  "/api/rent/order/complete",
  "/api/rent/order/cancel",
  "/api/auth/token/refresh"
]
```

Ces endpoints sont loggués avec trace complète par Sentry.

---

## 2. Grizzly SMS — Documentation API Officielle

### 2.1 Informations Générales

| Propriété | Valeur |
|---|---|
| Site web | https://grizzlysms.com |
| API Base | `https://api.grizzlysms.com/stubs/handler_api.php` |
| Documentation | https://grizzlysms.com/docs |
| Compatibilité | API compatible avec sms-activate |
| Type d'app | Nuxt.js (Vue.js SSR) |
| Services | 2 414+ services |
| Pays | 100+ pays |
| MCP Server | Disponible (GitHub: GrizzlySMS-Git/grizzly-sms-mcp) |
| OpenAPI | Disponible |
| Registre | GRZL PTE. LTD., Singapore (Reg. No. 202139052Z) |

### 2.2 Authentification

**Méthode :** Clé API (API Key) passée en paramètre `api_key`.

```
$api_key — votre clé API (disponible dans les paramètres du compte)
```

Toutes les requêtes doivent inclure le paramètre `api_key`.

### 2.3 Endpoints de l'API Grizzly SMS

L'API utilise une **seule URL de base** avec un paramètre `action` pour différencier les opérations :

```
https://api.grizzlysms.com/stubs/handler_api.php?api_key=$api_key&action=$action&...
```

#### 📱 Activation API (actions principales)

| Action | Description |
|---|---|
| `getNumber` | Obtenir un numéro pour un service |
| `getStatus` | Vérifier le statut d'une activation |
| `setStatus` | Changer le statut d'une activation |
| `getBalance` | Vérifier le solde du compte |
| `getPrices` | Obtenir les prix par pays |

#### 🔧 Utility API

| Action | Description |
|---|---|
| `getServices` | Liste des services disponibles |
| `getCountries` | Liste des pays disponibles |

#### 🏪 Rental API (Location)

| Action | Description |
|---|---|
| (Endpoints de location séparés) | Location de numéros pour des périodes prolongées |

#### 👥 Partner API

| Action | Description |
|---|---|
| (Endpoints partenaires) | Gestion des revendeurs / webmasters |

### 2.4 Détail de l'Endpoint `getNumber`

**URL :**
```
https://api.grizzlysms.com/stubs/handler_api.php
  ?api_key=$api_key
  &action=getNumber
  &service=$service
  &country=$country
  &maxPrice=$maxPrice
  &providerIds=$providerIds
  &exceptProviderIds=$exceptProviderIds
```

**Paramètres :**
| Paramètre | Description |
|---|---|
| `api_key` | Votre clé API |
| `service` | Code du service (ex: `tg` pour Telegram) |
| `country` | Code du pays. Peut être "any" ou vide pour laisser le système choisir |
| `maxPrice` | Prix maximum que vous êtes prêt à payer |
| `providerIds` | IDs de providers autorisés (séparés par des virgules) |
| `exceptProviderIds` | IDs de providers exclus (séparés par des virgules) |

**Réponse succès :**
```
ACCESS_NUMBER:38496653:66846426435
```
Format : `ACCESS_NUMBER:{activation_id}:{phone_number}`

**Erreurs possibles :**
| Erreur | Description |
|---|---|
| `BAD_KEY` | Clé API invalide |
| `NO_BALANCE` | Solde insuffisant |
| `NO_NUMBERS` | Aucun numéro disponible (réessayer ou changer de pays) |
| `SERVICE_UNAVAILABLE_REGION` | Accès restreint depuis votre région (utiliser une autre IP) |
| `The service is prohibited for sale by administration` | Service interdit à la vente |

### 2.5 Autres Endpoints de l'API d'Activation

**V2 de getNumber :**
```
https://api.grizzlysms.com/stubs/handler_api.php?api_key=$api_key&action=getNumber&service=$service&country=$country&maxPrice=$maxPrice
```

**Statut d'activation :**
```
getStatus     — Statut de base
getStatus v2  — Version améliorée
```

**Changement de statut :**
```
setStatus     — Changer le statut (ready, cancel, etc.)
```

**Annulation :**
```
Cancel activation — Annuler une activation
```

**Solde :**
```
getBalance    — Vérifier le solde
```

**Prix :**
```
getPrices            — Prix par pays (v1)
getPrices v2         — Prix par pays (v2)
getPrices v3         — Prix par pays (v3)
```

### 2.6 Webhooks (Grizzly SMS)

Grizzly SMS supporte les **webhooks** pour les notifications d'activation en temps réel.

**Configuration :**
- Disponible dans les paramètres du compte (Settings → Webhooks)
- Jusqu'à **3 adresses webhook** simultanées
- Méthode : `POST` avec body en JSON

**Payload du webhook :**
```json
{
  "activationId": 123456,
  "service": "Google",
  "text": "Your verification code is 123456",
  "code": "123456",
  "country": 12,
  "receivedAt": "2026-05-23 14:30:00"
}
```

**Comportement :**
- Envoi dès qu'un SMS est reçu
- Attente d'une réponse HTTP **200 OK**
- En cas d'échec : retry toutes les 15-30 minutes
- Maximum : **8 tentatives dans les 2 heures**
- Notifications d'erreur (max 1 fois toutes les 5 minutes)

### 2.7 Structure des Prix (Grizzly SMS)

Les prix sont structurés ainsi :

1. **Par pays** : chaque service a des prix par pays (ex: Telegram × Portugal a 6 prix différents)
2. **Par opérateur (provider)** : pour chaque pays, il y a plusieurs providers avec des prix différents
3. **Prix unique vs multiples** : un même service dans un même pays peut avoir **plusieurs prix** selon le provider

Exemple pour Telegram, France :
```
provider0  → $2.4  (447 dispo)
provider1  → $3.75 (20 dispo)
provider2-4→ $3.0  (539 dispo)
provider5  → $4.75 (20 dispo)
provider6  → $4.0  (28 dispo, livraison 23.08%)
```

**Indicateurs :**
- `delivery` — Pourcentage/temps de livraison
- `quantity` — Nombre de numéros disponibles
- `from $X` — Prix minimum affiché dans l'interface

**Services "Available only by API" :**
Certains services (ex: Apple, Netherlands, South Korea) sont disponibles **uniquement via l'API**, pas via l'interface web.

---

## 3. Comparaison SMS Online Pro vs Grizzly SMS

| Critère | SMS Online Pro | Grizzly SMS |
|---|---|---|
| **Documentation API** | ❌ Aucune documentation publique trouvée | ✅ Documentation complète sur /docs |
| **Type d'API** | REST (JSON) sur `/api` | REST (handler_api.php, format texte compatible sms-activate) |
| **Auth** | Bearer token (JWT) + Refresh token | Clé API (`api_key`) en paramètre GET |
| **Sentry monitoring** | ✅ Oui | Probablement |
| **Webhooks** | ✅ Présents dans l'UI | ✅ Documentés |
| **Location (Rent)** | ✅ Supporté | ✅ Supporté |
| **Pays** | ~100+ (similaire) | 100+ |
| **Services** | 200+ | 2 414+ |
| **Admin panel** | ✅ Oui (via `/admin`) | ✅ Oui |
| **Fonctionnalités webmaster** | ✅ Supporté (webmaster-partner-stats) | ✅ Programme complet |
| **2FA** | ✅ Supporté (endpoint `/api/auth/2fa_verify`) | ✅ Supporté |
| **API Key génération** | Via l'interface | Via les paramètres du compte |
| **Compatible sms-activate** | Non vérifié | ✅ Oui (documenté) |
| **OpenAPI / Swagger** | Non trouvé | Mentionné |
| **MCP Server** | Non trouvé | ✅ Oui (via GitHub) |
| **Base URL API** | `/api` (relative au domaine) | `https://api.grizzlysms.com/stubs/handler_api.php` |

---

## 4. Différences Notables

1. **Format d'API :** Grizzly SMS utilise le format classique `handler_api.php?action=X&param=Y` hérité de sms-activate, tandis que SMS Online Pro semble utiliser une API REST plus moderne avec JSON.

2. **Documentation :** Grizzly SMS a une documentation exhaustive et interactive. SMS Online Pro n'a **aucune documentation API publique** accessible.

3. **Catalogue :** Grizzly SMS est plus large (2414+ services vs estimation ~200-500 pour SMS Online Pro).

4. **Modèle économique :** Grizzly SMS semble plus orienté revendeurs/API avec des programmes partenaires complets (webmasters, développeurs, traffic).

5. **Architecture :** SMS Online Pro est une SPA React moderne. Grizzly SMS utilise Nuxt.js (Vue.js SSR).

6. **Prix :** Les deux services utilisent une tarification par service + pays avec multiples providers/tranches de prix.

---

## 5. Recommandations

1. **Pour utiliser SMS Online Pro via API :** Contacter leur support Telegram (`@sms_online_pro_Support_Bot`) pour obtenir la documentation, car elle n'est pas publique.

2. **Pour Grizzly SMS :** La documentation complète est disponible sur `/docs`. L'API est compatible sms-activate, donc la plupart des outils existants fonctionnent.

3. **Points d'intégration communs :**
   - Générer une clé API dans les paramètres du compte
   - Utiliser `getNumber` → obtenir un numéro
   - Attendre le SMS (polling ou webhook)
   - Utiliser `setStatus` pour finaliser/annuler

4. **Si vous migrez de Grizzly vers SMS Online Pro :** L'API REST de SMS Online Pro est probablement différente (requêtes JSON plutôt que paramètres GET). Une adaptation sera nécessaire.

---

## 6. Sources Consultées

- https://sms-online.pro — Site principal (SPA React)
- https://sms-online.pro/static/js/index-DdifeFfq.js — Bundle JS du frontend
- https://grizzlysms.com — Site principal (Nuxt.js)
- https://grizzlysms.com/docs — Documentation API complète
- https://api.grizzlysms.com/stubs/handler_api.php — API endpoint

---

*Rapport généré le 2026-05-23. Analyse technique basée sur l'ingénierie inverse du code JavaScript et la documentation publique disponible.*
