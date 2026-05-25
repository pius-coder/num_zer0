import { createRootRoute, HeadContent, Scripts, Outlet } from '@tanstack/react-router'
import { AuraProvider } from '@/aura/client'
import { AuraBumpToaster } from '@/aura/ui'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'Todo App' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
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
        <AuraProvider>
          <Outlet />
          <AuraBumpToaster />
        </AuraProvider>
        <Scripts />
      </body>
    </html>
  )
}
