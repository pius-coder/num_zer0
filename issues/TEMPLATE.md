# ISSUE Template — Prompt de Fix

## ⚠️ RÈGLE ABSOLUE : LIRE AVANT D'AGIR (automatique, pas de discussion)

**L'agent doit EXÉCUTER cette règle comme un automate. Pas de supposition. Pas de shortcut.**

```yaml
regle_absolue_automate:
  priorite: SUPREME — première action, toujours, systématiquement
  declencheur: dès qu'une issue est assignée à un agent
  comportement: automate strict, pas de "je pense que"

sequence_obligatoire_avant_tout:
  - etape: "1. LIRE les fichiers docs du feature concerné"
    fichiers:
      - docs/CONTINUE.md        # État actuel, décisions connues
      - docs/CHANGELOG.md       # Historique des changements
      - docs/TODOS.md           # Travail en cours/pending
    action: lire COMPLÈTEMENT avant la première ligne de code

  - etape: "2. LIRE le code source existant du composant/module"
    fichiers:
      - tous les fichiers listés dans "Composant(s)" de l'issue
      - les imports de ces fichiers (remonter les dépendances)
    action: >
      Comprendre chaque fonction, chaque variable, chaque import.
      Ne pas supposer ce qu'une fonction fait — lire son implémentation.

  - etape: "3. LIRE les variables d'environnement et la configuration"
    fichiers:
      - .env / .env.example / .env.local
      - tsconfig.json / package.json (scripts, deps)
      - les fichiers de config Convex, TanStack, etc.
    action: >
      Comprendre les valeurs, les chemins, les alias (ex: #/common/…).
      Vérifier les versions, les scripts disponibles.

  - etape: "4. CHERCHER les patterns existants dans le codebase"
    action: >
      Utiliser grep/ast-grep pour trouver des implémentations similaires.
      Ne PAS réinventer — reproduire les patterns existants.
      Vérifier les conventions de nommage, structure, imports.

  - etape: "5. LIRE les templates et fichiers de règle du projet"
    fichiers:
      - AGENTS.md
      - CLAUDE.md
      - ARCHITECTURE.md
      - CODE_STYLE.md
      - .agents/skills/ (si pertinent)
    action: >
      Connaître les conventions du projet avant d'écrire.
      Respecter les max-lines (200 lignes), le feature folder pattern, etc.

  - etape: "6. SEULEMENT APRÈS les 5 étapes — commencer à coder"
    action: >
      Si un doute persiste à ce stade, utiliser une question bloquante
      (pick_one/confirm) avant de coder. Ne JAMAIS coder sur une supposition.

exemples_de_non_respect:
  - situation: "je pense que cette fonction fait X"
    probleme: supposition ≠ lecture du code
    action_correcte: lire l'implémentation de la fonction

  - situation: "je suppose que la variable d'env est définie"
    probleme: supposition ≠ vérification
    action_correcte: lire .env.example et vérifier l'utilisation

  - situation: "j'utilise le pattern que je connais"
    probleme: supposition ≠ recherche de pattern existant
    action_correcte: chercher dans le codebase comment c'est fait ici
```

> **🔴 Cette règle n'est pas négociable. L'agent qui ne lit pas les docs avant d'agir est en échec.**
> **🔴 Il vaut mieux perdre 10 minutes à lire que 1 heure à corriger une supposition erronée.**

---

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
# RAPPEL OBLIGATOIRE AVANT D'EXÉCUTER CE PROMPT :
# Lire docs → Lire code → Lire config → Chercher patterns → Lire règles → Coder
# (voir RÈGLE ABSOLUE en haut de TEMPLATE.md)

guidelines:
  - LIRE les fichiers docs/ du composant (CONTINUE.md, TODOS.md, CHANGELOG.md)
  - LIRE le code source complet des fichiers impactés avant de modifier
  - LIRE les variables d'environnement et la configuration
  - CHERCHER les patterns existants dans le codebase
  - Ne modifier que les fichiers listés dans "Fichiers impactés"
  - Une seule responsabilité par commit
  - Utiliser les patterns existants du codebase (copier pas réinventer)
  - Ajouter des logs en dev uniquement, jamais en prod
  - TypeScript strict — pas de `any`
  - Ne JAMAIS supposer ce qu'une fonction/variable fait — lire son code
  - Si doute persiste après avoir tout lu → question bloquante avant d'agir

steps:
  - Étape 1: [description]
    files: [liste des fichiers]

  - Étape 2: [description]
    files: [liste des fichiers]

  - Étape 3: [description]
    files: [liste des fichiers]

verification:
  - [ ] Les docs du composant ont été lues avant d'écrire du code
  - [ ] Le code source existant a été lu et compris
  - [ ] Les patterns existants sont respectés
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

### Documentation préalable lue

- [ ] `docs/CONTINUE.md` — [résumé]
- [ ] `docs/TODOS.md` — [résumé]
- [ ] `docs/CHANGELOG.md` — [résumé]
- [ ] Code source des fichiers impactés — [confirmé]
- [ ] Variables d'environnement / config — [confirmé]

### Changements

```
[description des changements]
```

### Fichiers modifiés

- [ ] `path/file.ts` — [quoi changé]
- [ ] `path/file2.ts` — [quoi changé]

### Vérification

- [ ] Docs lues avant de coder (règle absolue respectée)
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

- `NNN` = prochain numéro disponible (max existant + 1)
- Vérifier les fichiers existants avant de créer
