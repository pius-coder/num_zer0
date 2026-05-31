export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-gray-200 px-4 pb-8 pt-8 dark:border-gray-800">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-left">
        <p className="m-0 text-sm text-gray-500 dark:text-gray-400">
          &copy; {year} Numzero. All rights reserved.
        </p>
        <p className="m-0 text-sm text-gray-400 dark:text-gray-500">
          Built with Numzero
        </p>
      </div>
    </footer>
  )
}
