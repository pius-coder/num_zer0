import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { env } from '@/config/env'

const queryClient = postgres(env.DATABASE_URL, {
  max: 1, // FIXED: Single connection per Vercel instance. PgBouncer handles the rest.
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false, // FIXED: Required for PgBouncer compatibility
  fetch_types: false, // FIXED: Prevents blocking queries on Supabase PgBouncer
  socket_timeout: 30, // Wait up to 30s for slow cold-starts
})

export const db = drizzle({ client: queryClient, schema })
