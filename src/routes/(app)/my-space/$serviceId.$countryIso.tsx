import { createFileRoute } from '@tanstack/react-router'
import { z } from 'zod'
import { PurchasePage } from '#/components/my-space/purchase-page'

export const Route = createFileRoute('/(app)/my-space/$serviceId/$countryIso')({
  validateSearch: z.object({
    operator: z.string().optional(),
    maxPrice: z.number().optional(),
  }),
  component: PurchaseRoute,
  notFoundComponent: () => <div>Service or country not found</div>,
})

function PurchaseRoute() {
  const { serviceId, countryIso } = Route.useParams()
  return <PurchasePage serviceId={serviceId} countryIso={countryIso} />
}
