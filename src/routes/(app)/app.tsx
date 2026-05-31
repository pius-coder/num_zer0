import { createFileRoute } from '@tanstack/react-router'
import { TodoAddForm, TodoList } from '#/components/todo'

export const Route = createFileRoute('/(app)/app')({
  ssr: false,
  component: AppPage,
})

function AppPage() {
  return (
    <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-lg flex-col gap-4 px-4 pt-12">
      <TodoAddForm />
      <TodoList />
    </div>
  )
}
