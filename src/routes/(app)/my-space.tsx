import { createFileRoute } from '@tanstack/react-router'
import { MySpacePage } from '#/components/spa/my-space-page'

export const Route = createFileRoute('/(app)/my-space')({
  ssr: false,
  component: MySpacePage,
})
