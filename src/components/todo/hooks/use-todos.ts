import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { useMutation, useQuery } from '@tanstack/react-query'
import { api } from '../../../../convex/_generated/api'
import type { Doc, Id } from '../../../../convex/_generated/dataModel'

type Todo = Doc<'todos'>

export const todoQueries = {
  list: () => convexQuery(api.todos.list, {}),
  stats: () => convexQuery(api.todos.getStats, {}),
}

export function useTodos() {
  return useQuery(todoQueries.list())
}

export function useTodoStats() {
  return useQuery(todoQueries.stats())
}

export function useAddTodoMutation() {
  const mutationFn = useConvexMutation(api.todos.add)
    .withOptimisticUpdate((localStore, args) => {
      const todos = localStore.getQuery(api.todos.list, {})
      if (!todos) return
      localStore.setQuery(api.todos.list, {}, [
        {
          _id: `temp_${Date.now()}` as Id<'todos'>,
          _creationTime: Date.now(),
          text: args.text,
          completed: false,
          priority: args.priority ?? 'p3',
          category: args.category,
          dueDate: args.dueDate,
          dueDateLabel: args.dueDateLabel,
          notes: args.notes,
          subtasks: args.subtasks,
          recurring: args.recurring,
          completedAt: undefined,
        } satisfies Todo,
        ...todos,
      ])
    })
  return useMutation({ mutationFn })
}

export function useToggleTodoMutation() {
  const mutationFn = useConvexMutation(api.todos.toggle)
    .withOptimisticUpdate((localStore, args) => {
      const todos = localStore.getQuery(api.todos.list, {})
      if (!todos) return
      localStore.setQuery(
        api.todos.list,
        {},
        todos.map((t) =>
          t._id === args.id ? { ...t, completed: !t.completed, completedAt: !t.completed ? Date.now() : undefined } : t,
        ),
      )
    })
  return useMutation({ mutationFn })
}

export function useRemoveTodoMutation() {
  const mutationFn = useConvexMutation(api.todos.remove)
    .withOptimisticUpdate((localStore, args) => {
      const todos = localStore.getQuery(api.todos.list, {})
      if (!todos) return
      localStore.setQuery(
        api.todos.list,
        {},
        todos.filter((t) => t._id !== args.id),
      )
    })
  return useMutation({ mutationFn })
}

export function useUpdateTodoMutation() {
  const mutationFn = useConvexMutation(api.todos.update)
    .withOptimisticUpdate((localStore, args) => {
      const todos = localStore.getQuery(api.todos.list, {})
      if (!todos) return
      localStore.setQuery(
        api.todos.list,
        {},
        todos.map((t) =>
          t._id === args.id ? { ...t, ...args, id: undefined as unknown as Id<'todos'> } : t,
        ),
      )
    })
  return useMutation({ mutationFn })
}
