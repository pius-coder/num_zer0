import { NextResponse } from 'next/server'
import { asc } from 'drizzle-orm'
import { z } from 'zod'

import { db } from '@/database'
import { creditPackage } from '@/database/schema'
import { requireAdminSession, AdminAuthError } from '@/lib/auth/require-admin'

const createSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  nameFr: z.string().min(1),
  nameEn: z.string().min(1),
  credits: z.number().int().positive(),
  priceXaf: z.number().int().positive(),
  bonusPct: z.number().int().min(0).max(100).default(0),
  sortOrder: z.number().int().default(0),
})

export async function GET() {
  try {
    await requireAdminSession()
    const packages = await db.select().from(creditPackage).orderBy(asc(creditPackage.sortOrder))
    return NextResponse.json({ packages })
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 500
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'admin_packages_fetch_failed' },
      { status }
    )
  }
}

export async function POST(request: Request) {
  try {
    await requireAdminSession()
    const payload = createSchema.parse(await request.json())
    const [created] = await db.insert(creditPackage).values(payload).returning()
    return NextResponse.json({ package: created }, { status: 201 })
  } catch (error) {
    const status = error instanceof AdminAuthError ? error.status : 400
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'admin_package_create_failed' },
      { status }
    )
  }
}
