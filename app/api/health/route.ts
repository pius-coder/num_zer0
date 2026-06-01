import { db } from '@/database'
import { sql } from 'drizzle-orm'

export async function GET() {
  const startTime = Date.now()

  try {
    // Check database connection
    await db.execute(sql`SELECT 1`)

    const responseTime = Date.now() - startTime

    return Response.json({
      status: 'ok',
      db: 'connected',
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
    })
  } catch (error) {
    return Response.json(
      {
        status: 'error',
        db: 'disconnected',
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'unknown_error',
      },
      { status: 503 }
    )
  }
}
