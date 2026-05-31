import { createFileRoute } from '@tanstack/react-router'
import { seo } from '#/seo'

export const Route = createFileRoute('/')({ head: () => seo.landing, component: App })

function App() {
  return (
    <main>
      Comming Soon...
    </main>
  )
}
