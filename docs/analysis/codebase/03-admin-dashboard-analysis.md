# Rapport d'Analyse : Admin Dashboard (num_zer0)

## Résumé

L'admin dashboard est dans un **état très précoce** (skeleton/stub).
Toutes les pages frontend sont des `export default function Page() { return null }`.
Seules les **routes API backend** sont implémentées.

---

## 1. Structure des Dossiers

```
app/[locale]/(admin)/
  └── admin/
      ├── layout.tsx              ← Layout minimal (juste {children})
      ├── page.tsx                ← Page d'accueil admin (redirection?)
      ├── audit/
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      ├── config/
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      ├── credits/
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      ├── dashboard/
      │   ├── error.tsx
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      ├── finance/
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      ├── fraud/
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      ├── logs/
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      ├── price-rules/
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      ├── providers/
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      ├── services/
      │   ├── [slug]/
      │   │   └── page.tsx
      │   ├── loading.tsx
      │   └── page.tsx            ← STUB (null)
      └── users/
          ├── [id]/
          │   └── page.tsx
          ├── loading.tsx
          └── page.tsx            ← STUB (null)
```

**Total : 13 routes, dont 11 stubs (return null)**

---

## 2. Layout Admin

**Fichier :** `app/[locale]/(admin)/admin/layout.tsx`

```tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
```

**Aucun sidebar, header, navigation, ou breadcrumb.** Le layout est un passe-plat.

---

## 3. Routes API Admin

Toutes les routes API sont dans `app/api/admin/` :

| Fichier | Route HTTP | Statut |
|---------|-----------|--------|
| `app/api/admin/config/route.ts` | `GET /api/admin/config` | ❓ (head vide) |
| `app/api/admin/countries/route.ts` | `GET /api/admin/countries` | ✅ Implémentée |
| `app/api/admin/countries/[iso]/overrides/route.ts` | `GET/PUT` | ❓ (head vide) |
| `app/api/admin/dashboard/route.ts` | `GET /api/admin/dashboard` | ✅ Implémentée |
| `app/api/admin/price-rules/route.ts` | `GET/PUT` | ❓ (head vide) |
| `app/api/admin/providers/route.ts` | `GET /api/admin/providers` | ❓ (head vide) |
| `app/api/admin/providers/[id]/costs/route.ts` | `GET` | ❓ (head vide) |
| `app/api/admin/providers/sync/route.ts` | `POST /api/admin/providers/sync` | ❓ (head vide) |
| `app/api/admin/services/route.ts` | `GET /api/admin/services` | ✅ Implémentée |
| `app/api/admin/services/[slug]/route.ts` | `GET/PUT` | ❓ (head vide) |
| `app/api/admin/services/[slug]/live-prices/route.ts` | `GET` | ❌ (fichier vide 0 bytes) |
| `app/api/admin/users/route.ts` | `GET /api/admin/users` | ✅ Implémentée |
| `app/api/admin/users/[id]/route.ts` | `GET /api/admin/users/[id]` | ❓ (head vide) |

### Routes API Admin Complètement Implémentées (4/14) :

1. **`GET /api/admin/countries`** — Liste des pays avec overrides + statut Grizzly
2. **`GET /api/admin/dashboard`** — KPIs via `ReportService`
3. **`GET /api/admin/services`** — Liste des services avec stats price_rule
4. **`GET /api/admin/users`** — Liste des users avec pagination/recherche

---

## 4. Server Actions Admin

**Fichier :** `src/actions/admin.action.ts`

| Action | Fonction | Statut |
|--------|----------|--------|
| `updateUserAccountStatusAction` | Bannir/débannir user | ✅ |
| `manualCreditAdjustmentAction` | Ajouter crédits manuellement | ✅ |
| `updatePlatformConfigAction` | Mettre à jour config plateforme | ✅ |
| `syncProviderDataAction` | Sync provider mappings/balance | ✅ |
| `refundPurchaseAction` | Rembourser un achat | ✅ |
| `getAdminDashboardStatsAction` | Stats dashboard (users, revenue, fraud) | ✅ |
| `resolveFraudEventAction` | Résoudre un événement fraud | ✅ |
| `updatePriceRuleAction` | Mettre à jour une règle de prix | ✅ |

---

## 5. Admin Service (Backend)

**Fichier :** `src/services/admin.service.ts`

Présent dans `src/services/` mais son contenu n'est pas analysé en détail.

---

## 6. Composants Admin

**Aucun composant admin trouvé** dans `src/component/`. Les pages admin sont vides,
donc il n'y a pas de sidebar, header, table, ou formulaire admin.

---

## 7. Ce Qui Manque / Doit Être Développé

