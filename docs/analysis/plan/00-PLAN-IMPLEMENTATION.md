# PLAN D'IMPLEMENTATION : Migration Grizzly SMS → SMS Online Pro

**Date :** 23 Mai 2026  
**Auteur :** Orya (Assistant Dev)  
**Projet :** num_zer0 — Plateforme d'activation SMS

---

## ⚠️ CORRECTION du 23 Mai 2026 — Protocole API

**Le protocole API de SMS Online Pro est compatible sms-activate, PAS REST/JWT.**

L'analyse initiale du bundle React était trompeuse : le bundle correspond au **frontend SPA**,
mais l'API backend réelle utilise le même format `handler_api.php?action=X&api_key=Y`
que Grizzly SMS (et sms-activate).

**Découverte :** La page `/docsPage` de l'interface React charge en fait une iframe vers
`/docs/api/en/index.html` — un site de documentation statique hébergé séparément.

### API réelle
```
Base: https://sms-online.pro/stubs/handler_api.php
Auth: api_key (en paramètre GET/POST)
Format: handler_api.php?action=getNumber&api_key=$key&service=$service&country=$country
```

### Endpoints confirmés
- `getNumber` — Demander numéro (réponse: `ACCESS_NUMBER:$id:$phone`)
- `setStatus` — Changer statut (1=prêt, 3=recode, 6=compléter, 8=annuler)
- `getStatus` — Voir statut (réponse: `STATUS_WAIT_CODE`, `STATUS_OK:$code`, etc.)
- `getBalance` — Solde (`ACCESS_BALANCE:$amount`)
- `getNumbersStatus` — Quantité dispo par pays (JSON)
- `getPrices` — Prix par pays/service (JSON)
- `getOperators` — Opérateurs par pays (JSON)
- `getTopCountriesByService` — Top pays
- Rent API complète (location de numéros)

### Conséquence
La migration est **beaucoup plus simple** que prévu. Pas de rewrite du client HTTP.
Changer l'URL de base, mapper les codes services/pays, et ajuster la structure des prix.

**Données extraites :** 644 services, 186 pays (depuis `/docs/api/js/script.js`)

---

## Résumé Exécutif

Remplacer **Grizzly SMS** par **SMS Online Pro** comme fournisseur SMS unique.
En profondeur : nouvelle intégration API, refonte des prix, refonte du wallet,
réécriture de l'admin. **Pas d'adaptateurs, pas de wrappers.**
On réécrit sur de nouvelles bases.

---

## État des Lieux (Analyse du Code)

### Architecture Actuelle

```
Client (Next.js 16 / Bun)
  → API Routes (App Router)
    → Services Métier (ActivationService, PricingResolverService, etc.)
      → GrizzlyClient (singleton, compatible sms-activate)
      → FapshiClient (MTN MoMo & Orange Money)
    → Drizzle ORM → PostgreSQL
```

### Ce qu'on remplace
| Composant | Taille | Fichiers |
|-----------|--------|----------|
| Grizzly SMS Client | ~160 lignes | `src/services/grizzly/*` (6 fichiers) |
| Provider Routing | ~100 lignes | `src/services/provider-routing.service.ts` |
| Shadow Pricing | ~180 lignes | `src/services/pricing-resolver.service.ts` |
| Webhook Grizzly | 1 fichier | `app/api/webhooks/grizzly/route.ts` |
| Registry statique | ~800 KB | `public/registry/grizzly-*.json` |
| Icônes statiques | ~2000 fichiers | `public/assets/services/*.webp` |

### Ce qu'on garde (à recoder)
| Composant | Raison |
|-----------|--------|
| Système de Wallet/Holds | Concept solide, code à réécrire proprement |
| Authentification (Better-Auth) | Pas de changement |
| UI de base (shadcn, Tailwind) | Framework UI inchangé |
| Drizzle ORM + PostgreSQL | Persistance inchangée |

---

## Analyse de SMS Online Pro

### API Reconstituée (par analyse du bundle JS)

