# Issue: Dashboard Admin Complet — Pilotage intégral de la plateforme

**Date:** 2026-06-05
**Priorité:** Haute
**Statut:** Ouvert
**Composant(s):** `src/components/admin/`, `src/routes/admin.tsx`, `convex/`
**Signalé par:** Utilisateur
**Contrainte:** Fusion des styles UI (CSS vars app + accents landing), mix shadcn + custom, CRUD complet pour modules gestion

---

## Phase 1 — Exploration (sortie des agents)

| Fichier | Intervalle | Rôle dans l'issue |
|---|---|---|
| `C:\Users\pc\num_zer0\src\components\admin\admin-dashboard.tsx` | L1-L357 | Dashboard actuel — base à refactoriser en modules |
| `C:\Users\pc\num_zer0\src\routes\admin.tsx` | L1-L6 | Route admin — doit ajouter `ssr: false` + nouveau layout |
| `C:\Users\pc\num_zer0\convex\analytics.ts` | L24-L90 | `getAnalyticsSummary` — agrège analytics, admin-only |
| `C:\Users\pc\num_zer0\convex\users.ts` | L218-L279 | `getAllUsers` (pattern: getUserIdentity + isAdmin inline), `deleteUser` (pattern: requireAdmin) |
| `C:\Users\pc\num_zer0\convex\purchases.ts` | L46-L56, L77-L240 | `getPurchases` scope user. Pas d'admin query. `validatePromoCode`, `internalGetPromoCode` existent |
| `C:\Users\pc\num_zer0\convex\sms_provider.ts` | L502-L532 | `getMyActivations` scope user. Pas d'admin query |
| `C:\Users\pc\num_zer0\convex\comptabilite.ts` | L148-L223 | `getCompte`, `getMouvements`, `getMyMouvements`. Pas d'admin list queries |
| `C:\Users\pc\num_zer0\convex\lib\auth_helpers.ts` | L3-L17 | `requireAuth` (QueryCtx|MutationCtx) + `requireAdmin` (MutationCtx SEULEMENT) |
| `C:\Users\pc\num_zer0\convex\schema.ts` | L1-L132 | 10 tables. `promoCodes`, `marginOverrides`, `packages` sans fonctions dédiées |
| `C:\Users\pc\num_zer0\convex\margin_tiers.ts` | L1-L48 | `getEffectiveMargin` + `computeDefaultMargin` — logique métier des marges |
| `C:\Users\pc\num_zer0\src\common\ui\` | — | 61 composants shadcn (card, tabs, table, dialog, badge, select, input, skeleton, etc.) |
| `C:\Users\pc\num_zer0\src\components\purchases\hooks\` | — | Patterns React Query: `purchaseKeys` factory, `activationKeys` factory, `onSettled` invalidation |
| `C:\Users\pc\num_zer0\src\components\landing\` | — | Patterns UI: warm-100, #25D366, #F97316, `anim-glow-pulse`, reveal, stagger |
| `C:\Users\pc\num_zer0\src\components\wallet\` | — | Patterns UI app: CSS vars `--sea-ink`, `--surface`, `--line`, glass-morphism |
| `C:\Users\pc\num_zer0\src\global.css` | L1-L109 | CSS variables, thèmes dark/light, Tailwind v4 |
| `C:\Users\pc\num_zer0\src\routes\__root.tsx` | L1-L91 | Root layout: ConvexBetterAuthProvider, beforeLoad avec `getToken()` |

**Agents utilisés:** 4 agents explore (Convex, routes, hooks/queries, UI/shadcn)

---

## Phase 2 — Lecture ciblée (résumé du code lu)

- `admin-dashboard.tsx` (L1-L357): 357 lignes > limite 200. Style dark hardcodé (`#0f0f0f`, `#141414`, `white/5`). 2 onglets inline. Guard admin via `getAccessStatus` client-side. Pas de barrel. Pas de hooks dédiés.
- `auth_helpers.ts` (L3-L17): `requireAdmin` est typé `(ctx: MutationCtx)` — PAS utilisable dans les queries. Les queries admin doivent utiliser le pattern manuel: `getUserIdentity()` + `db.query('users').withIndex('by_betterAuthUserId')` + check `isAdmin`.
- `getAllUsers` (L218-237): Pattern exact à suivre pour toutes les nouvelles queries admin: pas de `requireAdmin`, vérification manuelle avec messages d'erreur en français.
- `purchases.ts`: `validatePromoCode` (query publique no-auth), `internalGetPromoCode` (internal). `promoCodes` partiellement ici.
- `sms_provider.ts`: `getMyActivations` opt-in auth (retourne `[]` si pas auth). `getActivation` avec ownership check. `syncPrices` admin-only via `internalGetUserByBetterAuthId`.
- `comptabilite.ts`: `creditCompte` augmente le solde, `debitCompte` le diminue. `createPiece` avec `sens` comptable (debit=augmente compte, credit=diminue).
- `purchases/hooks/`: Pattern query key factory (`purchaseKeys.all = ['purchases']`). Toutes les mutations utilisent `onSettled` pour invalidation (pas `onSuccess`/`onError`). `useConvexMutation` pour mutations, `useConvexAction` pour actions.
- `wallet/`: Patterns cards app: `bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)]/50 rounded-2xl`. Typographie: `font-figtree` + CSS vars. Pas de `#0f0f0f` — l'app utilise le système de thème CSS.
- `landing/`: `anim-glow-pulse` sur CTA orange, `anim-float` sur éléments décoratifs, scroll reveal avec `IntersectionObserver`. Palette: warm-100 (bg), dark-900 (text), #25D366 (vert), #F97316 (orange).
- `global.css`: 2 thèmes via `:root` et `[data-theme='dark']`. Variables: `--sea-ink`, `--surface`, `--line`, `--bg-base`, `--foam`, etc. Les composants shadcn utilisent `data-slot` pour le styling.

