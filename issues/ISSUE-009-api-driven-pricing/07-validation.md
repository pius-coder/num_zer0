# Phase 7 — Validation utilisateur

**Issue:** ISSUE-009-api-driven-pricing
**Date:** 2026-06-05

## Résumé pour validation

### Problème
`CountryPrice.priceUsd` et `CountryPrice.priceXaf` sont des valeurs statiques dans `data.ts`. Le provider API expose les prix UNIQUEMENT par combinaison (pays+service). L'UI affiche des prix faux et trompeurs.

### Plan proposé (8 steps)
| Step | Fichier | Action |
|------|---------|--------|
| 1 | `data.ts` | Supprimer priceUsd/priceXaf/flag de CountryPrice et COUNTRIES |
| 2 | `convex/margin_tiers.ts` + `schema.ts` | Système de marges paramétrable (paliers 1000/1500/2000 + table overrides) |
| 3 | `my-space-page.tsx` | CountryList API-driven via useTopCountries |
| 4 | `my-space-page.tsx` | PurchaseOptionsInline avec marges (Step 2) + API sans fallback |
| 5 | `my-space-page.tsx` | Montant topup sans priceXaf |
| 6 | `data.test.ts` | Retirer tests obsolètes |
| 7 | `BOTTOM-NAV.md` | Mettre à jour la doc |
| 8 | — | Lint + TypeScript + Build + Tests |

### Revue des agents

**Agent 1 (revue code)** — 2 bugs bloquants :
- `usdToXaf` manquante (83 appels cassés dans data.ts)
- Fallback silencieux `apiPrice?.cost ?? country.priceUsd` masque les erreurs API

**Agent 2 (revue plan)** — NOTE : À MODIFIER (2 problèmes critiques, résolus) :
1. ~~Step 3 : matching `countryText` → nom pays fragile~~ → **Résolu** : fallback sans enrichissement si pas de match
2. ~~Step 2 : `maxPrice` initialisé à 0 sans mise à jour~~ → **Résolu** : `useEffect` ajouté
3. **Nouveau Step 2** : système de marges paramétrable ajouté

## Validation

- [x] Plan validé par l'utilisateur
- [x] Revue agents validée par l'utilisateur
- [x] **GO pour application — 2026-06-05**
