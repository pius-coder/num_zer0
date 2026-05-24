# Agent Instructions

## Communication

- **Passé**: what was done (commit ref, files changed)
- **Présent**: what is being worked on now
- **Futur**: what comes next (choices if multiple)

## Coding conventions

- No comments in code
- Concise responses (<4 lines unless asked)
- Edit existing files, don't create new ones unless explicitly required
- Mimic code style, use existing libraries and patterns
- Prefer barrel imports (`@/aura/client`, `@/aura/server`) over deep paths

## Deprecations

- When a new approach replaces an old one, mark the old as `~~DEPRECATED~~` in TRACKER.md decision table with the new motivation
- Never delete a decision — strike-through and explain why

## Workflow

1. Read TRACKER.md on session start
2. Read relevant source files before editing
3. Run type check after changes
4. Update CHANGELOG.md and TRACKER.md before committing
5. Commit message format: `theme N: description (details)`
6. Push after each commit

## Build

- `bun x tsc --noEmit --project packages/aura/tsconfig.json` for framework
- `bun x tsc --noEmit --project apps/app/tsconfig.json` for app
