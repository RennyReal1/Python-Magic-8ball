import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  formatDate,
  ROLE_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  PRIORITY_COLORS,
  PRIORITY_LABELS,
  canViewAllTasks,
} from '@/lib/utils'
import type { Profile, Task, UserRole, WorkLog } from '@/types/database'
import { CheckSquare, FileText, AlertCircle, Clock } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single<Profile>()

  if (!profile) redirect('/login')

  const role = profile.role
  const isManager = canViewAllTasks(role)

  // Fetch tasks relevant to the user
  const tasksQuery = supabase
    .from('tasks')
    .select('*, assignee:assigned_to(full_name, role), assigner:assigned_by(full_name)')
    .order('created_at', { ascending: false })
    .limit(5)

  if (!isManager) {
    tasksQuery.eq('assigned_to', user.id)
  }

  const [{ data: tasks }, { data: logs }, { count: totalTasks }, { count: completedTasks }] =
    await Promise.all([
      tasksQuery.returns<Task[]>(),
      supabase
        .from('work_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('week_start', { ascending: false })
        .limit(3)
        .returns<WorkLog[]>(),
      supabase.from('tasks').select('*', { count: 'exact', head: true }),
      supabase
        .from('tasks')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed'),
    ])

  const completionRate =
    totalTasks && totalTasks > 0
      ? Math.round(((completedTasks ?? 0) / totalTasks) * 100)
      : 0

  const roleGreeting: Record<UserRole, string> = {
    admin: 'Welcome back, Founder',
    nigeria_ceo: 'Welcome back',
    program_manager: 'Welcome back',
    team_member: 'Welcome back',
    coach: 'Welcome back',
    student: 'Welcome back',
  }

  return (
    <div>
      <TopBar
        title={`${roleGreeting[role]}, ${profile.full_name.split(' ')[0]}`}
        subtitle={ROLE_LABELS[role]}
      />

      <div className="p-6 space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Tasks"
            value={String(totalTasks ?? 0)}
            icon={<CheckSquare size={18} className="text-brand-400" />}
            sub={isManager ? 'across team' : 'assigned to you'}
          />
          <StatCard
            label="Completed"
            value={String(completedTasks ?? 0)}
            icon={<CheckSquare size={18} className="text-emerald-400" />}
            sub={`${completionRate}% completion rate`}
          />
          <StatCard
            label="Work Logs"
            value={String(logs?.length ?? 0)}
            icon={<FileText size={18} className="text-yellow-400" />}
            sub="recent submissions"
          />
          <StatCard
            label="Urgent Tasks"
            value={String(
              tasks?.filter((t) => t.priority === 'urgent' && t.status !== 'completed').length ?? 0
            )}
            icon={<AlertCircle size={18} className="text-red-400" />}
            sub="need attention"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent tasks */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Tasks</CardTitle>
              <CardDescription>
                {isManager ? 'Latest team tasks' : 'Your assigned tasks'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {tasks && tasks.length > 0 ? (
                tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-surface border border-surface-border hover:border-brand-700/50 transition"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{task.title}</p>
                      {task.due_date && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                          <Clock size={11} />
                          Due {formatDate(task.due_date)}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <Badge className={STATUS_COLORS[task.status]}>
                        {STATUS_LABELS[task.status]}
                      </Badge>
                      <Badge className={PRIORITY_COLORS[task.priority]}>
                        {PRIORITY_LABELS[task.priority]}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm py-4 text-center">No tasks found</p>
              )}
            </CardContent>
          </Card>

          {/* Recent work logs */}
          <Card>
            <CardHeader>
              <CardTitle>Your Work Logs</CardTitle>
              <CardDescription>Recent weekly submissions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {logs && logs.length > 0 ? (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 rounded-lg bg-surface border border-surface-border"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-white">
                        Week of {formatDate(log.week_start)}
                      </p>
                      <Badge className="bg-brand-900/40 text-brand-300">
                        {log.hours_worked}h
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{log.summary}</p>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm py-4 text-center">No work logs yet</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
  sub,
}: {
  label: string
  value: string
  icon: React.ReactNode
  sub: string
}) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-start justify-between mb-3">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
          <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center">
            {icon}
          </div>
        </div>
        <p className="text-3xl font-bold text-white">{value}</p>
        <p className="text-xs text-slate-500 mt-1">{sub}</p>
      </CardContent>
    </Card>
  )
}
