import { NextResponse } from 'next/server'
import { and, asc, eq } from 'drizzle-orm'

import { db } from '@/database'
import { creditPackage } from '@/database/schema'

export async function GET() {
  const packages = await db
    .select()
    .from(creditPackage)
    .where(and(eq(creditPackage.isActive, true)))
    .orderBy(asc(creditPackage.sortOrder))

  return NextResponse.json({ packages })
}
