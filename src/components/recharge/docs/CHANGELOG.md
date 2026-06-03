# Changelog — Recharge

## 2026-06-03

### Migrated entire flow to landing page dark theme (orange #F97316 accent)

- **step-topup.tsx**: Restyled with landing page palette — invisible input with handwritten SVG underline, quick-select USD buttons ($5/$10/$20/$50) as orange pills, CTA buttons with orange glow (`shadow-[0_0_30px_-8px_#F97316]`), dark backgrounds (`#121212`/`#171717`), borders `#292929`. Fixed TS error with `z.input<typeof topUpSchema>` for zod v4 compatibility.
- **step-method.tsx**: Replaced `--sea-ink` / `--sea-ink-soft` with `text-white` / `text-white/65`, changed selection ring from green (`#25D366`) to orange (`#F97316`).
- **recharge-drawer.tsx**: Added `bg-[#121212]` to `SheetContent` for dark drawer background, migrated `SheetHeader` subtitle from `--sea-ink-soft` to `text-white/65`.
- Moved "Recharger mon solde" heading from `text-center` to `text-right`.
- Reverted heading to `text-center`, moved "Payer" button from bottom to top-right bar alongside "← Retour".
- Added handwritten SVG squiggly underline to promo code and phone number inputs for visual consistency.
- Fixed button texture: replaced static `shadow` with `anim-glow-pulse` + `hover:brightness-110` + `transition-all duration-200` on both "Suivant" and "Payer" buttons to match landing page style.