---

## Phase 3 — Recherche (sources consultées)

- `AGENTS.md` — conventions max 200 lignes, feature folder pattern, barrel exports
- `.agents/skills/tanstack-query-best-practices/` — patterns query descriptors, mutations
- `src/common/ui/` — API des 61 composants shadcn (tous utilisent `data-slot` + `cn()`)
- `src/components/purchases/hooks/` — pattern exact des query keys et mutations
- `convex/lib/auth_helpers.ts` — typage `requireAdmin` vérifié
- `src/global.css` — système de thème et variables CSS
- `src/components/landing/animations.css` — classes d'animation disponibles
- Issues existantes: ISSUE-002 à ISSUE-009 pour les conventions de nommage

---

## Phase 4 — Analyse profonde

### Architecture proposée (corrigée)

```
src/components/admin/
├── index.ts                          # Barrel export
├── admin-layout.tsx                  # Layout principal avec sidebar + header + guard
├── admin-sidebar.tsx                 # Navigation sidebar
├── hooks/
│   ├── index.ts                      # Barrel hooks
│   └── use-admin-queries.ts          # Tous les hooks React Query admin
├── analytics/
│   ├── admin-analytics.tsx           # Onglet analytics (shadcn Tabs + Card)
│   └── analytics-kpi-grid.tsx        # Grille de KPI cards
├── users/
│   ├── admin-users.tsx               # Onglet users (shadcn Table + Dialog)
│   └── user-delete-dialog.tsx        # Dialog confirmation suppression
├── purchases/
│   └── admin-purchases.tsx           # Onglet achats (shadcn Table + Badge)
├── activations/
│   ├── admin-activations.tsx         # Onglet activations (shadcn Table + Badge)
│   └── activation-detail-dialog.tsx  # Détail activation (shadcn Dialog)
├── accounting/
│   ├── admin-accounting.tsx          # Onglet compta (shadcn Table + Tabs)
│   └── compte-detail-dialog.tsx      # Détail compte (shadcn Dialog)
├── promo-codes/
│   ├── admin-promo-codes.tsx         # Onglet codes promo (shadcn Table + Dialog)
│   └── promo-code-form-dialog.tsx    # Formulaire CRUD (shadcn Dialog + Input)
├── margins/
│   ├── admin-margins.tsx             # Onglet marges (shadcn Table + Select + Dialog)
│   └── margin-form-dialog.tsx        # Formulaire CRUD
├── packages/
│   ├── admin-packages.tsx            # Onglet packages (shadcn Table + Dialog)
│   └── package-form-dialog.tsx       # Formulaire CRUD
└── docs/
    ├── CHANGELOG.md
    ├── CONTINUE.md
    └── TODOS.md
```

