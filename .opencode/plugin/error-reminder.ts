import type { Plugin } from "@opencode-ai/plugin"

/**
 * Generic error reminder plugin.
 * Detects errors in tool output and reminds to read official docs before fixing.
 */

function extractErrorContext(text: string): string[] {
  const errors: string[] = []

  // TypeScript errors: TS2322, TS7022, etc.
  const tsMatches = text.matchAll(/(?:error\s+)?(TS\d{4,5}):?\s*([^\n]*)/gi)
  for (const m of tsMatches) {
    errors.push(`TypeScript ${m[1]}: ${m[2].trim().slice(0, 120)}`)
  }

  // Node.js / runtime errors
  const runtimeMatches = text.matchAll(/(TypeError|ReferenceError|SyntaxError|RangeError|Error):\s*([^\n]*)/g)
  for (const m of runtimeMatches) {
    errors.push(`${m[1]}: ${m[2].trim().slice(0, 120)}`)
  }

  // Convex-specific
  const convexMatches = text.matchAll(/(Can't use fetch\(\) in queries and mutations|Not authenticated|Convex[^:\n]*error[^\n]*)/gi)
  for (const m of convexMatches) {
    errors.push(m[1].trim().slice(0, 120))
  }

  // Shell / system errors
  const shellMatches = text.matchAll(/(Command failed|ENOENT|EACCES|EPERM|ECONNREFUSED)[^\n]*/g)
  for (const m of shellMatches) {
    errors.push(m[1].trim().slice(0, 120))
  }

  // npm / package errors
  const npmMatches = text.matchAll(/(npm ERR![^\n]*|ERR_PNPM[^\n]*)/g)
  for (const m of npmMatches) {
    errors.push(m[1].trim().slice(0, 120))
  }

  return [...new Set(errors)]
}

function suggestDoc(error: string): string | null {
  const lower = error.toLowerCase()

  // TypeScript
  if (lower.includes("ts2322")) return "Read https://typescriptlang.org/docs/handbook/2/types-from-types.html"
  if (lower.includes("ts7022")) return "Read https://docs.convex.dev/functions/actions#dealing-with-circular-type-inference"
  if (lower.includes("ts2339")) return "Check generated types after npx convex dev --once"
  if (lower.includes("ts2304")) return "Missing import — check the function signature in docs"
  if (lower.includes("ts")) return "Read https://typescriptlang.org/docs/handbook/intro.html"

  // Convex
  if (lower.includes("fetch()") && lower.includes("not allowed")) return "Read https://docs.convex.dev/functions/actions — use action, not mutation"
  if (lower.includes("not authenticated")) return "Read https://docs.convex.dev/auth/functions-auth"
  if (lower.includes("convex")) return "Read https://docs.convex.dev/functions"

  // Node.js runtime
  if (lower.includes("typeerror")) return "Read the API docs for the type involved"
  if (lower.includes("referenceerror")) return "Check variable scope and imports"
  if (lower.includes("syntaxerror")) return "Check bracket/quote matching and syntax"

  // System
  if (lower.includes("enoent")) return "File or directory not found — check the path"
  if (lower.includes("eacces")) return "Permission denied — check file permissions"
  if (lower.includes("econnrefused")) return "Connection refused — is the server running?"

  // npm
  if (lower.includes("npm err")) return "Read the npm error output above and follow its suggestion"

  return null
}

export default (async () => {
  return {
    "tool.execute.after": async (_input, output) => {
      const text = typeof output === "string" ? output : JSON.stringify(output)
      const errors = extractErrorContext(text)

      if (errors.length === 0) return

      const suggestions: string[] = []
      for (const err of errors) {
        const doc = suggestDoc(err)
        if (doc) suggestions.push(`  • ${err}\n    → ${doc}`)
      }

      if (suggestions.length === 0) return

      const reminder = [
        "",
        "╔══════════════════════════════════════════════╗",
        "║  ⚠️  ERREURS DÉTECTÉES — LIS LA DOC AVANT   ║",
        "║     DE CODER / CORRIGER                      ║",
        "╚══════════════════════════════════════════════╝",
        "",
        ...suggestions,
        "",
      ].join("\n")

      if (typeof output === "string") {
        output += reminder
      } else if (typeof output === "object" && output !== null) {
        const o = output as Record<string, unknown>
        o.stderr = (typeof o.stderr === "string" ? o.stderr : "") + reminder
      }
    },
  }
}) satisfies Plugin
