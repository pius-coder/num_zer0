import { useQuery } from '@tanstack/react-query'
import { Circle } from 'lucide-react'
import { todoQueries } from './hooks/use-todos'
import { TodoItem } from './todo-item'

export function TodoList() {
  const { data: todos, isLoading } = useQuery(todoQueries.list())

  const completedCount = todos?.filter((t) => t.completed).length ?? 0
  const totalCount = todos?.length ?? 0

  return (
    <div className="overflow-hidden rounded-xl border bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      {isLoading ? (
        <div className="flex flex-col items-center gap-3 p-8 text-sm text-gray-500 dark:text-gray-400">
          <div className="size-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600 dark:border-gray-600 dark:border-t-gray-300" />
          Loading todos...
        </div>
      ) : todos?.length === 0 ? (
        <div className="flex flex-col items-center gap-2 p-8 text-sm text-gray-500 dark:text-gray-400">
          <Circle className="size-8 text-gray-300 dark:text-gray-600" />
          <span className="font-medium text-gray-700 dark:text-gray-300">No todos yet</span>
          <span>Add your first todo above to get started!</span>
        </div>
      ) : (
        <>
          {totalCount > 0 && <TodoStats completedCount={completedCount} totalCount={totalCount} />}
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {todos?.map((todo) => (
              <TodoItem key={todo._id} todo={todo} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}

function TodoStats({ completedCount, totalCount }: { completedCount: number; totalCount: number }) {
  return (
    <div className="flex justify-center gap-4 border-b border-gray-100 px-4 py-2 text-xs text-gray-500 dark:border-gray-800 dark:text-gray-400">
      <span>{completedCount} completed</span>
      <span>{totalCount - completedCount} remaining</span>
    </div>
  )
}
