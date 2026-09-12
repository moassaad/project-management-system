import type { TaskPriority, TaskStatus, TaskType } from '../types/task.types.ts'

const statusStyles: Record<TaskStatus, string> = {
  TODO: 'bg-gray-100 text-gray-700',
  IN_PROGRESS: 'bg-blue-100 text-blue-700',
  DONE: 'bg-green-100 text-green-700',
}

const priorityStyles: Record<TaskPriority, string> = {
  LOW: 'bg-gray-100 text-gray-700',
  MEDIUM: 'bg-amber-100 text-amber-800',
  HIGH: 'bg-red-100 text-red-700',
}

const typeStyles: Record<TaskType, string> = {
  FEATURE: 'bg-purple-100 text-purple-700',
  BUG: 'bg-red-100 text-red-700',
  IMPROVEMENT: 'bg-teal-100 text-teal-700',
}

function Badge({ label, className }: { label: string; className: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  )
}

/**
 * Status/priority/type badges for tasks — shared by list and details.
 * Pure display; no data fetching.
 */
export function TaskBadges({
  status,
  priority,
  type,
}: {
  status: TaskStatus
  priority: TaskPriority
  type?: TaskType | null
}) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-label="Task attributes">
      <Badge label={status.replace('_', ' ')} className={statusStyles[status]} />
      <Badge label={priority} className={priorityStyles[priority]} />
      {type ? <Badge label={type} className={typeStyles[type]} /> : null}
    </div>
  )
}
