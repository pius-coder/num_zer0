# Phase 4 — Analyse profonde (corrigée après reanalyse)

Voir la section Phase 4 du fichier principal pour l'analyse complète.

## Corrections majeures vs version initiale

1. **requireAdmin est typé MutationCtx uniquement** → Les queries admin (getAllPurchases, getAllActivations, etc.) doivent utiliser le PATTERN MANUEL comme getAllUsers: getUserIdentity() + lookup user + check isAdmin inline. requireAdmin ne peut être utilisé que pour les mutations.

2. **Style UI**: L'issue initiale disait d'utiliser `bg-[#0f0f0f]` mais l'app utilise des CSS variables (`--bg-base`, `--surface`, `--line`). Le dashboard actuel utilise du dark hardcodé qui est INCOHÉRENT avec le système de thème de l'app.

3. **Nouveaux fichiers Convex**: 
   - `promo_codes.ts` (pas dans purchases.ts — nouveau fichier dédié)
   - `margins.ts` (pas `margin_overrides.ts`)
   - `packages.ts` (existe en schema, 0 fonctions)

4. **Route admin**: Doit avoir `ssr: false` comme my-space.tsx

5. **~25 fichiers** dans l'architecture complète, respectant tous < 200 lignes
