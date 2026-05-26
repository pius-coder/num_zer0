import { createRootRoute, HeadContent, Scripts, Outlet } from '@tanstack/react-router'
import { AuraProviderShell } from '@/aura/server/manifest-injector'
import { AuraBumpToaster } from '@/aura/ui/aura-bump-toaster'

import '../styles.css'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Todo App' },
    ],
  }),
  component: RootDocument,
})

function RootDocument() {
  return (
    <html lang="fr" className="dark" style={{ colorScheme: 'dark' }} suppressHydrationWarning>
      <head>
        <HeadContent />
      </head>
      <body>
        <AuraProviderShell>
          <Outlet />
          <AuraBumpToaster />
        </AuraProviderShell>
        <Scripts />
      </body>
    </html>
  )
}
