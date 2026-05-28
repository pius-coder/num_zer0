import { createRootRoute, HeadContent, Scripts, Outlet } from '@tanstack/react-router'
import { AuraProvider } from '@/aura/client'
import { AuraBumpToaster } from '@/aura/ui/aura-bump-toaster'

import '../styles.css'

const AURA_URL = (() => {
  const baked = import.meta.env.VITE_AURA_URL;
  if (baked) return baked as string;
  if (import.meta.env.DEV) return "http://localhost:3001";
  throw new Error(
    "[aura] VITE_AURA_URL is required at build time for production. " +
    "Pass it via --build-arg VITE_AURA_URL=https://api.example.com when building Dockerfile.frontend."
  );
})();

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
        <AuraProvider config={{ baseUrl: AURA_URL }}>
          <Outlet />
          <AuraBumpToaster />
        </AuraProvider>
        <Scripts />
      </body>
    </html>
  )
}
