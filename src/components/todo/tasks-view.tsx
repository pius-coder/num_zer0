import { QuickAdd } from './quick-add'
import { TaskList } from './task-list'
import type { Doc } from '../../../convex/_generated/dataModel'

type Todo = Doc<'todos'>

interface Props {
  onAddTask: () => void
  onEditTask: (todo: Todo) => void
  initialFilter?: string
}

export function TasksView({ onAddTask, onEditTask, initialFilter }: Props) {
  return (
    <div className="absolute inset-0 flex flex-col bg-[#0f0f0f] relative">
      <div className="flex-shrink-0 px-5 pt-20 md:px-11 md:pt-24">
        <div className="max-w-[640px] w-full mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-white/20 rounded-full">
            <span className="w-2 h-2 rounded-full bg-[#25D366] shadow-[0_0_12px_0_#25D366] anim-pulse-dot" />
            <span className="font-figtree text-xs font-semibold tracking-[-0.015em] uppercase text-[#4f4f4f]">TASKS</span>
          </div>

          <div className="mt-5 mb-4">
            <h2 className="font-figtree text-[32px] font-[400] tracking-[-0.04em] leading-[1.1] text-white m-0 md:text-[44px]">
              Your Tasks
            </h2>
            <p className="font-figtree font-medium text-[14px] tracking-[-0.3px] leading-[1.5] text-white/65 mt-2 md:text-[16px]">
              Stay organized and track what matters.
            </p>
          </div>

          <QuickAdd onOpenModal={onAddTask} />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 pb-6 md:px-11">
        <div className="max-w-[640px] w-full mx-auto pt-4">
          <TaskList onEditTask={onEditTask} initialFilter={initialFilter} />
        </div>
      </div>
    </div>
  )
}
