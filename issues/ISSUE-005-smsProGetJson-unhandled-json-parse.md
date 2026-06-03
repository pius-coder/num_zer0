# Issue: `smsProGetJson` crash sur `NO_NUMBERS` — JSON.parse non protégé

**Date:** 2026-06-03
**Priorité:** Critique
**Statut:** Résolu
**Composant(s):** `convex/sms_provider.ts`
**Signalé par:** Bug report UI

---

## Description

Quand l'API SMS-Online.pro retourne des erreurs textuelles (ex: `NO_NUMBERS`, `NO_BALANCE`, `BAD_KEY`), `smsProGetJson()` tente un `JSON.parse()` sur ces chaînes non-JSON, ce qui lève une `SyntaxError`.

**Observation:**
> L'utilisateur voit l'erreur : `Unexpected token 'N', "NO_NUMBERS" is not valid JSON` dans l'interface. L'activation reste bloquée en statut `awaiting_number` et l'escrow n'est jamais remboursée.

**Attendu:**
> `NO_NUMBERS` doit être détecté → statut `no_numbers` + remboursement escrow. Les autres erreurs textuelles (`NO_BALANCE`, `BAD_KEY`, etc.) doivent être traitées par leur branche dédiée.

---

## Analyse Root Cause

La fonction `smsProGetJson()` (ligne 26-29) fait un `JSON.parse(text)` **sans aucun try/catch** :

```ts
async function smsProGetJson(params: Record<string, string>): Promise<any> {
  const text = await smsProGet(params)
  return JSON.parse(text)      // ← CRASH si text = 'NO_NUMBERS'
}
```

L'API V2 de SMS-Online.pro (endpoint `getNumberV2`) retourne des chaînes textuelles pour les erreurs :
- `NO_NUMBERS` → "Aucun numéro disponible"
- `NO_BALANCE` → "Solde épuisé"
- `BAD_KEY` → "Clé API invalide"

Ces réponses ne sont PAS du JSON. `JSON.parse('NO_NUMBERS')` lève une `SyntaxError`.

Cette exception atterrit dans le `catch` générique (lignes 253-262) qui **replanifie un poll** au lieu de traiter l'erreur. Conséquences :
1. L'activation boucle en retry perpétuel
2. L'escrow n'est **jamais remboursée**
3. L'utilisateur voit un message cryptique au lieu de "Aucun numéro disponible"

Le **même pattern existe dans le script de test** (`scripts/test_sms_provider.mjs:25-26`) qui, lui, est correct :
```ts
try { return JSON.parse(text) } catch { return text }
```

---

## ✅ Prompt de Correction

```yaml
guidelines:
  - LIRE le code source complet de sms_provider.ts avant de modifier
  - Utiliser le pattern déjà existant dans le codebase (getNumberQuantity, getTopCountries)
  - Ne modifier que la fonction smsProGetJson
  - Garder le typage cohérent (retourne `any` → peut être un objet ou une string)

steps:
  - Étape 1: Ajouter un try/catch dans smsProGetJson
    files: [convex/sms_provider.ts]

  - Étape 2: Vérifier que la logique existante (lignes 177-220) fonctionne correctement
    files: [convex/sms_provider.ts]

verification:
  - [ ] Le code source existant a été lu et compris
  - [ ] Les patterns existants (getNumberQuantity, getTopCountries) sont respectés
  - [ ] Test 1: `JSON.parse` ne crash plus sur 'NO_NUMBERS'
  - [ ] Test 2: Les branches NO_NUMBERS / NO_BALANCE / BAD_KEY sont atteignables
  - [ ] Test 3: Les réponses JSON valides passent toujours correctement
  - [ ] Lint & TypeScript pass
  - [ ] Build passe
```

---

## Fichiers impactés

| Fichier | Action | Description |
|---------|--------|-------------|
| `convex/sms_provider.ts` | MODIFIER | Ajouter try/catch dans `smsProGetJson` |

---

## Solution Appliquée

**Commit:** `8fd8701`
**Branche:** `v5`
**Date:** 2026-06-03 13:45

### Documentation préalable lue

- [x] `docs/` — N/A (pas de dossier docs/ dans convex/ ni components/whatsapp/)
- [x] Code source des fichiers impactés — `convex/sms_provider.ts` lu intégralement
- [x] Variables d'environnement / config — `SMSONLINEPRO_API_KEY` confirmé dans le code

### Analyse détaillée

Le bug a été trouvé en traçant le flux `pollActivation` (lignes 162-262) :

1. L'utilisateur initie une activation WhatsApp France
2. `pollActivation` appelle `smsProGetJson(params)` avec `action: 'getNumberV2'`
3. Le provider retourne `NO_NUMBERS` (pas de numéro disponible pour ce pays/service)
4. **`JSON.parse('NO_NUMBERS')` lève `SyntaxError`** car c'est du texte brut, pas du JSON
5. L'exception atterrit dans le `catch` générique (lignes 257-266)
6. Ce catch **replanifie un polling** au lieu de traiter l'erreur → boucle infinie
7. L'utilisateur voit `Unexpected token 'N', "NO_NUMBERS" is not valid JSON`
8. L'activation ne passe jamais en `no_numbers`, **l'escrow n'est pas remboursée**

Le `getNumberV2` endpoint retourne :
| Réponse | Type | Action attendue |
|---------|------|-----------------|
| `{ activationId, phoneNumber, ... }` | JSON | Démarrer statut `awaiting_sms` |
| `NO_NUMBERS` | string | `no_numbers` + refund escrow |
| `NO_BALANCE` | string | `expired` + refund escrow |
| `BAD_KEY` | string | `expired` + refund escrow |
| `WRONG_MAX_PRICE:N` | string | `max_price_too_low` + refund escrow |

Les 4 dernières réponses sont des strings, pas du JSON → `smsProGetJson` doit les passer intactes.

### Changements

```
Fonction smsProGetJson() :
  Avant : return JSON.parse(text)  ← crash si text n'est pas du JSON
  Après : try { return JSON.parse(text) } catch { return text }  ← résilient
```

Le pattern utilisé est déjà existant dans le même fichier :
- `getNumberQuantity` (ligne 539) : `try { ... } catch { return {} }`
- `getTopCountries` (ligne 564) : `try { ... } catch { return [] }`
- `test_sms_provider.mjs` (ligne 26) : `try { return JSON.parse(text) } catch { return text }`

### Fichiers modifiés

- [x] `convex/sms_provider.ts` — Ajout try/catch dans `smsProGetJson` (ligne 28-32)

### Vérification

- [x] Docs lues avant de coder (règle absolue respectée — pas de docs/ existant)
- [x] Code source lu et compris intégralement
- [x] Patterns existants respectés (getNumberQuantity, getTopCountries, test script)
- [x] TypeScript OK — le `any` de retour accepte déjà string|object
- [x] Build OK
