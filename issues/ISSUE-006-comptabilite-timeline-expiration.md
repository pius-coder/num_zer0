# Issue: 4 bugs flux activation — comptabilité (double refund), timeline (done=false), expiration 20 min

**Date:** 2026-06-03
**Priorité:** Critique
**Statut:** Ouvert
**Composant(s):** `convex/sms_provider.ts`, `src/components/spa/my-space-page.tsx`
**Signalé par:** glace.45e8@numzer0.app (solde: 8.33→10.83) + observation UI timeline

---

## Description

4 bugs distincts dans le flux d'activation WhatsApp, tous visibles sur l'activation de glace.45e8.

**Bug #1 — Timeline "Numéro attribué" toujours vert**
La TimelineLine pour "Numéro attribué" a `done` en dur à `true`. Même si le numéro a expiré, que l'activation est annulée, ou qu'aucun numéro n'a été reçu, la coche reste verte.

**Bug #2 — Double remboursement dans refundEscrow**
`refundEscrow()` crée une pièce inverse (lignes 329-337) qui crédite le compte utilisateur, PUIS appelle `annulerPiece()` (lignes 339-341) sur la pièce d'escrow originale. `annulerPiece` inverse chaque ligne de la pièce originale, ce qui crédite l'utilisateur UNE DEUXIÈME FOIS. Résultat : l'utilisateur reçoit 2× le montant.

**Bug #3 — Activation gratuite dans completeActivation**
`completeActivation()` crée une pièce qui distribue l'escrow (702-marge, 471-fournisseur), PUIS appelle `annulerPiece()` sur l'escrow original (lignes 392-394). L'utilisateur récupère son argent + reçoit le service = gratuit.

**Bug #4 — Expiration 20 min non gérée proprement**
Les numéros SMS-Online.pro ont une durée de validité de 20 minutes. `pollActivation()` ne vérifie pas `rentEndTime` pour détecter les expirations. De plus, `ACTIVATION_TIMEOUT_MS = 15 min` est plus court que les 20 min du provider, ce qui coupe le polling avant l'expiration réelle.

**Observation:**
> UI : "Numéro attribué ✓" en vert mais "En attente…" en texte
> Compta : solde glace.45e8 = 10.83 XAF au lieu de 8.33 XAF (dépôt initial)
> Activation : bloquée indéfiniment, ni remboursée ni complétée

**Attendu:**
> ✓ Timeline reflète le statut réel (non attribué = pas vert)
> ✓ refundEscrow crédite 1× l'utilisateur (pas de double)
> ✓ completeActivation consomme l'escrow sans rembourser
> ✓ L'expiration 20 min est détectée et gérée proprement

---

## Analyse Root Cause

### Bug #1 — done={true} en dur (my-space-page.tsx:517)
```tsx
<TimelineLine
  done                                          // ← true en dur, TOUJOURS vert
  label="Numéro attribué"
  value={activation.phoneNumber ?? 'En attente…'}
/>
```
Le `done` devrait être conditionnel : vrai SEULEMENT si le numéro a été attribué ET que l'activation est encore active.
```tsx
// Comparaison avec les autres timeline items :
done={activation.status === 'sms_received'}       // SMS reçu ✓
done={activation.status === 'completed'}          // Activation terminée ✓
done                                              // Numéro attribué — TOUJOURS vert ✗
```

### Bug #2 — createPiece + annulerPiece = 2 crédits (sms_provider.ts:329-341)
La pièce d'escrow originale (dans `initiateActivation`, lignes 120-128) :
```
411-user: credit  → debitCompte => solde -= montant  (soustraction)
471-escrow: debit → creditCompte => solde += montant
```

`refundEscrow` crée une pièce inverse :
```
471-escrow: credit → debitCompte => 471 -= montant
411-user: debit    → creditCompte => 411 += montant  → 1er REMBOURSEMENT ✓
```

Puis `annulerPiece` sur l'original :
- Original `411-user: credit` (soustrayait) → `creditCompte` (AJOUTE) → 2e REMBOURSEMENT ✗
- Original `471-escrow: debit` (ajoutait) → `debitCompte` (enlève) → solde 471 re-diminué

**Résultat :** L'utilisateur est crédité 2×.

### Bug #3 — annulerPiece dans completeActivation (sms_provider.ts:392-394)
```
createPiece (distribution escrow) :
  471-escrow: credit → 471 -= montant
  702-marge: debit   → 702 += marge
  471-fournisseur: debit → 471-fournisseur += cout fournisseur

annulerPiece (sur l'original) :
  Original 411-user: credit → creditCompte => 411 += montant → REMBOURSEMENT ✗
  Original 471-escrow: debit → debitCompte => 471 -= montant
```
L'utilisateur est remboursé ET reçoit le service. Gratuit.

### Bug #4 — Absence de vérification rentEndTime (sms_provider.ts:141-267)
- `ACTIVATION_TIMEOUT_MS = 15 * 60 * 1000` (15 min) — trop court (provider = 20 min)
- `rentEndTime` est stocké (ligne 191 : `activationTime + 20 min`) mais jamais vérifié
- Si le provider retourne `STATUS_CANCEL`, le cas est géré (lignes 249-254) mais avec `refundEscrow` qui double le refund (Bug #2)
- Si le polling s'arrête à 15 min (timeout), l'expiration réelle à 20 min n'est jamais détectée

---

## ✅ Prompt de Correction

```yaml
guidelines:
  - LIRE le code source complet des fichiers impactés avant de modifier
  - LIRE les fichiers docs/ du feature concerné
  - CHERCHER les patterns existants dans le codebase
  - Ne modifier que les fichiers listés dans "Fichiers impactés"
  - Une seule responsabilité par commit
  - TypeScript strict — pas de `any`

steps:
  - Étape 1: Timeline — Rendre `done` conditionnel dans my-space-page.tsx
    files: [src/components/spa/my-space-page.tsx]

  - Étape 2: Double refund — Supprimer `annulerPiece` dans refundEscrow
    files: [convex/sms_provider.ts]

  - Étape 3: Activation gratuite — Supprimer `annulerPiece` dans completeActivation
    files: [convex/sms_provider.ts]

  - Étape 4: Expiration 20 min — Vérifier rentEndTime dans pollActivation + ajuster ACTIVATION_TIMEOUT_MS
    files: [convex/sms_provider.ts]

verification:
  - [ ] Les docs du composant ont été lues avant d'écrire du code
  - [ ] Le code source existant a été lu et compris
  - [ ] Les patterns existants sont respectés
  - [ ] Test 1: Timeline "Numéro attribué" n'est PAS vert si statut = awaiting_number / no_numbers / expired / cancelled
  - [ ] Test 2: refundEscrow crédite l'utilisateur 1× (pas de double)
  - [ ] Test 3: completeActivation ne rembourse pas l'utilisateur
  - [ ] Test 4: Expiration à 20 min détectée → statut expired + refund (1×)
  - [ ] Lint & TypeScript pass
  - [ ] Build passe
```

---

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `convex/sms_provider.ts` | MODIFIER | Bugs #2, #3, #4 — supprimer annulerPiece + ajouter check rentEndTime |
| `src/components/spa/my-space-page.tsx` | MODIFIER | Bug #1 — rendre done conditionnel |

---

## Solution Appliquée

**Commit:** `—`
**Branche:** `—`
**Date:** —

### Vérification

- [ ] Docs lues avant de coder
- [ ] Code source lu
- [ ] Patterns respectés
- [ ] Test manuel OK
- [ ] Lint OK
- [ ] TypeScript OK
- [ ] Build OK
```
