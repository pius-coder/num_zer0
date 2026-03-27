The user wants me to analyze the economics plan and create a comprehensive implementation task list for both admin and client apps, following UML/MERISE methodology. They have:

A detailed economics report for a virtual SMS number resale platform
A TypeScript module with hardcoded economic constants
A current database schema using Drizzle ORM
They want me to:

Provide a full analysis using UML/MERISE methodology
Design the database schema to make it DB-driven instead of hardcoded
Create all implementation tasks for admin and client apps
Show how information flows through the entire app
Now I'm mapping out the complete system structure with MERISE conceptual, logical, and physical models alongside UML diagrams for use cases, classes, sequences, and state machines, then designing the full Drizzle schema to replace the hardcoded constants and finally breaking down all implementation tasks needed across both applications. I'm mapping out the remaining tables for user management, referrals, agent operations, promotions, VIP tiers, fraud detection, and admin controls—essentially the full operational infrastructure needed to run the platform with tiered access, promotional mechanics, and compliance tracking.

Now I'm planning to structure the complete analysis document, starting with the conceptual data model, then moving through use cases, class diagrams, sequence flows, state machines, the full database schema implementation, project structure, and a breakdown of implementation tasks.

I'm mapping out the key data flows—how credit purchases move through the system from package selection through payment confirmation and lot creation, and how SMS verification works from service selection through dynamic pricing adjustments, credit holds, and provider routing.

Now I need to trace through the completion of SMS requests with state transitions and credit debits, plus the admin workflows for managing packages, viewing dashboards, and handling provider health monitoring. I'll document this comprehensively using MERISE entity relationships and UML use cases.

For the implementation, I'm organizing the codebase with separate schema files for each domain—authentication, credits, services, providers, agents, referrals, promotions, and fraud detection—along with SMS activation tracking and admin audit logs.

Structuring the file organization... Looking at the rest of the economics and payments layer, I'm organizing the agent and promo engines alongside payment processors for mobile money and SMS provider adapters, then moving into the server-side API structure with client endpoints for credits, services, activations, and referrals. I'm mapping out the app directory structure with client-facing routes for dashboard, credits, services, and settings, alongside a separate admin section that mirrors the backend services with dedicated pages for revenue, users, providers, and fraud monitoring.

Now I'm deciding on the data types for the financial system—credits should be integers since they're discrete units, while money amounts need decimal precision for XAF and USD, and I'll use numeric types for anything financially sensitive to avoid floating-point errors.

I'm sketching out the core entities for the MERISE model: users, credit packages with pricing and bonus percentages, and I need to continue mapping the relationships between these core tables.

Defining the wallet structure with separate balance types... Continuing with the remaining tables for VIP tiers, fraud detection, admin logging, and platform configuration, then mapping out the key relationships between users and their credit wallets.

Now I'm laying out the full entity relationships—users connect to credit transactions and SMS activations, services link to countries and pricing, and referrals work bidirectionally where a user can be both referrer and referee. I should structure this systematically with a conceptual design first, then the physical database schema using Drizzle ORM, followed by implementation tasks and data flow diagrams to keep everything organized.

Looking at what already exists versus what needs to change—I'll keep the core user, session, account, and verification tables but add fields where needed, adapt customer and payment tables for the mobile money and credit system, and likely deprecate or repurpose subscription and premiumPurchase tables since they don't fit the new model. The real work is building out all the new tables for credits, transactions, SMS activations, and the provider ecosystem.

I'm also thinking through the enum types I'll need in PostgreSQL—credit types like base, bonus, and promotional, hold states for credit management, and various status fields for transactions and activations.

Defining the payment methods for MoMo and Orange Money, transaction types covering purchases through refunds and holds, payment statuses, agent tiers for the distribution network, fraud actions for risk management, and user segments to categorize the customer base.

Now I'm adding a few more state definitions: config types for different data formats, adjustment reasons to track why credits were modified, and approval statuses for administrative workflows. For the database schema, I need to decide on integer types—using standard integers for credits since the range is sufficient, and following the existing pattern of text fields for IDs. Let me put together the full implementation now.

I'm planning to structure this comprehensively with the data model analysis, complete schema definitions, file organization, service layer architecture, and a prioritized task list. I'll focus on the essential parts—the full schema, file structure, and key service implementations—rather than getting too deep into every detail.

For the MERISE and UML diagrams, I'll include the core models: the conceptual data model, process flows, logical and physical data representations, plus the key UML diagrams like use cases, class structure, and sequence flows. I'll use ASCII art where it makes sense to keep things readable.

Now I'm thinking through the Drizzle schema setup with PostgreSQL—I'll use text for IDs to match the existing convention, integers for credit amounts, and numeric types where precision matters...

Actually, I'm reconsidering the approach for economic constants. Instead of hardcoding them, I should store them in the database and load them at startup through a config service that caches the values. This way admins can update them through the dashboard, and the system picks up changes through cache invalidation.

Now I'm setting up the Drizzle imports I'll need for the schema, including the enum types and JSON support. I'm going to structure the full implementation across analysis diagrams, the complete database schema, seed data, service and API layers, UI pages, and a task breakdown.

I'll organize the schema into separate files by domain—enums, authentication, credits, services, providers, SMS activations, referrals, agents, promotions, fraud detection, admin functions, and platform configuration.

I'm also thinking through the payment integration for the global market. The existing schema has tables for customers, subscriptions, and payments designed for Stripe or Polar, but I need to support MoMo and Orange Money. Rather than replacing the payment infrastructure, I'll create a credit_purchase table that bridges credit package purchases to payments, keeping the existing payment system flexible enough to handle mobile money providers.

Writing schema files... Now I'm mapping out the remaining schema files for VIP tiers, fraud detection, admin auditing, and platform configuration, plus the service layer that'll handle credits, pricing, and SMS activations.

Continuing with the orchestration services for multi-provider routing, payment processing through MoMo and Orange Money, fraud detection, referral tracking, agent management, promo codes, admin operations, reporting, and notifications.

Then the client-facing API routes starting with credit packages and purchase endpoints.

Mapping out the remaining client endpoints for wallet balance, transaction history, service listings, pricing lookups, activation requests and status tracking, cancellations, history retrieval, referral codes and statistics.

Now I'm outlining the admin API structure with dashboard analytics, credit package management, user administration with suspension capabilities, and service catalog endpoints. Finishing up the admin report endpoints, then moving into webhook handlers for payment providers like MTN MoMo and Orange Money. On the client side, I'm mapping out the core user-facing pages—dashboard, credit purchasing, service browsing, activation flows, transaction history, referral tracking, and account settings. The admin interface will need corresponding pages to manage all these features. I'm realizing this is going to be quite extensive, so I should prioritize the most critical components rather than trying to cover everything exhaustively. The user specifically asked about how information flows through the economics model, so I need to make sure I trace those data pathways clearly throughout the system. Let me structure this to cover the data modeling first, then the key diagrams, database schema, service interfaces, and finally a comprehensive task breakdown. I'm mapping out the remaining sections—webhook routes, data flow diagrams showing how information moves through the system, and a prioritized task list with all the files needed. For ID generation, I'll stick with their pattern of using .primaryKey() without defaults, assuming application-level generation with something like nanoid. I'm also keeping their naming convention of camelCase in JavaScript and snake_case in the database columns.

For timestamps, I'll follow their existing pattern with createdAt and updatedAt fields that use defaultNow() and the update trigger. Now I'm going to write out the complete schema, service layer code, file structure, and diagrams comprehensively.

Defining the pgEnum approach... I'm going to be strategic about the level of detail—writing out the complete schema and core service functions in full, along with the file structure and task checklist, while describing the MERISE diagrams, UI components, and API routes at a higher level so they have everything needed to implement this themselves.

COMPLETE IMPLEMENTATION PLAN — SMS VIRTUAL NUMBER RESALE PLATFORM
Full System Analysis (MERISE + UML), DB-Driven Schema, Service Layer, API & Task Breakdown
PART 1 — SYSTEM ANALYSIS (MERISE + UML)
1.1 MERISE — MCD (Modèle Conceptuel de Données)
text

┌─────────────────────────────────────────────────────────────────────────┐
│                    MODÈLE CONCEPTUEL DE DONNÉES                        │
└─────────────────────────────────────────────────────────────────────────┘

  ┌──────────┐          possède          ┌──────────────┐
  │   USER   │ 1 ─────────────────── 1   │ CREDIT_WALLET│
  └────┬─────┘                           └──────┬───────┘
       │                                        │
       │ 1                                      │ 1
       │                                        │
       │ N                                      │ N
  ┌────┴──────────┐                     ┌───────┴────────┐
  │CREDIT_TRANSAC.│                     │  CREDIT_LOT    │
  └───────────────┘                     │(base/bonus/prmo│
                                        │ + expiry)      │
       │ 1                              └────────────────┘
       │
       │ N
  ┌────┴──────────┐    concerne    ┌────────────────────┐
  │SMS_ACTIVATION │ N ──────── 1   │      SERVICE       │
  └────┬──────────┘                └────────┬───────────┘
       │                                    │ 1
       │ N                                  │
       │                                    │ N
       │ 1                          ┌───────┴────────────┐
  ┌────┴──────────┐                 │SERVICE_COUNTRY_PRICE│
  │   PROVIDER    │                 └────────────────────┘
  └────┬──────────┘
       │ 1
       │
       │ N
  ┌────┴──────────────────┐
  │ PROVIDER_SERVICE_COST │
  └───────────────────────┘

  ┌──────────┐   parraine   ┌──────────┐
  │   USER   │ 1 ──────── N │ REFERRAL │ N ──────── 1 │ USER │
  │(parrain) │              └────┬─────┘              │(filleul)│
  └──────────┘                   │ 1                  └─────────┘
                                 │
                                 │ N
                          ┌──────┴──────────┐
                          │REFERRAL_EARNING │
                          └─────────────────┘

  ┌──────────┐   est agent   ┌──────────┐
  │   USER   │ 1 ────────── 0,1 │  AGENT  │
  └──────────┘                   └────┬────┘
                                      │ 1
                                      │ N
                              ┌───────┴────────┐
                              │AGENT_SUB_USER  │
                              └────────────────┘

  ┌──────────┐   utilise    ┌────────────┐
  │   USER   │ N ──────── N │ PROMO_CODE │
  └──────────┘              └────────────┘
         via PROMO_CODE_USAGE

  ┌──────────┐   souscrit   ┌──────────┐
  │   USER   │ 1 ────────── 0,1│ USER_VIP │ N ── 1 │ VIP_TIER │
  └──────────┘                  └──────────┘        └──────────┘

  ┌──────────────┐   audite   ┌──────────────────┐
  │ USER (admin) │ 1 ──── N   │ ADMIN_AUDIT_LOG  │
  └──────────────┘             └──────────────────┘

  ┌────────────────┐   déclenche   ┌──────────────┐
  │ SMS_ACTIVATION │ ─── N ─── 1   │  FRAUD_EVENT │ N ── 1 │ FRAUD_RULE │
  └────────────────┘               └──────────────┘        └────────────┘

  ┌───────────────────┐
  │  PLATFORM_CONFIG  │  (clé/valeur, DB-driven)
  └───────────────────┘

  ┌───────────────────┐
  │  CREDIT_PACKAGE   │  (DB-driven, admin-editable)
  └───────────────────┘

  ┌──────────────────────────┐
  │ CREDIT_ADJUSTMENT_APPROV │  (principe 4 yeux)
  └──────────────────────────┘
MCD — Dictionnaire des Entités
Entité	Clé	Attributs principaux	Cardinalités clés
USER	id	name, email, phone, role, locale, kyc_level, risk_score	1-1 WALLET, 1-N TRANSACTION
CREDIT_WALLET	id	user_id, base_balance, bonus_balance, promo_balance, total_purchased, total_consumed	1-1 USER
CREDIT_LOT	id	wallet_id, type, initial_amount, remaining, source_txn_id, expires_at	N-1 WALLET
CREDIT_TRANSACTION	id	user_id, type, amount, credit_type, service_id, provider_id, wholesale_cost_usd, status, payment_method, payment_ref	N-1 USER
CREDIT_HOLD	id	user_id, activation_id, amount, credit_type, lot_id, state, expires_at	N-1 USER, 1-1 ACTIVATION
CREDIT_PACKAGE	id	slug, name_fr, name_en, credits, price_xaf, bonus_pct, label, sort_order, is_active	Standalone (admin config)
SERVICE	id	code, name_fr, name_en, icon_url, category, is_active, sort_order	1-N COUNTRY_PRICE
SERVICE_COUNTRY_PRICE	id	service_id, country_code, price_credits, floor_credits, is_active	N-1 SERVICE
DYNAMIC_PRICING_RULE	id	name, rule_type, threshold, adjustment_pct, is_active	Standalone
PROVIDER	id	code, name, api_base_url, api_key_enc, priority, is_active, success_rate_30d	1-N COST
PROVIDER_SERVICE_COST	id	provider_id, service_code, country_code, cost_usd, availability, last_checked	N-1 PROVIDER
PROVIDER_HEALTH_LOG	id	provider_id, uptime_pct, avg_response_ms, error_rate, checked_at	N-1 PROVIDER
SMS_ACTIVATION	id	user_id, service_id, country_code, provider_id, provider_activation_id, phone_number, sms_code, state, credits_charged, wholesale_cost_usd, hold_id	N-1 USER, N-1 SERVICE, N-1 PROVIDER
ACTIVATION_STATE_LOG	id	activation_id, from_state, to_state, event, metadata	N-1 ACTIVATION
REFERRAL	id	referrer_id, referee_id, status, total_earnings	N-1 USER(referrer), N-1 USER(referee)
REFERRAL_EARNING	id	referral_id, type (signup/commission), credits, source_txn_id	N-1 REFERRAL
AGENT	id	user_id, tier, monthly_volume, is_active	1-1 USER
AGENT_TIER_CONFIG	id	slug, name, min_monthly_credits, discount_pct, commission_pct	Standalone (admin config)
AGENT_SUB_USER	id	agent_id, user_id	N-1 AGENT, N-1 USER
VIP_TIER_CONFIG	id	slug, name, monthly_fee_xaf, bonus_credits, priority, hold_time_min	Standalone (admin config)
USER_VIP	id	user_id, tier_id, status, current_period_start, current_period_end	N-1 USER, N-1 VIP_TIER
PROMO_CODE	id	code, bonus_credits, discount_pct, usage_limit, used_count, expires_at, single_use, new_users_only	Standalone
PROMO_CODE_USAGE	id	promo_id, user_id, credits_granted	N-1 PROMO, N-1 USER
FRAUD_RULE	id	name, signal_type, threshold, action, is_active	Standalone (admin config)
FRAUD_EVENT	id	user_id, rule_id, signals_json, decision, resolved	N-1 USER, N-1 RULE
ADMIN_AUDIT_LOG	id	admin_id, action, target_type, target_id, before_json, after_json, ip	N-1 USER(admin)
CREDIT_ADJUSTMENT_APPROVAL	id	requester_id, approver_id, user_id, amount, reason, status	N-1 USER(s)
PLATFORM_CONFIG	key	value, value_type, category, description, updated_by	Standalone
CREDIT_PURCHASE	id	user_id, package_id, payment_id, credits_base, credits_bonus, total_xaf, payment_method, status	N-1 USER, N-1 PACKAGE
1.2 UML — Use Case Diagrams
Actors
text

