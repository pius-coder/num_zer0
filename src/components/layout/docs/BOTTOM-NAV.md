# Mobile Bottom Nav — Reusable Drawer System

## Architecture

The bottom nav is a **generic drawer/panel system**, not just a nav menu. It consists of:

```
BottomNavProvider (context)
  ├─ MobileBottomNav      (mobile: md:hidden, pill fixed bottom-right)
  └─ DesktopDrawerProxy   (desktop: md:+, renders a Sheet/modal)
```

They share state via `useBottomNav()` — callers don't care which is showing.

## Provider (`bottom-nav-store.tsx`)

Wraps the app layout. Exports:

```ts
const { isOpen, activePanel, panelProps, openPanel, closePanel, toggleNav } = useBottomNav()
```

### PanelId
```ts
type PanelId = 'nav' | 'recharge' | 'topup' | null
```

### openPanel(panel, props?)
- `panel: PanelId` — which panel to show
- `props?: Record<string, unknown>` — arbitrary data passed to the panel (e.g. `{ amount: 5000 }`)

### closePanel()
Closes the drawer (sets `activePanel = null`, `isOpen = false`).

### toggleNav()
Shorthand for `openPanel('nav')`.

## Mobile (`mobile-bottom-nav.tsx`)

Responsive pill fixed at `right-3 bottom-3`:
- **Closed**: shows `$USD` balance + `+` (recharge) + hamburger icon
- **Open**: panel slides up inside the same pill container (max height 560px)

### Panels rendered inside the pill

| `activePanel` | Component | Description |
|---------------|-----------|-------------|
| `'nav'`       | `NavPanel` | 5 links: Mon Espace, Portefeuille, Compte, Recharger, Support |
| `'recharge'`  | `RechargePanel` | Full `StepTopUp` form inside the pill |
| `'topup'`     | `RechargePanel` | Same form but with `topUpAmount` preset from `panelProps.amount` |

### Panel switching
The `toggleNav()` / hamburger button opens `'nav'`. Other code opens `'recharge'` or `'topup'` directly.

## Desktop (`desktop-drawer-proxy.tsx`)

Renders a `RechargeDrawer` (Sheet/side panel) for desktop breakpoint (`>= 768px`).
Only handles `'recharge'` and `'topup'` — `'nav'` is mobile-only.

## How other components call it

### Open the recharge panel
```tsx
const { openPanel } = useBottomNav()
openPanel('recharge')

// Preset amount for a service
openPanel('topup', { amount: country.priceXaf })
```

### Existing callers

| File | Action | Panel |
|------|--------|-------|
| `wallet-page-shell.tsx` | "Recharger" button | `'recharge'` |
| `recharge-trigger-button.tsx` | Buy button on a package card | `'recharge'` |
| `routes/(app)/recharge.tsx` | Recharge route page | `'recharge'` |
| `my-space-page.tsx` | "Buy this number" on a country row | `'topup'` with `{ amount }` |

## Key CSS details

- Pill: `rounded-[18px]`, `bg-[var(--surface)]`, `backdrop-blur-xl`, `border-[var(--line)]/50`
- Shadow: layered `box-shadow` for Apple-style glass effect
- Transition: `duration-500 ease-out` for open/close animation
- `style={{ maxHeight: isOpen ? '560px' : '52px' }}` — animates height; the pill stays in same position

## Adding a new panel

1. Add the panel ID to `PanelId` type in `bottom-nav-store.tsx`
2. Add the panel JSX inside `mobile-bottom-nav.tsx` under the `activePanel ===` check
3. Optionally add desktop equivalent in `desktop-drawer-proxy.tsx`
4. Call `openPanel('<new-panel-id>', { ...props })` from anywhere

## TL;DR mental model

One context + two UI shells (mobile pill, desktop sheet). Consumers just call `openPanel()` and don't care which shell renders the content.
