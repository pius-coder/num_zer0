import { createFileRoute } from '@tanstack/react-router'
import { TodoAddForm, TodoList } from '#/components/todo'

export const Route = createFileRoute('/demo/convex')({
  ssr: false,
  component: ConvexTodos,
})

function ConvexTodos() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <div className="flex w-full max-w-lg flex-col gap-4">
        <div className="rounded-xl border bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <h1 className="mb-1 text-2xl font-bold">Convex Todos</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Powered by real-time sync
          </p>
        </div>
        <TodoAddForm />
        <TodoList />
        <p className="text-center text-xs text-gray-400 dark:text-gray-500">
          Built with Convex &middot; Real-time updates &middot; Always in sync
        </p>
      </div>
    </div>
  )
}
