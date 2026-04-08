# Draft: Fix Activation Flow - Number Display & Sheet UX

## Requirements (confirmed)
- After purchase, go DIRECTLY to "waiting for SMS" view with number displayed (copyable)
- Current problem: Shows "Demandé" status card instead of the proper waiting-for-SMS experience
- Cancel detection: Check if activation number is still available via Grizzly — if not available, it was cancelled
- Cancel button: Active only after 5 minutes (Grizzly's cooldown period)
- Number must be copyable in waiting state
- Clicking activation card opens a Sheet (Custom pattern like CountryDrawer, NOT Radix Sheet)
- Sheet replaces ConfirmDialog — purchase confirm step becomes a step inside the Sheet

## User Decisions (confirmed)
1. **Sheet Pattern**: Custom Sheet like CountryDrawer (CSS transforms, not Radix)
2. **Purchase Flow**: Sheet d'activation direct — remplace le ConfirmDialog. Etape de confirmation = mini-step dans le Sheet.
3. **Timer**: Bouton "Annuler" desactivé pendant 5 min (cooldown Grizzly), puis actif. Pas de countdown visible — juste un timer qui rend le bouton actif.
4. **Cancel Detection**: Verifier si le numero est toujours disponible via Grizzly. Si plus disponible = annulé. Utilisateurs n'accedent pas a Grizzly.

## Research Findings (complete)

### Grizzly API Status Flow
- `getStatus()` v1: Returns text statuses including `STATUS_CANCEL` — **THIS IS HOW WE DETECT CANCELLATION**
- `getStatusV2()`: Returns JSON with `verificationType` and `sms` object — **DOES NOT include cancel status**
- Current app only uses `getStatusV2()` → misses cancellations
- **Fix**: Call both `getStatus()` v1 and `getStatusV2()`, or better: just use `getStatus()` v1 which returns `STATUS_CANCEL`

### App Status Mapping
- DB enum: `requested → assigned → waiting → received → completed → expired → cancelled → cancelled_no_refund → failed → refunded`
- UI STATE_CONFIG only handles: `requested`, `assigned`, `completed`, `cancelled`, `expired`
- `waiting` is a valid DB state but UI maps it same as `assigned`
- The `requested` state is the problem — it's a transient DB state before Grizzly returns the number

### Current Components
- `ConfirmDialog` — Custom modal, two phases: confirm → active
- `ActivationActiveView` — Shows phone number + "En attente du SMS..." + retry/cancel buttons
- `ActiveActivationCard` — Card in ActivationsList with state icons and pulse bar
- `CountryDrawer` — Custom bottom sheet with CSS transform animations
- `RechargeDrawer` — Radix Sheet (different pattern)
- No countdown timer component exists
- `timerExpiresAt` exists in DB but is NOT exposed to UI

### Key Discovery: Grizzly cancel behavior
- Grizzly allows cancel after `setStatus(id, 1)` (ACCESS_READY) is called
- Cancel codes: -1 (before READY) or 8 (after READY)
- Our app calls `setStatus(id, 1)` immediately after `getNumberV2` — so cancel with code 8 applies
- Grizzly has a 5-minute cooldown before cancel is possible
- **IMPORTANT**: The cancel detection should use `getStatus()` v1 which returns `STATUS_CANCEL`

### Polling
- `useActivation(id)` polls every 2s for SMS code
- `useActivationsList()` polls every 5s for list
- Both stop polling in terminal states
- **Missing**: No poll for cancellation detection

## Scope Boundaries
- INCLUDE: Activation Sheet (replaces ConfirmDialog), cancel detection via getStatus v1, cancel button with 5-min cooldown, copyable number, proper state display
- EXCLUDE: Payment/credit flow changes, admin dashboard changes, Grizzly API wrapper changes