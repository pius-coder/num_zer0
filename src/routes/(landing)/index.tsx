import { createFileRoute } from '@tanstack/react-router'
import { seo } from '#/seo'

export const Route = createFileRoute('/(landing)/')({
  head: () => seo.landing,
  component: RouteComponent,
})

function RouteComponent() {
  return (
    <main className="flex min-h-[calc(100vh-8rem)] flex-col items-center justify-center px-4 text-center">
      <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-7xl dark:text-gray-100">
        Numzero
      </h1>
      <p className="mt-4 max-w-md text-lg text-gray-500 dark:text-gray-400">
        Coming soon.
      </p>
    </main>
  )
}
