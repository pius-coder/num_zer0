# Bug: Identifiant invité généré sans suffixe (format invalide)

**Date:** 2026-06-03
**Sévérité:** Critique
**Composant:** `src/common/guest-identifier.ts`
**Signalé par:** Test QA

## Description

Quand un utilisateur clique sur "Générer mon identifiant" dans le flux invité (`/auth-splash`), l'identifiant généré est parfois incomplet — il manque des caractères après le point. Exemple : `azure.` au lieu de `azure.x7k9`. En cliquant sur "Créer et accéder", le message d'erreur `"Format d'identifiant invité invalide"` s'affiche car la regex `/^[a-z]+\.[a-z0-9]{4}$/` rejette l'identifiant.

## Root Cause

La fonction `randomSuffix()` dans `guest-identifier.ts` a un bug d'indexation :

```typescript
const chars = 'abcdefghjkmnpqrstuvwxyz23456789'   // 31 chars
const maxValid = Math.floor(256 / chars.length) * chars.length  // = 248
// ...
result[i] = chars[b]  // b est 0-247, mais chars n'a que les indices 0-30 !
```

Le tableau `chars` a **31 caractères** (indices 0-30), mais `b` peut valoir de **0 à 247** (après le rejection sampling). Donc `chars[b]` retourne `undefined` pour `b >= 31` (217 valeurs sur 248 possibles ≈ 87.5% de chance).

La probabilité que les 4 caractères soient valides est de seulement `(31/248)^4 ≈ 0.024%`.

## Correction

Remplacer `chars[b]` par `chars[b % chars.length]` pour que l'index soit toujours dans les limites du tableau.

**Fichier:** `src/common/guest-identifier.ts` ligne 45
**Correctif:** `result[i] = chars[b % chars.length]`

## Test

- 50 000 générations avec la correction : **0 échec**
- 100% des suffixes font exactement 4 caractères
- Tous les identifiants passent la regex `IDENTIFIER_REGEX`
