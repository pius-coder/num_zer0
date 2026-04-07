import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { env } from '@/config/env'

const queryClient = postgres(env.DATABASE_URL, {
  max: 1, 
  idle_timeout: 20,
  connect_timeout: 15, // Standard postgres-js option
  prepare: false, 
  fetch_types: false, 
})

export const db = drizzle({ client: queryClient, schema })