### Nouvelles fonctions Convex (admin-facing)

**IMPORTANT — `requireAdmin` est typé `MutationCtx` uniquement**: Les queries admin doivent utiliser le pattern manuel (getUserIdentity + lookup + isAdmin check), PAS `requireAdmin`. Les mutations peuvent utiliser `requireAdmin`.

```
convex/purchases.ts:
  - getAllPurchases: query → pattern manuel (getUserIdentity + isAdmin inline), retourne tous les achats order desc

convex/sms_provider.ts:
  - getAllActivations: query → pattern manuel, retourne toutes les activations order desc

convex/comptabilite.ts:
  - getAllComptes: query → pattern manuel, retourne tous les comptes
  - getAllPieces: query → pattern manuel, retourne toutes les pieces order desc (limit 100)

convex/promo_codes.ts (NOUVEAU):
  - list: query → pattern manuel, tous les codes promo
  - create: mutation → requireAdmin, crée un code promo
  - update: mutation → requireAdmin, modifie un code promo
  - delete: mutation → requireAdmin, supprime un code promo

convex/margins.ts (NOUVEAU — note: pas "margin_overrides.ts"):
  - list: query → pattern manuel, toutes les sur-marges
  - create: mutation → requireAdmin, crée une sur-marge
  - update: mutation → requireAdmin, modifie une sur-marge
  - delete: mutation → requireAdmin, supprime une sur-marge

convex/packages.ts (NOUVEAU):
  - list: query → pattern manuel, tous les packages
  - create: mutation → requireAdmin, crée un package
  - update: mutation → requireAdmin, modifie un package
  - delete: mutation → requireAdmin, supprime un package
```

### Style UI fusionné (corrigé)

Le dashboard actuel utilise du dark hardcodé (`#0f0f0f`, `#141414`). L'app utilise un système de thème via CSS variables. La fusion doit utiliser les CSS variables pour assurer la compatibilité dark/light.

| Élément | Source | Classes |
|---|---|---|
| Fond page | App (CSS var) | `bg-[var(--bg-base)]` |
| Cards | App (glass) | `rounded-[18px] bg-[var(--surface)] backdrop-blur-xl border border-[var(--line)]/50 p-5 shadow-[0_26px_75px_rgba(0,0,0,0.42)]` |
| Accents verts | Landing | `text-[#25D366]` (succès, validé, solde positif) |
| Accents orange | Landing | `bg-[#F97316]` (CTA principal, boutons action) |
| Texte titres | Landing | `font-kubo font-bold` (branding) |
| Texte corps | App + Landing | `font-figtree` |
| Badges statuts | shadcn | `<Badge variant="success" />` pour confirmé, `variant="warning"` pour pending, etc. |
| Tables | shadcn | `<Table>` + `<TableHeader>` + `<TableRow>` + `<TableCell>` |
| Tabs navigation | shadcn | `<Tabs>` + `<TabsList>` + `<TabsTrigger>` + `<TabsContent>` |
| Dialogs | shadcn | `<Dialog>` + `<DialogTrigger>` + `<DialogContent>` + `<DialogHeader>` + `<DialogFooter>` |
| Forms CRUD | shadcn + custom | `<Input>`, `<Select>`, `<Switch>` pour actif/inactif |
| Animations | Landing | `anim-glow-pulse` sur CTA admin, `anim-pulse-dot` pour statuts en direct |
| Sidebar | Custom | Style navbar landing adapté: dark, glass, `font-figtree` |

### Pattern Query Keys (à suivre exactement)

```ts
export const adminKeys = {
  all: ['admin'] as const,
  analytics: () => [...adminKeys.all, 'analytics'] as const,
  users: () => [...adminKeys.all, 'users'] as const,
  purchases: () => [...adminKeys.all, 'purchases'] as const,
  activations: () => [...adminKeys.all, 'activations'] as const,
  accounting_: () => [...adminKeys.all, 'accounting'] as const,
  promo_codes: () => [...adminKeys.all, 'promo_codes'] as const,
  margins: () => [...adminKeys.all, 'margins'] as const,
  packages: () => [...adminKeys.all, 'packages'] as const,
}
```

