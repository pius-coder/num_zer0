# ISSUE Template — Prompt de Fix Agentique

**Agent dédié:** `issue-copilot` (`.opencode/agents/issue-copilot.md`)
**Commande:** `@issue-copilot <issue> <description>`

## ⚠️ RÈGLE ABSOLUE : LIRE AVANT D'AGIR

L'agent doit exécuter cette règle comme un automate. Pas de supposition. Pas de shortcut. Pas de code avant compréhension.

```yaml
regle_absolue_automate:
  priorite: SUPREME — première action, toujours, systématiquement
  declencheur: dès qu'une issue est assignée à un agent
  comportement: automate strict, pas de "je pense que"

sequence_obligatoire_avant_tout:
  - etape: '1. LIRE les fichiers docs du feature concerné'
    fichiers:
      - docs/CONTINUE.md
      - docs/CHANGELOG.md
      - docs/TODOS.md
    action: lire complètement avant la première ligne de code

  - etape: '2. LIRE le code source existant du composant/module'
    fichiers:
      - tous les fichiers listés dans "Composant(s)" de l'issue
      - les imports de ces fichiers
    action: >
      Comprendre chaque fonction, chaque variable, chaque import.
      Ne pas supposer ce qu'une fonction fait — lire son implémentation.

  - etape: "3. LIRE les variables d'environnement et la configuration"
    fichiers:
      - .env / .env.example / .env.local
      - tsconfig.json / package.json
      - les fichiers de config Convex, TanStack, etc.
    action: >
      Comprendre les valeurs, les chemins, les alias.
      Vérifier les versions, les scripts disponibles.

  - etape: '4. CHERCHER les patterns existants dans le codebase'
    action: >
      Utiliser grep / ast-grep pour trouver des implémentations similaires.
      Ne pas réinventer — reproduire les patterns existants.
      Vérifier les conventions de nommage, structure, imports.

  - etape: '5. LIRE les templates et fichiers de règle du projet'
    fichiers:
      - AGENTS.md
      - CLAUDE.md
      - ARCHITECTURE.md
      - CODE_STYLE.md
      - .agents/skills/ si pertinent
    action: >
      Connaître les conventions du projet avant d'écrire.
      Respecter les max-lines, le feature folder pattern, etc.

  - etape: '6. SEULEMENT APRÈS les 5 étapes — commencer à coder'
    action: >
      Si un doute persiste à ce stade, utiliser une question bloquante
      avant de coder. Ne jamais coder sur une supposition.

exemples_de_non_respect:
  - situation: 'je pense que cette fonction fait X'
    probleme: supposition ≠ lecture du code
    action_correcte: lire l'implémentation de la fonction

  - situation: "je suppose que la variable d'env est définie"
    probleme: supposition ≠ vérification
    action_correcte: lire .env.example et vérifier l'utilisation

  - situation: "j'utilise le pattern que je connais"
    probleme: supposition ≠ recherche de pattern existant
    action_correcte: chercher dans le codebase comment c'est fait ici
```

> Cette règle n'est pas négociable. L'agent qui ne lit pas les docs avant d'agir est en échec.
> Il vaut mieux perdre 10 minutes à lire que 1 heure à corriger une supposition erronée.

---

## 🔁 Workflow obligatoire

**Agent à utiliser:** `@issue-copilot` (défini dans `.opencode/agents/issue-copilot.md`)

Aucune phase ne peut être sautée. Aucune régression vers une phase antérieure n'est permise sans validation explicite de l'utilisateur.

