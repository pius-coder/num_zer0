import { createFileRoute, notFound } from '@tanstack/react-router'
import { z } from 'zod'
import { useQuery } from '@tanstack/react-query'
import { mySpaceQueries } from '#/components/my-space/hooks'
import { CountryListPage } from '#/components/my-space/country-list'

export const Route = createFileRoute('/(app)/my-space/$serviceId/')({
  validateSearch: z.object({
    filter: z.string().optional(),
  }),
  loader: async ({ params, context: { queryClient } }) => {
    const data = await queryClient.ensureQueryData(mySpaceQueries.topCountries(params.serviceId))
    if (!data) throw notFound()
    return data
  },
  component: CountryListRoute,
  notFoundComponent: () => <div>Service not found</div>,
})

function CountryListRoute() {
  const { serviceId } = Route.useParams()
  const { data: topCountries } = useQuery(mySpaceQueries.topCountries(serviceId))
  return <CountryListPage serviceId={serviceId} topCountries={topCountries ?? []} />
}
