'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Filter } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { TaskCard } from '@/components/tasks/TaskCard'
import { TaskForm } from '@/components/tasks/TaskForm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { createClient } from '@/lib/supabase/client'
import {
  canManageTasks,
  canViewAllTasks,
  STATUS_LABELS,
  STATUS_COLORS,
} from '@/lib/utils'
import type { Profile, Task, TaskStatus, UserRole } from '@/types/database'

const STATUSES: TaskStatus[] = ['not_started', 'in_progress', 'completed']

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
  const [teamMembers, setTeamMembers] = useState<Pick<Profile, 'id' | 'full_name' | 'role'>[]>([])
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'all'>('all')
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: p } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single<Profile>()

    if (!p) return
    setProfile(p)

    const role = p.role
    const isManager = canViewAllTasks(role)

    let q = supabase
      .from('tasks')
      .select('*, assignee:assigned_to(id, full_name, role), assigner:assigned_by(id, full_name)')
      .order('created_at', { ascending: false })

    if (!isManager) {
      q = q.eq('assigned_to', user.id)
    }

    if (filterStatus !== 'all') {
      q = q.eq('status', filterStatus)
    }

    const { data: taskData } = await q.returns<Task[]>()
    setTasks(taskData ?? [])

    if (isManager) {
      const { data: members } = await supabase
        .from('profiles')
        .select('id, full_name, role')
        .neq('role', 'student')
        .returns<Pick<Profile, 'id' | 'full_name' | 'role'>[]>()
      setTeamMembers(members ?? [])
    }

    setLoading(false)
  }, [filterStatus])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const role = profile?.role as UserRole | undefined
  const canCreate = role ? canManageTasks(role) : false
  const isManager = role ? canViewAllTasks(role) : false

  const grouped = STATUSES.reduce(
    (acc, s) => {
      acc[s] = tasks.filter((t) => t.status === s)
      return acc
    },
    {} as Record<TaskStatus, Task[]>
  )

  return (
    <div>
      <TopBar
        title="Task Board"
        subtitle={isManager ? 'All team tasks' : 'Your assigned tasks'}
      />

      <div className="p-6 space-y-6">
        {/* Toolbar */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Filter size={14} className="text-slate-500" />
            <span className="text-xs text-slate-500 font-medium">Filter:</span>
            {(['all', ...STATUSES] as const).map((s) => (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                className={`text-xs px-2.5 py-1 rounded-full transition ${
                  filterStatus === s
                    ? 'bg-brand-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-surface-hover'
                }`}
              >
                {s === 'all' ? 'All' : STATUS_LABELS[s]}
              </button>
            ))}
          </div>

          {canCreate && profile && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={14} />
              New Task
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filterStatus !== 'all' ? (
          /* Flat list when filtered */
          <div className="space-y-2">
            {tasks.length > 0 ? (
              tasks.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  userRole={role!}
                  userId={profile!.id}
                  onUpdate={fetchData}
                />
              ))
            ) : (
              <p className="text-slate-500 text-sm py-10 text-center">No tasks in this status</p>
            )}
          </div>
        ) : (
          /* Kanban columns */
          <div className="grid md:grid-cols-3 gap-4">
            {STATUSES.map((s) => (
              <div key={s} className="bg-surface-card border border-surface-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Badge className={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Badge>
                  <span className="text-xs text-slate-500 ml-auto">{grouped[s].length}</span>
                </div>
                <div className="space-y-2">
                  {grouped[s].length > 0 ? (
                    grouped[s].map((t) => (
                      <TaskCard
                        key={t.id}
                        task={t}
                        userRole={role!}
                        userId={profile!.id}
                        onUpdate={fetchData}
                      />
                    ))
                  ) : (
                    <p className="text-slate-600 text-xs py-6 text-center">Empty</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {profile && (
        <TaskForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onCreated={fetchData}
          assignerId={profile.id}
          teamMembers={teamMembers}
        />
      )}
    </div>
  )
}