```yaml
# ─── PERSISTENCE RULE (applies to ALL phases) ──────────────────────────────
# Chaque phase DOIT sauvegarder sa sortie brute dans un fichier AVANT de
# passer à la phase suivante. Structure:
#   issues/ISSUE-NNN-description/     ← dossier de phase (créé à l'étape 1)
#     01-exploration.md               ← sortie brute des agents explore
#     02-lecture.md                   ← notes de lecture ciblée
#     03-recherche.md                 ← docs/URLs consultées
#     04-analyse.md                   ← root cause + edge cases
#     05-plan.md                      ← steps atomiques
#     06-revue-code.md                ← rapport agent reviewer 1
#     06-revue-plan.md                ← rapport agent reviewer 2
#     07-validation.md                ← approbation utilisateur
#     08-application.md               ← résultat de l'application
#
# Le fichier ISSUE-NNN-description.md (à la racine de issues/) contient la
# SYNTHÈSE (phases 1-7 pré-remplies). Les fichiers dans le dossier / sont
# les RAPPORTS BRUTS — ce qui évite de relancer les analyses si la session
# s'arrête ou si un autre agent reprend le travail.
# ───────────────────────────────────────────────────────────────────────────

workflow_strict:
  phase_1_exploration:
    nom: 'Exploration par agents'
    sortie: 'issues/ISSUE-NNN/01-exploration.md + synthèse dans le fichier issue'
    regles:
      - AVANT de commencer, vérifier si `issues/ISSUE-NNN/01-exploration.md` existe déjà → si oui, le lire et passer à la phase 2
      - TOUJOURS utiliser un ou plusieurs agents `explore` en parallèle
      - Chaque agent DOIT fournir: path absolu + intervalle de lignes (start-end)
      - JAMAIS lire le contenu complet d'un fichier dans cette phase — seulement le path et la plage
      - Si un fichier est volumineux (>200 lignes), un agent `general` peut le découper en sections
      - Le but est de cartographier l'impact AVANT toute lecture détaillée
      - SAUVEGARDER la sortie brute dans `issues/ISSUE-NNN/01-exploration.md`
      - IMPORTANT : C'est le subagent `explore` lui-même qui écrit le fichier — NE PAS écrire le fichier depuis l'agent coordinateur. Le prompt du subagent DOIT inclure : "À la fin de ton analyse, écris ce rapport dans `issues/ISSUE-NNN/01-exploration.md`"

  phase_2_lecture_ciblee:
    nom: 'Lecture ciblée du code'
    sortie: 'issues/ISSUE-NNN/02-lecture.md + synthèse dans le fichier issue'
    regles:
      - AVANT de commencer, vérifier si `issues/ISSUE-NNN/02-lecture.md` existe déjà → skip si complet
      - Lire le code source COMPLET de chaque fichier listé en phase 1
      - Remonter les imports et dépendances transitives
      - Identifier les conventions, patterns, types, interfaces
      - Documenter les fonctions publiques et leurs signatures
      - SAUVEGARDER dans `issues/ISSUE-NNN/02-lecture.md`
      - IMPORTANT : Le subagent `reader` écrit le fichier directement. Son prompt DOIT inclure : "À la fin de ta lecture, écris ce rapport dans `issues/ISSUE-NNN/02-lecture.md`"

  phase_3_recherche:
    nom: 'Recherche (docs + web)'
    sortie: 'issues/ISSUE-NNN/03-recherche.md + synthèse dans le fichier issue'
    regles:
      - AVANT de commencer, vérifier si `issues/ISSUE-NNN/03-recherche.md` existe déjà → skip si complet
      - Si l'issue touche une API tierce → lire la doc officielle
      - Si l'issue touche un pattern framework → lire la skill correspondante
      - Si l'issue touche un module interne → lire AGENTS.md, ARCHITECTURE.md, docs/
      - Documenter les sources consultées avec URL ou path
      - SAUVEGARDER dans `issues/ISSUE-NNN/03-recherche.md`
      - IMPORTANT : Le subagent écrit le fichier directement. Son prompt DOIT inclure : "À la fin de ta recherche, écris ce rapport dans `issues/ISSUE-NNN/03-recherche.md`"

  phase_4_analyse_profonde:
    nom: 'Analyse profonde'
    sortie: 'issues/ISSUE-NNN/04-analyse.md + synthèse dans le fichier issue'
    regles:
      - AVANT de commencer, vérifier si `issues/ISSUE-NNN/04-analyse.md` existe déjà → skip si complet
      - Penser à l'implémentation complète, pas juste au fix immédiat
      - Identifier les régressions possibles
      - Lister les edge cases
      - Si "no backward compat" est demandé → identifier tout ce qui doit être supprimé
      - Penser aux impacts downstream: consommateurs, tests, types
      - SAUVEGARDER dans `issues/ISSUE-NNN/04-analyse.md`
      - IMPORTANT : Le subagent `analyse` écrit le fichier directement. Son prompt DOIT inclure : "À la fin de ton analyse, écris ce rapport dans `issues/ISSUE-NNN/04-analyse.md`"

  phase_5_plan:
    nom: 'Plan complet'
    sortie: 'issues/ISSUE-NNN/05-plan.md + synthèse dans le fichier issue'
    regles:
      - AVANT de commencer, vérifier si `issues/ISSUE-NNN/05-plan.md` existe déjà → skip si complet
      - Steps atomiques: un commit = un step
      - Chaque step liste ses fichiers et son résultat attendu
      - Ordre d'exécution des steps justifié
      - Si l'issue demande "no backward compat" → plan inclut la suppression explicite du code legacy
      - Plan validé AVANT toute écriture de code
      - SAUVEGARDER dans `issues/ISSUE-NNN/05-plan.md`
      - IMPORTANT : Le subagent `plan` écrit le fichier directement. Son prompt DOIT inclure : "À la fin de ton plan, écris ce rapport dans `issues/ISSUE-NNN/05-plan.md`"

  phase_6_revue_par_agents:
    nom: 'Revue par 2 agents reviewers'
    sortie: 'issues/ISSUE-NNN/06-revue-{code,plan}.md + synthèse dans le fichier issue'
    regles:
      - AVANT de commencer, vérifier si les deux fichiers de revue existent déjà → skip si complets
      - Lancer DEUX agents reviewers en parallèle
      - Agent 1 = revue du CODE existant → persisté dans `06-revue-code.md`
      - Agent 2 = revue du PLAN → persisté dans `06-revue-plan.md`
      - Chaque agent DOIT lister explicitement: ce qui est OK / ce qui manque / ce qui doit changer
      - Si l'un des reviewers signale un problème bloquant → revenir à la phase concernée
      - IMPORTANT : Chaque reviewer agent écrit son propre fichier. Le prompt DOIT inclure : "À la fin de ta revue, écris ce rapport dans `issues/ISSUE-NNN/06-revue-{code,plan}.md`"

  phase_7_validation_utilisateur:
    nom: 'Validation utilisateur'
    sortie: 'issues/ISSUE-NNN/07-validation.md + synthèse dans le fichier issue'
    regles:
      - AVANT de commencer, vérifier si `issues/ISSUE-NNN/07-validation.md` existe déjà et contient un GO explicite → skip
      - AUCUN code écrit tant que l'utilisateur n'a pas validé le plan + la revue
      - Présenter un résumé clair: problème, plan, reviewers, prochaines actions
      - Attendre le GO explicite de l'utilisateur
      - SAUVEGARDER l'approbation dans `issues/ISSUE-NNN/07-validation.md`

  phase_8_application:
    nom: 'Application'
    sortie: 'issues/ISSUE-NNN/08-application.md + synthèse dans le fichier issue'
    regles:
      - AVANT de commencer, vérifier si `issues/ISSUE-NNN/08-application.md` existe déjà avec all steps cochés → skip
      - Suivre le plan validé, step par step
      - Mettre à jour CHANGELOG.md, CONTINUE.md, TODOS.md à la fin
      - Cocher toutes les cases de vérification
      - NE PAS dévier du plan sans nouvelle validation utilisateur
      - SAUVEGARDER le résultat dans `issues/ISSUE-NNN/08-application.md`
```