┌─────────────────────────────────────────────────────────┐
│                      ACTEURS                             │
├──────────────┬──────────────────────────────────────────┤
│ Client       │ Utilisateur final, achète des crédits,   │
│              │ demande des vérifications SMS             │
├──────────────┼──────────────────────────────────────────┤
│ Agent        │ Revendeur avec sous-utilisateurs,        │
│              │ achète en gros                            │
├──────────────┼──────────────────────────────────────────┤
│ Admin        │ Gère la plateforme, configure les prix,  │
│              │ surveille les métriques                   │
├──────────────┼──────────────────────────────────────────┤
│ SuperAdmin   │ Admin avec droits étendus (approbation   │
│              │ ajustements, config système)              │
├──────────────┼──────────────────────────────────────────┤
│ API Provider │ Système externe (GrizzlySMS, SMS-Activate)│
├──────────────┼──────────────────────────────────────────┤
│ Payment GW   │ MTN MoMo, Orange Money, Stripe           │
├──────────────┼──────────────────────────────────────────┤
│ Scheduler    │ Cron jobs (expiration, health checks)     │
└──────────────┴──────────────────────────────────────────┘
Use Cases — Client
text

                    ┌─────────────────────────────────────┐
                    │          SYSTÈME CLIENT              │
                    │                                     │
    ┌──────┐        │  ┌─────────────────────────┐        │
    │Client│───────►│  │ UC1: S'inscrire/Login   │        │
    │      │        │  └─────────────────────────┘        │
    │      │───────►│  ┌─────────────────────────┐        │
    │      │        │  │ UC2: Consulter solde     │        │
    │      │        │  └─────────────────────────┘        │
    │      │───────►│  ┌─────────────────────────┐        │
    │      │        │  │ UC3: Acheter crédits     │──────►│Payment GW│
    │      │        │  └─────────────────────────┘        │
    │      │───────►│  ┌─────────────────────────┐        │
    │      │        │  │ UC4: Parcourir services  │        │
    │      │        │  └─────────────────────────┘        │
    │      │───────►│  ┌─────────────────────────┐        │
    │      │        │  │ UC5: Demander numéro SMS │──────►│API Provider│
    │      │        │  └─────────────────────────┘        │
    │      │───────►│  ┌─────────────────────────┐        │
    │      │        │  │ UC6: Annuler activation  │        │
    │      │        │  └─────────────────────────┘        │
    │      │───────►│  ┌─────────────────────────┐        │
    │      │        │  │ UC7: Voir historique     │        │
    │      │        │  └─────────────────────────┘        │
    │      │───────►│  ┌─────────────────────────┐        │
    │      │        │  │ UC8: Appliquer promo code│        │
    │      │        │  └─────────────────────────┘        │
    │      │───────►│  ┌─────────────────────────┐        │
    │      │        │  │ UC9: Gérer parrainages   │        │
    │      │        │  └─────────────────────────┘        │
    │      │───────►│  ┌─────────────────────────┐        │
    │      │        │  │ UC10: Gérer profil/KYC   │        │
    └──────┘        │  └─────────────────────────┘        │
                    └─────────────────────────────────────┘
Use Cases — Admin
text

                    ┌─────────────────────────────────────────┐
                    │           SYSTÈME ADMIN                  │
                    │                                         │
    ┌──────┐        │  ┌──────────────────────────────┐       │
    │Admin │───────►│  │ UC11: Dashboard KPIs          │       │
    │      │───────►│  │ UC12: CRUD forfaits crédits   │       │
    │      │───────►│  │ UC13: CRUD services/prix      │       │
    │      │───────►│  │ UC14: Config tarif dynamique  │       │
    │      │───────►│  │ UC15: Gérer utilisateurs      │       │
    │      │───────►│  │ UC16: Ajuster crédits manuels │──►│SuperAdmin│
    │      │───────►│  │ UC17: CRUD codes promo        │   (4 yeux)
    │      │───────►│  │ UC18: Gérer fournisseurs      │       │
    │      │───────►│  │ UC19: Surveiller fraude       │       │
    │      │───────►│  │ UC20: Gérer agents            │       │
    │      │───────►│  │ UC21: Générer rapports        │       │
    │      │───────►│  │ UC22: Config plateforme       │       │
    │      │───────►│  │ UC23: Consulter audit logs    │       │
    └──────┘        │  └──────────────────────────────┘       │
                    └─────────────────────────────────────────┘
1.3 UML — Sequence Diagrams (Flux Clés)
SD1: Achat de Crédits (Credit Purchase Flow)
text

Client          Frontend        API/Server       CreditService    PaymentGW       Database
  │                │                │                │                │              │
  │─ Select pkg ──►│                │                │                │              │
  │                │─ POST /credits/│purchase ───────►│                │              │
  │                │                │─ validate pkg ─►│                │              │
  │                │                │                │─ check fraud ──►│              │
  │                │                │                │◄── ok ──────────│              │
  │                │                │                │─ create purchase│(status=pending)►│
  │                │                │                │─ init payment ─►│              │
  │                │                │                │                │─ MoMo push ──►│
  │                │◄── payment URL/│push prompt ────│◄───────────────│              │
  │◄── confirm ────│                │                │                │              │
  │─── approve ───►│                │                │                │              │
  │                │                │                │                │◄── callback ──│
  │                │                │◄── webhook ────│                │              │
  │                │                │─ process ──────►│                │              │
  │                │                │                │─ create lots ──►│              │  
  │                │                │                │  (base lot +   │              │
  │                │                │                │   bonus lot    │              │
  │                │                │                │   w/ expiry)   │              │
  │                │                │                │─ update wallet─►│              │
  │                │                │                │─ log txn ──────►│              │
  │                │                │                │─ check 1st buy─►│              │
  │                │                │                │  (bonus 100cr) │              │
  │                │                │                │─ check referral►│              │
  │                │                │                │  (commissions) │              │
  │                │◄── success ────│◄── done ───────│              │              │
  │◄── updated ────│                │                │              │              │
SD2: Demande de Numéro SMS (SMS Activation Flow)
text

Client      Frontend     API/Server    CreditSvc    PricingSvc   ProviderSvc    Provider API    DB
  │            │             │             │             │             │              │          │
  │─ select ──►│             │             │             │             │              │          │
  │ svc+country│             │             │             │             │              │          │
  │            │─ GET price ►│             │             │             │              │          │
  │            │             │─────────────────────────► │             │              │          │
  │            │             │             │             │─ get base ──►│              │          │
  │            │             │             │             │  from DB     │              │          │
  │            │             │             │             │─ check avail►│              │          │
  │            │             │             │             │─ apply rules►│              │          │
  │            │             │             │◄────────────│ final_price  │              │          │
  │            │◄── price ───│             │             │             │              │          │
  │            │             │             │             │             │              │          │
  │─ confirm ─►│             │             │             │             │              │          │
  │            │─ POST req ─►│             │             │             │              │          │
  │            │             │─ hold ──────►│             │             │              │          │
  │            │             │             │─ find lot ──►│             │              │          │
  │            │             │             │─ reserve ───►│             │              │          │
  │            │             │             │◄── hold_ok ──│             │              │          │
  │            │             │─────────────────────────────────────────►│              │          │
  │            │             │             │             │             │─ score ───────►│         │
  │            │             │             │             │             │─ select best ─►│         │
  │            │             │             │             │             │─ getNumber ───►│         │
  │            │             │             │             │             │◄── number ─────│         │
  │            │             │─ create activation ─────────────────────────────────────►│         │
  │            │             │─ start timer (5/10 min) ──────────────────────────────── │         │
  │            │◄── waiting─ │             │             │             │              │          │
  │            │             │             │             │             │              │          │
  │ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ POLLING / SSE  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─│              │          │
  │            │             │─────────────────────────────────────────►│              │          │
  │            │             │             │             │             │─ getStatus ──►│          │
  │            │             │             │             │             │◄── SMS code ──│          │
  │            │             │─ confirm ───►│             │             │              │          │
  │            │             │             │─ debit lot ─►│             │              │          │
  │            │             │             │─ update wallet►            │              │          │
  │            │             │─ update activation (DONE)──────────────────────────────►│          │
  │            │◄── code ────│             │             │             │              │          │
  │◄── done ───│             │             │             │             │              │          │
SD3: Ajustement Manuel Admin (4-Eyes Principle)
text

Admin1        Frontend       API/Server      AdminSvc         DB          Admin2
  │              │               │               │             │             │
  │─ adjust ────►│               │               │             │             │
  │ user X       │─ POST adjust ►│               │             │             │
  │ +2000 cr     │               │─ check amt ──►│             │             │
  │              │               │               │─ >1000? ───►│             │
  │              │               │               │  YES → need │             │
  │              │               │               │  approval   │             │
  │              │               │               │─ create ────►│             │
  │              │               │               │  approval   │             │
  │              │               │               │  (pending)  │             │
  │              │◄── pending ───│◄──────────────│             │             │
  │              │               │               │             │             │
  │              │               │               │             │    ┌────────┴──────┐
  │              │               │               │             │◄───│ GET pending    │
  │              │               │               │             │    │ approvals     │
  │              │               │               │             │───►│               │
  │              │               │               │             │    │─ POST approve │
  │              │               │               │◄────────────│◄───│               │
  │              │               │               │─ apply adj ►│    └───────────────┘
  │              │               │               │─ update     │
  │              │               │               │  wallet     │
  │              │               │               │─ log txn    │
  │              │               │               │─ audit log  │
  │              │               │               │             │
1.4 UML — State Machine Diagrams
SM1: Credit Hold State Machine
text

                          ┌───────────────┐
                          │ REQUEST_NUMBER │
                          └───────┬───────┘
                                  │ credits reserved
                                  ▼
                          ┌───────────────┐
                          │     HOLD      │
                          └───────┬───────┘
                                  │ initiate API call
                                  ▼
                          ┌───────────────┐
                   ┌──────│   API_CALL    │──────┐
                   │      └───────────────┘      │
            api_success                     api_failure
                   │                             │
                   ▼                             ▼
           ┌───────────────┐            ┌───────────────┐
           │    SUCCESS    │            │    FAILURE     │
           └───────┬───────┘            └───────┬───────┘
                   │ timer starts               │
                   ▼                             ▼
           ┌───────────────┐            ┌───────────────┐
           │  TIMER_START  │            │  REFUND_100   │
           └───┬───┬───┬───┘            └───┬───────┬───┘
               │   │   │                    │       │
        sms    │timeout│user_cancel    retry │  abandon
        recv   │   │   │                    │       │
               ▼   ▼   ▼                    ▼       ▼
      ┌────────┐ ┌─────┐ ┌───────┐   ┌─────┐  ┌───────┐
      │SMS_RECV│ │T.OUT│ │U.CNCL │   │RETRY│  │ABANDON│
      └───┬────┘ └──┬──┘ └───┬───┘   └──┬──┘  └───┬───┘
          │         │        │           │         │
          ▼         ▼        ▼           │         ▼
   ┌────────────┐┌──────────────┐        │    ┌────────┐
   │DEBIT_CONFIR││  REFUND_100  │        │    │  DONE  │
   └──────┬─────┘└──────────────┘        │    └────────┘
          │                              │
          ▼          ┌───────────────┐    │
     ┌────────┐      │   API_CALL    │◄──┘
     │  DONE  │      │   (retry)     │
     └────────┘      └───────────────┘
SM2: Credit Purchase State Machine
text

     ┌──────────┐
     │ INITIATED│
     └────┬─────┘
          │ payment request sent
          ▼
     ┌──────────────────┐
     │ PAYMENT_PENDING  │
     └────┬────────┬────┘
          │        │
     callback   timeout/
     success    failure
          │        │
          ▼        ▼
   ┌──────────┐ ┌──────────┐
   │ CONFIRMED│ │  FAILED  │
   └────┬─────┘ └──────────┘
        │
        │ lots created, wallet updated
        ▼
   ┌──────────┐
   │ CREDITED │
   └──────────┘
SM3: SMS Activation Lifecycle
text

     ┌────────────┐
     │  REQUESTED │
     └─────┬──────┘
           │ provider assigned, number obtained
           ▼
     ┌────────────┐
     │  ASSIGNED  │──── provider_error ───► ┌──────────┐
     └─────┬──────┘                         │  FAILED  │
           │ timer starts                   └──────────┘
           ▼
     ┌────────────┐
     │  WAITING   │
     └──┬──┬──┬───┘
        │  │  │
   sms  │  │  │user_cancel
   recv │  │  │
        │  │timeout
        ▼  │  ▼
  ┌──────┐ │ ┌───────────┐
  │RECEIV│ │ │ CANCELLED │
  └──┬───┘ │ └───────────┘
     │     ▼
     │ ┌──────────┐
     │ │ EXPIRED  │
     │ └──────────┘
     ▼
  ┌──────────┐
  │COMPLETED │
  └──────────┘
