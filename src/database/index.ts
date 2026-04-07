import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { env } from '@/config/env'

const queryClient = postgres(env.DATABASE_URL, {
  max: 2, // Lower pool size to prevent 'MaxClients' error on Supabase PgBouncer
  idle_timeout: 10, // Close idle connections faster
  connect_timeout: 15,
  prepare: false, // Disable prepared statements for PgBouncer compatibility
  socket_timeout: 30, // Fail fast if the socket hangs
  fetch_types: true, // Fetch types on connection (important for Drizzle)
})

export const db = drizzle({ client: queryClient, schema })