> Aucune phase ne peut être sautée. Le non-respect de ce workflow invalide le travail.

---

## 🧠 Règle agentique importante: multi-subagents pour la collecte de contexte

L’agent principal peut créer plusieurs sous-agents quand cela aide à gagner en largeur de contexte ou en vitesse d’analyse.

### Quand spawn des sous-agents

- quand plusieurs fichiers doivent être explorés en parallèle
- quand le contexte est dispersé dans plusieurs zones du codebase
- quand il faut comparer des patterns
- quand il faut séparer exploration, lecture, et vérification

### Règles de coordination

- chaque subagent reçoit une mission unique
- pas de chevauchement inutile
- chaque subagent écrit SA sortie directement dans le fichier de phase (sinon le résultat est perdu en fin de session)
- chaque sortie doit contenir: path, lignes, faits, risques, conclusion
- le coordinateur fusionne, déduplique et tranche les sorties des subagents dans la synthèse de l'issue
- ne pas multiplier les subagents sans raison

### Répartition recommandée

- **Subagent explore**: cartographie des fichiers et intervalles de lignes
- **Subagent reader**: lecture ciblée des fichiers importants
- **Subagent pattern**: recherche des implémentations similaires
- **Subagent reviewer**: vérification des risques, tests, edge cases

---

## Structure du fichier d'issue

Chaque issue suit ce format. Copier ce fichier et renommer en `ISSUE-NNN-description.md`.

### Persistance des phases

Chaque phase produit un fichier brut dans `issues/ISSUE-NNN-description/` :
```
issues/
  ISSUE-NNN-description.md                  ← Synthèse (phases 1-7 pré-remplies)
  ISSUE-NNN-description/                    ← Rapports bruts par phase
    01-exploration.md
    02-lecture.md
    03-recherche.md
    04-analyse.md
    05-plan.md
    06-revue-code.md
    06-revue-plan.md
    07-validation.md
    08-application.md
```

