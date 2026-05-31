import { Check, Trash2 } from 'lucide-react'
import { useToggleTodoMutation, useRemoveTodoMutation } from './hooks/use-todos'
import type { Doc } from '../../../convex/_generated/dataModel'

type Todo = Doc<'todos'>

export function TodoItem({ todo }: { todo: Todo }) {
  const { mutate: toggleTodo } = useToggleTodoMutation()
  const { mutate: removeTodo } = useRemoveTodoMutation()

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 ${todo.completed ? 'opacity-60' : ''}`}
    >
      <button
        onClick={() => toggleTodo({ id: todo._id })}
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
          todo.completed
            ? 'border-green-500 bg-green-500 text-white'
            : 'border-gray-300 text-transparent hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        }`}
      >
        <Check className="size-3.5" />
      </button>

      <span
        className={`flex-1 text-sm ${
          todo.completed
            ? 'text-gray-400 line-through dark:text-gray-500'
            : 'text-gray-800 dark:text-gray-200'
        }`}
      >
        {todo.text}
      </span>

      <button
        onClick={() => removeTodo({ id: todo._id })}
        className="flex size-7 shrink-0 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950 dark:hover:text-red-400"
      >
        <Trash2 className="size-4" />
      </button>
    </div>
  )
}
