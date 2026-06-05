# Issue: CountryList — Margin non appliqué, pagination manquante, affichage code + ISO

**Date:** 2026-06-05
**Priorité:** Haute
**Statut:** Ouvert
**Composant(s):** `src/components/spa/my-space-page.tsx`, `convex/sms_countries.ts`, `src/components/services/data.ts`
**Signalé par:** Utilisateur (test dashboard)
**Contrainte:** Aucune

---

## Phase 1 — Exploration (sortie des agents)

| Fichier | Intervalle | Rôle dans l'issue |
| ------- | ---------- | ----------------- |
| `C:\Users\pc\num_zer0\src\components\spa\my-space-page.tsx` | L420-L540 | CountryList + PurchaseOptionsInline — affichage prix, pagination, marges |
| `C:\Users\pc\num_zer0\convex\sms_countries.ts` | L1-L62 | Mapping numeric → ISO (manque 109, 110) |
| `C:\Users\pc\num_zer0\src\components\services\data.ts` | L1-L100 | COUNTRIES array — données pays (nom, code tel, iso) |
| `C:\Users\pc\num_zer0\convex\sms_provider.ts` | L562-L594 | getTopCountries action — retourne retailPrice sans marge |
| `C:\Users\pc\num_zer0\convex\margin_tiers.ts` | L1-L48 | Système de marge (computeDefaultMargin) |
| `C:\Users\pc\num_zer0\src\components\purchases\hooks\use-activations.ts` | L78-L83 | useTopCountries hook |

---

## Phase 2 — Lecture ciblée

- `my-space-page.tsx` (L530-L536): `getDefaultMarginXaf` défini localement mais utilisé SEULEMENT dans `PurchaseOptionsInline` (L581-L603), PAS dans `CountryList`
- `my-space-page.tsx` (L494-L520): CountryList affiche `item.retailPrice.toFixed(2) USD` — prix brut API sans marge
- `my-space-page.tsx` (L434-L437): Enrichissement des pays — `tc.countryText` sert de fallback name quand ISO ne match pas COUNTRIES
- `sms_countries.ts`: Manque entries 109 et 110 dans SMS_COUNTRY_MAP
- `data.ts`: COUNTRIES array a nom, iso, code téléphone, phonePrefix

---

## Phase 3 — Recherche

- `AGENTS.md` — conventions du projet
- `issues/TEMPLATE.md` — template d'issue
- `convex/margin_tiers.ts` — système de marge existant

---

## Phase 4 — Analyse profonde

### Root cause

**Margin non appliqué:** `CountryList` affiche `item.retailPrice` (prix API brut) sans ajouter la marge. La fonction `getDefaultMarginXaf` existe mais n'est pas appelée dans CountryList.

**Pagination manquante:** CountryList rend tous les ~183 pays en une fois sans pagination ni infinite scroll.

**Code + ISO manquant:** Certains pays (109, 110) n'ont pas de mapping ISO → pas de match dans COUNTRIES → fallback sur le code numérique. De plus, le code téléphonique (phonePrefix) n'est pas affiché.

### Edge cases

- Pays sans ISO mapping (109, 110) → afficher code numérique comme fallback
- Marge à 0 si `retailPrice` est 0 ou undefined
- Loading/error states avec pagination
- Scroll infini avec moins d'items que la page

---

## Phase 5 — Plan complet

1. **Step 1** — Ajouter les pays 109, 110 à SMS_COUNTRY_MAP (si ISO connu) ou améliorer fallback display
   - Fichiers: `convex/sms_countries.ts`
   - Résultat: mapping complet

2. **Step 2** — Appliquer la marge dans CountryList
   - Fichiers: `src/components/spa/my-space-page.tsx`
   - Résultat: CountryList affiche `retailPrice + marginUsd` au lieu de `retailPrice`

3. **Step 3** — Ajouter infinite scroll à CountryList
   - Fichiers: `src/components/spa/my-space-page.tsx`
   - Résultat: Pagination par Intersection Observer, 20 items par page

4. **Step 4** — Afficher code téléphone + ISO dans CountryList
   - Fichiers: `src/components/spa/my-space-page.tsx`
   - Résultat: Chaque entrée montre `+XXX ISO name`

5. **Step 5** — Vérification déploiement + tests
   - Fichiers: Tous
   - Résultat: `npx convex deploy`, `vitest`, build OK

---

## Phase 6 — Revue par 2 agents

*(À remplir pendant la session)*

---

## Phase 7 — Validation utilisateur

*(À remplir après GO)*

---

## Description

**Observation (dashboard):**
```
95AE
1.43 USD
```
- Prix brut API sans marge
- Pas de pagination (183 pays d'un coup)
- Code téléphone absent
- Certains pays sans nom (affichent code numérique)

**Attendu:**
```
+971 AE UAE    1.43 + 1000 FCFA → 2.87 USD
+93 AF Afghanistan  0.44 + 1000 FCFA → 1.88 USD
...
```
- Prix avec marge appliquée
- Pagination (20 par page) + infinite scroll
- Code téléphone + ISO + nom

---

## Analyse Root Cause

1. **Margin:** `getDefaultMarginXaf` défini mais pas utilisé dans `CountryList` — seulement dans `PurchaseOptionsInline`
2. **Pagination:** Aucun mécanisme de pagination — rendu complet synchrone
3. **Code/ISO:** Les pays sans ISO mapping (109, 110) n'ont pas de nom dans COUNTRIES → affichent le code numérique

---

## ✅ Prompt de Correction

<!-- À exécuter après validation utilisateur -->

```yaml
guidelines:
  - LIRE les fichiers docs/ du composant (CONTINUE.md, TODOS.md, CHANGELOG.md)
  - LIRE le code source complet des fichiers impactés avant de modifier
  - Utiliser les patterns existants du codebase

steps:
  - Étape 1: Ajouter pays 109, 110 à SMS_COUNTRY_MAP
    files: [convex/sms_countries.ts]
  - Étape 2: Appliquer marge dans CountryList
    files: [src/components/spa/my-space-page.tsx]
  - Étape 3: Ajouter infinite scroll (20 items/page, Intersection Observer)
    files: [src/components/spa/my-space-page.tsx]
  - Étape 4: Afficher phonePrefix + ISO dans chaque entrée
    files: [src/components/spa/my-space-page.tsx]
  - Étape 5: Déploiement + vérification
    files: [tous]

verification:
  - [ ] npx convex deploy --typecheck=disable OK
  - [ ] npx vitest run OK (si tests existent)
  - [ ] npm run build OK
```

---

## Fichiers impactés

| Fichier | Action | Description |
| ------- | ------ | ----------- |
| `convex/sms_countries.ts` | MODIFIER | Ajouter pays 109, 110 |
| `src/components/spa/my-space-page.tsx` | MODIFIER | Margin + pagination + code/ISO |