**Authentification :** Bearer JWT (token + refreshToken en localStorage)
**Base URL :** `https://sms-online.pro/api`

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/auth/login_check` | POST | Connexion (email, password, cfTurnstile) |
| `/api/user` | GET | Infos utilisateur + solde |
| `/api/order` | POST | Créer une commande (achat numéro) |
| `/api/order` | GET | Liste des commandes |
| `/api/rent/order` | POST | Créer une location |
| `/api/rent/order/complete` | PUT | Compléter une location |
| `/api/rent/order/cancel` | PUT | Annuler une location |
| `/api/product/price/:id` | GET | Prix d'un service |
| `/api/product/price/:id/update` | PUT | Màj prix (admin) |

**⚠️ Aucune documentation API publique.**  
Recommandation : contacter `@sms_online_pro_Support_Bot` sur Telegram pour obtenir la doc officielle.

### Différences Clés avec Grizzly

| Aspect | Grizzly SMS | SMS Online Pro |
|--------|-------------|----------------|
| **Format API** | `handler_api.php?action=X&param=Y` (texte) | REST JSON |
| **Auth** | Clé API en paramètre GET | Bearer JWT |
| **Target** | Marché mondial | Marché africain (?) |
| **Services** | 2 414+ | ~200-500 estimés |
| **Pays** | 100+ | ~100+ |
| **Location (Rent)** | Oui | Oui |
| **Webhooks** | Oui (jusqu'à 3 URLs) | Oui |
| **Prix multiples** | Par provider/opérateur | Inconnu — à vérifier |
| **MCP Server** | Oui | Non |
| **OpenAPI** | Oui | Non |

---

## Plan de Migration — Phases

---

### PHASE 0 : Recherche & Setup 🔍

**Durée estimée :** 1-2 jours

#### Objectifs
1. Contacter SMS Online Pro pour obtenir la documentation API officielle
2. Créer un compte API SMS Online Pro avec les credentials nécessaires
3. Analyser le catalogue de services SMS Online Pro
4. Déterminer la structure des prix exacte (par pays ? par opérateur ?)
5. Vérifier les webhooks disponibles

#### Livrables
- [ ] Doc API SMS Online Pro officielle obtenue
- [ ] Compte API créé avec clés
- [ ] Catalogue complet des services/pays/prix extrait
- [ ] Structure des prix documentée

---

### PHASE 1 : Nouveau Provider SMS 📡

**Durée estimée :** 3-5 jours

#### 1.1 — Nouveau client SMS Online Pro (nouveau dossier)

```typescript
// src/services/sms-online-pro/client.ts
class SmsOnlineProClient {
  // - Auth: login_check → JWT, refresh automatique
  // - getNumber(order) → POST /api/order  
  // - getStatus(orderId) → GET /api/order
  // - cancelOrder(orderId) → PUT ou DELETE
  // - getBalance() → GET /api/user
  // - getPrices(service, country) → GET /api/product/price/:id
  // - getServices() → À déterminer
  // - getCountries() → À déterminer
}
```

**Fichiers à créer :**
```
src/services/sms-online-pro/
├── client.ts          ← Client API principal
├── types.ts           ← Types spécifiques SMS Online Pro
├── utils.ts           ← Helpers (refresh token, parsing)
└── index.ts           ← Re-export + singleton
```

#### 1.2 — Nouveau système de routing provider

Supprimer `provider-routing.service.ts` actuel (hardcodé pour Grizzly).
Créer un système propre qui pointe vers SMS Online Pro.

**Fichiers :**
```
src/services/provider-routing-v2.service.ts  ← Nouveau
```

#### 1.3 — Nouveau service d'activation

Réécrire `activation.service.ts` :
- Nouveau flow d'activation basé sur l'API SMS Online Pro
- Gestion des statuts spécifiques
- Nouveau mapping de statut
- Supprimer toute référence à Grizzly

#### 1.4 — Nouveau système de webhooks

```
app/api/webhooks/sms-online-pro/route.ts  ← Nouveau webhook
```

Payload présumé : `{ orderId, status, phone, smsText, smsCode }`

#### 1.5 — Mise à jour des dépendances

- `src/config/env.ts` : Remplacer `GRIZZLY_API_KEY` par `SMS_ONLINE_PRO_*` vars
- `.env.example` : Mettre à jour les variables d'environnement

**Fichiers modifiés :**
```
src/config/env.ts
.env.example
```

---

### PHASE 2 : Refonte du Système de Prix 💰

**Durée estimée :** 3-5 jours

#### 2.1 — Analyse des prix SMS Online Pro

Prérequis : avoir la structure des prix de SMS Online Pro.
Si les prix sont différents de Grizzly (ex: prix unique par service/pays, pas de providers), ça simplifie mais ça change toute la logique.

**Scénario probable (à confirmer) :**
- SMS Online Pro a des prix par service + pays
- Pas forcément de providers multiples
- Prix possiblement en EUR/USD

#### 2.2 — Nouveau système de pricing (XAF par défaut)

Supprimer le `PricingResolverService` actuel (shadow pricing Grizzly).
Créer un nouveau système :

```typescript
// src/services/pricing-v2.service.ts
class PricingService {
  constructor(
    private smsOnlinePro: SmsOnlineProClient
  ) {}
  
