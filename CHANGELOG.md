# Aura — Changelog

> Log incrémental de toutes les modifications.
> Format: `YYYY-MM-DD | Phase N | [Ajouté/Modifié/Supprimé/Déprécié]`

---

## 2026-05-24 | Phase 0 | Ajouté

**Système de tracking pour reprise de contexte**

- `TRACKER.md` — Fichier source de vérité. Contient l'architecture complète, todo list, état d'avancement, décisions contraignantes, et prochaine action.
- `CHANGELOG.md` — CE FICHIER. Log incrémental de chaque modification avec l'ancienne motivation vs nouvelle motivation.

**Motivation initiale :**
> Le contexte de l'IA se réinitialise à chaque session. Impossible de travailler sur un projet complexe sans un fichier qui stocke l'état exact et les décisions. TRACKER.md sert de "mémoire externe".

---

## Prochaines entrées prévues

```
YYYY-MM-DD | Phase 1 | Ajouté
  Structure monorepo (root workspace, packages/aura, apps/app)
  
YYYY-MM-DD | Phase 2 | Modifié
  Migration du framework aura dans packages/aura
  Ancien: src/aura/ (dans le projet)
  Nouveau: packages/aura/src/ (workspace package @aura-js/core)
  
YYYY-MM-DD | Phase 3 | Modifié
  Migration de l'app dans apps/app avec code-based router
  Ancien: routes file-based
  Nouveau: routes code-based dans router.tsx
```
