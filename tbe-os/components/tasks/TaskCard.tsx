'use client'

import { useState } from 'react'
import { Clock, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  formatDate,
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  cn,
} from '@/lib/utils'
import type { Task, TaskStatus, UserRole } from '@/types/database'
import { createClient } from '@/lib/supabase/client'

interface TaskCardProps {
  task: Task
  userRole: UserRole
  userId: string
  onUpdate: () => void
}

const STATUS_CYCLE: TaskStatus[] = ['not_started', 'in_progress', 'completed']

export function TaskCard({ task, userRole, userId, onUpdate }: TaskCardProps) {
  const [updating, setUpdating] = useState(false)

  const canChangeStatus =
    task.assigned_to === userId ||
    ['admin', 'program_manager'].includes(userRole)

  async function cycleStatus() {
    if (!canChangeStatus || updating) return
    const current = STATUS_CYCLE.indexOf(task.status)
    const next = STATUS_CYCLE[(current + 1) % STATUS_CYCLE.length]

    setUpdating(true)
    const supabase = createClient()
    await supabase.from('tasks').update({ status: next }).eq('id', task.id)
    setUpdating(false)
    onUpdate()
  }

  const assigneeName =
    (task.assignee as { full_name?: string } | null)?.full_name ?? 'Unassigned'

  return (
    <div className="group p-4 bg-surface border border-surface-border rounded-xl hover:border-brand-700/40 transition-all">
      <div className="flex items-start gap-3">
        {/* Status toggle circle */}
        <button
          onClick={cycleStatus}
          disabled={!canChangeStatus || updating}
          title={canChangeStatus ? 'Click to advance status' : undefined}
          className={cn(
            'mt-0.5 w-4 h-4 rounded-full border-2 flex-shrink-0 transition',
            task.status === 'completed'
              ? 'bg-emerald-500 border-emerald-500'
              : task.status === 'in_progress'
              ? 'border-blue-400 bg-blue-400/20'
              : 'border-slate-600 bg-transparent',
            canChangeStatus && !updating && 'cursor-pointer hover:border-brand-400',
            (!canChangeStatus || updating) && 'cursor-default'
          )}
        />

        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium text-white leading-snug',
              task.status === 'completed' && 'line-through text-slate-500'
            )}
          >
            {task.title}
          </p>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge className={STATUS_COLORS[task.status]}>{STATUS_LABELS[task.status]}</Badge>
            <Badge className={PRIORITY_COLORS[task.priority]}>{PRIORITY_LABELS[task.priority]}</Badge>

            <span className="text-xs text-slate-500 flex items-center gap-1">
              <User size={10} />
              {assigneeName}
            </span>

            {task.due_date && (
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Clock size={10} />
                {formatDate(task.due_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
