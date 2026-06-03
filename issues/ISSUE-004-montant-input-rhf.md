# Issue: Montant input — controlled → uncontrolled avec RHF + Zod

**Date:** 2026-06-03
**Priorité:** Haute
**Statut:** Ouvert
**Composant(s):** `src/components/recharge/step-topup.tsx`, `src/components/recharge/recharge-drawer.tsx`
**Signalé par:** [utilisateur]

---

## Description

Le champ "Montant (FCFA)" est un **input contrôlé** avec `value={amount}` + clamping `Math.max(1500, Number(e.target.value))`. Cela crée un **blocage UX** : l'utilisateur ne peut pas effacer les caractères librement.

**Observation:**
- Au chargement, le champ affiche `1500`
- Si l'utilisateur efface un chiffre (ex: "1500" → "150"), la valeur est immédiatement clampée à 1500 → rien ne se passe visuellement
- L'utilisateur peut ajouter des chiffres à la fin (ex: "15000") et les effacer, mais pas toucher aux 4 chiffres d'origine
- Impossible de taper un montant en partant de zéro — il faut écraser la valeur existante
- Le `min={1500}` HTML ne bloque que les flèches du stepper, pas la saisie clavier

**Attendu:**
- L'utilisateur doit pouvoir taper et effacer librement n'importe quel chiffre
- La validation du minimum (1 500 FCFA) doit se faire au **submit** ou **blur**, pas en temps réel dans l'`onChange`
- Le champ doit être **uncontrolled** avec `defaultValue`, validé par Zod + React Hook Form

---

## Analyse Root Cause

L'input est contrôlé avec `value={amount}` et le handler `onChange` clamps immédiatement :

```tsx
// step-topup.tsx ~ligne 56
<input
  type="number"
  min={1500}
  value={amount}
  onChange={(e) => setAmount(Math.max(1500, Number(e.target.value)))}
/>
```

**Problème technique :** React ne peut pas gérer d'état intermédiaire avec un input contrôlé + clamping. Quand l'utilisateur tape "1", `Number("1")` = 1, `Math.max(1500, 1)` = 1500, donc le champ saute à "1500". L'utilisateur n'a **jamais** le contrôle du curseur ou du contenu.

**Problème UX :** L'utilisateur croit que le champ est cassé car ses actions (effacer) n'ont aucun effet visuel.

---

## ✅ Prompt de Correction

```yaml
# RAPPEL OBLIGATOIRE AVANT D'EXÉCUTER CE PROMPT :
# Lire docs → Lire code → Lire config → Chercher patterns → Lire règles → Coder
# (voir RÈGLE ABSOLUE en haut de TEMPLATE.md)

guidelines:
  - LIRE les fichiers docs/ du composant recharge (CONTINUE.md, TODOS.md, CHANGELOG.md)
  - LIRE le code source complet des fichiers impactés avant de modifier
  - CHERCHER les patterns react-hook-form existants (account-type-chooser.tsx, login-splash.tsx)
  - Ne modifier que les fichiers listés dans "Fichiers impactés"
  - Utiliser les mêmes patterns que les formulaires existants (register, handleSubmit)
  - Garder le calcul USD en temps réel via watch()
  - TypeScript strict — pas de `any`
  - Ne JAMAIS supposer ce qu'une fonction/variable fait — lire son code

steps:
  - Étape 1: Installer les dépendances manquantes
    description: >
      zod et @hookform/resolvers ne sont pas installés.
      Commande: `bun add zod @hookform/resolvers`
    files: [package.json]

  - Étape 2: Refactorer StepTopUp — remplacer le useState contrôlé par react-hook-form + Zod
    description: >
      - Remplacer `const [amount, setAmount] = useState(initialAmount)` par un useForm
        avec defaultValues: { amount: initialAmount, phone: '', promoCode: '' }
      - Définir un schéma Zod avec z.number().min(1500, 'Minimum 1 500 FCFA')
      - Utiliser register('amount') au lieu de value/onChange
      - Le champ devient uncontrolled — plus de clamping en temps réel
      - Le calcul USD en bas utilise watch('amount')
      - Le bouton "Payer" utilise watch('amount') pour l'affichage
      - La validation se fait au submit via handleSubmit
      - Garder le `disabled={amount < 1500}` sur le bouton → remplacer par
        validation du formState
    files: [src/components/recharge/step-topup.tsx]

  - Étape 3: Adapter RechargeDrawer si nécessaire
    description: >
      Vérifier que l'interface n'a pas changé de manière incompatible.
      StepTopUp reçoit toujours initialAmount et onPay — seulement
      la gestion interne change.
    files: [src/components/recharge/recharge-drawer.tsx]

verification:
  - [ ] Les docs du composant recharge ont été lues avant d'écrire du code
  - [ ] Le code source existant a été lu et compris
  - [ ] Les patterns react-hook-form existants sont respectés
  - [ ] Test 1: Saisir "1000" → le champ affiche "1000" (pas de clamping)
  - [ ] Test 2: Effacer tous les chiffres → le champ est vide (pas de reset forcé)
  - [ ] Test 3: Saisir "1500" → bouton "Payer" actif
  - [ ] Test 4: Saisir "500" et submit → message d'erreur Zod "Minimum 1 500 FCFA"
  - [ ] Test 5: Calcul USD se met à jour en temps réel pendant la saisie
  - [ ] Test 6: Le code promo et le téléphone fonctionnent toujours
  - [ ] Lint & TypeScript pass
  - [ ] Build passe
```

---

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `package.json` | MODIFIER | Ajouter `zod` et `@hookform/resolvers` |
| `src/components/recharge/step-topup.tsx` | MODIFIER | Refactor complet : remplacer useState contrôlé par RHF + Zod |
| `src/components/recharge/recharge-drawer.tsx` | À VÉRIFIER | Aucun changement d'interface attendu |

---

## Solution Appliquée

*[À remplir après correction]*

**Commit:** `[hash]`
**Branche:** `[branche]`
**Date:** YYYY-MM-DD HH:mm

### Documentation préalable lue

- [ ] `docs/CONTINUE.md` — *[à remplir]*
- [ ] `docs/TODOS.md` — *[à remplir]*
- [ ] `docs/CHANGELOG.md` — *[à remplir]*
- [ ] Code source des fichiers impactés — *[confirmé]*
- [ ] Variables d'environnement / config — *[confirmé]*

### Changements

```
[description des changements]
```

### Fichiers modifiés

- [ ] `package.json` — ajout de `zod`, `@hookform/resolvers`
- [ ] `src/components/recharge/step-topup.tsx` — refactor RHF + Zod

### Vérification

- [ ] Docs lues avant de coder (règle absolue respectée)
- [ ] Test manuel OK
- [ ] Lint OK
- [ ] TypeScript OK
- [ ] Build OK