### 🔴 Critique — Pages Frontend (toutes sont des stubs)

| Page | Priorité |
|------|----------|
| Dashboard (/admin) | Haute — KPIs, graphiques |
| Utilisateurs (/admin/users) | Haute — liste + détails |
| Crédits (/admin/credits) | Haute — transactions, ajustements |
| Finance (/admin/finance) | Haute — revenus, remboursements |
| Services (/admin/services) | Haute — liste avec prix pays |
| Providers (/admin/providers) | Moyenne — status API sync |
| Price Rules (/admin/price-rules) | Haute — gestion overrides |
| Configuration (/admin/config) | Moyenne — config plateforme |
| Fraud (/admin/fraud) | Moyenne — événements fraude |
| Audit (/admin/audit) | Basse — logs d'audit |
| Logs (/admin/logs) | Basse — logs serveur |

### 🟡 Important — Infrastructure Manquante

1. **Layout admin avec sidebar** — Actuellement juste `{children}`
2. **Système d'authentification admin** — `requireAdminSession()` existe mais pas de 
   UI de login admin distinct
3. **Formatage de dates/monnaie** — Pas de helpers admin
4. **Pagination/table component** — Pas de DataTable réutilisable

### 🟢 Observations

- Les **server actions** sont bien structurées avec validation Zod
- Les **routes API** utilisent toutes `requireAdminSession()`, rate limiting, 
  et logging structuré
- Le `ReportService` existe dans `src/services/report.service.ts`
- Le schéma de la table `platform_config` est présent

---

## 8. Recommandations pour l'Ordre de Développement

```
Phase 1 (Fondations) :
  - Layout admin avec sidebar + header
  - Dashboard page (stats cards)
  - Navigation entre sections

Phase 2 (Opérationnel) :
  - Users list + detail + actions
  - Services list + country pricing view
  - Credits management
  - Finance overview

Phase 3 (Avancé) :
  - Providers management & sync UI
  - Price rules CRUD
  - Fraud management
  - Configuration

Phase 4 (Monitoring) :
  - Audit logs viewer
  - System logs
  - Webhook logs
```

---

## 9. Fichiers Admin — Liste Complète

### Pages Frontend (13 fichiers)
```
app/[locale]/(admin)/admin/layout.tsx
app/[locale]/(admin)/admin/page.tsx
app/[locale]/(admin)/admin/audit/page.tsx
app/[locale]/(admin)/admin/audit/loading.tsx
app/[locale]/(admin)/admin/config/page.tsx
app/[locale]/(admin)/admin/config/loading.tsx
app/[locale]/(admin)/admin/credits/page.tsx
app/[locale]/(admin)/admin/credits/loading.tsx
app/[locale]/(admin)/admin/dashboard/page.tsx
app/[locale]/(admin)/admin/dashboard/loading.tsx
app/[locale]/(admin)/admin/dashboard/error.tsx
app/[locale]/(admin)/admin/finance/page.tsx
app/[locale]/(admin)/admin/finance/loading.tsx
app/[locale]/(admin)/admin/fraud/page.tsx
app/[locale]/(admin)/admin/fraud/loading.tsx
app/[locale]/(admin)/admin/logs/page.tsx
app/[locale]/(admin)/admin/logs/loading.tsx
app/[locale]/(admin)/admin/price-rules/page.tsx
app/[locale]/(admin)/admin/price-rules/loading.tsx
app/[locale]/(admin)/admin/providers/page.tsx
app/[locale]/(admin)/admin/providers/loading.tsx
app/[locale]/(admin)/admin/services/page.tsx
app/[locale]/(admin)/admin/services/loading.tsx
app/[locale]/(admin)/admin/services/[slug]/page.tsx
app/[locale]/(admin)/admin/users/page.tsx
app/[locale]/(admin)/admin/users/loading.tsx
app/[locale]/(admin)/admin/users/[id]/page.tsx
```

### Routes API (14 fichiers)
```
app/api/admin/config/route.ts
app/api/admin/countries/route.ts
app/api/admin/countries/[iso]/overrides/route.ts
app/api/admin/dashboard/route.ts
app/api/admin/price-rules/route.ts
app/api/admin/providers/route.ts
app/api/admin/providers/[id]/costs/route.ts
app/api/admin/providers/sync/route.ts
app/api/admin/services/route.ts
app/api/admin/services/[slug]/route.ts
app/api/admin/services/[slug]/live-prices/route.ts
app/api/admin/users/route.ts
app/api/admin/users/[id]/route.ts
```

### Services Backend (2 fichiers)
```
src/services/admin.service.ts
src/services/report.service.ts
src/actions/admin.action.ts
```

### Auth
```
src/common/auth/require-admin.server.ts
```