### Pattern Mutations (à suivre exactement)

```ts
export function useDeleteUser() {
  const qc = useQueryClient()
  const mutationFn = useConvexMutation(api.users.deleteUser)
  return useMutation({
    mutationFn,
    onSettled: () => {
      qc.invalidateQueries({ queryKey: adminKeys.users() })
    },
  })
}
```

### Route admin — corrections nécessaires

- Ajouter `ssr: false` (comme `my-space.tsx`) car les queries Convex échouent en SSR
- Pas de `beforeLoad` pour le moment (le guard reste dans le composant)
- La route reste directe enfant de root (pas besoin du layout `(app)`)

### Edge cases (complétés)

- Données vides: chaque module doit gérer l'état "Aucune donnée" avec le pattern app (`font-figtree text-[var(--sea-ink-soft)] text-[18px]`)
- États de chargement: `isLoading` pour chaque query avec spinner ou skeleton
- États d'erreur: `isError` + message d'erreur + bouton retry si pertinent
- Admin non connecté: page "Accès Refusé" avec lien retour
- Admin non-admin: même page (les queries Convex throw, catch dans le composant)
- Confirmations avant delete: pattern `confirm()` ou shadcn `AlertDialog`
- Formatage monétaire: XAF (prix affichés) / USD (soldes comptables). Utiliser `Intl.NumberFormat`
- Dates: `toLocaleDateString('fr-FR')` pattern existant
- Timezone: timestamps Convex en ms, stockés en UTC
- Tables longues: limite 50-100 entrées (pattern existant)
- `requireAdmin` non disponible pour les queries: utiliser le pattern manuel de `getAllUsers`

---

## Phase 5 — Plan complet (steps atomiques)

1. **Step 1** — Nouvelles fonctions Convex admin (partie 1: queries)
   - Fichiers: `convex/purchases.ts`, `convex/sms_provider.ts`, `convex/comptabilite.ts`
   - Actions: Ajouter `getAllPurchases` (query, pattern manuel isAdmin), `getAllActivations` (query, pattern manuel), `getAllComptes` (query), `getAllPieces` (query)
   - Résultat: `api.purchases.getAllPurchases`, `api.sms_provider.getAllActivations`, `api.comptabilite.getAllComptes`, `api.comptabilite.getAllPieces` disponibles

2. **Step 2** — Nouvelles fonctions Convex admin (partie 2: nouveaux fichiers CRUD)
   - Fichiers: `convex/promo_codes.ts` (créer), `convex/margins.ts` (créer), `convex/packages.ts` (créer)
   - Actions: Chaque fichier: `list` (query, pattern manuel), `create` (mutation, requireAdmin), `update` (mutation, requireAdmin), `delete` (mutation, requireAdmin)
   - Résultat: API CRUD complète pour les 3 modules de gestion

3. **Step 3** — Hooks React Query admin
   - Fichiers: `src/components/admin/hooks/use-admin-queries.ts`, `src/components/admin/hooks/index.ts`
   - Actions: Créer `adminKeys` factory, hooks pour chaque module admin (useAdminAnalytics, useAdminUsers, useAdminPurchases, useAdminActivations, useAdminAccountingComptes, useAdminAccountingPieces, useAdminPromoCodes, useAdminMargins, useAdminPackages, useDeleteUser, etc.)
   - Résultat: Tous les hooks admin disponibles, pattern `onSettled` pour les mutations

4. **Step 4** — Layout admin + route
   - Fichiers: `src/components/admin/admin-layout.tsx`, `src/components/admin/admin-sidebar.tsx`, `src/routes/admin.tsx`
   - Actions: Créer layout avec sidebar navigation verticale (8 entrées). Route admin avec `ssr: false`. Guard admin (vérification `isAdmin` client-side). Supprimer l'ancien `admin-dashboard.tsx`
   - Résultat: Navigation admin fonctionnelle avec 8 onglets, thème CSS vars appliqué