Le fichier principal (`ISSUE-NNN-description.md`) contient la **synthèse** utilisable en un coup d'œil. Les fichiers dans le dossier `/` contiennent les **rapports bruts** des agents (sortie complète des subagents, listings grep, etc.) — ce qui permet de reprendre le travail sans relancer les analyses.

````markdown
# Issue: [Titre court du problème]

**Date:** YYYY-MM-DD
**Priorité:** Critique / Haute / Moyenne / Basse
**Statut:** Ouvert / En cours / Résolu / Fermé
**Composant(s):** `chemin/vers/fichier.ts`
**Signalé par:** [qui]
**Contrainte:** [ex: "No backward compatibility — full reimplementation API-driven"]

---

## Phase 1 — Exploration (sortie des agents)

> Liste des fichiers impactés. Chaque ligne DOIT inclure path absolu + intervalle de lignes.
> Remplir cette section AVANT toute lecture de code.

| Fichier                           | Intervalle | Rôle dans l'issue |
| --------------------------------- | ---------- | ----------------- |
| `C:\Users\pc\num_zer0\src/...`    | L100-L200  | ...               |
| `C:\Users\pc\num_zer0\convex/...` | L50-L120   | ...               |

**Agents utilisés:** [noms et nombre]

---

## Phase 2 — Lecture ciblée (résumé du code lu)

> Résumé des findings pour chaque fichier de la phase 1. Pas de code brut — seulement les observations clés.

- `path/file.ts` (L100-L200): [observation 1], [observation 2]
- `path/file2.ts` (L50-L120): [observation 1]

---

## Phase 3 — Recherche (sources consultées)

> Documentation lue (interne ou externe). Chaque source = path/URL + raison.

- `AGENTS.md` (path) — conventions du projet
- `https://...` (URL) — doc API tierce
- `.agents/skills/...` (path) — pattern framework

---

## Phase 4 — Analyse profonde (root cause + edge cases)

> Explication complète du problème, pas seulement le fix immédiat.

### Root cause

[Cause racine identifiée]

### Causes secondaires

- [cause 1]
- [cause 2]

### Edge cases

- [edge case 1]
- [edge case 2]

### Si "no backward compat" demandé

- [élément legacy à supprimer]
- [élément legacy à supprimer]

---

## Phase 5 — Plan complet (steps atomiques)

> Steps ordonnés, chacun = un commit potentiel. Pas de code ici, juste la stratégie.

1. **Step 1** — [description]
   - Fichiers: [liste]
   - Résultat attendu: [quoi]
2. **Step 2** — [description]
   - Fichiers: [liste]
   - Résultat attendu: [quoi]
3. ...

---

## Phase 6 — Revue par 2 agents

### Agent 1 (revue code)

- ✓ [point validé]
- ✗ [problème détecté + correction suggérée]
- ✓ [point validé]

### Agent 2 (revue plan)

- ✓ [point validé]
- ✗ [problème détecté + correction suggérée]
- ✓ [point validé]

---

## Phase 7 — Validation utilisateur

- [ ] Plan validé par l'utilisateur
- [ ] Revue agents validée par l'utilisateur
- [ ] GO pour application

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

```text
[code snippet ou trace si pertinent]
```
````

---

## ✅ Prompt de Correction

```yaml
# RAPPEL OBLIGATOIRE AVANT D'EXÉCUTER CE PROMPT :
# Lire docs → Lire code → Lire config → Chercher patterns → Lire règles → Coder

guidelines:
  - LIRE les fichiers docs/ du composant (CONTINUE.md, TODOS.md, CHANGELOG.md)
  - LIRE le code source complet des fichiers impactés avant de modifier
  - LIRE les variables d'environnement et la configuration
  - CHERCHER les patterns existants dans le codebase
  - Ne modifier que les fichiers listés dans "Fichiers impactés"
  - Une seule responsabilité par commit
  - Utiliser les patterns existants du codebase
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

| Fichier        | Action                       | Description |
| -------------- | ---------------------------- | ----------- |
| `path/file.ts` | MODIFIER / CRÉER / SUPPRIMER | [quoi]      |

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

- [ ] `path/file.ts` — [quoi changé]
- [ ] `path/file2.ts` — [quoi changé]

### Vérification

- [ ] Docs lues avant de coder
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
```
