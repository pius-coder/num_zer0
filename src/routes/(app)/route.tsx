import { createFileRoute, Outlet, Link } from '@tanstack/react-router'
import { ThemeToggle } from '#/components/landing/theme-toggle'

export const Route = createFileRoute('/(app)')({
  component: AppLayout,
})

function AppLayout() {
  return (
    <>
      <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80">
        <nav className="mx-auto flex max-w-5xl items-center gap-6 py-3 sm:py-4">
          <Link
            to="/app"
            className="text-sm font-semibold text-gray-900 no-underline dark:text-gray-100"
          >
            Numzero
          </Link>
          <Link
            to="/"
            className="text-sm text-gray-500 no-underline hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
          >
            Landing
          </Link>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
          </div>
        </nav>
      </header>
      <Outlet />
    </>
  )
}
