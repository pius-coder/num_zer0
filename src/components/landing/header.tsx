import { Link } from '@tanstack/react-router'
import { ThemeToggle } from './theme-toggle'

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/80 px-4 backdrop-blur-lg dark:border-gray-800 dark:bg-gray-950/80">
      <nav className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 py-3 sm:py-4">
        <Link
          to="/"
          className="text-sm font-semibold text-gray-900 no-underline dark:text-gray-100"
        >
          Numzero
        </Link>
        <Link
          to="/"
          className="text-sm text-gray-500 no-underline hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          Home
        </Link>
        <Link
          to="/app"
          className="text-sm text-gray-500 no-underline hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
        >
          App
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  )
}
