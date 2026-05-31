# Landing — Continue Guide

## Current State

The landing feature provides:
- `Header` — sticky nav with logo, links, dropdown demos, social icons, and theme toggle
- `Footer` — copyright, social links, "Built with TanStack Start" badge
- `ThemeToggle` — cycles light → dark → auto with localStorage persistence
- `index.ts` barrel exports all three as named exports

## Architecture

- Uses project CSS custom properties (`--sea-ink`, `--lagoon`, etc.) for theming
- Components use `export default function` — re-exported in barrel as named
- Theme state saved to localStorage; theme script in `__root.tsx` prevents FOUC

## Known Issues

1. The `to="/about"` Link in `header.tsx` will fail at runtime until an `/about` route exists
2. Components use custom CSS vars directly — could be migrated to shadcn tokens

## Next Steps

- [ ] Create `/about` route to resolve the broken link
- [ ] Add i18n support for nav labels
- [ ] Extract nav links to a config file
