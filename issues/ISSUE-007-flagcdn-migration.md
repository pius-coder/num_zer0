# Issue: Migrer les emoji flags vers flagcdn sur la landing page

**Date:** 2026-06-05
**Priorité:** Moyenne
**Statut:** Ouvert
**Composant(s):** `src/components/landing/country-flags.tsx`, `src/components/landing/data/index.ts`, `src/components/landing/floating-images.tsx`, `src/components/landing/security.tsx`
**Signalé par:** afreeserv

---

## Description

Remplacer les emoji flags Unicode (🇺🇸, 🇫🇷, etc.) par des images PNG depuis le CDN Flagpedia (flagcdn.com) sur tous les composants de la landing page.

**Observation:**
> Les emoji flags rendent différemment selon les OS (Windows, macOS, Linux, mobile). Qualité inégale, pas de fallback.

**Attendu:**
> Des images flag CDN cohérentes et cross-platform via `https://flagcdn.com/{width}x{height}/{code}.png`

---

## Analyse Root Cause

Les emoji flags sont des caractères Unicode dont le rendu dépend du système d'exploitation et du navigateur. Sur Windows, certaines couleurs sont délavées. Sur mobile, les emoji flags peuvent être absents ou mal alignés. Flagpedia fournit des images PNG vectorielles via Cloudflare CDN, garantissant un rendu homogène.

---

## ✅ Prompt de Correction

```yaml
guidelines:
  - LIRE les fichiers docs/ du composant (CONTINUE.md, TODOS.md, CHANGELOG.md)
  - LIRE le code source complet des fichiers impactés avant de modifier
  - CHERCHER les patterns existants dans le codebase
  - Ne modifier que les fichiers listés dans "Fichiers impactés"
  - Utiliser les patterns existants du codebase (copier pas réinventer)
  - TypeScript strict — pas de `any`

steps:
  - Étape 1: Ajouter `code` (ISO alpha-2) à chaque entrée de COUNTRIES, PRICING.plans, FLOATING_IMAGES
    files: [data/index.ts]

  - Étape 2: Mettre à jour CountryFlags pour utiliser `<img>` avec flagcdn
    files: [country-flags.tsx]

  - Étape 3: Mettre à jour FloatingImages pour utiliser `<img>` avec flagcdn
    files: [floating-images.tsx]

  - Étape 4: Mettre à jour Security (PRICING plans) pour utiliser `<img>` avec flagcdn
    files: [security.tsx]

verification:
  - [ ] Les docs du composant ont été lues avant d'écrire du code
  - [ ] Le code source existant a été lu et compris
  - [ ] Les patterns existants sont respectés
  - [ ] Test: Les flags apparaissent correctement dans CountryFlags
  - [ ] Test: Les flags apparaissent correctement dans FloatingImages
  - [ ] Test: Les flags apparaissent correctement dans Security/PRICING
  - [ ] Lint & TypeScript pass
  - [ ] Build passe
```

---

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/landing/data/index.ts` | MODIFIER | Ajouter `code` (ISO alpha-2) aux COUNTRIES, PRICING, FLOATING_IMAGES |
| `src/components/landing/country-flags.tsx` | MODIFIER | Remplacer emoji par `<img>` flagcdn |
| `src/components/landing/floating-images.tsx` | MODIFIER | Remplacer emoji par `<img>` flagcdn |
| `src/components/landing/security.tsx` | MODIFIER | Remplacer emoji par `<img>` flagcdn |

---

## Solution Appliquée

**Date:** 2026-06-05

### Documentation préalable lue

- [x] `docs/CONTINUE.md` — Landing feature overview
- [x] `docs/TODOS.md` — Pending tasks
- [x] `docs/CHANGELOG.md` — Change history
- [x] Code source des fichiers impactés — confirmé
- [x] Variables d'environnement / config — confirmé

### Changements

- Ajout de `code` (ISO 3166-1 alpha-2) dans COUNTRIES, PRICING.plans, FLOATING_IMAGES
- CountryFlags: remplacé `c.flag` emoji par `<img>` depuis flagcdn
- FloatingImages: remplacé `card.flag` emoji par `<img>` depuis flagcdn
- Security (PRICING): remplacé `s.flag` emoji par `<img>` depuis flagcdn

### Fichiers modifiés

| Fichier | Description |
|---------|-------------|
| `data/index.ts` | Ajout code pays dans COUNTRIES, PRICING, FLOATING_IMAGES |
| `country-flags.tsx` | Flag emoji → flagcdn `<img>` |
| `floating-images.tsx` | Flag emoji → flagcdn `<img>` |
| `security.tsx` | Flag emoji → flagcdn `<img>` |

### Vérification

- [x] Docs lues avant de coder (règle absolue respectée)
- [x] Test manuel OK
- [x] Lint OK
- [x] TypeScript OK
- [x] Build OK