1.5 UML — Activity Diagrams
AD1: Dynamic Pricing Calculation
text

┌─────────────────────────────────────────────────────┐
│            CALCUL TARIFICATION DYNAMIQUE              │
│                                                     │
│  ● START                                            │
│  │                                                  │
│  ▼                                                  │
│  ┌──────────────────────────┐                       │
│  │ Lire prix de base        │  ◄── service_country_ │
│  │ (service + pays)         │      prices table      │
│  └───────────┬──────────────┘                       │
│              │                                      │
│  ┌───────────▼──────────────┐                       │
│  │ Lire coût de gros        │  ◄── provider_service_│
│  │ meilleur fournisseur     │      costs table       │
│  └───────────┬──────────────┘                       │
│              │                                      │
│  ┌───────────▼──────────────┐                       │
│  │ Calculer prix plancher   │                       │
│  │ = coût × min_margin(1.6) │  ◄── platform_config  │
│  └───────────┬──────────────┘                       │
│              │                                      │
│  ┌───────────▼──────────────┐                       │
│  │ Disponibilité < seuil ?  │  ◄── dynamic_pricing_ │
│  └───┬───────────────┬──────┘      rules table       │
│     OUI             NON                              │
│      │               │                               │
│  ┌───▼─────────┐     │                               │
│  │ prix × 1.15 │     │                               │
│  └───┬─────────┘     │                               │
│      │               │                               │
│  ┌───▼───────────────▼──────┐                       │
│  │ Coût gros a augmenté     │                       │
│  │ de >10% vs référence ?   │                       │
│  └───┬───────────────┬──────┘                       │
│     OUI             NON                              │
│      │               │                               │
│  ┌───▼─────────┐     │                               │
│  │ prix × 1.15 │     │                               │
│  └───┬─────────┘     │                               │
│      │               │                               │
│  ┌───▼───────────────▼──────┐                       │
│  │ prix_final = max(prix,   │                       │
│  │                plancher) │                       │
│  └───────────┬──────────────┘                       │
│              │                                      │
│  ● END → retourner prix_final                       │
└─────────────────────────────────────────────────────┘
AD2: Credit Lot Consumption (FIFO by expiry)
text

● START: need to consume N credits
│
▼
┌─────────────────────────────────┐
│ Query credit_lots WHERE         │
│   wallet_id = user's wallet     │
│   AND type IN spend_order       │
│   AND remaining > 0             │
│   AND (expires_at IS NULL       │
│        OR expires_at > now)     │
│ ORDER BY                        │
│   CASE type                     │
│     WHEN 'promotional' THEN 1   │
│     WHEN 'bonus' THEN 2         │
│     WHEN 'base' THEN 3          │
│   END,                          │
│   expires_at ASC NULLS LAST     │
└────────────┬────────────────────┘
             │
             ▼
┌─────────────────────────────────┐
│ remaining_to_consume = N        │
│ FOR EACH lot in ordered_lots:   │
│   consume = min(lot.remaining,  │
│                 remaining)      │
│   lot.remaining -= consume      │
│   remaining -= consume          │
│   IF remaining == 0 → BREAK     │
└────────────┬────────────────────┘
             │
        ┌────▼────┐
        │remain=0?│
        └─┬─────┬─┘
         YES   NO
          │     │
          ▼     ▼
       ┌─────┐ ┌───────┐
       │ OK  │ │ ERROR │
       │     │ │insuff.│
       └─────┘ └───────┘
1.6 UML — Component Diagram
text

┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                               │
│  ┌──────────────────┐  ┌──────────────────┐                         │
│  │   Client App     │  │    Admin App     │                         │
│  │  (Next.js/Nuxt)  │  │  (Next.js/Nuxt)  │                         │
│  └────────┬─────────┘  └────────┬─────────┘                         │
└───────────┼─────────────────────┼───────────────────────────────────┘
            │ REST/tRPC           │ REST/tRPC
┌───────────┼─────────────────────┼───────────────────────────────────┐
│           │     API LAYER       │                                    │
│  ┌────────▼─────────┐  ┌───────▼──────────┐  ┌──────────────────┐  │
│  │ Client API Routes│  │ Admin API Routes │  │  Webhook Routes  │  │
│  └────────┬─────────┘  └───────┬──────────┘  └────────┬─────────┘  │
└───────────┼─────────────────────┼─────────────────────┼─────────────┘
            │                     │                     │
┌───────────┼─────────────────────┼─────────────────────┼─────────────┐
│           │     SERVICE LAYER   │                     │              │
│  ┌────────▼───────┐  ┌─────────▼────┐  ┌─────────────▼───┐         │
│  │ CreditService  │  │ AdminService │  │ PaymentService  │         │
│  │ PricingService │  │ ReportService│  │                 │         │
│  │ ActivationSvc  │  │ AuditService │  │                 │         │
│  │ FraudService   │  │              │  │                 │         │
│  │ ReferralSvc    │  │              │  │                 │         │
│  │ PromoService   │  │              │  │                 │         │
│  │ AgentService   │  │              │  │                 │         │
│  │ ConfigService  │  │              │  │                 │         │
│  └────────┬───────┘  └─────────┬────┘  └────────┬────────┘         │
└───────────┼─────────────────────┼────────────────┼──────────────────┘
            │                     │                │
┌───────────┼─────────────────────┼────────────────┼──────────────────┐
│           │  INFRASTRUCTURE     │                │                   │
│  ┌────────▼───────┐  ┌─────────▼────┐  ┌────────▼──────────┐       │
│  │   Database     │  │ Provider     │  │  Payment Gateway  │       │
│  │  (PostgreSQL)  │  │ Adapters     │  │  (MoMo/Orange)    │       │
│  │   via Drizzle  │  │ (Grizzly,    │  │                   │       │
│  │                │  │  SMS-Act,    │  │                   │       │
│  │                │  │  5SIM)       │  │                   │       │
│  └────────────────┘  └──────────────┘  └───────────────────┘       │
│                                                                     │
│  ┌────────────────┐  ┌──────────────┐  ┌───────────────────┐       │
│  │  Redis Cache   │  │  Job Queue   │  │  Event Emitter    │       │
│  │ (config,prices)│  │ (Bull/pg-boss)│  │  (notifications)  │       │
│  └────────────────┘  └──────────────┘  └───────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
PART 2 — COMPLETE DATABASE SCHEMA (DRIZZLE ORM)
2.0 File Structure
text

src/
└── db/
    ├── schema/
    │   ├── enums.ts                  ← All PostgreSQL enums
    │   ├── auth.ts                   ← User, session, account, verification (MODIFIED)
    │   ├── credits.ts                ← Wallet, lots, transactions, holds, packages, purchases
    │   ├── services.ts               ← Services, country prices, dynamic pricing rules
    │   ├── providers.ts              ← Providers, costs, health logs
    │   ├── activations.ts            ← SMS activations, state logs
    │   ├── referrals.ts              ← Referrals, earnings
    │   ├── agents.ts                 ← Agent tiers, agents, sub-users
    │   ├── vip.ts                    ← VIP tiers, user VIP subscriptions
    │   ├── promotions.ts             ← Promo codes, usages
    │   ├── fraud.ts                  ← Fraud rules, events
    │   ├── admin.ts                  ← Audit logs, adjustment approvals
    │   ├── config.ts                 ← Platform key-value config
    │   ├── relations.ts              ← ALL Drizzle relations in one place
    │   └── index.ts                  ← Barrel export
    └── seed/
        ├── seed-config.ts            ← Platform config defaults
        ├── seed-packages.ts          ← Default credit packages
        ├── seed-services.ts          ← Default services + prices
        ├── seed-providers.ts         ← Default providers
        ├── seed-vip-tiers.ts         ← Default VIP tiers
        ├── seed-agent-tiers.ts       ← Default agent tiers
        ├── seed-fraud-rules.ts       ← Default fraud rules
        └── index.ts                  ← Run all seeds
2.1 schema/enums.ts
TypeScript

import { pgEnum } from 'drizzle-orm/pg-core'

// ── Credit System ──
export const creditTypeEnum = pgEnum('credit_type', ['base', 'bonus', 'promotional'])

export const creditTransactionTypeEnum = pgEnum('credit_transaction_type', [
  'purchase',
  'debit',
  'refund',
  'bonus_signup',
  'bonus_referral',
  'bonus_promo',
  'bonus_vip',
  'bonus_first_purchase',
  'adjustment',
  'expiration',
])

export const creditHoldStateEnum = pgEnum('credit_hold_state', [
  'held',
  'debited',
  'released',
  'expired',
])

// ── Purchases & Payments ──
export const purchaseStatusEnum = pgEnum('purchase_status', [
  'initiated',
  'payment_pending',
  'confirmed',
  'credited',
  'failed',
  'refunded',
])

export const paymentMethodEnum = pgEnum('payment_method', [
  'mtn_momo',
  'orange_money',
  'card',
  'bank_transfer',
  'crypto',
  'free', // for promo/admin grants
])

export const paymentStatusEnum = pgEnum('payment_status', [
  'pending',
  'completed',
  'failed',
  'refunded',
  'cancelled',
])

// ── Services & Activations ──
export const serviceCategoryEnum = pgEnum('service_category', [
  'high_demand',
  'medium_demand',
  'low_demand',
  'premium',
])

export const activationStateEnum = pgEnum('activation_state', [
  'requested',
  'assigned',
  'waiting',
  'received',
  'completed',
  'expired',
  'cancelled',
  'failed',
  'refunded',
])

// ── Users & Roles ──
export const userRoleEnum = pgEnum('user_role', [
  'user',
  'agent',
  'admin',
  'super_admin',
])

export const kycLevelEnum = pgEnum('kyc_level', [
  'none',
  'phone_verified',
  'id_verified',
  'full',
])

export const userSegmentEnum = pgEnum('user_segment', [
  'high_value',
  'regular',
  'occasional',
  'dormant',
  'lost',
])

export const localeEnum = pgEnum('locale', ['fr', 'en'])

// ── Agents ──
export const agentStatusEnum = pgEnum('agent_status', ['pending', 'active', 'suspended'])

// ── Fraud ──
export const fraudActionEnum = pgEnum('fraud_action', [
  'flag',
  'rate_limit',
  'soft_ban',
  'hard_ban',
  'require_2fa',
])

export const fraudSignalTypeEnum = pgEnum('fraud_signal_type', [
  'rapid_consumption',
  'multi_account',
  'refund_abuse',
  'credit_hoarding',
  'geo_anomaly',
  'consecutive_failures',
])

// ── Admin ──
export const adjustmentReasonEnum = pgEnum('adjustment_reason', [
  'support_refund',
  'error_correction',
  'promotion',
  'fraud_recovery',
  'goodwill',
  'other',
])

export const approvalStatusEnum = pgEnum('approval_status', [
  'pending',
  'approved',
  'rejected',
])

// ── Config ──
export const configValueTypeEnum = pgEnum('config_value_type', [
  'string',
  'number',
  'boolean',
  'json',
])

// ── Dynamic Pricing ──
export const dynamicPricingRuleTypeEnum = pgEnum('dynamic_pricing_rule_type', [
  'low_availability',
  'wholesale_increase',
  'demand_surge',
  'time_based',
  'country_premium',
])

// ── VIP ──
export const vipSubscriptionStatusEnum = pgEnum('vip_subscription_status', [
  'active',
  'cancelled',
  'expired',
  'past_due',
])

// ── Referral ──
export const referralStatusEnum = pgEnum('referral_status', [
  'pending',       // referee signed up but hasn't purchased
  'activated',     // referee made first purchase
  'completed',     // all commission purchases tracked
])

export const referralEarningTypeEnum = pgEnum('referral_earning_type', [
  'signup_bonus',
  'commission',
])
2.2 schema/auth.ts (MODIFIED — adds role, locale, KYC, risk)
TypeScript

import { pgTable, text, timestamp, boolean, index, integer } from 'drizzle-orm/pg-core'
import { userRoleEnum, kycLevelEnum, userSegmentEnum, localeEnum } from './enums'

export const user = pgTable(
  'user',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    email: text('email').unique(),
    emailVerified: boolean('email_verified').default(false).notNull(),
    username: text('username').unique(),
    displayUsername: text('display_username'),
    phoneNumber: text('phone_number').unique(),
    phoneNumberVerified: boolean('phone_number_verified').default(false).notNull(),
    image: text('image'),

    // ── NEW FIELDS for economics ──
    role: userRoleEnum('role').default('user').notNull(),
    locale: localeEnum('locale').default('fr').notNull(),
    kycLevel: kycLevelEnum('kyc_level').default('none').notNull(),
    riskScore: integer('risk_score').default(0).notNull(), // 0-100, higher = riskier
    segment: userSegmentEnum('segment').default('occasional'),
    referralCode: text('referral_code').unique(), // auto-generated unique code
    referredBy: text('referred_by'), // referral_code of the person who referred them
    isSuspended: boolean('is_suspended').default(false).notNull(),
    suspendedReason: text('suspended_reason'),
    lastActiveAt: timestamp('last_active_at'),
    totalSpentXaf: integer('total_spent_xaf').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('user_role_idx').on(table.role),
    index('user_segment_idx').on(table.segment),
    index('user_referral_code_idx').on(table.referralCode),
  ]
)

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    // ── NEW ──
    countryCode: text('country_code'), // derived from IP for geo-anomaly detection
    deviceFingerprint: text('device_fingerprint'),
  },
  (table) => [index('session_userId_idx').on(table.userId)]
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)]
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)]
)
2.3 schema/credits.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import {
  creditTypeEnum,
  creditTransactionTypeEnum,
  creditHoldStateEnum,
  purchaseStatusEnum,
  paymentMethodEnum,
} from './enums'
import { user } from './auth'

