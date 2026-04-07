import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { env } from '@/config/env'

const queryClient = postgres(env.DATABASE_URL, {
  max: 1, // Fixed for Vercel/Supabase limits
  idle_timeout: 20,
  connect_timeout: 20,
  // CRITICAL FIX: fetch_types MUST be true. 
  // When false, postgres.js fails to serialize NULL correctly for FK columns.
  fetch_types: true, 
  // REQUIRED: PgBouncer (Supabase) cannot handle Prepared Statements.
  prepare: false,
})

export const db = drizzle({ client: queryClient, schema })
