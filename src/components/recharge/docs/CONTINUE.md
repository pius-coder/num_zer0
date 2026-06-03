# Continue — Recharge

## Current State

The recharge flow consists of two steps inside a bottom Sheet drawer:

1. **Step 0 (StepMethod)**: Select payment provider (MTN MoMo or Orange Money) — dark themed with orange accent
2. **Step 1 (StepTopUp)**: Enter amount with quick-select USD buttons, promo code, phone number, then pay — fully restyled to landing page dark palette

All three components (`step-topup.tsx`, `step-method.tsx`, `recharge-drawer.tsx`) now use the landing page design system:
- Orange accent `#F97316`
- Dark backgrounds `bg-[#121212]`
- Borders `border-[#292929]`
- White text with `text-white/65` for secondary
- Figtree font, consistent tracking/leading

## Known Issues

- Step 0 "Suivant" button only has `bg-[#F97316]` without the glow shadow that step 1's "Payer" button has (`shadow-[0_0_30px_-8px_#F97316]`)
- The two visual steps are managed via local `step` state — should eventually use URL search params for deep linking

## Next Steps

- Verify visual rendering in dev (`http://localhost:3001`)
- Add `shadow-[0_0_30px_-8px_#F97316]` to the step 0 "Suivant" button for consistency
- Consider using URL search params (`?step=0|1&method=mtn_momo`) for shareable state