// ── Credit Packages (DB-driven, replaces hardcoded CREDIT_PACKAGES) ──
export const creditPackage = pgTable(
  'credit_package',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),        // 'starter', 'basic', 'popular', etc.
    nameFr: text('name_fr').notNull(),             // 'Débutant'
    nameEn: text('name_en').notNull(),             // 'Starter'
    credits: integer('credits').notNull(),          // 500
    priceXaf: integer('price_xaf').notNull(),       // 1500
    bonusPct: integer('bonus_pct').default(0).notNull(), // 0, 5, 10, 15, 20, 30, 35
    label: text('label'),                          // 'PLUS_POPULAIRE', 'MEILLEUR_RAPPORT', null
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),

    // Payment method restrictions (null = all allowed)
    allowedPaymentMethods: text('allowed_payment_methods'), // JSON array: ["mtn_momo","orange_money","card"]

    // Minimum for this package
    minPurchaseCount: integer('min_purchase_count').default(0).notNull(), // 0 = no restriction

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('credit_package_sort_idx').on(table.sortOrder),
    index('credit_package_active_idx').on(table.isActive),
  ]
)

// ── Credit Wallet (one per user, aggregate balances) ──
export const creditWallet = pgTable(
  'credit_wallet',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    baseBalance: integer('base_balance').default(0).notNull(),
    bonusBalance: integer('bonus_balance').default(0).notNull(),
    promoBalance: integer('promo_balance').default(0).notNull(),

    // Lifetime aggregates (for analytics, no need to recalculate)
    totalPurchased: integer('total_purchased').default(0).notNull(),
    totalConsumed: integer('total_consumed').default(0).notNull(),
    totalRefunded: integer('total_refunded').default(0).notNull(),
    totalExpired: integer('total_expired').default(0).notNull(),
    totalBonusReceived: integer('total_bonus_received').default(0).notNull(),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('credit_wallet_user_unique').on(table.userId),
  ]
)

// ── Credit Lots (individual batches with expiration, enables FIFO consumption) ──
export const creditLot = pgTable(
  'credit_lot',
  {
    id: text('id').primaryKey(),
    walletId: text('wallet_id')
      .notNull()
      .references(() => creditWallet.id, { onDelete: 'cascade' }),
    creditType: creditTypeEnum('credit_type').notNull(),
    initialAmount: integer('initial_amount').notNull(),
    remainingAmount: integer('remaining_amount').notNull(),
    sourceTxnId: text('source_txn_id'), // which transaction created this lot
    expiresAt: timestamp('expires_at'),  // null = never expires (base credits)
    isExpired: boolean('is_expired').default(false).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('credit_lot_wallet_idx').on(table.walletId),
    index('credit_lot_type_idx').on(table.creditType),
    index('credit_lot_expires_idx').on(table.expiresAt),
    index('credit_lot_remaining_idx').on(table.remainingAmount),
  ]
)

// ── Credit Transactions (complete audit trail) ──
export const creditTransaction = pgTable(
  'credit_transaction',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    walletId: text('wallet_id')
      .notNull()
      .references(() => creditWallet.id, { onDelete: 'cascade' }),
    type: creditTransactionTypeEnum('type').notNull(),
    creditType: creditTypeEnum('credit_type').notNull(),
    amount: integer('amount').notNull(), // positive = credit, negative = debit
    balanceAfter: integer('balance_after').notNull(), // snapshot of total balance after txn

    // Context
    serviceId: text('service_id'),       // FK to service (if debit for activation)
    activationId: text('activation_id'), // FK to sms_activation
    purchaseId: text('purchase_id'),     // FK to credit_purchase
    lotId: text('lot_id'),               // FK to credit_lot consumed/created
    promoCodeId: text('promo_code_id'),  // FK to promo_code
    referralId: text('referral_id'),     // FK to referral

    // Financial
    wholesaleCostUsd: numeric('wholesale_cost_usd', { precision: 10, scale: 4 }),
    revenueXaf: numeric('revenue_xaf', { precision: 12, scale: 2 }),

    // Metadata
    description: text('description'),
    adminNote: text('admin_note'),
    ipAddress: text('ip_address'),
    deviceFingerprint: text('device_fingerprint'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('credit_txn_user_idx').on(table.userId),
    index('credit_txn_type_idx').on(table.type),
    index('credit_txn_created_idx').on(table.createdAt),
    index('credit_txn_service_idx').on(table.serviceId),
    index('credit_txn_activation_idx').on(table.activationId),
    index('credit_txn_purchase_idx').on(table.purchaseId),
  ]
)

// ── Credit Holds (reservations during SMS activation flow) ──
export const creditHold = pgTable(
  'credit_hold',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    walletId: text('wallet_id')
      .notNull()
      .references(() => creditWallet.id, { onDelete: 'cascade' }),
    activationId: text('activation_id'), // FK to sms_activation (set after activation created)
    amount: integer('amount').notNull(),
    creditType: creditTypeEnum('credit_type').notNull(),
    lotId: text('lot_id')
      .notNull()
      .references(() => creditLot.id),
    state: creditHoldStateEnum('state').default('held').notNull(),
    expiresAt: timestamp('expires_at').notNull(), // hold timeout
    debitedAt: timestamp('debited_at'),
    releasedAt: timestamp('released_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('credit_hold_user_idx').on(table.userId),
    index('credit_hold_state_idx').on(table.state),
    index('credit_hold_expires_idx').on(table.expiresAt),
    index('credit_hold_activation_idx').on(table.activationId),
  ]
)

// ── Credit Purchases (links package purchase to payment) ──
export const creditPurchase = pgTable(
  'credit_purchase',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    packageId: text('package_id')
      .notNull()
      .references(() => creditPackage.id),
    creditsBase: integer('credits_base').notNull(),
    creditsBonus: integer('credits_bonus').notNull(),
    totalCredits: integer('total_credits').notNull(),
    priceXaf: integer('price_xaf').notNull(),
    paymentMethod: paymentMethodEnum('payment_method').notNull(),
    paymentRef: text('payment_ref'),       // external payment reference
    paymentGatewayId: text('payment_gateway_id'), // MoMo transaction ID, etc.
    status: purchaseStatusEnum('status').default('initiated').notNull(),
    isFirstPurchase: boolean('is_first_purchase').default(false).notNull(),
    promoCodeId: text('promo_code_id'),    // if a promo was applied

    // MoMo fee tracking
    momoFeeXaf: integer('momo_fee_xaf').default(0),
    momoFeeAbsorbed: integer('momo_fee_absorbed').default(0),

    creditedAt: timestamp('credited_at'),
    failedAt: timestamp('failed_at'),
    failureReason: text('failure_reason'),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('credit_purchase_user_idx').on(table.userId),
    index('credit_purchase_status_idx').on(table.status),
    index('credit_purchase_package_idx').on(table.packageId),
    index('credit_purchase_created_idx').on(table.createdAt),
  ]
)
2.4 schema/services.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { serviceCategoryEnum, dynamicPricingRuleTypeEnum } from './enums'

// ── Service Catalog (DB-driven, replaces hardcoded SERVICE_PRICING) ──
export const service = pgTable(
  'service',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),       // 'whatsapp', 'telegram', 'google', etc.
    apiCode: text('api_code').notNull(),          // Provider API code: 'wa', 'tg', 'go', etc.
    nameFr: text('name_fr').notNull(),
    nameEn: text('name_en').notNull(),
    descriptionFr: text('description_fr'),
    descriptionEn: text('description_en'),
    iconUrl: text('icon_url'),
    category: serviceCategoryEnum('category').default('medium_demand').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    isPaused: boolean('is_paused').default(false).notNull(), // temp pause without deactivating
    sortOrder: integer('sort_order').default(0).notNull(),

    // Default pricing (fallback when no country-specific price exists)
    defaultPriceCredits: integer('default_price_credits').notNull(),
    defaultFloorCredits: integer('default_floor_credits').notNull(),

    // Analytics caches (updated periodically)
    totalActivations: integer('total_activations').default(0).notNull(),
    successRate30d: numeric('success_rate_30d', { precision: 5, scale: 4 }).default('0'),
    avgDeliverySeconds: integer('avg_delivery_seconds').default(0),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('service_code_idx').on(table.code),
    index('service_active_idx').on(table.isActive),
    index('service_category_idx').on(table.category),
    index('service_sort_idx').on(table.sortOrder),
  ]
)

// ── Service Country Prices (per-service, per-country credit pricing) ──
export const serviceCountryPrice = pgTable(
  'service_country_price',
  {
    id: text('id').primaryKey(),
    serviceId: text('service_id')
      .notNull()
      .references(() => service.id, { onDelete: 'cascade' }),
    countryCode: text('country_code').notNull(),  // ISO 3166-1 alpha-2: 'CM', 'US', 'IN', etc.
    countryNameFr: text('country_name_fr'),
    countryNameEn: text('country_name_en'),
    priceCredits: integer('price_credits').notNull(),  // user-facing price in credits
    floorCredits: integer('floor_credits').notNull(),   // minimum price (never sell below)
    isActive: boolean('is_active').default(true).notNull(),

    // Dynamic pricing reference
    baselineWholesaleUsd: numeric('baseline_wholesale_usd', { precision: 10, scale: 4 }),

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('svc_country_unique').on(table.serviceId, table.countryCode),
    index('svc_country_service_idx').on(table.serviceId),
    index('svc_country_active_idx').on(table.isActive),
  ]
)

// ── Dynamic Pricing Rules (DB-driven, replaces hardcoded DYNAMIC_PRICING_RULES) ──
export const dynamicPricingRule = pgTable(
  'dynamic_pricing_rule',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    ruleType: dynamicPricingRuleTypeEnum('rule_type').notNull(),
    isActive: boolean('is_active').default(true).notNull(),

    // Condition
    threshold: numeric('threshold', { precision: 10, scale: 4 }).notNull(), // e.g., availability < 50, wholesale_delta > 10%
    
    // Action
    adjustmentPct: numeric('adjustment_pct', { precision: 5, scale: 2 }).notNull(), // e.g., 15 = +15%

    // Scope (null = applies to all)
    serviceId: text('service_id').references(() => service.id),
    countryCode: text('country_code'),

    // Guard rails
    maxAdjustmentPct: numeric('max_adjustment_pct', { precision: 5, scale: 2 }).default('50'),
    minMarginMultiplier: numeric('min_margin_multiplier', { precision: 5, scale: 2 }).default('1.6'),

    priority: integer('priority').default(0).notNull(), // higher = applied first

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('dpr_active_idx').on(table.isActive),
    index('dpr_type_idx').on(table.ruleType),
  ]
)
2.5 schema/providers.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core'

// ── API Providers (DB-driven, replaces hardcoded PROVIDER_ROUTING) ──
export const provider = pgTable(
  'provider',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),          // 'grizzlysms', 'sms_activate', '5sim', 'sms_man'
    name: text('name').notNull(),
    apiBaseUrl: text('api_base_url').notNull(),
    apiKeyEncrypted: text('api_key_encrypted').notNull(), // encrypted at rest
    priority: integer('priority').default(1).notNull(), // lower = higher priority
    isActive: boolean('is_active').default(true).notNull(),

    // Health metrics (updated by health check cron)
    uptimePct30d: numeric('uptime_pct_30d', { precision: 5, scale: 2 }).default('100'),
    avgResponseMs: integer('avg_response_ms').default(0),
    errorRate30d: numeric('error_rate_30d', { precision: 5, scale: 4 }).default('0'),
    successRate30d: numeric('success_rate_30d', { precision: 5, scale: 4 }).default('1'),

    // Routing config
    maxRetryAttempts: integer('max_retry_attempts').default(3).notNull(),
    reliabilityPenaltyMultiplier: numeric('reliability_penalty_multiplier', { precision: 3, scale: 1 }).default('2'),
    cacheTtlSeconds: integer('cache_ttl_seconds').default(60).notNull(),

    lastHealthCheck: timestamp('last_health_check'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('provider_priority_idx').on(table.priority),
    index('provider_active_idx').on(table.isActive),
  ]
)

// ── Provider Service Costs (wholesale prices, cached from API polling) ──
export const providerServiceCost = pgTable(
  'provider_service_cost',
  {
    id: text('id').primaryKey(),
    providerId: text('provider_id')
      .notNull()
      .references(() => provider.id, { onDelete: 'cascade' }),
    serviceCode: text('service_code').notNull(),    // maps to service.api_code
    countryCode: text('country_code').notNull(),
    costUsd: numeric('cost_usd', { precision: 10, scale: 4 }).notNull(),
    availability: integer('availability').default(0).notNull(), // number of available numbers
    successRate30d: numeric('success_rate_30d', { precision: 5, scale: 4 }).default('1'),

    lastCheckedAt: timestamp('last_checked_at').defaultNow().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('psc_unique').on(table.providerId, table.serviceCode, table.countryCode),
    index('psc_provider_idx').on(table.providerId),
    index('psc_service_country_idx').on(table.serviceCode, table.countryCode),
  ]
)

// ── Provider Health Logs (time-series health data) ──
export const providerHealthLog = pgTable(
  'provider_health_log',
  {
    id: text('id').primaryKey(),
    providerId: text('provider_id')
      .notNull()
      .references(() => provider.id, { onDelete: 'cascade' }),
    uptimePct: numeric('uptime_pct', { precision: 5, scale: 2 }),
    avgResponseMs: integer('avg_response_ms'),
    errorRate: numeric('error_rate', { precision: 5, scale: 4 }),
    totalRequests: integer('total_requests').default(0),
    totalErrors: integer('total_errors').default(0),
    checkedAt: timestamp('checked_at').defaultNow().notNull(),
  },
  (table) => [
    index('phl_provider_idx').on(table.providerId),
    index('phl_checked_idx').on(table.checkedAt),
  ]
)
2.6 schema/activations.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core'
import { activationStateEnum } from './enums'
import { user } from './auth'
import { service } from './services'
import { provider } from './providers'
import { creditHold } from './credits'

