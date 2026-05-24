# Analyse de Codebase num_zer0 — Vue d'Ensemble

Date de l'analyse : 23 mai 2026
Projet : Next.js 15 (App Router) + Drizzle ORM + PostgreSQL + Tailwind CSS v4
Langue du code : TypeScript (React Server Components + Client Components)

---

## Structure des Dossiers

```
num_zer0/
├── app/                              # Next.js App Router
│   ├── [locale]/                     # Internationalisation (i18n)
│   │   ├── (admin)/admin/            # Interface admin (13 routes, 11 stubs)
│   │   ├── (auth)/                   # Auth pages (login, register, verify, reset-password)
│   │   ├── (main)/                   # Pages principales
│   │   │   ├── account/              # Compte utilisateur
│   │   │   ├── my-space/             # Espace personnel (services + achats)
│   │   │   ├── numbers/              # Pages numéros (legacy)
│   │   │   └── wallet/               # Wallet crédits
│   │   ├── page.tsx                  # Landing page
│   │   └── layout.tsx                # Layout i18n
│   ├── _styles/globals.css           # CSS Tailwind v4
│   ├── api/                          # API Routes
│   │   ├── admin/                    # 14 routes admin
│   │   ├── auth/                     # Better Auth
│   │   ├── client/                   # Routes client (services, credits, activations)
│   │   ├── webhooks/                 # Webhooks (grizzly, fapshi, credits)
│   │   └── health/route.ts           # Health check
│   ├── layout.tsx                    # Root layout
│   └── manifest.ts / robots.ts / sitemap.ts
│
├── src/
│   ├── actions/                      # Server Actions (Next.js)
│   │   ├── activation.action.ts
│   │   ├── admin.action.ts
│   │   ├── payment.action.ts
│   │   ├── support.action.ts
│   │   └── user.action.ts
│   │
│   ├── common/                       # Logique partagée
│   │   ├── auth/                     # Auth helpers (session, admin check, phone)
│   │   ├── catalog/                  # Service/Country registry
│   │   ├── icons/                    # Iconify search (inutilisé en prod)
│   │   ├── logger/                   # Logger structuré (multi-transport)
│   │   ├── phone/                    # Utilitaires téléphone
│   │   ├── result/                   # Result<T, E> type
│   │   ├── css.ts
│   │   └── search-params.ts
│   │
│   ├── component/                    # React Components
│   │   ├── account/                  # Gestion compte
│   │   ├── auth/                     # Formulaires auth
│   │   ├── landing/                  # Landing page components
│   │   ├── layout/                   # Layout (header, nav, search)
│   │   ├── numbers/                  # Services/Countries UI (grid, list, drawer)
│   │   ├── recharge/                 # Recharge credits (package, method, flow)
│   │   ├── support/                  # Support chat
│   │   ├── ui/                       # Shadcn/ui components (~40 composants)
│   │   └── wallet/                   # Wallet UI (balance, transactions)
│   │
│   ├── config/                       # Configuration (env vars with t3-env)
│   │
│   ├── database/                     # Drizzle ORM
│   │   ├── schema.ts                 # Ré-export
│   │   └── schemas/                  # Schémas par domaine
│   │       ├── activations.ts        # sms_activation
│   │       ├── auth.ts               # user, session, account
│   │       ├── credits.ts            # wallet, lots, holds, transactions, packages
│   │       ├── enums.ts              # Tous les enums PostgreSQL
│   │       ├── governance.ts         # promo_code, platform_config
│   │       ├── new-tables.ts         # Nouvelles tables
│   │       ├── payments.ts           # customer, subscription, payment
│   │       ├── referral.ts           # Referral system
│   │       └── services.ts           # provider, mappings, price_override
│   │
│   ├── hooks/                        # React Hooks personnalisés
│   │   ├── use-admin.ts
│   │   ├── use-credits.ts
│   │   ├── use-global-query-params.ts
│   │   ├── use-mobile.ts
│   │   ├── use-numbers.ts
│   │   ├── use-session.ts
│   │   └── use-verification.ts
│   │
│   ├── middleware/                    # Middleware
│   │   ├── error-handler.ts
│   │   ├── rate-limit.ts
│   │   └── request-context.ts
│   │
│   ├── services/                     # Services métier
│   │   ├── __mocks__/                # Mocks de test
│   │   ├── activation.service.ts     # Activation SMS (critique)
│   │   ├── admin.service.ts
│   │   ├── base.service.ts           # Classe de base (logging, retry, assertions)
│   │   ├── credit-ledger.service.ts  # Wallet et comptabilité
│   │   ├── economics-config.service.ts
│   │   ├── fapshi/                   # Client Fapshi (MTN MoMo, Orange Money)
│   │   ├── fraud.service.ts
│   │   ├── grizzly/                  # Client Grizzly SMS (wrapper API)
│   │   ├── payment-purchase.service.ts
│   │   ├── pricing-resolver.service.ts  # Shadow Pricing
│   │   ├── pricing.service.ts
│   │   ├── provider-routing.service.ts
│   │   ├── report.service.ts
│   │   └── sync.service.ts
│   │
│   ├── store/                        # Client state (Zustand)
│   │   └── use-payment-store.ts
│   │
│   └── type/                         # Types partagés
│       ├── activation.ts
│       ├── api.ts
│       ├── common.ts
│       ├── credit.ts
│       ├── provider.ts
│       └── service.ts
│
├── public/
│   ├── assets/                       # Images statiques (services/*.webp, countries/*.webp)
│   └── registry/                     # Données Grizzly (JSON)
│
├── drizzle/                          # Migrations SQL
│   └── migrations/                   # 6 migrations (0000 à 0005)
│
├── docs/                             # Documentation (MDX)
│   ├── payments/, auth/, email/, premium/
│   └── ...
│
├── messages/                         # i18n (en, fr, es, de)
│
├── scripts/                          # Scripts utilitaires
│   ├── full-service-sync.ts
│   ├── recalculate-prices.ts
│   ├── check-tables.ts
│   └── ...
│
└── .sisyphus/                        # Notes de développement
    ├── plans/
    └── notepads/
```

