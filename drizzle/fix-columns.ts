import postgres from 'postgres'
import { env } from '../src/config/env'

async function main() {
  const client = postgres(env.DATABASE_URL, { max: 1 })

  // Find all columns to convert
  const cols = await client.unsafe(`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND data_type = 'numeric'
    AND column_name IN ('wholesale_cost_usd', 'revenue_xaf', 'margin_ratio', 'max_price_sent_usd')
    ORDER BY table_name, column_name
  `)

  console.log(`Found ${cols.length} columns to convert`)

  for (const c of cols) {
    try {
      await client.unsafe(
        `ALTER TABLE ${c.table_name} ALTER COLUMN ${c.column_name} TYPE jsonb USING CASE WHEN ${c.column_name} IS NULL THEN NULL ELSE jsonb_build_object('value', ${c.column_name}) END`
      )
      console.log('  ✓', `${c.table_name}.${c.column_name} → jsonb`)
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      if (msg.includes('does not exist')) {
        console.log('  ⏭', `${c.table_name}.${c.column_name}`, '(already converted)')
      } else {
        console.error('  ✗', `${c.table_name}.${c.column_name}:`, msg)
      }
    }
  }

  console.log('Done.')
  await client.end()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
