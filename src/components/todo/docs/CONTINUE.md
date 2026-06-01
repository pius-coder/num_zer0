# Todo — Continue Guide

## Current State

Complete SPA (Single Page Application) todo app at `/app`:
- **No page scroll** — `h-screen overflow-hidden`, internal content scrolls
- **2 views**: Dashboard (stats) and Tasks (management), switched via hamburger menu
- **Bottom nav**: N0 brand at bottom-left (navbar pill style), hamburger FAB at bottom-right
- **Landing design system** used exhaustively: 100% of class patterns extracted from all landing components

## Design Patterns Used (from landing page)

### Layout
- `h-screen overflow-hidden` — SPA no-scroll shell
- `flex-1 overflow-y-auto` — scrollable content area
- Alternating warm/dark sections (dashboard=warm, tasks=dark)
- `max-w-[640px] mx-auto` content constraint

### Navbar (bottom placement)
- `fixed bottom-3 left-3 z-10 md:left-6 md:bottom-6`
- `border border-dark-700 bg-dark-800 rounded-[16px] md:rounded-[72px]`
- Shadow: exactly match landing navbar shadow
- N0 logo: `font-figtree font-bold text-[22px] text-[#25D366] md:text-xl`

### Floating Hamburger FAB
- `fixed bottom-3 right-3 z-10 w-14 h-14 rounded-full border border-dark-700 bg-dark-800`
- `md:bottom-6 md:right-6 hover:brightness-110 transition-all`
- Inspired by landing WhatsApp cart button

### Menu Overlay
- `backdrop-blur-sm bg-black/60` overlay
- Menu card: `border border-dark-700 bg-dark-800 rounded-[16px] md:rounded-[72px]`
- Menu items: `font-figtree font-medium text-[32px] tracking-[-0.04em] leading-[1.4] text-white`
- Orange CTA: `rounded-[14px] bg-[#F97316] anim-glow-pulse`
- Close button: `border border-dark-700 bg-dark-700` with inner shadow

### Dashboard (warm bg)
- Dots background: `radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.5)_1px,transparent_0)`
- Border accent: `border border-dashed border-dark-900/12`
- Badge pill: `border border-dashed border-dark-900/20 rounded-[25px]` + green dot anim-pulse-dot
- H1: `font-serif font-bold text-[clamp(48px,8vw,64px)] tracking-[-4.5px] leading-[1.1]`
- Highlight: `background:linear-gradient(100deg,transparent 0%,transparent 5%,rgba(37,211,102,0.3) 5%,...`
- Description: `font-figtree font-medium text-[17px] tracking-[-0.025em] leading-[1.4] text-dark-900/75`
- Stats cards: `rounded-[12px] px-[18px] py-[14px] border border-black/8` with green checkmark
- Progress ring: `anim-float` / hidden on mobile `xl:block` / shown below on mobile `xl:hidden`
- Tip card: `border border-dark-900/20 rounded-[26px] md:rounded-[44px]` with gradient overlay
- Ticker: `anim-ticker-reverse` (country-flags pattern)

### Tasks (dark bg)
- Badge: `border border-dashed border-white/20 rounded-full` + green dot shadow anim-pulse-dot
- H2: `font-figtree text-[32px] font-[400] tracking-[-0.04em] leading-[1.1] md:text-[44px]`
- Description: `font-figtree font-medium text-[16px] tracking-[-0.3px] leading-[1.5] text-white/65 md:text-[18px]`
- Filter pills: `rounded-full border border-dashed transition-colors` / active: `bg-white/10`
- Search: `border border-[#292929] bg-dark-800 rounded-[14px]` with icon
- Form/Lists cards: `border border-[#292929] bg-dark-800 rounded-[20px]`
- Stats bar: `border-b border-[#292929]`
- Items: `hover:bg-white/[0.02] transition-colors divide-y divide-[#292929]`
- Empty state: icon in `border border-dashed border-white/10 bg-white/[0.04] rounded-[16px]`

### Color Palette
- Page bg: `bg-[#0f0f0f]`
- Warm bg: `bg-warm-100`
- Card bg light: `bg-dark-800` (#171717)
- Card bg dark: `bg-[#121212]`
- Border: `border-[#292929]`, `border-dark-700`, `border-white/10`, `border-black/8`
- Green: `#25D366`, `#00BA1F`
- Orange: `#F97316`
- Text dark: `text-dark-900`, `text-dark-900/75`, `text-dark-900/65`, `text-dark-900/50`
- Text white: `text-white`, `text-white/85`, `text-white/65`, `text-white/50`, `text-white/40`, `text-white/30`, `text-white/20`
- Font: `font-figtree` (Space Grotesk alias), `font-serif`
- Radii: `rounded-[14px]`, `rounded-[16px]`, `rounded-[20px]`, `rounded-[26px]`, `rounded-[44px]`, `rounded-[72px]`, `rounded-full`
- Animations: `anim-pulse-dot`, `anim-glow-pulse`, `anim-float`, `anim-ticker-reverse`, `anim-fade-in-up`, `anim-scale-in`

## Architecture

### File Structure
```
components/todo/
├── docs/CHANGELOG.md, CONTINUE.md, TODOS.md
├── hooks/use-todos.ts           — Convex queries + mutations with optimistic updates
├── dashboard-view.tsx           — Dashboard SPA view (stats, progress, tips, ticker)
├── tasks-view.tsx               — Tasks SPA view (filters, search, form, list)
├── todo-form.tsx                — Add task form component
├── todo-list.tsx                — Task list with stats bar + empty state
├── todo-item.tsx                — Single task row with toggle + delete
└── index.ts                     — Barrel exports

routes/(app)/
├── route.tsx                    — Just <Outlet /> (landing pattern)
└── app.tsx                      — SPA shell: view switching, bottom N0, hamburger FAB, menu
```

### Data Flow
- `todoQueries.list()` consumed by `@tanstack/react-query`'s `useQuery`
- Mutations use `useConvexMutation` + `withOptimisticUpdate`
- Both dashboard and tasks views share the same Convex query

## Known Issues

None currently.

## Next Steps

- [ ] Add task editing (inline edit on double-click)
- [ ] Add task priorities (high/medium/low)
- [ ] Add due dates with calendar picker
- [ ] Add drag-and-drop reordering
- [ ] Add data persistence sync indicator