  async getPrice(serviceSlug: string, countryIso: string): Promise<PricingResult> {
    const rawPrice = await this.smsOnlinePro.getPrice(serviceSlug, countryIso)
    // XAF est la devise de base
    // Aucun achat de crédits — paiement direct en XAF
    const xafPrice = this.applyMultiplierAndMargin(rawPrice)
    return { rawPrice, xafPrice, appliedMargin, appliedMultiplier }
  }
  
  private applyMultiplierAndMargin(rawPrice: number): number {
    // rawPrice + multiplicateur + marge = prix final en XAF
    // Paramètres configurables dans l'admin
  }
}
```

#### 2.3 — Nouveau modèle de données (prix)

Supprimer les tables inutiles et en créer de nouvelles :

**Tables à supprimer/modifier :**
- `credit_package` → Supprimer (plus d'achat de crédits)
- `credit_purchase` → Supprimer
- `credit_hold` → À recoder (nouveau mécanisme)
- `credit_lot` → À recoder
- `credit_wallet` → À recoder (simplifier)
- `price_override` → À conserver ou remplacer
- `price_rule` → À conserver ou remplacer

**Nouvelles tables :**
- `service_pricing` — Prix direct en XAF par service + pays
- `pricing_config` — Multiplicateurs, marges par défaut
- `margin_rules` — Règles de marge (par pays, par service, globales)

#### 2.4 — Migration des données SQL

Écrire les migrations Drizzle :
```sql
-- 1. Nouvelle table service_pricing
CREATE TABLE service_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_slug VARCHAR NOT NULL,
  country_iso VARCHAR(2) NOT NULL,
  price_xaf NUMERIC(12, 2) NOT NULL,
  provider_price NUMERIC(12, 6) NOT NULL,
  margin_pct NUMERIC(5, 2) DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(service_slug, country_iso)
);