5. **Step 5** — Module Analytics
   - Fichiers: `src/components/admin/analytics/admin-analytics.tsx`, `src/components/admin/analytics/analytics-kpi-grid.tsx`
   - Actions: Refactor des analytics actuelles en 2 fichiers. KPI cards avec shadcn Card. Stats appareils/pays avec shadcn Table. Événements récents avec shadcn Badge pour les types d'événements
   - Résultat: Module analytics < 200 lignes/fichier, style fusionné

6. **Step 6** — Module Users
   - Fichiers: `src/components/admin/users/admin-users.tsx`, `src/components/admin/users/user-delete-dialog.tsx`
   - Actions: Table users avec shadcn Table + Badge pour statuts. Dialog suppression avec shadcn AlertDialog
   - Résultat: Module users avec CRUD (delete) + détails

7. **Step 7** — Module Purchases
   - Fichiers: `src/components/admin/purchases/admin-purchases.tsx`
   - Actions: Tableau de tous les achats. Colonnes: Date, User, Montant XAF, Méthode, Statut, Promo. Badge coloré par statut
   - Résultat: Vue complète des transactions

8. **Step 8** — Module Activations
   - Fichiers: `src/components/admin/activations/admin-activations.tsx`, `src/components/admin/activations/activation-detail-dialog.tsx`
   - Actions: Tableau des activations. Colonnes: User, Service, Pays, Statut, Téléphone, Prix, Date. Dialog détail avec timeline complète
   - Résultat: Monitoring des activations SMS en temps réel

9. **Step 9** — Module Comptabilité
   - Fichiers: `src/components/admin/accounting/admin-accounting.tsx`, `src/components/admin/accounting/compte-detail-dialog.tsx`
   - Actions: Deux sous-vues: Comptes (solde, code, libellé) + Écritures (date, libellé, montant, sens). Dialog détail pour un compte avec ses mouvements
   - Résultat: Vue comptable complète

10. **Step 10** — Module Promo Codes (CRUD)
    - Fichiers: `src/components/admin/promo-codes/admin-promo-codes.tsx`, `src/components/admin/promo-codes/promo-code-form-dialog.tsx`
    - Actions: Table avec tous les codes. Dialog création/édition avec shadcn Dialog + Input + Switch. Suppression avec confirmation
    - Résultat: CRUD promo codes fonctionnel

11. **Step 11** — Module Margins (CRUD)
    - Fichiers: `src/components/admin/margins/admin-margins.tsx`, `src/components/admin/margins/margin-form-dialog.tsx`
    - Actions: Table des sur-marges. Dialog création/édition avec Select pays + Select service. Suppression
    - Résultat: CRUD margins fonctionnel

12. **Step 12** — Module Packages (CRUD)
    - Fichiers: `src/components/admin/packages/admin-packages.tsx`, `src/components/admin/packages/package-form-dialog.tsx`
    - Actions: Table des packages. Dialog création/édition avec Input prix, nom, slug. Toggle actif/inactif
    - Résultat: CRUD packages fonctionnel

13. **Step 13** — Barrel + Documentation
    - Fichiers: `src/components/admin/index.ts`, `src/components/admin/docs/CHANGELOG.md`, `docs/CONTINUE.md`, `docs/TODOS.md`
    - Actions: Barrel export, documentation lifecycle complète
    - Résultat: Module admin complet et documenté

---

## Phase 6 — Revue par 2 agents

### Agent 1 (revue code — reanalyse complète)

- ✓ 50+ symboles Convex exportés identifiés avec précision (contre ~53 initialement)
- ✓ `requireAdmin` typage `MutationCtx` uniquement — corrigé dans l'analyse
- ✓ Pattern exact des queries admin: `getAllUsers` comme référence (pas `requireAdmin`)
- ✓ Pattern exact des mutations: `onSettled` pour invalidation
- ✓ 61 composants shadcn dans `common/ui/` avec `data-slot` pattern
- ✓ CSS variables système de thème identifié (pas de couleurs hardcodées)
- ✗ **Correction critique**: L'issue originale disait "57 fonctions" — 50+ est plus précis. Le style "fusionné" doit utiliser les CSS vars de l'app, PAS le dark hardcodé du dashboard actuel.
- ✗ **Correction critique**: L'issue originale disait d'utiliser `requireAdmin` pour les queries admin. C'est IMPOSSIBLE car `requireAdmin` est typé `MutationCtx`. Les queries doivent suivre le pattern manuel de `getAllUsers`.
- ✗ **Correction critique**: L'issue originale suggérait `margin_overrides.ts` comme nom de fichier. Le pattern du projet utilise le nom logique: `margins.ts`.
- ✗ **Amélioration**: La route admin doit avoir `ssr: false` pour éviter les échecs Convex en SSR.

