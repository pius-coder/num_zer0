# CHANGELOG — Admin Dashboard

## 2026-06-05 — v1.0.0 — Création du Dashboard Admin Complet

**Par:** Agent autonome (issue-copilot via ISSUE-010)

### Changements

- **Architecture:** Migration du monolithe `admin-dashboard.tsx` (357 lignes) vers une architecture dossier-par-module (~25 fichiers, <200 lignes chacun)
- **Convex:** 6 nouvelles fonctions admin (getAllPurchases, getAllActivations, getAllComptes, getAllPieces + CRUD promo_codes/margins/packages)
- **Hooks:** Création de `adminKeys` factory + 20 hooks React Query
- **Modules:** 8 modules (Analytics, Users, Purchases, Activations, Accounting, Promo Codes, Margins, Packages)
- **Style:** Fusion des styles landing (accents #25D366/#F97316, font-kubo) + app (CSS variables, glass-morphism)
- **Composants:** shadcn (Badge, Table) pour la structure + custom pour le branding

### Fichiers

- `convex/purchases.ts` — Ajout `getAllPurchases`
- `convex/sms_provider.ts` — Ajout `getAllActivations`
- `convex/comptabilite.ts` — Ajout `getAllComptes`, `getAllPieces`
- `convex/promo_codes.ts` — Nouveau fichier CRUD
- `convex/margins.ts` — Nouveau fichier CRUD
- `convex/packages.ts` — Nouveau fichier CRUD
- `src/routes/admin.tsx` — Ajout `ssr: false`, nouveau layout
- `src/components/admin/` — Réécriture complète (~25 fichiers)
