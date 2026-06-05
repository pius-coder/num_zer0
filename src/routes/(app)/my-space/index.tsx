import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { mySpaceQueries } from '#/components/my-space/hooks'
import { ServiceListPage } from '#/components/my-space/service-list'

export const Route = createFileRoute('/(app)/my-space/')({
  loader: async ({ context: { queryClient } }) => {
    await Promise.all([
      queryClient.ensureQueryData(mySpaceQueries.myActivations()),
      queryClient.ensureQueryData(mySpaceQueries.balance()),
    ])
  },
  component: ServiceListRoute,
})

function ServiceListRoute() {
  const { data: myActivations } = useSuspenseQuery(mySpaceQueries.myActivations())
  const { data: balanceData } = useSuspenseQuery(mySpaceQueries.balance())
  return <ServiceListPage myActivations={myActivations ?? []} balanceUsd={balanceData?.balanceUsd ?? 0} />
}
