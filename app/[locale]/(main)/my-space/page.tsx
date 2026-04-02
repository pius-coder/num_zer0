import { setRequestLocale } from 'next-intl/server'
import { Suspense, cache } from 'react'
import { MySpaceTabs } from '@/component/numbers/my-space-tabs'
import { DesktopSidebar } from '@/component/numbers/desktop-sidebar'
import { MySpaceHeroMobile } from './_components/my-space-hero-mobile'
import { MySpaceHeroDesktop } from './_components/my-space-hero-desktop'
import { db } from '@/database'
import { priceRule } from '@/database/schema'
import { sql } from 'drizzle-orm'
import { getServiceBySlug } from '@/common/catalog'
import type { ServiceItem } from '@/type/service'

export const revalidate = 300

const fetchInitialServices = cache(async (): Promise<ServiceItem[]> => {
  try {
    const rows = await db
      .select({
        slug: priceRule.serviceSlug,
        hasPrices: sql<boolean>`bool_or(${priceRule.isActive})`,
        countryCount: sql<number>`count(distinct ${priceRule.countryIso})`,
      })
      .from(priceRule)
      .where(sql`${priceRule.isActive} = true`)
      .groupBy(priceRule.serviceSlug)

    return rows.map((row) => {
      const meta = getServiceBySlug(row.slug)
      return {
        slug: row.slug,
        name: meta?.name ?? row.slug,
        category: meta?.category ?? 'other',
        icon: meta?.icon ?? '/assets/services/ot.webp',
        hasPrices: row.hasPrices,
        countryCount: Number(row.countryCount),
      }
    })
  } catch {
    return []
  }
})

export default async function MySpacePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  setRequestLocale(locale)

  const initialServices = await fetchInitialServices()

  return (
    <div className='mx-auto max-w-7xl px-3 py-4 md:px-6 md:py-8'>
      <MySpaceHeroMobile />
      <MySpaceHeroDesktop />

      <div className='lg:grid lg:grid-cols-[1fr_320px] lg:gap-6'>
        <section>
          <Suspense
            fallback={<div className='py-20 text-center text-muted-foreground'>Loading...</div>}
          >
            <MySpaceTabs initialServices={initialServices} />
          </Suspense>
        </section>
        <aside className='hidden lg:block'>
          <DesktopSidebar />
        </aside>
      </div>
    </div>
  )
}
