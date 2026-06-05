import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { useSuspenseQuery } from '@tanstack/react-query'
import { mySpaceQueries } from '#/components/my-space/hooks'
import { PurchasePage } from '#/components/my-space/purchase-page'

export const Route = createFileRoute('/(app)/my-space/$serviceId/$countryIso')({
  validateSearch: z.object({
    operator: z.string().optional(),
    maxPrice: z.number().optional(),
  }),
  loader: async ({ context: { queryClient } }) => {
    const balanceData = await queryClient.ensureQueryData(mySpaceQueries.balance())
    return { balanceData }
  },
  component: PurchaseRoute,
  notFoundComponent: () => <div>Service or country not found</div>,
})

function PurchaseRoute() {
  const { serviceId, countryIso } = Route.useParams()
  const { data: balanceData } = useSuspenseQuery(mySpaceQueries.balance())
  return <PurchasePage serviceId={serviceId} countryIso={countryIso} balanceUsd={balanceData?.balanceUsd ?? 0} />
}
