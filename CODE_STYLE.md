# num_zer0 Code Style Guide

## Overview

This document defines the coding conventions for the num_zer0 project. All code should follow these patterns to maintain consistency. This guide is intended for both human contributors and AI agents.

The project uses **Prettier** for formatting, **ESLint (tanstack config)** for linting, and **TypeScript 6** in strict mode. Run `bun run format` to auto-fix most style issues.

---

## Formatting (Enforced by Prettier)

| Rule | Value |
|------|-------|
| Semicolons | **None** (ASI) |
| Quotes | **Single** (') |
| Trailing commas | **All** (including function params) |
| Print width | Default (80) |

```typescript
// ✅ Correct - no semi, single quotes, trailing comma
const name = 'num_zer0'
const items = ['a', 'b', 'c',]

// ❌ Wrong
const name = "num_zer0";
const items = [
  'a',
  'b'
];
```

Run `bun run format` to apply Prettier + ESLint fixes.

---

## TypeScript Conventions

### Strict Mode

The project uses TypeScript 6 in full strict mode (`tsconfig.json`):

```json
{
  "strict": true,
  "noUnusedLocals": true,
  "noUnusedParameters": true,
  "noFallthroughCasesInSwitch": true,
  "noUncheckedSideEffectImports": true,
  "verbatimModuleSyntax": true
}
```

### Path Aliases

Use path aliases instead of relative imports:

```typescript
// ✅ Correct
import { cn } from '@/lib/utils'
import { Button } from '#/common/ui/button'
import { api } from '../../convex/_generated/api'  // OK for deep Convex refs

// ❌ Wrong
import { cn } from '../../lib/utils'
```

- `@/*` → `./src/*`
- `#/*` → `./src/*`

### Imports Style

- Use `import type` for type-only imports
- Order: external → internal → CSS
- Group by: react → libraries → project → relative

```typescript
import { useState } from 'react'
import { Button } from '@base-ui/react/button'
import { cn } from '@/lib/utils'
import { ServiceItem } from '#/type/service'
```

### Types

- Prefer `interface` for object types (extensible)
- Prefer `type` for unions, intersections, and aliases
- Domain types go in `src/type/` with PascalCase filenames matching export

```typescript
// ✅ Use interface for object shapes
export interface ServiceItem {
  slug: string
  name: string
  category: string
}

// ✅ Use type for unions
export type PriceSource = 'override' | 'computed'

// ✅ Use type for tuples/utility types
export type Result<T, E = Error> = Ok<T> | Err<E>
```

---

## React Conventions

### Component Format

- Use `function` declarations (not arrow functions or `export default`)
- Named exports only (no `export default`)
- PascalCase for component names
- Props typed inline with `React.ComponentProps` for native elements

```typescript
// ✅ Correct
function Button({ className, variant = 'default', ...props }: ButtonProps) {
  return <button className={cn(styles, className)} {...props} />
}

function DialogHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div className={cn('p-4', className)} data-slot='dialog-header' {...props} />
}

export { Button, DialogHeader }

// ❌ Wrong
export default function Button(props: ButtonProps) { ... }
const Button = (props: ButtonProps) => { ... }
```

### Re-export Pattern

For UI primitives built on Base UI / Radix, re-export multiple components:

```typescript
export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
}
```

### File Organization

- One component per file (except tightly coupled compound components)
- **kebab-case** for filenames: `button.tsx`, `service-card.tsx`
- Colocate tests, hooks, data alongside components in feature directories

```
components/
├── landing/
│   ├── hero.tsx
│   ├── features.tsx
│   ├── faq.tsx
│   ├── hooks/
│   ├── data/
│   └── index.ts
├── auth/
├── wallet/
└── services/
```

### Max Lines

ESLint enforces **200 lines per file** (excluding blanks and comments). Break large components into smaller ones.

### `'use client'` Directive

Add `'use client'` at the top of files that use browser APIs, event handlers, or hooks:

```typescript
'use client'

import { useState } from 'react'
```

### Class Variance & Styling

Use `cva` for variant-based styling (shadcn pattern). Use `cn()` for class merging.

```typescript
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center rounded-lg text-sm font-medium',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground',
        outline: 'border-border bg-background',
      },
      size: {
        default: 'h-8 px-2.5',
        sm: 'h-7 px-2.5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)
```

---

## Tailwind CSS Conventions

### Theme Variables

Use the project's custom CSS variable theme instead of hardcoded colors:

```jsx
// ✅ Correct
<div className='bg-[var(--sea-ink)] text-[var(--foam)]' />
<div className='border-[var(--line)]' />

// ❌ Wrong
<div className='bg-teal-800 text-gray-100' />
```

Key theme variables:

| Variable | Light | Dark | Usage |
|----------|-------|------|-------|
| `--sea-ink` | `#173a40` | `#d7ece8` | Primary text, headings |
| `--sea-ink-soft` | `#416166` | `#afcdc8` | Secondary text |
| `--lagoon` | `#4fb8b2` | `#60d7cf` | Accent, interactive |
| `--lagoon-deep` | `#328f97` | `#8de5db` | Active states |
| `--palm` | `#2f6a4a` | `#6ec89a` | Success, positive |
| `--sand` | `#e7f0e8` | `#0f1a1e` | Background |
| `--foam` | `#f3faf5` | `#101d22` | Surface bg variant |
| `--surface` | `rgba(255,255,255,0.74)` | `rgba(16,30,34,0.8)` | Glass surfaces |
| `--line` | `rgba(23,58,64,0.14)` | `rgba(141,229,219,0.18)` | Borders, dividers |
| `--bg-base` | `#e7f3ec` | `#0a1418` | Page background |

### Standard CSS Properties

Use standard Tailwind utility classes where they apply. Use `[@media]` or `[@supports]` for complex queries.

```jsx
// Preferred - Tailwind utilities
<div className='flex items-center gap-2 p-4 max-sm:flex-col' />

// When needed - CSS variables inline
<div style={{ boxShadow: '0 26px 75px rgba(0,0,0,0.42)' }} />
```

---

## Convex Conventions

### Query/Mutation Pattern

```typescript
import { query, mutation } from './_generated/server'
import { v } from 'convex/values'

export const getUserBalance = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity()
    if (!identity) return { balanceUsd: 0 }

    const user = await ctx.db
      .query('users')
      .withIndex('by_betterAuthUserId', (q) =>
        q.eq('betterAuthUserId', identity.subject)
      )
      .unique()

    return { balanceUsd: user?.balanceUsd ?? 0 }
  },
})

export const syncUser = mutation({
  args: {
    betterAuthUserId: v.string(),
    email: v.optional(v.string()),
    isAnonymous: v.boolean(),
  },
  handler: async (ctx, args) => {
    // mutation logic
  },
})
```

### Rules

- Always use `.withIndex()` — never scan tables without an index
- Always check `ctx.auth.getUserIdentity()` for authenticated queries
- Throw descriptive errors (French for admin-facing, English for user-facing)
- Use `v.optional()` for nullable fields in args
- Export named constants (e.g., `XAF_TO_USD = 600`) for magic numbers
- Use `_id` for document references, not custom IDs (except betterAuthUserId)

### Idempotency

For payment-related mutations, always use `idempotencyKey` to prevent duplicate processing:

```typescript
const existing = await ctx.db
  .query('purchases')
  .withIndex('by_idempotencyKey', (q) => q.eq('idempotencyKey', idempotencyKey))
  .unique()
if (existing) return existing
```

---

## Error Handling

Use the custom `Result<T, E>` type for operations that can fail (from `src/lib/result.ts`):

```typescript
import { Ok, Err, type Result, isOk, isErr } from '#/lib/result'

function divide(a: number, b: number): Result<number, string> {
  if (b === 0) return Err('Division by zero')
  return Ok(a / b)
}

const result = divide(10, 2)
if (isOk(result)) {
  console.log(result.value)
}
```

For simple cases, use `throw` with descriptive messages (caught by the router's `MutationCache.onError` which shows a sonner toast).

---

## Naming Conventions

| Category | Convention | Example |
|----------|-----------|---------|
| **Files** | kebab-case | `service-card.tsx`, `auth-client.ts` |
| **Components** | PascalCase | `Button`, `DialogPopup` |
| **Functions** | camelCase | `getUserBalance`, `cn` |
| **Types/Interfaces** | PascalCase | `ServiceItem`, `CountryItem` |
| **Variables** | camelCase | `sessionId`, `priceXaf` |
| **Constants** | UPPER_SNAKE | `XAF_TO_USD`, `CONVEX_URL` |
| **Env vars** | UPPER_SNAKE | `VITE_CONVEX_URL`, `FAPSHI_API_KEY` |
| **Database tables** | snake_case | `analytics_events`, `promoCodes` |
| **Database indexes** | `by_fieldName` | `by_betterAuthUserId`, `by_userId` |
| **Components dirs** | kebab-case | `recharge/`, `my-space/` |

### File Contents by Directory

| Directory | Contains |
|-----------|----------|
| `src/common/ui/` | shadcn/Base UI primitives (buttons, dialogs, inputs) |
| `src/common/hooks/` | Shared hooks (e.g., `use-mobile`) |
| `src/lib/` | Pure utilities, no React (Result, cn, trackers, auth clients) |
| `src/type/` | TypeScript domain types only |
| `src/components/<feature>/` | Feature-specific React components |
| `convex/` | All backend: schema, queries, mutations, HTTP routes |

---

## CSS & Styling

- **Tailwind v4** with `@theme` directive for design tokens
- CSS custom properties for themes (light/dark via `data-theme` attribute)
- Dark mode via `:root[data-theme="dark"]` and `@media (prefers-color-scheme: dark)`
- Custom fonts: **Space Grotesk** (primary), **KUBO** (decorative)
- Global styles go in `src/global.css`
- Component-specific animations use `@keyframes` in CSS or Tailwind's animate utilities

---

## Commit Conventions

- Use conventional commits: `feat:`, `fix:`, `chore:`, `refactor:`, `style:`, `docs:`
- Present tense, imperative mood
- Keep subject under 50 characters
- Reference issue numbers where applicable

---

## Miscellaneous

- **No tests found yet** — when adding tests, use Vitest + Testing Library, colocate `.test.tsx` files next to components
- **`sonner`** for toast notifications (configured globally in router's `onError`)
- **`motion`** library for animations
- **`react-hook-form`** for form handling
- **`lucide-react`** for icons