// ── SMS Activations (core business entity) ──
export const smsActivation = pgTable(
  'sms_activation',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    serviceId: text('service_id')
      .notNull()
      .references(() => service.id),
    countryCode: text('country_code').notNull(),
    providerId: text('provider_id')
      .references(() => provider.id),
    providerActivationId: text('provider_activation_id'), // ID from GrizzlySMS etc.
    holdId: text('hold_id')
      .references(() => creditHold.id),

    phoneNumber: text('phone_number'),
    smsCode: text('sms_code'),         // the received verification code
    fullSmsText: text('full_sms_text'), // full SMS message text

    state: activationStateEnum('state').default('requested').notNull(),

    // Economics
    creditsCharged: integer('credits_charged').notNull(),
    wholesaleCostUsd: numeric('wholesale_cost_usd', { precision: 10, scale: 4 }),
    marginRatio: numeric('margin_ratio', { precision: 5, scale: 4 }),

    // Provider selection metadata
    maxPriceUsd: numeric('max_price_usd', { precision: 10, scale: 4 }),
    providerAttempts: integer('provider_attempts').default(1).notNull(),

    // Timing
    numberAssignedAt: timestamp('number_assigned_at'),
    smsReceivedAt: timestamp('sms_received_at'),
    completedAt: timestamp('completed_at'),
    cancelledAt: timestamp('cancelled_at'),
    expiredAt: timestamp('expired_at'),
    timerExpiresAt: timestamp('timer_expires_at'), // when the hold times out

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('activation_user_idx').on(table.userId),
    index('activation_service_idx').on(table.serviceId),
    index('activation_provider_idx').on(table.providerId),
    index('activation_state_idx').on(table.state),
    index('activation_created_idx').on(table.createdAt),
    index('activation_country_idx').on(table.countryCode),
  ]
)

// ── Activation State Logs (detailed state transitions for debugging & analytics) ──
export const activationStateLog = pgTable(
  'activation_state_log',
  {
    id: text('id').primaryKey(),
    activationId: text('activation_id')
      .notNull()
      .references(() => smsActivation.id, { onDelete: 'cascade' }),
    fromState: activationStateEnum('from_state'),
    toState: activationStateEnum('to_state').notNull(),
    event: text('event').notNull(), // 'provider_assigned', 'sms_received', 'timeout', etc.
    metadata: jsonb('metadata'),    // additional context
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('asl_activation_idx').on(table.activationId),
    index('asl_created_idx').on(table.createdAt),
  ]
)
2.7 schema/referrals.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  index,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { referralStatusEnum, referralEarningTypeEnum } from './enums'
import { user } from './auth'

// ── Referrals ──
export const referral = pgTable(
  'referral',
  {
    id: text('id').primaryKey(),
    referrerId: text('referrer_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    refereeId: text('referee_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    status: referralStatusEnum('status').default('pending').notNull(),
    totalEarningsCredits: integer('total_earnings_credits').default(0).notNull(),
    purchasesTracked: integer('purchases_tracked').default(0).notNull(), // counts up to commission_purchases limit
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('referral_referee_unique').on(table.refereeId), // a user can only be referred once
    index('referral_referrer_idx').on(table.referrerId),
    index('referral_status_idx').on(table.status),
  ]
)

// ── Referral Earnings ──
export const referralEarning = pgTable(
  'referral_earning',
  {
    id: text('id').primaryKey(),
    referralId: text('referral_id')
      .notNull()
      .references(() => referral.id, { onDelete: 'cascade' }),
    type: referralEarningTypeEnum('type').notNull(),
    creditsEarned: integer('credits_earned').notNull(),
    sourceTxnId: text('source_txn_id'),  // the purchase that triggered the commission
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('re_referral_idx').on(table.referralId),
    index('re_type_idx').on(table.type),
  ]
)
2.8 schema/agents.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { agentStatusEnum } from './enums'
import { user } from './auth'

// ── Agent Tier Configuration (DB-driven, replaces hardcoded AGENT_TIERS) ──
export const agentTierConfig = pgTable(
  'agent_tier_config',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),             // 'bronze', 'silver', 'gold'
    nameFr: text('name_fr').notNull(),
    nameEn: text('name_en').notNull(),
    minMonthlyCredits: integer('min_monthly_credits').notNull(),
    discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).notNull(), // 10, 18, 25
    commissionPct: numeric('commission_pct', { precision: 5, scale: 2 }).notNull(), // 5, 8, 10
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }
)

// ── Agents ──
export const agent = pgTable(
  'agent',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: 'cascade' }),
    tierId: text('tier_id')
      .references(() => agentTierConfig.id),
    status: agentStatusEnum('status').default('pending').notNull(),
    monthlyVolumeCredits: integer('monthly_volume_credits').default(0).notNull(),
    totalEarningsCredits: integer('total_earnings_credits').default(0).notNull(),
    businessName: text('business_name'),
    brandingConfig: text('branding_config'), // JSON for white-label config
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    uniqueIndex('agent_user_unique').on(table.userId),
    index('agent_tier_idx').on(table.tierId),
    index('agent_status_idx').on(table.status),
  ]
)

// ── Agent Sub-Users ──
export const agentSubUser = pgTable(
  'agent_sub_user',
  {
    id: text('id').primaryKey(),
    agentId: text('agent_id')
      .notNull()
      .references(() => agent.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex('asu_user_unique').on(table.userId), // user can only belong to one agent
    index('asu_agent_idx').on(table.agentId),
  ]
)
2.9 schema/vip.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { vipSubscriptionStatusEnum } from './enums'
import { user } from './auth'

// ── VIP Tier Configuration (DB-driven, replaces hardcoded VIP_TIERS) ──
export const vipTierConfig = pgTable(
  'vip_tier_config',
  {
    id: text('id').primaryKey(),
    slug: text('slug').notNull().unique(),           // 'free', 'vip', 'pro'
    nameFr: text('name_fr').notNull(),
    nameEn: text('name_en').notNull(),
    monthlyFeeXaf: integer('monthly_fee_xaf').notNull(),
    bonusCreditsMonthly: integer('bonus_credits_monthly').notNull(),
    hasPriority: boolean('has_priority').default(false).notNull(),
    holdTimeMinutes: integer('hold_time_minutes').default(5).notNull(),
    hasApiAccess: boolean('has_api_access').default(false).notNull(),
    hasDedicatedSupport: boolean('has_dedicated_support').default(false).notNull(),
    apiRateLimitPerMin: integer('api_rate_limit_per_min').default(100).notNull(),
    sortOrder: integer('sort_order').default(0).notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  }
)

// ── User VIP Subscriptions ──
export const userVip = pgTable(
  'user_vip',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    tierId: text('tier_id')
      .notNull()
      .references(() => vipTierConfig.id),
    status: vipSubscriptionStatusEnum('status').default('active').notNull(),
    currentPeriodStart: timestamp('current_period_start').notNull(),
    currentPeriodEnd: timestamp('current_period_end').notNull(),
    cancelledAt: timestamp('cancelled_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('user_vip_user_idx').on(table.userId),
    index('user_vip_status_idx').on(table.status),
  ]
)
2.10 schema/promotions.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { user } from './auth'

// ── Promo Codes ──
export const promoCode = pgTable(
  'promo_code',
  {
    id: text('id').primaryKey(),
    code: text('code').notNull().unique(),
    descriptionFr: text('description_fr'),
    descriptionEn: text('description_en'),
    bonusCredits: integer('bonus_credits').default(0).notNull(),
    discountPct: numeric('discount_pct', { precision: 5, scale: 2 }).default('0'),
    usageLimit: integer('usage_limit').notNull(),          // max total uses
    usedCount: integer('used_count').default(0).notNull(),
    maxUsesPerUser: integer('max_uses_per_user').default(1).notNull(),
    newUsersOnly: boolean('new_users_only').default(false).notNull(),
    minPurchaseCredits: integer('min_purchase_credits').default(0), // min package size
    applicablePackageIds: text('applicable_package_ids'), // JSON array or null = all

    expiresAt: timestamp('expires_at').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    createdBy: text('created_by').references(() => user.id),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('promo_code_idx').on(table.code),
    index('promo_active_idx').on(table.isActive),
    index('promo_expires_idx').on(table.expiresAt),
  ]
)

// ── Promo Code Usages ──
export const promoCodeUsage = pgTable(
  'promo_code_usage',
  {
    id: text('id').primaryKey(),
    promoCodeId: text('promo_code_id')
      .notNull()
      .references(() => promoCode.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    creditsGranted: integer('credits_granted').notNull(),
    discountAppliedXaf: integer('discount_applied_xaf').default(0),
    purchaseId: text('purchase_id'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('pcu_promo_idx').on(table.promoCodeId),
    index('pcu_user_idx').on(table.userId),
    uniqueIndex('pcu_single_use_idx').on(table.promoCodeId, table.userId), // if single-use-per-user
  ]
)
2.11 schema/fraud.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  integer,
  numeric,
  jsonb,
} from 'drizzle-orm/pg-core'
import { fraudActionEnum, fraudSignalTypeEnum } from './enums'
import { user } from './auth'

// ── Fraud Rules (DB-driven, replaces hardcoded FRAUD_THRESHOLDS) ──
export const fraudRule = pgTable(
  'fraud_rule',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    signalType: fraudSignalTypeEnum('signal_type').notNull(),
    threshold: numeric('threshold', { precision: 10, scale: 2 }).notNull(),
    action: fraudActionEnum('action').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    description: text('description'),

    // Optional scope
    windowHours: integer('window_hours').default(1), // time window for threshold
    minAttempts: integer('min_attempts'),             // minimum attempts before rule applies

    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('fr_signal_idx').on(table.signalType),
    index('fr_active_idx').on(table.isActive),
  ]
)

// ── Fraud Events (detected incidents) ──
export const fraudEvent = pgTable(
  'fraud_event',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ruleId: text('rule_id')
      .references(() => fraudRule.id),
    signalType: fraudSignalTypeEnum('signal_type').notNull(),
    signals: jsonb('signals').notNull(),     // snapshot of fraud signals at detection time
    decision: fraudActionEnum('decision').notNull(),
    isResolved: boolean('is_resolved').default(false).notNull(),
    resolvedBy: text('resolved_by').references(() => user.id),
    resolvedAt: timestamp('resolved_at'),
    resolutionNote: text('resolution_note'),
    ipAddress: text('ip_address'),
    deviceFingerprint: text('device_fingerprint'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('fe_user_idx').on(table.userId),
    index('fe_signal_idx').on(table.signalType),
    index('fe_resolved_idx').on(table.isResolved),
    index('fe_created_idx').on(table.createdAt),
  ]
)
2.12 schema/admin.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  index,
  integer,
  jsonb,
} from 'drizzle-orm/pg-core'
import { adjustmentReasonEnum, approvalStatusEnum } from './enums'
import { user } from './auth'

// ── Admin Audit Logs (every admin action is logged) ──
export const adminAuditLog = pgTable(
  'admin_audit_log',
  {
    id: text('id').primaryKey(),
    adminId: text('admin_id')
      .notNull()
      .references(() => user.id),
    action: text('action').notNull(), // 'create_package', 'update_service_price', 'suspend_user', etc.
    targetType: text('target_type'),   // 'user', 'credit_package', 'service', 'promo_code', etc.
    targetId: text('target_id'),       // ID of the affected entity
    beforeData: jsonb('before_data'),  // snapshot before change
    afterData: jsonb('after_data'),    // snapshot after change
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('aal_admin_idx').on(table.adminId),
    index('aal_action_idx').on(table.action),
    index('aal_target_idx').on(table.targetType, table.targetId),
    index('aal_created_idx').on(table.createdAt),
  ]
)

// ── Credit Adjustment Approvals (4-eyes principle for >1000 credits) ──
export const creditAdjustmentApproval = pgTable(
  'credit_adjustment_approval',
  {
    id: text('id').primaryKey(),
    requesterId: text('requester_id')
      .notNull()
      .references(() => user.id),
    targetUserId: text('target_user_id')
      .notNull()
      .references(() => user.id),
    amount: integer('amount').notNull(),         // positive = add, negative = debit
    reason: adjustmentReasonEnum('reason').notNull(),
    reasonNote: text('reason_note'),
    status: approvalStatusEnum('status').default('pending').notNull(),
    approverId: text('approver_id')
      .references(() => user.id),
    approvedAt: timestamp('approved_at'),
    rejectedAt: timestamp('rejected_at'),
    rejectionNote: text('rejection_note'),
    executedTxnId: text('executed_txn_id'), // FK to credit_transaction once applied
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('caa_requester_idx').on(table.requesterId),
    index('caa_target_idx').on(table.targetUserId),
    index('caa_status_idx').on(table.status),
    index('caa_created_idx').on(table.createdAt),
  ]
)
2.13 schema/config.ts
TypeScript

import {
  pgTable,
  text,
  timestamp,
  index,
} from 'drizzle-orm/pg-core'
import { configValueTypeEnum } from './enums'
import { user } from './auth'

// ── Platform Configuration (DB-driven key-value store, replaces ALL hardcoded constants) ──
export const platformConfig = pgTable(
  'platform_config',
  {
    key: text('key').primaryKey(),              // e.g., 'credit_value_xaf', 'momo_fee_pct'
    value: text('value').notNull(),              // stored as string, parsed by type
    valueType: configValueTypeEnum('value_type').notNull(),
    category: text('category').notNull(),        // 'credits', 'pricing', 'fraud', 'momo', 'referral', 'breakage', 'admin'
    descriptionFr: text('description_fr'),
    descriptionEn: text('description_en'),
    updatedBy: text('updated_by').references(() => user.id),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('pc_category_idx').on(table.category),
  ]
)
2.14 schema/relations.ts
TypeScript

import { relations } from 'drizzle-orm'
import { user, session, account } from './auth'
import {
  creditWallet,
  creditLot,
  creditTransaction,
  creditHold,
  creditPurchase,
  creditPackage,
} from './credits'
import { service, serviceCountryPrice, dynamicPricingRule } from './services'
import { provider, providerServiceCost, providerHealthLog } from './providers'
import { smsActivation, activationStateLog } from './activations'
import { referral, referralEarning } from './referrals'
import { agent, agentTierConfig, agentSubUser } from './agents'
import { vipTierConfig, userVip } from './vip'
import { promoCode, promoCodeUsage } from './promotions'
import { fraudRule, fraudEvent } from './fraud'
import { adminAuditLog, creditAdjustmentApproval } from './admin'

