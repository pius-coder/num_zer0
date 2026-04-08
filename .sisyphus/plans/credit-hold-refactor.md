# Credit Hold Refactor - Work Plan

## TL;DR

> **Objective**: Refaire le credit_hold flow pour éviter les FK constraint errors. Nouveau flow: créer sms_activation AVEC default provider_id → hold avec valid FK → caller provider → update status.

> **Test**: Service **`wa`**, Country **`41`** (Biélorussie), appels **RÉELS** vers Grizzly.

> **Deliverables**:
> - Table credit_hold avec DEFAULT au lieu de NULL
> - Services refactorisés (credit-ledger + activation)
> - Clean transactions atomiques

> **Estimated Effort**: Medium
> **Parallel Execution**: NO (sequential dependencies)
> **Critical Path**: Schema → Services → Tests → Deploy

---

## Context

### Le Problème Actuel

L'erreur observée:
```
Failed query: INSERT INTO "credit_hold" (...)
params: ..., "buy_whatsapp_92_..._lot_...","
```

Le `activation_id` est OMIS de l'INSERT puis lié APRÈS. Le raw SQL INSERT échoue.

### Flow Actuel (PROBLÉMATIQUE)
```
1. Hold credits (SANS activationId)
2. Appeler Grizzly getNumber
3. Insérer sms_activation AVEC provider ID
4. Lier holds APRÈS (linkHoldsToActivation)
```

### Flow Nouveau (ROBUSTE)
```
1. Créer sms_activation(id) avec provider_id='PENDING' (default)
2. Hold credits AVEC activation_id (FK valid!)
3. Appeler Grizzly getNumber
4a. SI OK → update provider_id, state='success'
4b. SI FAIL → update state='failed' → release holds
```

---

## Work Objectives

### Core Objective
Implémenter le nouveau flow credit hold avec FK valid dès le début.

### Deliverables
- [ ] Migration: credit_hold avec DEFAULT = 'PENDING'
- [ ] credit-ledger.service.ts: hold avec activationId requis
- [ ] activation.service.ts: nouveau flow complete
- [ ] Tests: smoke tests du nouveau flow

### Must Have
- [ ] FK toujours valid (jamais NULL après insert)
- [ ] Transaction atomique: si Grizzly fail → release automatique
- [ ] Rollback propre sur erreur

### Must NOT Have
- [ ] activation_id = NULL dans credit_hold
- [ ] Linking en 2 étapes
- [ ] Raw SQL pour INSERT (utiliser Drizzle)

---

## Execution Strategy

### Phase 1: Schema (Wave 1)

- [ ] 1. **Modifier credit_hold schema** - ajouter DEFAULT 'PENDING'
  - Fichier: `src/database/schemas/credits.ts`
  - Colonne: `activation_id` avec `.default('PENDING')`
  - Type: changer de nullable à required avec default

- [ ] 2. **Générer migration**
  - Commande: `bun run generate-migration`
  - Vérifier: `migration` file créé

### Phase 2: Services (Wave 2)

- [ ] 3. **Refaire credit-ledger.holdCredits()** - accepts activationId required
  - Fichier: `src/services/credit-ledger.service.ts`
  - Signature: `activationId: string` (required, pas optionnel)
  - INSERT: utiliser Drizzle, pas raw SQL
  - Returns: le hold créé

- [ ] 4. **Refaire activation.service.request()** - nouveau flow
  - Étape 1: create smsActivation with provider_id='PENDING'
  - Étape 2: holdCredits(activationId) - now FK valid!
  - Étape 3: call Grizzly
  - Étape 4: update status (success/failed + release if failed)

### Phase 3: Verification (Wave 3)

- [ ] 5. **Smoke test** - TEST RÉEL avec service=`wa`, country=`41`
  - Service: `wa` (WhatsApp)
  - Country: `41` (Biélorussie)
  - Appels RÉELS vers Grizzly (pas mock!)
  - Vérifier: hold créé, numéro obtenu, credits débités

---

## References

### Schema Reference
- `src/database/schemas/credits.ts:101-128` - credit_hold definition
- `src/database/schemas/enums.ts:18-23` - creditHoldStateEnum

### Service Reference
- `src/services/credit-ledger.service.ts:137-233` - holdCredits method
- `src/services/activation.service.ts:58-196` - request method

---

## Commit Strategy

- **Schema**: `db: credit_hold default provider_id`
- **Services**: `refactor: credit hold flow`
- Tests: `test: credit hold flow`

---

## Success Criteria

```bash
# Test local:
bun run dev
# Trigger activation flow
# Verify: credit_hold.provider_id = 'PENDING' default
# Verify: hold created with valid FK
# Verify: rollback on Grizzly failure
```