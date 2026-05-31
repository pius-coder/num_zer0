import { useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '#/common/ui/button'
import { useAddTodoMutation } from './hooks/use-todos'

export function TodoAddForm() {
  const [text, setText] = useState('')
  const { mutate: addTodo, isPending } = useAddTodoMutation()

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!text.trim() || isPending) return
    addTodo({ text: text.trim() })
    setText('')
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="What needs to be done?"
        className="min-w-0 flex-1 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-gray-400 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500 dark:focus:border-gray-500"
      />
      <Button type="submit" disabled={!text.trim() || isPending}>
        <Plus />
        Add
      </Button>
    </form>
  )
}
