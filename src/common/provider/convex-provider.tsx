import { ConvexProvider } from 'convex/react'
import { useRouter } from '@tanstack/react-router'

export function AppConvexProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const { convexQueryClient } = router.options.context
  return <ConvexProvider client={convexQueryClient.convexClient}>{children}</ConvexProvider>
}