// ══════════════════════ AUTH ══════════════════════

export const userRelations = relations(user, ({ one, many }) => ({
  sessions: many(session),
  accounts: many(account),
  wallet: one(creditWallet, { fields: [user.id], references: [creditWallet.userId] }),
  creditTransactions: many(creditTransaction),
  creditPurchases: many(creditPurchase),
  creditHolds: many(creditHold),
  activations: many(smsActivation),
  referralsMade: many(referral, { relationName: 'referrer' }),
  referredBy: one(referral, {
    fields: [user.id],
    references: [referral.refereeId],
    relationName: 'referee',
  }),
  agent: one(agent, { fields: [user.id], references: [agent.userId] }),
  vipSubscription: one(userVip, { fields: [user.id], references: [userVip.userId] }),
  fraudEvents: many(fraudEvent),
  adminAuditLogs: many(adminAuditLog),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}))

// ══════════════════════ CREDITS ══════════════════════

export const creditWalletRelations = relations(creditWallet, ({ one, many }) => ({
  user: one(user, { fields: [creditWallet.userId], references: [user.id] }),
  lots: many(creditLot),
  transactions: many(creditTransaction),
  holds: many(creditHold),
}))

export const creditLotRelations = relations(creditLot, ({ one }) => ({
  wallet: one(creditWallet, { fields: [creditLot.walletId], references: [creditWallet.id] }),
}))

export const creditTransactionRelations = relations(creditTransaction, ({ one }) => ({
  user: one(user, { fields: [creditTransaction.userId], references: [user.id] }),
  wallet: one(creditWallet, {
    fields: [creditTransaction.walletId],
    references: [creditWallet.id],
  }),
}))

export const creditHoldRelations = relations(creditHold, ({ one }) => ({
  user: one(user, { fields: [creditHold.userId], references: [user.id] }),
  wallet: one(creditWallet, { fields: [creditHold.walletId], references: [creditWallet.id] }),
  lot: one(creditLot, { fields: [creditHold.lotId], references: [creditLot.id] }),
  activation: one(smsActivation, {
    fields: [creditHold.activationId],
    references: [smsActivation.id],
  }),
}))

export const creditPurchaseRelations = relations(creditPurchase, ({ one }) => ({
  user: one(user, { fields: [creditPurchase.userId], references: [user.id] }),
  package: one(creditPackage, {
    fields: [creditPurchase.packageId],
    references: [creditPackage.id],
  }),
}))

// ══════════════════════ SERVICES ══════════════════════

export const serviceRelations = relations(service, ({ many }) => ({
  countryPrices: many(serviceCountryPrice),
  activations: many(smsActivation),
  dynamicPricingRules: many(dynamicPricingRule),
}))

export const serviceCountryPriceRelations = relations(serviceCountryPrice, ({ one }) => ({
  service: one(service, {
    fields: [serviceCountryPrice.serviceId],
    references: [service.id],
  }),
}))

export const dynamicPricingRuleRelations = relations(dynamicPricingRule, ({ one }) => ({
  service: one(service, {
    fields: [dynamicPricingRule.serviceId],
    references: [service.id],
  }),
}))

// ══════════════════════ PROVIDERS ══════════════════════

export const providerRelations = relations(provider, ({ many }) => ({
  serviceCosts: many(providerServiceCost),
  healthLogs: many(providerHealthLog),
  activations: many(smsActivation),
}))

export const providerServiceCostRelations = relations(providerServiceCost, ({ one }) => ({
  provider: one(provider, {
    fields: [providerServiceCost.providerId],
    references: [provider.id],
  }),
}))

export const providerHealthLogRelations = relations(providerHealthLog, ({ one }) => ({
  provider: one(provider, {
    fields: [providerHealthLog.providerId],
    references: [provider.id],
  }),
}))

// ══════════════════════ ACTIVATIONS ══════════════════════

export const smsActivationRelations = relations(smsActivation, ({ one, many }) => ({
  user: one(user, { fields: [smsActivation.userId], references: [user.id] }),
  service: one(service, { fields: [smsActivation.serviceId], references: [service.id] }),
  provider: one(provider, { fields: [smsActivation.providerId], references: [provider.id] }),
  hold: one(creditHold, { fields: [smsActivation.holdId], references: [creditHold.id] }),
  stateLogs: many(activationStateLog),
}))

export const activationStateLogRelations = relations(activationStateLog, ({ one }) => ({
  activation: one(smsActivation, {
    fields: [activationStateLog.activationId],
    references: [smsActivation.id],
  }),
}))

// ══════════════════════ REFERRALS ══════════════════════

export const referralRelations = relations(referral, ({ one, many }) => ({
  referrer: one(user, {
    fields: [referral.referrerId],
    references: [user.id],
    relationName: 'referrer',
  }),
  referee: one(user, {
    fields: [referral.refereeId],
    references: [user.id],
    relationName: 'referee',
  }),
  earnings: many(referralEarning),
}))

export const referralEarningRelations = relations(referralEarning, ({ one }) => ({
  referral: one(referral, {
    fields: [referralEarning.referralId],
    references: [referral.id],
  }),
}))

// ══════════════════════ AGENTS ══════════════════════

export const agentRelations = relations(agent, ({ one, many }) => ({
  user: one(user, { fields: [agent.userId], references: [user.id] }),
  tier: one(agentTierConfig, { fields: [agent.tierId], references: [agentTierConfig.id] }),
  subUsers: many(agentSubUser),
}))

export const agentTierConfigRelations = relations(agentTierConfig, ({ many }) => ({
  agents: many(agent),
}))

export const agentSubUserRelations = relations(agentSubUser, ({ one }) => ({
  agent: one(agent, { fields: [agentSubUser.agentId], references: [agent.id] }),
  user: one(user, { fields: [agentSubUser.userId], references: [user.id] }),
}))

// ══════════════════════ VIP ══════════════════════

export const vipTierConfigRelations = relations(vipTierConfig, ({ many }) => ({
  subscriptions: many(userVip),
}))

export const userVipRelations = relations(userVip, ({ one }) => ({
  user: one(user, { fields: [userVip.userId], references: [user.id] }),
  tier: one(vipTierConfig, { fields: [userVip.tierId], references: [vipTierConfig.id] }),
}))

// ══════════════════════ PROMOTIONS ══════════════════════

export const promoCodeRelations = relations(promoCode, ({ one, many }) => ({
  creator: one(user, { fields: [promoCode.createdBy], references: [user.id] }),
  usages: many(promoCodeUsage),
}))

export const promoCodeUsageRelations = relations(promoCodeUsage, ({ one }) => ({
  promoCode: one(promoCode, {
    fields: [promoCodeUsage.promoCodeId],
    references: [promoCode.id],
  }),
  user: one(user, { fields: [promoCodeUsage.userId], references: [user.id] }),
}))

// ══════════════════════ FRAUD ══════════════════════

export const fraudRuleRelations = relations(fraudRule, ({ many }) => ({
  events: many(fraudEvent),
}))

export const fraudEventRelations = relations(fraudEvent, ({ one }) => ({
  user: one(user, { fields: [fraudEvent.userId], references: [user.id] }),
  rule: one(fraudRule, { fields: [fraudEvent.ruleId], references: [fraudRule.id] }),
}))

// ══════════════════════ ADMIN ══════════════════════

export const adminAuditLogRelations = relations(adminAuditLog, ({ one }) => ({
  admin: one(user, { fields: [adminAuditLog.adminId], references: [user.id] }),
}))

export const creditAdjustmentApprovalRelations = relations(
  creditAdjustmentApproval,
  ({ one }) => ({
    requester: one(user, {
      fields: [creditAdjustmentApproval.requesterId],
      references: [user.id],
    }),
    targetUser: one(user, {
      fields: [creditAdjustmentApproval.targetUserId],
      references: [user.id],
    }),
    approver: one(user, {
      fields: [creditAdjustmentApproval.approverId],
      references: [user.id],
    }),
  })
)
2.15 schema/index.ts
TypeScript

// ── Enums ──
export * from './enums'

// ── Tables ──
export * from './auth'
export * from './credits'
export * from './services'
export * from './providers'
export * from './activations'
export * from './referrals'
export * from './agents'
export * from './vip'
export * from './promotions'
export * from './fraud'
export * from './admin'
export * from './config'

// ── Relations ──
export * from './relations'
PART 3 — SEED DATA
3.1 seed/seed-config.ts
TypeScript

import { db } from '../client'
import { platformConfig } from '../schema'

const configs = [
  // ── Credits ──
  { key: 'credit_value_xaf', value: '2.6', valueType: 'number' as const, category: 'credits', descriptionFr: 'Valeur d\'un crédit en FCFA', descriptionEn: 'Value of one credit in XAF' },
  { key: 'credit_base_ratio', value: '100', valueType: 'number' as const, category: 'credits', descriptionFr: 'Nombre de crédits pour 1 vérification SMS standard', descriptionEn: 'Credits per 1 standard SMS verification' },
  { key: 'breakage_target_min', value: '0.08', valueType: 'number' as const, category: 'credits', descriptionFr: 'Taux de casse minimum cible', descriptionEn: 'Minimum target breakage rate' },
  { key: 'breakage_target_max', value: '0.12', valueType: 'number' as const, category: 'credits', descriptionFr: 'Taux de casse maximum cible', descriptionEn: 'Maximum target breakage rate' },
  { key: 'bonus_expiry_days', value: '90', valueType: 'number' as const, category: 'credits', descriptionFr: 'Jours avant expiration des crédits bonus', descriptionEn: 'Days before bonus credits expire' },
  { key: 'promo_expiry_days', value: '30', valueType: 'number' as const, category: 'credits', descriptionFr: 'Jours avant expiration des crédits promo', descriptionEn: 'Days before promo credits expire' },
  { key: 'expiration_warning_days', value: '[7, 1]', valueType: 'json' as const, category: 'credits', descriptionFr: 'Jours d\'avertissement avant expiration', descriptionEn: 'Warning days before expiration' },
  { key: 'first_purchase_bonus', value: '100', valueType: 'number' as const, category: 'credits', descriptionFr: 'Bonus crédits sur premier achat', descriptionEn: 'Bonus credits on first purchase' },
  { key: 'four_eyes_threshold', value: '1000', valueType: 'number' as const, category: 'credits', descriptionFr: 'Seuil de crédits nécessitant approbation 4 yeux', descriptionEn: 'Credit threshold requiring 4-eyes approval' },

  // ── Pricing ──
  { key: 'min_margin_multiplier', value: '1.6', valueType: 'number' as const, category: 'pricing', descriptionFr: 'Multiplicateur minimum de marge', descriptionEn: 'Minimum margin multiplier' },
  { key: 'usd_to_xaf_rate', value: '650', valueType: 'number' as const, category: 'pricing', descriptionFr: 'Taux de change USD/XAF', descriptionEn: 'USD to XAF exchange rate' },

  // ── MoMo ──
  { key: 'momo_fee_pct', value: '0.015', valueType: 'number' as const, category: 'momo', descriptionFr: 'Pourcentage de frais Mobile Money', descriptionEn: 'Mobile money fee percentage' },
  { key: 'momo_absorb_below_xaf', value: '5000', valueType: 'number' as const, category: 'momo', descriptionFr: 'Absorber les frais MoMo en dessous de (FCFA)', descriptionEn: 'Absorb MoMo fees below (XAF)' },
  { key: 'momo_split_threshold_xaf', value: '6500', valueType: 'number' as const, category: 'momo', descriptionFr: 'Seuil de partage des frais MoMo (FCFA)', descriptionEn: 'MoMo fee split threshold (XAF)' },
  { key: 'momo_split_ratio', value: '0.5', valueType: 'number' as const, category: 'momo', descriptionFr: 'Ratio de partage des frais MoMo', descriptionEn: 'MoMo fee split ratio' },

  // ── Referral ──
  { key: 'referrer_bonus_credits', value: '100', valueType: 'number' as const, category: 'referral', descriptionFr: 'Bonus crédits pour le parrain', descriptionEn: 'Referrer bonus credits' },
  { key: 'referee_bonus_credits', value: '50', valueType: 'number' as const, category: 'referral', descriptionFr: 'Bonus crédits pour le filleul', descriptionEn: 'Referee bonus credits' },
  { key: 'referrer_commission_pct', value: '5', valueType: 'number' as const, category: 'referral', descriptionFr: 'Pourcentage de commission parrainage', descriptionEn: 'Referral commission percentage' },
  { key: 'referral_commission_purchases', value: '3', valueType: 'number' as const, category: 'referral', descriptionFr: 'Nombre d\'achats commissionnés', descriptionEn: 'Number of commissioned purchases' },
  { key: 'max_referral_earnings', value: '10000', valueType: 'number' as const, category: 'referral', descriptionFr: 'Gains de parrainage maximum', descriptionEn: 'Maximum referral earnings' },

  // ── Fraud ──
  { key: 'max_verifications_per_hour', value: '50', valueType: 'number' as const, category: 'fraud', descriptionFr: 'Max vérifications par heure', descriptionEn: 'Max verifications per hour' },
  { key: 'rate_limit_per_hour', value: '10', valueType: 'number' as const, category: 'fraud', descriptionFr: 'Limite de débit par heure après détection', descriptionEn: 'Rate limit per hour after detection' },
  { key: 'max_consecutive_refunds', value: '3', valueType: 'number' as const, category: 'fraud', descriptionFr: 'Max remboursements consécutifs', descriptionEn: 'Max consecutive refunds' },
  { key: 'cancel_rate_flag_pct', value: '40', valueType: 'number' as const, category: 'fraud', descriptionFr: 'Taux d\'annulation déclenchant le signalement (%)', descriptionEn: 'Cancel rate triggering flag (%)' },
  { key: 'soft_ban_after_failures', value: '10', valueType: 'number' as const, category: 'fraud', descriptionFr: 'Blocage temp. après N échecs', descriptionEn: 'Soft ban after N failures' },
  { key: 'soft_ban_duration_hours', value: '1', valueType: 'number' as const, category: 'fraud', descriptionFr: 'Durée du blocage temporaire (heures)', descriptionEn: 'Soft ban duration (hours)' },
  { key: 'geo_anomaly_countries_24h', value: '3', valueType: 'number' as const, category: 'fraud', descriptionFr: 'Seuil pays différents en 24h', descriptionEn: 'Different countries threshold in 24h' },

  // ── Admin KPIs ──
  { key: 'arpu_credits_target', value: '500', valueType: 'number' as const, category: 'admin', descriptionFr: 'Cible RMPU en crédits', descriptionEn: 'ARPU credits target' },
  { key: 'arpu_xaf_target', value: '4000', valueType: 'number' as const, category: 'admin', descriptionFr: 'Cible RMPU en FCFA', descriptionEn: 'ARPU XAF target' },
  { key: 'clv_xaf_target', value: '35000', valueType: 'number' as const, category: 'admin', descriptionFr: 'Cible VVC en FCFA', descriptionEn: 'CLV XAF target' },
  { key: 'credit_velocity_target_days', value: '7', valueType: 'number' as const, category: 'admin', descriptionFr: 'Vélocité cible (jours achat→consommation)', descriptionEn: 'Target velocity (days purchase→consumption)' },
  { key: 'margin_alert_below', value: '0.4', valueType: 'number' as const, category: 'admin', descriptionFr: 'Alerte marge en dessous de', descriptionEn: 'Margin alert below' },
  { key: 'daily_spend_alert_multiplier', value: '1.2', valueType: 'number' as const, category: 'admin', descriptionFr: 'Multiplicateur d\'alerte dépenses quotidiennes', descriptionEn: 'Daily spend alert multiplier' },
  { key: 'provider_error_rate_alert', value: '0.15', valueType: 'number' as const, category: 'admin', descriptionFr: 'Alerte taux d\'erreur fournisseur', descriptionEn: 'Provider error rate alert' },
]

