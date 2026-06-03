# Landing — Continue Guide

## Current State

The landing feature provides:

- `Header` — sticky nav with logo, links, dropdown demos, social icons, and theme toggle
- `Footer` — copyright, social links, "Built with Numzero" badge
- `ThemeToggle` — cycles light → dark → auto with localStorage persistence
- `index.ts` barrel exports all three as named exports

## Architecture

- Landing page is served via `routes/(landing)/` route group: `route.tsx` wraps Header/Footer/Outlet, `index.tsx` has the coming soon content
- `__root.tsx` stays as a minimal shell — no Header/Footer there
- Uses project CSS custom properties (`--sea-ink`, `--lagoon`, etc.) for theming
- Components use `export default function` — re-exported in barrel as named
- Theme state saved to localStorage; theme script in `__root.tsx` prevents FOUC
- SEO metadata in `src/seo.ts` now points to "Numzero"

## Known Issues

1. Components use custom CSS vars directly — could be migrated to shadcn tokens

## Next Steps

- [ ] Add i18n support for nav labels
- [ ] Extract nav links to a config file
