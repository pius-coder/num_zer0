# Todo — Changelog

## [4.0.0] — 2026-06-01

### Changed
- **Complete rebrand from scratch** — no adaptation of legacy code, 100% new architecture (afreeserv)
- N0 brand: plain text like landing navbar `font-figtree font-bold text-[22px] text-[#25D366]`, no card/pill (afreeserv)
- Dashboard: dark bg `bg-[#0f0f0f]` matching tasks view, consistent design language (afreeserv)
- Stats: EXACT security.tsx pricing row pattern `bg-dark-800 border border-[#292929] rounded-[12px] px-[18px] py-[14px] flex flex-row gap-[10px] items-center` with green check SVG (afreeserv)
- Quick-add: NO card wrapper, inline on section bg (afreeserv)
- Tasks list: NO card wrapper, directly on bg with `divide-y divide-[#292929]` (afreeserv)

### Added
- **Priority system P1-P4**: colored dots (red/orange/yellow/green) with filter pills (afreeserv)
- **Category system**: Work 💼, Personal 🏠, Shopping 🛒, Health 🏥, Finance 💰 with SVG icons (afreeserv)
- **Smart quick-add**: NLP parsing — type "buy milk tomorrow high work" auto-detects date/priority/category (afreeserv)
- **Due dates**: "Today", "Tomorrow", "Overdue" smart labels (afreeserv)
- **Subtasks**: expandable checklist within each task via FAQ accordion pattern (afreeserv)
- **Notes**: editable textarea per task (afreeserv)
- **Recurring tasks**: daily/weekly/monthly (afreeserv)
- **Task accordion**: click to expand details (FAQ accordion pattern: `max-h-0 → max-h-[500px] transition-all`) (afreeserv)
- **Streak counter**: consecutive days with completions (afreeserv)
- **Daily goal progress bar**: gradient `from-[#25D366] to-[#F97316]` (CTA section pattern) (afreeserv)
- **Busiest hour stat**: productivity insight (afreeserv)
- **Date grouping**: Today / Tomorrow / Overdue / This Week / Upcoming (afreeserv)
- **Category filter pills**: with SVG icons (afreeserv)
- **Empty state**: icon box `bg-white/[0.04] border border-dashed border-white/10 rounded-[16px]` (afreeserv)
- **Activity feed**: recent completions with timestamps (afreeserv)
- **Keyboard shortcuts**: Enter to add task (afreeserv)

### Removed
- `todo-form.tsx` — replaced by `quick-add.tsx` (afreeserv)
- `todo-list.tsx` — replaced by `task-list.tsx` (afreeserv)
- `todo-item.tsx` — replaced by `task-item.tsx` + `task-details.tsx` (afreeserv)
- All warm bg colors, all card-wrapped forms (afreeserv)
- All legacy gray/slate color values (afreeserv)

## [3.0.0] — 2026-06-01

### Changed
- **Complete SPA restructure** — no page scroll, view switching via hamburger menu (afreeserv)
