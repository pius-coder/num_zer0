import { createFileRoute, notFound } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { mySpaceQueries } from '#/components/my-space/hooks'
import { ActivationPage } from '#/components/my-space/activation-detail'

export const Route = createFileRoute('/(app)/my-space/activations/$activationId')({
  loader: async ({ params, context: { queryClient } }) => {
    const data = await queryClient.ensureQueryData(mySpaceQueries.activation(params.activationId as any))
    if (!data) throw notFound()
    return data
  },
  component: ActivationRoute,
  notFoundComponent: () => <div>Activation not found</div>,
})

function ActivationRoute() {
  const { activationId } = Route.useParams()
  const { data: activation } = useSuspenseQuery(mySpaceQueries.activation(activationId as any))
  return <ActivationPage activation={activation} />
}