-- 2. Supprimer tables crédits
-- (fait en plusieurs migrations, ne pas tout supprimer d'un coup)
```

---

### PHASE 3 : Refonte du Wallet & Paiements 💳

**Durée estimée :** 4-6 jours

#### 3.1 — Nouveau système : Paiement Direct en XAF

**Avant :** User achète des crédits (MTN MoMo) → Crédits dans wallet → Dépense par activation  
**Après :** User paye directement en XAF par activation

Le système de wallet peut être simplifié :
- Plus besoin de `credit_lot`, `credit_hold` complexes
- Le wallet devient un solde XAF simple
- Pas de distinction base/bonus/promo (sauf si on veut garder un système promo)
- L'activation coûte directement en XAF

#### 3.2 — Nouveau système de holds (simplifié)

```
1. User initie une activation
2. On vérifie le solde du wallet
3. On hold le montant exact en XAF
4. SMS reçu → On débite le hold
5. Annulation → On release le hold
```

#### 3.3 — Paiements via Fapshi (à conserver)

Fapshi reste pertinent pour les paiements MTN MoMo et Orange Money.
MAIS : au lieu d'acheter des packages de crédits, on recharge le wallet en XAF directement.

**Modifications Fapshi :**
- Montants en XAF (déjà le cas)
- Plus de mapping package → crédits
- Recharge directe du wallet XAF

#### 3.4 — Composants UI wallet à réécrire

**Fichiers à réécrire :**
```
src/component/recharge/*          ← Tout (plus d'achat de packages)
src/component/wallet/*            ← Simplifier (solde XAF + historique)
app/[locale]/(main)/wallet/*      ← Adapter à la nouvelle UI
app/api/client/credits/*          ← Remplacer par API wallet XAF
```

---

### PHASE 4 : Refonte du Dashboard Admin 🛠️

**Durée estimée :** 5-7 jours

#### 4.1 — Nouveau layout admin

Actuellement vide (`return children`). Créer :
```
src/component/admin/
├── admin-sidebar.tsx       ← Sidebar navigation
├── admin-header.tsx        ← Top bar (user, notifs)
├── admin-layout.tsx        ← Layout complet
└── admin-shell.tsx         ← Shell avec sidebar + header
```

#### 4.2 — Pages admin (actuellement toutes des stubs)

Ordre de développement :

| Priorité | Page | Description |
|----------|------|-------------|
| P0 | Dashboard | KPIs, graphiques, stats en temps réel |
| P0 | Services | Liste services avec prix par pays + édition |
| P0 | Utilisateurs | Liste + détails + actions (ban, ajustement) |
| P1 | Providers | Statut API, sync, balance |
| P1 | Pricing Rules | Marges, multiplicateurs, overrides |
| P1 | Transactions | Journal des transactions XAF |
| P2 | Configuration | Config plateforme (email, webhooks) |
| P2 | Logs | Logs système et webhook |

#### 4.3 — Simplification

Tu as dit que l'admin actuelle est trop complexe. Le plan :
- Une seule source de vérité pour les stats (pas de doublon API + actions)
- Tables réutilisables (composant DataTable)
- Formulaires standardisés
- Pas d'over-engineering

---

### PHASE 5 : UI & Icônes 🎨

**Durée estimée :** 2-3 jours

#### 5.1 — Migration des icônes

**État actuel :** Images WebP statiques (2000+ fichiers) avec chemins dans JSON
**Problème :** Lourd, maintenance chère

**Solution recommandée :**
- SMS Online Pro a probablement ses propres icônes (via API ou URLs)
- Si oui, les utiliser directement (pas de stockage local)
- Si non, garder le système actuel mais le simplifier
- Fallback : lettres/gradient pour chaque service
- **Supprimer le système Iconify inutilisé**

#### 5.2 — Implémentation avec next/image

Remplacer les `<img>` directs par `<Image>` de Next.js pour l'optimisation :
```
src/component/numbers/service-grid-item.tsx
src/component/numbers/service-list-item.tsx  
src/component/numbers/country-flag.tsx
```

#### 5.3 — Nouvelles fonctionnalités SMS Online Pro

Si SMS Online Pro a des features que Grizzly n'a pas :
- Location améliorée (rent)
- Prix par opérateur (si différent)
- Nouvelles UI à ajouter

**Fonctionnalités à supprimer :**
- Achat de packages de crédits
- Interface de sélection de package
- Bonus/Promo des packages

---

### PHASE 6 : Nettoyage & Tests 🧹

**Durée estimée :** 2-3 jours

#### 6.1 — Suppression des fichiers Grizzly

```
src/services/grizzly/           ← Supprimer
src/services/__mocks__/grizzly.ts ← Supprimer
public/registry/grizzly-*.json  ← Supprimer
public/assets/services/*.webp   ← Supprimer (si remplacé)
public/assets/countries/*.webp  ← Supprimer (si remplacé)
app/api/webhooks/grizzly/*      ← Supprimer
```

#### 6.2 — Mise à jour des mocks et tests

- Nouveaux mocks pour SMS Online Pro
- Mettre à jour les fixtures
- Tester tous les flows (activation, webhook, wallet, pricing)

#### 6.3 — Nettoyage des variables d'env

- Supprimer toutes les vars Grizzly
- Conserver/nettoyer SMSMAN (non utilisé, à enlever ou garder)
- Nouvelles vars SMS Online Pro

#### 6.4 — Documentation

- Mettre à jour `.env.example`
- Mettre à jour `README.md`
- Documenter le nouveau flow d'activation
- Documenter le nouveau système de pricing

---

## Calendrier Estimé

| Phase | Description | Jours | Total |
|-------|-------------|-------|-------|
| P0 | Recherche & Setup | 2 | J1-J2 |
| P1 | Nouveau Provider SMS | 5 | J3-J7 |
| P2 | Refonte Prix | 5 | J5-J9 |
| P3 | Wallet & Paiements | 6 | J8-J13 |
| P4 | Admin Dashboard | 7 | J10-J16 |
| P5 | UI & Icônes | 3 | J14-J16 |
| P6 | Nettoyage & Tests | 3 | J17-J19 |

**Total : ~19 jours ouvrés** (les phases se chevauchent)

---

## Décisions Architecturales

### 1. Pas d'adaptateurs
Chaque composant est réécrit proprement. Pas de `GrizzlyToSmsOnlineProAdapter`.
Si le code est trop différent, on réécrit. Point.

### 2. XAF comme devise de base
Plus de crédits virtuels. Le wallet stocke du XAF.
Tout est calculé et affiché en XAF par défaut.
Multiplicateur + marge configurables dans l'admin.

### 3. Architecture Clean
- `src/providers/sms-online-pro/` — Client API uniquement
- `src/services/` — Logique métier
- `src/component/` — UI
- Séparation stricte des responsabilités

### 4. Migration progressive
On ne supprime Grizzly qu'à la toute fin.
Pendant la migration, les deux peuvent cohabiter (mais on ne veut pas de wrapper).

---

## Prochaines Étapes Immédiates

1. **[Toi]** Contacter `@sms_online_pro_Support_Bot` sur Telegram pour la doc API
2. **[Toi]** Créer un compte de test sur SMS Online Pro
3. **[Moi]** Commencer la rédaction du nouveau client API SMS Online Pro
4. **[Toi]** Me donner les credentials GitHub (token PAT) pour que je puisse pousser le code

Tu veux qu'on attaque par où ?
