# ISSUE Template — Prompt de Fix

## Structure du fichier d'issue

Chaque issue suit ce format. Copier ce fichier et renommer en `ISSUE-NNN-description.md`.

---

```markdown
# Issue: [Titre court du problème]

**Date:** YYYY-MM-DD
**Priorité:** Critique / Haute / Moyenne / Basse
**Statut:** Ouvert / En cours / Résolu / Fermé
**Composant(s):** `chemin/vers/fichier.ts`
**Signalé par:** [qui]

---

## Description

[Description claire du problème. Inclure le comportement observé vs attendu.]

**Observation:**
> [ce qui se passe]

**Attendu:**
> [ce qui devrait se passer]

---

## Analyse Root Cause

[Explication de la cause racine. Pourquoi le bug se produit.]

```
[code snippet ou trace si pertinent]
```

---

## ✅ Prompt de Correction

```yaml
guidelines:
  - Ne modifier que les fichiers listés dans "Fichiers impactés"
  - Une seule responsabilité par commit
  - Utiliser les patterns existants du codebase
  - Ajouter des logs en dev, jamais en prod
  - TypeScript strict — pas de `any`
  - Tests avant/après si applicable

steps:
  - Étape 1: [description]
    files: [liste des fichiers]
  
  - Étape 2: [description]
    files: [liste des fichiers]
  
  - Étape 3: [description]
    files: [liste des fichiers]

verification:
  - [ ] Test 1: [description]
  - [ ] Test 2: [description]
  - [ ] Lint & TypeScript pass
  - [ ] Build passe
```

---

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `path/file.ts` | MODIFIER / CRÉER / SUPPRIMER | [quoi] |

---

## Solution Appliquée

[À remplir après correction]

**Commit:** `[hash]`
**Branche:** `[branche]`
**Date:** YYYY-MM-DD HH:mm

### Changements

```
[description des changements]
```

### Fichiers modifiés

- [ ] `path/file.ts` — [quoi changé]
- [ ] `path/file2.ts` — [quoi changé]

### Vérification

- [ ] Test manuel OK
- [ ] Lint OK
- [ ] TypeScript OK
- [ ] Build OK
```

---

## Règles de nommage

| Format | Exemple | Quand |
|--------|---------|-------|
| `ISSUE-NNN-description.md` | `ISSUE-002-top-loader-fix.md` | Issue simple (1-3 fichiers) |
| `YYYY-MM-DD-description/` + `ISSUE-ANALYSIS.md` | `2026-06-03-payment-bug/` | Issue complexe (analyse + assets) |

## Incrémentation

- `N N N` = prochain numéro disponible (max existant + 1)
- Vérifier les fichiers existants avant de créer
