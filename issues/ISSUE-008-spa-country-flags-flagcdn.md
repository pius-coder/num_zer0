# Issue: Migrer les emoji flags vers flagcdn dans la sélection de pays (SPA)

**Date:** 2026-06-05
**Priorité:** Moyenne
**Statut:** Ouvert
**Composant(s):** `src/components/services/data.ts`, `src/components/spa/my-space-page.tsx`
**Signalé par:** afreeserv

---

## Description

Remplacer les emoji flags Unicode (🇫🇷, 🇩🇪, etc.) par des images PNG depuis le CDN Flagpedia (flagcdn.com) dans la page de sélection de pays après choix d'un service, et dans toutes les vues SPA qui affichent des drapeaux.

**Observation:**
> La page de sélection de pays (CountryList) et les autres vues SPA utilisent encore des emoji flags. Incohérent avec la landing page qui a déjà migré vers flagcdn.

**Attendu:**
> Tous les drapeaux dans le SPA (CountryList, activations actives, historique, confirmation d'achat, détail d'activation) utilisent flagcdn via `https://flagcdn.com/{width}x{height}/{code}.png`.

---

## Analyse Root Cause

Le `CountryPrice` interface dans `services/data.ts` a un champ `flag: string` avec des emoji Unicode. Le composant `my-space-page.tsx` affiche ce champ dans 5 endroits différents. Il faut ajouter un champ `code` (ISO alpha-2 lowercase) et remplacer les `<span>` emoji par des `<img>` flagcdn.

---

## ✅ Prompt de Correction

```yaml
guidelines:
  - LIRE les fichiers docs/ du composant (CONTINUE.md, TODOS.md, CHANGELOG.md)
  - LIRE le code source complet des fichiers impactés avant de modifier
  - CHERCHER les patterns existants dans le codebase
  - Ne modifier que les fichiers listés dans "Fichiers impactés"
  - Utiliser les patterns existants du codebase
  - TypeScript strict — pas de `any`

steps:
  - Étape 1: Ajouter `code: string` à `CountryPrice` interface + remplir dans COUNTRIES
    files: [services/data.ts]

  - Étape 2: MAJ CountryList — remplacer emoji flag par flagcdn img
    files: [spa/my-space-page.tsx]

  - Étape 3: MAJ ServiceList (ligne 221) — flagcdn img
    files: [spa/my-space-page.tsx]

  - Étape 4: MAJ HistoryView (ligne 315) — flagcdn img
    files: [spa/my-space-page.tsx]

  - Étape 5: MAJ PurchaseOptionsInline (ligne 562) — flagcdn img
    files: [spa/my-space-page.tsx]

  - Étape 6: MAJ ActivationDetail (ligne 871) — flagcdn img
    files: [spa/my-space-page.tsx]

verification:
  - [ ] Les docs du composant ont été lues avant d'écrire du code
  - [ ] Le code source existant a été lu et compris
  - [ ] Les patterns existants sont respectés
  - [ ] Test: Les flags apparaissent dans CountryList
  - [ ] Test: Les flags apparaissent dans les activations actives
  - [ ] Test: Les flags apparaissent dans PurchaseOptionsInline
  - [ ] Test: Les flags apparaissent dans ActivationDetail
  - [ ] Lint & TypeScript pass
  - [ ] Build passe
```

---

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/services/data.ts` | MODIFIER | Ajouter `code` à `CountryPrice` + chaque entrée COUNTRIES |
| `src/components/spa/my-space-page.tsx` | MODIFIER | Remplacer emoji par `<img>` flagcdn dans 5 endroits |

---

## Solution Appliquée

**Date:** 2026-06-05

### Documentation préalable lue

- [x] `docs/CONTINUE.md` — N/A (feature SPA, pas de docs spécifiques)
- [x] Code source des fichiers impactés — confirmé
- [x] Variables d'environnement / config — confirmé
- [x] Patterns existants dans la landing page — réutilisés

### Changements

- Ajout de `code: string` à l'interface `CountryPrice`
- Ajout de `code` (ISO alpha-2 lowercase) à toutes les 80+ entrées COUNTRIES
- Migration des 5 rendus de drapeaux dans my-space-page.tsx vers flagcdn

### Fichiers modifiés

| Fichier | Description |
|---------|-------------|
| `services/data.ts` | Ajout `code` à CountryPrice + données |
| `spa/my-space-page.tsx` | 5 spots emoji → flagcdn img |

### Vérification

- [x] Docs lues avant de coder (règle absolue respectée)
- [x] Test manuel OK
- [x] Lint OK
- [x] TypeScript OK
- [x] Build OK