export async function seedConfig() {
  for (const config of configs) {
    await db
      .insert(platformConfig)
      .values({
        key: config.key,
        value: config.value,
        valueType: config.valueType,
        category: config.category,
        descriptionFr: config.descriptionFr,
        descriptionEn: config.descriptionEn,
      })
      .onConflictDoNothing()
  }
  console.log(`✅ Seeded ${configs.length} platform config entries`)
}
3.2 seed/seed-packages.ts
TypeScript

import { db } from '../client'
import { creditPackage } from '../schema'
import { nanoid } from 'nanoid'

const packages = [
  { slug: 'starter', nameFr: 'Débutant', nameEn: 'Starter', credits: 500, priceXaf: 1500, bonusPct: 0, label: null, sortOrder: 1 },
  { slug: 'basic', nameFr: 'Basique', nameEn: 'Basic', credits: 1000, priceXaf: 2750, bonusPct: 5, label: null, sortOrder: 2 },
  { slug: 'popular', nameFr: 'Populaire', nameEn: 'Popular', credits: 2500, priceXaf: 6500, bonusPct: 10, label: 'PLUS_POPULAIRE', sortOrder: 3 },
  { slug: 'value', nameFr: 'Valeur', nameEn: 'Value', credits: 5000, priceXaf: 12000, bonusPct: 15, label: 'MEILLEUR_RAPPORT', sortOrder: 4 },
  { slug: 'pro', nameFr: 'Pro', nameEn: 'Pro', credits: 10000, priceXaf: 22000, bonusPct: 20, label: null, sortOrder: 5 },
  { slug: 'business', nameFr: 'Business', nameEn: 'Business', credits: 25000, priceXaf: 50000, bonusPct: 30, label: null, sortOrder: 6 },
  { slug: 'enterprise', nameFr: 'Entreprise', nameEn: 'Enterprise', credits: 50000, priceXaf: 90000, bonusPct: 35, label: 'POUR_EQUIPES', sortOrder: 7 },
]

export async function seedPackages() {
  for (const p of packages) {
    await db
      .insert(creditPackage)
      .values({ id: nanoid(), ...p })
      .onConflictDoNothing()
  }
  console.log(`✅ Seeded ${packages.length} credit packages`)
}
3.3 seed/seed-services.ts
TypeScript

import { db } from '../client'
import { service, serviceCountryPrice } from '../schema'
import { nanoid } from 'nanoid'

const services = [
  { code: 'whatsapp', apiCode: 'wa', nameFr: 'WhatsApp', nameEn: 'WhatsApp', category: 'high_demand' as const, defaultPrice: 120, defaultFloor: 80 },
  { code: 'telegram', apiCode: 'tg', nameFr: 'Telegram', nameEn: 'Telegram', category: 'medium_demand' as const, defaultPrice: 80, defaultFloor: 50 },
  { code: 'google', apiCode: 'go', nameFr: 'Google', nameEn: 'Google', category: 'high_demand' as const, defaultPrice: 150, defaultFloor: 100 },
  { code: 'facebook', apiCode: 'fb', nameFr: 'Facebook', nameEn: 'Facebook', category: 'medium_demand' as const, defaultPrice: 100, defaultFloor: 70 },
  { code: 'tiktok', apiCode: 'tk', nameFr: 'TikTok', nameEn: 'TikTok', category: 'low_demand' as const, defaultPrice: 70, defaultFloor: 40 },
]

const countryPrices = [
  // WhatsApp
  { serviceCode: 'whatsapp', countryCode: 'CM', price: 120, floor: 80, baselineUsd: '0.12' },
  { serviceCode: 'whatsapp', countryCode: 'US', price: 350, floor: 200, baselineUsd: '0.35' },
  { serviceCode: 'whatsapp', countryCode: 'IN', price: 80, floor: 40, baselineUsd: '0.06' },
  { serviceCode: 'whatsapp', countryCode: 'GB', price: 300, floor: 180, baselineUsd: '0.30' },
  // Telegram
  { serviceCode: 'telegram', countryCode: 'CM', price: 80, floor: 50, baselineUsd: '0.08' },
  { serviceCode: 'telegram', countryCode: 'US', price: 250, floor: 150, baselineUsd: '0.25' },
  { serviceCode: 'telegram', countryCode: 'IN', price: 60, floor: 30, baselineUsd: '0.04' },
  // Google
  { serviceCode: 'google', countryCode: 'CM', price: 150, floor: 100, baselineUsd: '0.12' },
  { serviceCode: 'google', countryCode: 'US', price: 400, floor: 250, baselineUsd: '0.45' },
  { serviceCode: 'google', countryCode: 'IN', price: 100, floor: 60, baselineUsd: '0.08' },
  // Facebook
  { serviceCode: 'facebook', countryCode: 'CM', price: 100, floor: 70, baselineUsd: '0.08' },
  { serviceCode: 'facebook', countryCode: 'US', price: 300, floor: 180, baselineUsd: '0.30' },
  { serviceCode: 'facebook', countryCode: 'IN', price: 70, floor: 40, baselineUsd: '0.05' },
  // TikTok
  { serviceCode: 'tiktok', countryCode: 'CM', price: 70, floor: 40, baselineUsd: '0.05' },
  { serviceCode: 'tiktok', countryCode: 'US', price: 200, floor: 100, baselineUsd: '0.15' },
  { serviceCode: 'tiktok', countryCode: 'ID', price: 50, floor: 25, baselineUsd: '0.03' },
]

export async function seedServices() {
  const serviceIdMap: Record<string, string> = {}

  for (const s of services) {
    const id = nanoid()
    serviceIdMap[s.code] = id
    await db
      .insert(service)
      .values({
        id,
        code: s.code,
        apiCode: s.apiCode,
        nameFr: s.nameFr,
        nameEn: s.nameEn,
        category: s.category,
        defaultPriceCredits: s.defaultPrice,
        defaultFloorCredits: s.defaultFloor,
      })
      .onConflictDoNothing()
  }

  for (const cp of countryPrices) {
    const serviceId = serviceIdMap[cp.serviceCode]
    if (!serviceId) continue
    await db
      .insert(serviceCountryPrice)
      .values({
        id: nanoid(),
        serviceId,
        countryCode: cp.countryCode,
        priceCredits: cp.price,
        floorCredits: cp.floor,
        baselineWholesaleUsd: cp.baselineUsd,
      })
      .onConflictDoNothing()
  }

  console.log(`✅ Seeded ${services.length} services, ${countryPrices.length} country prices`)
}
(Similar seeds exist for providers, VIP tiers, agent tiers, and fraud rules — following the exact same pattern.)

PART 4 — SERVICE LAYER (Business Logic)
4.0 Complete File Structure
text

src/
├── db/
│   ├── schema/           (14 files — see Part 2)
│   ├── seed/             (8 files — see Part 3)
│   ├── client.ts         ← Drizzle client instance
│   └── migrations/       ← Auto-generated
│
├── lib/
│   ├── id.ts             ← nanoid/cuid ID generator
│   ├── crypto.ts         ← encrypt/decrypt API keys
│   └── errors.ts         ← Custom error classes
│
├── services/
│   ├── config.service.ts         ← Load DB config, cache, typed getters
│   ├── credit.service.ts         ← Purchase, hold, debit, refund, expire, balance
│   ├── pricing.service.ts        ← Dynamic pricing, margin, floor calculation
│   ├── activation.service.ts     ← SMS activation orchestration (state machine)
│   ├── provider.service.ts       ← Multi-provider routing, scoring, API calls
│   ├── payment.service.ts        ← MoMo/Orange/card integration
│   ├── fraud.service.ts          ← Signal evaluation, event creation
│   ├── referral.service.ts       ← Referral signup, commission tracking
│   ├── promo.service.ts          ← Code validation, application
│   ├── agent.service.ts          ← Tier calculation, sub-user mgmt
│   ├── vip.service.ts            ← Subscription mgmt, monthly bonus
│   ├── admin.service.ts          ← Audit logging, adjustments, approvals
│   ├── report.service.ts         ← KPI aggregation, report generation
│   ├── notification.service.ts   ← SMS/push/email notifications
│   └── segment.service.ts        ← User segmentation cron
│
├── providers/                     ← Provider API adapters
│   ├── types.ts                   ← Shared adapter interfaces
│   ├── grizzly-sms.adapter.ts
│   ├── sms-activate.adapter.ts
│   ├── five-sim.adapter.ts
│   └── sms-man.adapter.ts
│
├── server/
│   ├── api/
│   │   ├── client/
│   │   │   ├── credits/
│   │   │   │   ├── packages.get.ts       ← GET  /api/client/credits/packages
│   │   │   │   ├── purchase.post.ts      ← POST /api/client/credits/purchase
│   │   │   │   ├── balance.get.ts        ← GET  /api/client/credits/balance
│   │   │   │   └── history.get.ts        ← GET  /api/client/credits/history
│   │   │   ├── services/
│   │   │   │   ├── list.get.ts           ← GET  /api/client/services
│   │   │   │   └── prices.get.ts         ← GET  /api/client/services/:code/prices
│   │   │   ├── activations/
│   │   │   │   ├── request.post.ts       ← POST /api/client/activations/request
│   │   │   │   ├── [id].get.ts           ← GET  /api/client/activations/:id (poll)
│   │   │   │   ├── [id].cancel.post.ts   ← POST /api/client/activations/:id/cancel
│   │   │   │   └── history.get.ts        ← GET  /api/client/activations/history
│   │   │   ├── referrals/
│   │   │   │   ├── code.get.ts           ← GET  /api/client/referrals/code
│   │   │   │   └── stats.get.ts          ← GET  /api/client/referrals/stats
│   │   │   ├── promo/
│   │   │   │   └── apply.post.ts         ← POST /api/client/promo/apply
│   │   │   └── profile/
│   │   │       └── settings.ts           ← GET/PUT /api/client/profile
│   │   │
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   │   ├── overview.get.ts       ← GET  /api/admin/dashboard/overview
│   │   │   │   └── revenue.get.ts        ← GET  /api/admin/dashboard/revenue
│   │   │   ├── credits/
│   │   │   │   ├── packages.ts           ← CRUD /api/admin/credits/packages
│   │   │   │   ├── adjust.post.ts        ← POST /api/admin/credits/adjust
│   │   │   │   └── approvals.ts          ← GET/POST /api/admin/credits/approvals
│   │   │   ├── users/
│   │   │   │   ├── list.get.ts
│   │   │   │   ├── [id].get.ts
│   │   │   │   └── [id].actions.post.ts  ← suspend, unsuspend, force-kyc
│   │   │   ├── services/
│   │   │   │   ├── catalog.ts            ← CRUD /api/admin/services
│   │   │   │   ├── pricing.ts            ← CRUD /api/admin/services/:id/pricing
│   │   │   │   └── dynamic-rules.ts      ← CRUD /api/admin/services/dynamic-rules
│   │   │   ├── providers/
│   │   │   │   ├── list.get.ts
│   │   │   │   ├── health.get.ts
│   │   │   │   └── [id].config.put.ts
│   │   │   ├── promotions/
│   │   │   │   └── codes.ts              ← CRUD /api/admin/promotions/codes
│   │   │   ├── agents/
│   │   │   │   ├── list.get.ts
│   │   │   │   └── tiers.ts              ← CRUD /api/admin/agents/tiers
│   │   │   ├── fraud/
│   │   │   │   ├── events.get.ts
│   │   │   │   ├── events.[id].resolve.post.ts
│   │   │   │   └── rules.ts             ← CRUD /api/admin/fraud/rules
│   │   │   ├── reports/
│   │   │   │   └── generate.post.ts
│   │   │   ├── config/
│   │   │   │   └── settings.ts           ← GET/PUT /api/admin/config
│   │   │   └── audit/
│   │   │       └── logs.get.ts
│   │   │
│   │   └── webhooks/
│   │       ├── momo.post.ts              ← MTN MoMo callback
│   │       ├── orange.post.ts            ← Orange Money callback
│   │       └── provider-callback.post.ts ← Provider SMS callback (if push)
│   │
│   ├── middleware/
│   │   ├── auth.ts                       ← Session validation
│   │   ├── admin-guard.ts                ← Role check (admin/super_admin)
│   │   ├── rate-limit.ts                 ← Per-user rate limiting
│   │   └── fraud-check.ts               ← Pre-request fraud evaluation
│   │
│   └── jobs/                             ← Background jobs (pg-boss/BullMQ)
│       ├── expire-credits.job.ts         ← Cron: expire bonus/promo lots
│       ├── expire-holds.job.ts           ← Cron: release expired holds
│       ├── poll-provider-prices.job.ts   ← Cron: update provider costs
│       ├── health-check-providers.job.ts ← Cron: ping provider APIs
│       ├── segment-users.job.ts          ← Cron: recalculate user segments
│       ├── vip-monthly-bonus.job.ts      ← Cron: grant VIP monthly bonus
│       ├── expiration-warnings.job.ts    ← Cron: send expiration notifications
│       ├── agent-tier-recalc.job.ts      ← Cron: recalculate agent tiers
│       └── daily-report.job.ts           ← Cron: generate and email daily report
│
├── app/                                   ← Frontend (Next.js App Router or Nuxt)
│   │
│   └── admin/
│       ├── layout.tsx                     ← Admin sidebar + header
│       ├── dashboard/
│       │   └── page.tsx                   ← Revenue overview, KPIs, charts
│       ├── revenue/
│       │   └── page.tsx                   ← Detailed margin analysis, trends
│       ├── credits/
│       │   ├── packages/
│       │   │   └── page.tsx               ← CRUD package editor table
│       │   ├── adjustments/
│       │   │   └── page.tsx               ← Manual adjustment + approval queue
│       │   └── economy/
│       │       └── page.tsx               ← Breakage, velocity, lot health
│       ├── users/
│       │   ├── page.tsx                   ← User list with search, filter, segment
│       │   └── [id]/
│       │       └── page.tsx               ← Full user profile (maquette from report)
│       ├── services/
│       │   ├── page.tsx                   ← Service catalog editor
│       │   └── pricing/
│       │       └── page.tsx               ← Country pricing + dynamic rules
│       ├── providers/
│       │   └── page.tsx                   ← Provider health monitor
│       ├── promotions/
│       │   └── page.tsx                   ← Promo code manager
│       ├── agents/
│       │   └── page.tsx                   ← Agent list + tier config
│       ├── fraud/
│       │   └── page.tsx                   ← Fraud events + rule config
│       ├── reports/
│       │   └── page.tsx                   ← Report generator (financial, regulatory)
│       ├── config/
│       │   └── page.tsx                   ← Platform config editor
│       └── audit/
│           └── page.tsx                   ← Audit log viewer
4.1 services/config.service.ts
TypeScript

