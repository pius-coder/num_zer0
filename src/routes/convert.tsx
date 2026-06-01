import { createFileRoute } from '@tanstack/react-router'
import { ConvertPage } from '#/components/auth'

export const Route = createFileRoute('/convert')({
  component: ConvertPage,
})
