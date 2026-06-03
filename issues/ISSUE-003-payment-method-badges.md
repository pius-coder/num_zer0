# Issue: Style des méthodes de paiement — retrait du cadre carte pour badges simples

**Date:** 2026-06-03
**Priorité:** Haute
**Statut:** Résolu
**Composant(s):** `src/components/recharge/step-method.tsx`, `src/components/recharge/payment-methods.ts`, `src/components/recharge/index.ts`
**Signalé par:** Utilisateur

---

## Description

Le composant `StepMethod` affiche les options de paiement (MTN MoMo, Orange Money) sous forme de **cartes plein-largeur** avec icône dans un conteneur coloré, texte + description, et indicateur de check.

L'utilisateur demande que ce soit **exactement comme sur la landing page** — où les logos sont affichés comme de simples **badges images** sans cadre, sans texte, sans check.

**Observation:**
> Les options de paiement s'affichent en cartes avec fond coloré, label, description, cercle de check — trop lourd, ne correspond pas au style de la landing page CTA section.

**Attendu:**
> Les options doivent être de simples badges cliquables (images seules avec rotation), identiques à l'affichage dans `src/components/landing/cta-section.tsx`.

---

## Analyse Root Cause

Deux problèmes distincts :

1. **Chemin d'images inexistant** dans `payment-methods.ts` : les icônes pointaient vers `/mtn-logo.jpg` et `/orange-logo.png` qui n'existent pas dans `public/`. Les vraies images sont dans `public/brand/momo.png` et `public/brand/om.png` (déjà utilisées par la landing page).

2. **Composant `step-method.tsx` sur-ingéniéré** : il utilisait `PaymentMethodCard` (conteneur carte avec rounded-xl, padding, gap, fond coloré), `PaymentMethodIcon` (wrapper icône avec fallback Wallet), et `PaymentMethodCheck` (cercle de validation). La landing page montre juste une `<img>` avec `rounded-lg` et rotation.

---

## ✅ Prompt de Correction

```yaml
guidelines:
  - LIRE les fichiers docs/ du composant (CONTINUE.md, TODOS.md, CHANGELOG.md)
  - LIRE le code source complet des fichiers impactés avant de modifier
  - LIRE les variables d'environnement et la configuration
  - CHERCHER les patterns existants dans le codebase
  - Ne modifier que les fichiers listés dans "Fichiers impactés"
  - Une seule responsabilité par commit
  - Utiliser les patterns existants du codebase (copier pas réinventer)
  - TypeScript strict — pas de `any`

steps:
  - Étape 1: Corriger les chemins d'images dans payment-methods.ts
    files: [src/components/recharge/payment-methods.ts]
    action: |
      Remplacer '/mtn-logo.jpg' → '/brand/momo.png'
      Remplacer '/orange-logo.png' → '/brand/om.png'

  - Étape 2: Simplifier step-method.tsx — remplacer PaymentMethodCard par des badges images
    files: [src/components/recharge/step-method.tsx]
    action: |
      Supprimer l'import de PaymentMethodCard
      Remplacer le layout `max-w-md space-y-2.5` par `flex items-center justify-center gap-2`
      Chaque méthode devient un <button> contenant une <img> avec rounded-lg
      Ajouter rotation (2deg / -2deg) comme sur la landing page
      État actif = ring-2 ring-[#25D366]

  - Étape 3: Nettoyer les exports inutilisés dans index.ts
    files: [src/components/recharge/index.ts]
    action: |
      Retirer les exports PaymentMethodCard, PaymentMethodIcon, PaymentMethodCheck
      (plus rien ne les importe)

verification:
  - [ ] Les docs du composant ont été lues avant d'écrire du code
  - [ ] Le code source existant a été lu et compris
  - [ ] Les patterns existants sont respectés (copié du cta-section.tsx)
  - [ ] Test 1: TypeScript check — `npx tsc --noEmit` ne montre que les erreurs préexistantes
  - [ ] Test 2: Lint — `bun run lint` ne montre que les erreurs préexistantes
  - [ ] Test 3: Les images MTN MoMo et Orange Money s'affichent correctement
  - [ ] Lint & TypeScript pass
  - [ ] Build passe
```

---

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `src/components/recharge/payment-methods.ts` | MODIFIER | Corriger les chemins d'images (mtn-logo.jpg → brand/momo.png, orange-logo.png → brand/om.png) |
| `src/components/recharge/step-method.tsx` | MODIFIER | Remplacer les cartes (PaymentMethodCard) par des badges images simples comme sur la landing page |
| `src/components/recharge/index.ts` | MODIFIER | Retirer les exports PaymentMethodCard, PaymentMethodIcon, PaymentMethodCheck devenus inutilisés |

---

## Solution Appliquée

**Commit:** `N/A` (changes made directly)
**Branche:** `main`
**Date:** 2026-06-03

### Documentation préalable lue

- [ ] `docs/CONTINUE.md` — inexistant pour recharge
- [ ] `docs/TODOS.md` — inexistant pour recharge
- [ ] `docs/CHANGELOG.md` — inexistant pour recharge
- [x] Code source des fichiers impactés — confirmé
- [x] Variables d'environnement / config — non nécessaire

### Changements

```
Trois modifications :

1. payment-methods.ts — correction des chemins d'images :
   - /mtn-logo.jpg → /brand/momo.png (fichier existant dans public/)
   - /orange-logo.png → /brand/om.png (fichier existant dans public/)

2. step-method.tsx — remplacement complet du rendu :
   - Suppression de l'import PaymentMethodCard
   - Nouveau layout en flex row centré avec gap-2 (au lieu de max-w-md space-y-2.5)
   - Chaque méthode rendue comme <button> contenant une <img> avec rounded-lg
   - Rotation appliquée : 2deg pour OM, -2deg pour MoMo (identique landing page)
   - État sélectionné : ring-2 ring-[#25D366] (au lieu du check + scale)
   - Animation hover:scale-105 au survol

3. index.ts — nettoyage des exports morts :
   - Retiré PaymentMethodCard, PaymentMethodIcon, PaymentMethodCheck
   - Conservé RechargeDrawer, RechargeTriggerButton, StepMethod, PaymentMethod, METHODS
```

### Fichiers modifiés

- [x] `src/components/recharge/payment-methods.ts` — 2 chemins d'images corrigés
- [x] `src/components/recharge/step-method.tsx` — refonte complète du rendu (61→49 lignes)
- [x] `src/components/recharge/index.ts` — retrait de 3 exports inutilisés

### Vérification

- [x] Docs lues avant de coder (règle absolue respectée)
- [x] TypeScript check — 3 erreurs préexistantes uniquement
- [x] Lint — 3 erreurs préexistantes uniquement
- [x] Pattern respecté — copié du `cta-section.tsx` de la landing page
- [x] Logs dev non ajoutés (aucun changement de logging)