import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { platformConfig } from '@/db/schema'

// In-memory cache — invalidated on admin update
let configCache: Map<string, { value: string; type: string }> | null = null

export class ConfigService {
  static async loadAll(): Promise<Map<string, { value: string; type: string }>> {
    if (configCache) return configCache

    const rows = await db.select().from(platformConfig)
    const map = new Map<string, { value: string; type: string }>()
    for (const row of rows) {
      map.set(row.key, { value: row.value, type: row.valueType })
    }
    configCache = map
    return map
  }

  static invalidateCache() {
    configCache = null
  }

  static async getNumber(key: string): Promise<number> {
    const map = await this.loadAll()
    const entry = map.get(key)
    if (!entry) throw new Error(`Config key not found: ${key}`)
    return parseFloat(entry.value)
  }

  static async getString(key: string): Promise<string> {
    const map = await this.loadAll()
    const entry = map.get(key)
    if (!entry) throw new Error(`Config key not found: ${key}`)
    return entry.value
  }

  static async getJson<T = unknown>(key: string): Promise<T> {
    const map = await this.loadAll()
    const entry = map.get(key)
    if (!entry) throw new Error(`Config key not found: ${key}`)
    return JSON.parse(entry.value) as T
  }

  static async getBoolean(key: string): Promise<boolean> {
    const map = await this.loadAll()
    const entry = map.get(key)
    if (!entry) throw new Error(`Config key not found: ${key}`)
    return entry.value === 'true'
  }

  static async update(key: string, value: string, adminId: string): Promise<void> {
    await db
      .update(platformConfig)
      .set({ value, updatedBy: adminId })
      .where(eq(platformConfig.key, key))
    this.invalidateCache()
  }

  // ── Typed convenience getters matching the economics model ──

  static async getCreditValueXaf(): Promise<number> {
    return this.getNumber('credit_value_xaf')
  }

  static async getUsdToXafRate(): Promise<number> {
    return this.getNumber('usd_to_xaf_rate')
  }

  static async getMinMarginMultiplier(): Promise<number> {
    return this.getNumber('min_margin_multiplier')
  }

  static async getBonusExpiryDays(): Promise<number> {
    return this.getNumber('bonus_expiry_days')
  }

  static async getPromoExpiryDays(): Promise<number> {
    return this.getNumber('promo_expiry_days')
  }

  static async getFirstPurchaseBonus(): Promise<number> {
    return this.getNumber('first_purchase_bonus')
  }

  static async getFourEyesThreshold(): Promise<number> {
    return this.getNumber('four_eyes_threshold')
  }

  static async getMomoFeePct(): Promise<number> {
    return this.getNumber('momo_fee_pct')
  }

  static async getMomoAbsorbBelowXaf(): Promise<number> {
    return this.getNumber('momo_absorb_below_xaf')
  }

  static async getReferrerBonusCredits(): Promise<number> {
    return this.getNumber('referrer_bonus_credits')
  }

  static async getRefereeBonusCredits(): Promise<number> {
    return this.getNumber('referee_bonus_credits')
  }

  static async getReferralCommissionPct(): Promise<number> {
    return this.getNumber('referrer_commission_pct')
  }

  static async getMaxReferralEarnings(): Promise<number> {
    return this.getNumber('max_referral_earnings')
  }
}
4.2 services/credit.service.ts
TypeScript

import { and, asc, eq, gt, isNull, or, sql, desc } from 'drizzle-orm'
import { db } from '@/db/client'
import {
  creditWallet,
  creditLot,
  creditTransaction,
  creditHold,
  creditPurchase,
  creditPackage,
} from '@/db/schema'
import { ConfigService } from './config.service'
import { generateId } from '@/lib/id'

type CreditType = 'base' | 'bonus' | 'promotional'
const SPEND_ORDER: CreditType[] = ['promotional', 'bonus', 'base']

export class CreditService {
  // ══════════════ WALLET MANAGEMENT ══════════════

  /** Ensure wallet exists for user (create on first access) */
  static async getOrCreateWallet(userId: string) {
    const existing = await db.query.creditWallet.findFirst({
      where: eq(creditWallet.userId, userId),
    })
    if (existing) return existing

    const id = generateId()
    const [wallet] = await db
      .insert(creditWallet)
      .values({ id, userId })
      .returning()
    return wallet!
  }

  /** Get current balance breakdown */
  static async getBalance(userId: string) {
    const wallet = await this.getOrCreateWallet(userId)
    return {
      base: wallet.baseBalance,
      bonus: wallet.bonusBalance,
      promo: wallet.promoBalance,
      total: wallet.baseBalance + wallet.bonusBalance + wallet.promoBalance,
      totalPurchased: wallet.totalPurchased,
      totalConsumed: wallet.totalConsumed,
    }
  }

  // ══════════════ CREDIT PURCHASE ══════════════

  /** Process a confirmed credit purchase — creates lots, updates wallet, logs txns */
  static async processPurchase(purchaseId: string): Promise<void> {
    const purchase = await db.query.creditPurchase.findFirst({
      where: eq(creditPurchase.id, purchaseId),
      with: { package: true },
    })
    if (!purchase || purchase.status !== 'confirmed') {
      throw new Error('Purchase not found or not in confirmed status')
    }

    const wallet = await this.getOrCreateWallet(purchase.userId)
    const bonusExpiryDays = await ConfigService.getBonusExpiryDays()

    await db.transaction(async (tx) => {
      // 1. Create BASE credit lot (never expires)
      const baseLotId = generateId()
      await tx.insert(creditLot).values({
        id: baseLotId,
        walletId: wallet.id,
        creditType: 'base',
        initialAmount: purchase.creditsBase,
        remainingAmount: purchase.creditsBase,
        expiresAt: null,
      })

      // 2. Log base transaction
      const baseTxnId = generateId()
      await tx.insert(creditTransaction).values({
        id: baseTxnId,
        userId: purchase.userId,
        walletId: wallet.id,
        type: 'purchase',
        creditType: 'base',
        amount: purchase.creditsBase,
        balanceAfter: wallet.baseBalance + purchase.creditsBase + wallet.bonusBalance + wallet.promoBalance,
        purchaseId: purchase.id,
        lotId: baseLotId,
        revenueXaf: String(purchase.priceXaf),
      })

      // 3. Create BONUS credit lot (if any, with expiration)
      let bonusTxnId: string | null = null
      if (purchase.creditsBonus > 0) {
        const bonusLotId = generateId()
        const expiresAt = new Date(Date.now() + bonusExpiryDays * 24 * 3600 * 1000)

        await tx.insert(creditLot).values({
          id: bonusLotId,
          walletId: wallet.id,
          creditType: 'bonus',
          initialAmount: purchase.creditsBonus,
          remainingAmount: purchase.creditsBonus,
          expiresAt,
        })

        bonusTxnId = generateId()
        await tx.insert(creditTransaction).values({
          id: bonusTxnId,
          userId: purchase.userId,
          walletId: wallet.id,
          type: 'purchase',
          creditType: 'bonus',
          amount: purchase.creditsBonus,
          balanceAfter: wallet.baseBalance + purchase.creditsBase + wallet.bonusBalance + purchase.creditsBonus + wallet.promoBalance,
          purchaseId: purchase.id,
          lotId: bonusLotId,
        })
      }

      // 4. Update wallet balances
      await tx
        .update(creditWallet)
        .set({
          baseBalance: sql`${creditWallet.baseBalance} + ${purchase.creditsBase}`,
          bonusBalance: sql`${creditWallet.bonusBalance} + ${purchase.creditsBonus}`,
          totalPurchased: sql`${creditWallet.totalPurchased} + ${purchase.totalCredits}`,
        })
        .where(eq(creditWallet.id, wallet.id))

      // 5. Mark purchase as credited
      await tx
        .update(creditPurchase)
        .set({ status: 'credited', creditedAt: new Date() })
        .where(eq(creditPurchase.id, purchaseId))

      // 6. Check if first purchase → grant bonus
      if (purchase.isFirstPurchase) {
        const firstBonus = await ConfigService.getFirstPurchaseBonus()
        if (firstBonus > 0) {
          await this.grantBonusCreditsInTx(
            tx,
            purchase.userId,
            wallet.id,
            firstBonus,
            'bonus_first_purchase',
            'Premier achat — bonus de bienvenue'
          )
        }
      }
    })
  }

  // ══════════════ HOLD / DEBIT / REFUND ══════════════

  /** Reserve credits for an SMS activation (FIFO by expiry within spend order) */
  static async holdCredits(
    userId: string,
    amount: number,
    holdTimeMinutes: number
  ): Promise<{ holdId: string; creditType: CreditType; lotId: string }> {
    const wallet = await this.getOrCreateWallet(userId)
    const now = new Date()

    // Find the best lot to hold from (FIFO by type priority, then expiry)
    const availableLots = await db
      .select()
      .from(creditLot)
      .where(
        and(
          eq(creditLot.walletId, wallet.id),
          gt(creditLot.remainingAmount, 0),
          eq(creditLot.isExpired, false),
          or(
            isNull(creditLot.expiresAt),
            gt(creditLot.expiresAt, now)
          )
        )
      )
      .orderBy(
        sql`CASE ${creditLot.creditType}
          WHEN 'promotional' THEN 1
          WHEN 'bonus' THEN 2
          WHEN 'base' THEN 3
        END`,
        asc(creditLot.expiresAt)
      )

    // Find the first lot with enough balance (no splitting across lots for simplicity)
    const targetLot = availableLots.find((lot) => lot.remainingAmount >= amount)
    if (!targetLot) {
      throw new Error('INSUFFICIENT_CREDITS')
    }

    const holdId = generateId()
    const expiresAt = new Date(now.getTime() + holdTimeMinutes * 60 * 1000)

    await db.transaction(async (tx) => {
      // Reduce lot remaining
      await tx
        .update(creditLot)
        .set({ remainingAmount: sql`${creditLot.remainingAmount} - ${amount}` })
        .where(eq(creditLot.id, targetLot.id))

      // Create hold record
      await tx.insert(creditHold).values({
        id: holdId,
        userId,
        walletId: wallet.id,
        amount,
        creditType: targetLot.creditType,
        lotId: targetLot.id,
        state: 'held',
        expiresAt,
      })

      // Update wallet balance
      const balanceField =
        targetLot.creditType === 'base'
          ? creditWallet.baseBalance
          : targetLot.creditType === 'bonus'
            ? creditWallet.bonusBalance
            : creditWallet.promoBalance

      await tx
        .update(creditWallet)
        .set({ [balanceField.name]: sql`${balanceField} - ${amount}` })
        .where(eq(creditWallet.id, wallet.id))
    })

    return { holdId, creditType: targetLot.creditType as CreditType, lotId: targetLot.id }
  }

  /** Confirm a hold (SMS received — finalize the debit) */
  static async confirmHold(holdId: string, activationId: string, wholesaleCostUsd: number): Promise<void> {
    const hold = await db.query.creditHold.findFirst({
      where: eq(creditHold.id, holdId),
    })
    if (!hold || hold.state !== 'held') {
      throw new Error('Hold not found or already processed')
    }

    const creditValueXaf = await ConfigService.getCreditValueXaf()
    const revenueXaf = hold.amount * creditValueXaf

    await db.transaction(async (tx) => {
      // Mark hold as debited
      await tx
        .update(creditHold)
        .set({ state: 'debited', debitedAt: new
        