import { createFileRoute } from '@tanstack/react-router'
import { useSuspenseQuery } from '@tanstack/react-query'
import { mySpaceQueries } from '#/components/my-space/hooks'
import { HistoryViewPage } from '#/components/my-space/history-view'

export const Route = createFileRoute('/(app)/my-space/history')({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(mySpaceQueries.myActivations())
  },
  component: HistoryRoute,
})

function HistoryRoute() {
  const { data: myActivations } = useSuspenseQuery(mySpaceQueries.myActivations())
  return <HistoryViewPage myActivations={myActivations ?? []} />
}
