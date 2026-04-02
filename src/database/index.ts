import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'
import { env } from '@/config/env'

const queryClient = postgres(env.DATABASE_URL, {
  max: 20,
  idle_timeout: 20,
  connect_timeout: 10,
  prepare: false,
})

export const db = drizzle({ client: queryClient, schema })
