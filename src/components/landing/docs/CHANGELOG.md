# Landing — Changelog

## [2.0.0] — 2026-05-31

### Added

- Full landing page from v3 branch: Navbar, Hero, Features, Security, Integrations, FooterSection (afreeserv)
- `useMediaQuery` hook for responsive behavior (afreeserv)
- Figtree + Instrument Serif fonts for landing page typography (afreeserv)
- Dark/warm color tokens in Tailwind theme (`--color-dark-*`, `--color-warm-*`) (afreeserv)

### Changed

- `(landing)/route.tsx` simplified to bare `<Outlet />` (landing page is self-contained with its own nav/footer) (afreeserv)
- `(landing)/index.tsx` now composes all v3 landing sections (afreeserv)
- SEO metadata updated for Bitcoin wallet landing page (afreeserv)
- Logo added to `public/logo.png` (afreeserv)

### Technical Debt

- 5 files (navbar, hero, features, security, footer) exceed 200-line ESLint limit — need refactoring from Framer inline styles to clean Tailwind (afreeserv)

## [1.2.0] — 2026-05-31

### Changed

- All components uniformized: removed custom CSS vars (`--sea-ink`, `--line`, etc.), replaced with plain Tailwind classes (afreeserv)
- No shadows, no gradients — clean shadcn-style design (afreeserv)
- Header and footer simplified to match app layout style (afreeserv)
- Theme toggle simplified (no shadow, no gradient) (afreeserv)

## [1.1.0] — 2026-05-31

### Changed

- Branding updated from "TanStack Start" to "Numzero" across header, footer, SEO (afreeserv)
- Landing page now served via `routes/(landing)/` route group with layout wrapping (afreeserv)
- SEO metadata updated for Numzero branding (afreeserv)

### Removed

- Old `routes/index.tsx` — replaced by `routes/(landing)/index.tsx` (afreeserv)

## [1.0.0] — 2026-05-31

### Fixed

- `header.tsx` import of `ThemeToggle` — wrong case caused TS error (afreeserv)
- `index.ts` barrel — replaced empty export with proper named re-exports (afreeserv)
- Added `hooks/` directory for future complex logic (afreeserv)

### Added

- Initial landing page feature with Header, Footer, ThemeToggle
- `docs/` lifecycle documentation (CHANGELOG, CONTINUE, TODOS)