---

## Technologie Stack

| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| Next.js | 15 (App Router) | Framework React SSR/SSG |
| TypeScript | ~5.x | Langage |
| Drizzle ORM | ~0.40+ | ORM PostgreSQL |
| PostgreSQL | via Neon.tech | Base de données |
| Tailwind CSS | v4 | Styling |
| Better Auth | ^1.x | Authentification |
| t3-env | ^0.x | Validation env vars |
| Zod | ^3.x | Validation |
| Lucide React | Icons | Icônes UI |
| React Query | (via hooks) | Data fetching |
| Zustand | (via store) | State management |
| Fapshi | — | Paiement MTN MoMo/Orange Money |
| Grizzly SMS | — | Fournisseur SMS |

---

## Métriques du Code

| Métrique | Valeur |
|----------|--------|
| Fichiers TypeScript (.ts/.tsx) | ~180 |
| Composants React | ~80 |
| Routes App Router | ~30 |
| Routes API | ~28 |
| Services métier | ~15 |
| Schémas DB | ~20 tables |
| Migrations SQL | 6 |
| Fichiers de test | ~8 |
| Messages i18n | 5 langues |
| Composants UI (shadcn) | ~40 |

---

## Rapports Disponibles

| # | Fichier | Contenu |
|---|---------|---------|
| 1 | `01-grizzly-sms-full-analysis.md` | Analyse exhaustive Grizzly SMS |
| 2 | `02-icons-system-analysis.md` | Système d'icônes (pas de CSS sprites) |
| 3 | `03-admin-dashboard-analysis.md` | Structure et état de l'admin |
| 4 | `04-credits-payments-analysis.md` | Crédits, wallet, Fapshi, achats |
| 5 | `05-services-structure-analysis.md` | Services SMS, prix, pays, shadow pricing |