### Agent 2 (revue plan — reanalyse complète)

- ✓ 13 steps atomiques vs 12 initialement — le split Convex en 2 steps est plus logique
- ✓ Architecture dossier-par-module respecte le feature folder pattern
- ✓ Pattern query keys respecté (`adminKeys.all = ['admin']`)
- ✓ Pattern `onSettled` pour toutes les mutations
- ✓ CSS variables pour le thème, shadcn pour la structure, custom pour le branding
- ✗ **Correction**: Step 1 (Convex queries) doit utiliser le pattern manuel isAdmin, PAS requireAdmin
- ✗ **Correction**: Step 2 (Convex mutations) peut utiliser requireAdmin
- ✓ Ordre logique: Backend → Hooks → Layout → Modules (1 par 1) → Docs

---

## Phase 7 — Validation utilisateur

- [ ] Plan validé par l'utilisateur
- [ ] Revue agents validée par l'utilisateur
- [ ] GO pour application

---

## Description

Création d'un Dashboard Admin complet couvrant l'intégralité des 8 modules métier de la plateforme num_zer0, avec fusion des styles UI (CSS variables de l'app + accents visuels de la landing), utilisation des 61 composants shadcn disponibles, et CRUD complet pour les modules de gestion (promo codes, margins, packages).

**État actuel:** Dashboard admin = 1 fichier de 357 lignes, 2 onglets, dark hardcodé, pas de CRUD.

**État attendu:** ~25 fichiers, 8 modules, <200 lignes/fichier, style cohérent avec le système de thème CSS, shadcn components, CRUD complet.

---

## Analyse (corrigée)

Le dashboard admin est le centre de pilotage de la plateforme. Chaque module correspond à un domaine métier identifié dans le schéma Convex. L'approche "un dossier par module" respecte le feature folder pattern défini dans AGENTS.md.

**Points clés de l'analyse corrigée:**
1. Les queries admin doivent utiliser le pattern manuel `getUserIdentity` + `isAdmin` inline (comme `getAllUsers`)
2. Les mutations admin peuvent utiliser `requireAdmin` (car typé `MutationCtx`)
3. Le style doit utiliser les CSS variables de l'app (`--bg-base`, `--surface`, `--line`, `--sea-ink`), pas les couleurs hardcodées
4. La route admin nécessite `ssr: false`
5. Les nouveaux fichiers Convex: `promo_codes.ts`, `margins.ts`, `packages.ts`

---

## Fichiers impactés

| Fichier | Action | Description |
|---|---|---|
| `convex/purchases.ts` | MODIFIER | Ajouter `getAllPurchases` (query, pattern manuel isAdmin) |
| `convex/sms_provider.ts` | MODIFIER | Ajouter `getAllActivations` (query, pattern manuel isAdmin) |
| `convex/comptabilite.ts` | MODIFIER | Ajouter `getAllComptes`, `getAllPieces` (query, pattern manuel isAdmin) |
| `convex/promo_codes.ts` | CRÉER | `list` (query) + `create`/`update`/`delete` (mutations, requireAdmin) |
| `convex/margins.ts` | CRÉER | `list` (query) + `create`/`update`/`delete` (mutations, requireAdmin) |
| `convex/packages.ts` | CRÉER | `list` (query) + `create`/`update`/`delete` (mutations, requireAdmin) |
| `src/routes/admin.tsx` | MODIFIER | Ajouter `ssr: false`, importer nouveau layout |
| `src/components/admin/admin-dashboard.tsx` | SUPPRIMER | Remplacé par la nouvelle architecture |
| `src/components/admin/admin-layout.tsx` | CRÉER | Layout avec admin guard + sidebar |
| `src/components/admin/admin-sidebar.tsx` | CRÉER | Navigation sidebar 8 onglets |
| `src/components/admin/index.ts` | CRÉER | Barrel export |
| `src/components/admin/hooks/use-admin-queries.ts` | CRÉER | Hooks React Query admin + adminKeys factory |
| `src/components/admin/hooks/index.ts` | CRÉER | Barrel hooks |
| `src/components/admin/analytics/admin-analytics.tsx` | CRÉER | Module analytics |
| `src/components/admin/analytics/analytics-kpi-grid.tsx` | CRÉER | Grille KPI |
| `src/components/admin/users/admin-users.tsx` | CRÉER | Module users |
| `src/components/admin/users/user-delete-dialog.tsx` | CRÉER | Dialog delete |
| `src/components/admin/purchases/admin-purchases.tsx` | CRÉER | Module purchases |
| `src/components/admin/activations/admin-activations.tsx` | CRÉER | Module activations |
| `src/components/admin/activations/activation-detail-dialog.tsx` | CRÉER | Dialog détail activation |
| `src/components/admin/accounting/admin-accounting.tsx` | CRÉER | Module comptabilité |
| `src/components/admin/accounting/compte-detail-dialog.tsx` | CRÉER | Dialog détail compte |
| `src/components/admin/promo-codes/admin-promo-codes.tsx` | CRÉER | Module promo codes |
| `src/components/admin/promo-codes/promo-code-form-dialog.tsx` | CRÉER | Formulaire CRUD promo |
| `src/components/admin/margins/admin-margins.tsx` | CRÉER | Module margins |
| `src/components/admin/margins/margin-form-dialog.tsx` | CRÉER | Formulaire CRUD margin |
| `src/components/admin/packages/admin-packages.tsx` | CRÉER | Module packages |
| `src/components/admin/packages/package-form-dialog.tsx` | CRÉER | Formulaire CRUD package |
| `src/components/admin/docs/CHANGELOG.md` | CRÉER | Documentation |
| `src/components/admin/docs/CONTINUE.md` | CRÉER | Documentation |
| `src/components/admin/docs/TODOS.md` | CRÉER | Documentation |

---

## Prompt de Correction

```yaml
guidelines:
  - LIRE les fichiers docs/ du composant (CONTINUE.md, TODOS.md, CHANGELOG.md) avant de coder
  - LIRE le code source complet des fichiers impactés avant de modifier
  - LIRE les variables d'environnement et la configuration
  - CHERCHER les patterns existants dans le codebase
  - max 200 lignes par fichier (ignorer lignes vides et commentaires)
  - TypeScript strict — pas de `any`
  - IMPORTANT: Les QUERIES admin doivent utiliser le pattern manuel getUserIdentity + isAdmin (comme getAllUsers). requireAdmin est pour MutationCtx uniquement.
  - IMPORTANT: Les MUTATIONS admin peuvent utiliser requireAdmin depuis auth_helpers.ts.
  - Les nouveaux fichiers Convex doivent être dans des fichiers séparés (promo_codes.ts, margins.ts, packages.ts).
  - Utiliser les CSS variables de l'app (--bg-base, --surface, --line) pour le style, PAS de couleurs hardcodées comme #0f0f0f
  - Utiliser les accents landing: #25D366 (vert), #F97316 (orange), anim-glow-pulse
  - shadcn components: Tabs pour navigation, Table pour données, Card pour KPIs, Dialog pour formulaires,
    Badge pour statuts, Select pour dropdowns, Switch pour toggles, Input pour formulaires
  - Pattern query keys: adminKeys.all = ['admin']
  - Pattern mutations: onSettled avec invalidateQueries
  - Route admin: ajouter ssr: false
  - Barrel index.ts pour chaque dossier

steps:
  - Étape 1: Convex queries admin — getAllPurchases, getAllActivations, getAllComptes, getAllPieces
    pattern: getUserIdentity + isAdmin inline (comme getAllUsers)
    files: [convex/purchases.ts, convex/sms_provider.ts, convex/comptabilite.ts]

  - Étape 2: Convex CRUD files — promo_codes.ts, margins.ts, packages.ts
    pattern: queries = isAdmin inline, mutations = requireAdmin
    files: [convex/promo_codes.ts, convex/margins.ts, convex/packages.ts]

  - Étape 3: Hooks React Query admin — adminKeys factory + hooks
    files: [src/components/admin/hooks/use-admin-queries.ts, src/components/admin/hooks/index.ts]

  - Étape 4: Layout admin + sidebar + route update + delete old dashboard
    files: [src/components/admin/admin-layout.tsx, src/components/admin/admin-sidebar.tsx,
            src/components/admin/index.ts, src/routes/admin.tsx]
    note: supprimer admin-dashboard.tsx

  - Étape 5: Module Analytics — KPI grid + breakdowns
    files: [src/components/admin/analytics/*]

  - Étape 6: Module Users — Table + delete dialog
    files: [src/components/admin/users/*]

  - Étape 7: Module Purchases — transaction table
    files: [src/components/admin/purchases/*]

  - Étape 8: Module Activations — table + detail dialog
    files: [src/components/admin/activations/*]

  - Étape 9: Module Accounting — comptes + pieces tables
    files: [src/components/admin/accounting/*]

  - Étape 10: Module Promo Codes — CRUD
    files: [src/components/admin/promo-codes/*]

  - Étape 11: Module Margins — CRUD
    files: [src/components/admin/margins/*]

  - Étape 12: Module Packages — CRUD
    files: [src/components/admin/packages/*]

  - Étape 13: Docs lifecycle
    files: [src/components/admin/docs/*]

verification:
  - [ ] Tous les fichiers < 200 lignes
  - [ ] Chaque module exporté via barrel index.ts
  - [ ] ERR: Les queries admin utilisent requireAdmin → doivent utiliser pattern manuel !!!
  - [ ] OK: Les mutations admin utilisent requireAdmin (MutationCtx)
  - [ ] CSS variables utilisées (--bg-base, --surface, --line) pas de colors hardcodées
  - [ ] Accents landing: #25D366, #F97316, anim-glow-pulse
  - [ ] Composants shadcn utilisés (Tabs, Table, Card, Dialog, Badge, Select, Switch, Input)
  - [ ] adminKeys factory pattern respecté
  - [ ] Mutations utilisent onSettled pattern
  - [ ] Route admin a ssr: false
  - [ ] CRUD fonctionnel pour promo codes, margins, packages
  - [ ] États de chargement et d'erreur gérés pour chaque module
  - [ ] Lint & TypeScript pass
  - [ ] Build passe
  - [ ] CHANGELOG.md, CONTINUE.md, TODOS.md créés
```

---

## Solution Appliquée

[À remplir après correction]

**Commit:** `[hash]`
**Branche:** `[branche]`
**Date:** YYYY-MM-DD HH:mm

### Documentation préalable lue

- [ ] `docs/CONTINUE.md` — [résumé]
- [ ] `docs/TODOS.md` — [résumé]
- [ ] `docs/CHANGELOG.md` — [résumé]
- [ ] Code source des fichiers impactés — [confirmé]
- [ ] Variables d'environnement / config — [confirmé]

### Changements

```text
[description des changements]
```

### Fichiers modifiés

- [ ] `convex/purchases.ts` — Ajout getAllPurchases (pattern isAdmin inline)
- [ ] `convex/sms_provider.ts` — Ajout getAllActivations (pattern isAdmin inline)
- [ ] `convex/comptabilite.ts` — Ajout getAllComptes, getAllPieces (pattern isAdmin inline)
- [ ] `convex/promo_codes.ts` — Création CRUD complet (query isAdmin inline, mutations requireAdmin)
- [ ] `convex/margins.ts` — Création CRUD complet
- [ ] `convex/packages.ts` — Création CRUD complet
- [ ] `src/routes/admin.tsx` — Ajout ssr:false + nouveau layout
- [ ] `src/components/admin/admin-dashboard.tsx` — SUPPRIMÉ
- [ ] `src/components/admin/` — Nouvelle architecture complète (~25 fichiers)
- [ ] `src/components/admin/docs/` — CHANGELOG, CONTINUE, TODOS

### Vérification

- [ ] Docs lues avant de coder
- [ ] Test manuel OK
- [ ] Lint OK
- [ ] TypeScript OK
- [ ] Build OK
