import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { TopBar } from '@/components/layout/TopBar'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ROLE_LABELS, STATUS_COLORS, STATUS_LABELS, canViewAllTasks } from '@/lib/utils'
import type { Profile, Task, UserRole } from '@/types/database'
import {
  Users,
  CheckSquare,
  FileText,
  TrendingUp,
  AlertTriangle,
  UserCheck,
} from 'lucide-react'

export default async function AdminPage() {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single<{ role: UserRole }>()

  if (!profileRow || !canViewAllTasks(profileRow.role)) {
    redirect('/')
  }

  // Parallel analytics queries
  const [
    { count: totalUsers },
    { count: totalTasks },
    { count: completedTasks },
    { count: inProgressTasks },
    { count: totalLogs },
    { data: profiles },
    { data: recentTasks },
  ] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
    supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('work_logs').select('*', { count: 'exact', head: true }),
    supabase.from('profiles').select('id, full_name, role, email, created_at').order('created_at', { ascending: false }).returns<Pick<Profile, 'id' | 'full_name' | 'role' | 'email' | 'created_at'>[]>(),
    supabase
      .from('tasks')
      .select('*, assignee:assigned_to(full_name)')
      .order('created_at', { ascending: false })
      .limit(10)
      .returns<(Task & { assignee: { full_name: string } | null })[]>(),
  ])

  const taskCompletion =
    totalTasks && totalTasks > 0
      ? Math.round(((completedTasks ?? 0) / totalTasks) * 100)
      : 0

  const roleCount = profiles?.reduce(
    (acc, p) => {
      acc[p.role as UserRole] = (acc[p.role as UserRole] ?? 0) + 1
      return acc
    },
    {} as Record<UserRole, number>
  )

  return (
    <div>
      <TopBar title="Analytics & Overview" subtitle="Admin dashboard — TBE OS" />

      <div className="p-6 space-y-6">
        {/* Key metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <MetricCard label="Total Users" value={totalUsers ?? 0} icon={<Users size={16} className="text-brand-400" />} />
          <MetricCard label="Total Tasks" value={totalTasks ?? 0} icon={<CheckSquare size={16} className="text-blue-400" />} />
          <MetricCard label="Completed" value={completedTasks ?? 0} icon={<CheckSquare size={16} className="text-emerald-400" />} />
          <MetricCard label="In Progress" value={inProgressTasks ?? 0} icon={<TrendingUp size={16} className="text-yellow-400" />} />
          <MetricCard label="Work Logs" value={totalLogs ?? 0} icon={<FileText size={16} className="text-purple-400" />} />
          <MetricCard label="Completion %" value={`${taskCompletion}%`} icon={<UserCheck size={16} className="text-emerald-400" />} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Team breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Team by Role</CardTitle>
              <CardDescription>{totalUsers ?? 0} total members</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {(Object.keys(ROLE_LABELS) as UserRole[]).map((r) => {
                const count = roleCount?.[r] ?? 0
                if (count === 0) return null
                return (
                  <div key={r} className="flex items-center justify-between py-1.5">
                    <span className="text-sm text-slate-300">{ROLE_LABELS[r]}</span>
                    <span className="text-sm font-semibold text-white">{count}</span>
                  </div>
                )
              })}
            </CardContent>
          </Card>

          {/* Task status breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Task Status</CardTitle>
              <CardDescription>Across all team tasks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {(['not_started', 'in_progress', 'completed'] as const).map((s) => {
                const count = recentTasks?.filter((t) => t.status === s).length ?? 0
                return (
                  <div key={s} className="flex items-center justify-between">
                    <Badge className={STATUS_COLORS[s]}>{STATUS_LABELS[s]}</Badge>
                    <span className="text-sm font-semibold text-white">{count}</span>
                  </div>
                )
              })}
              {/* Progress bar */}
              <div className="mt-4">
                <div className="flex justify-between text-xs text-slate-500 mb-1">
                  <span>Overall completion</span>
                  <span>{taskCompletion}%</span>
                </div>
                <div className="h-2 bg-surface rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-brand rounded-full transition-all"
                    style={{ width: `${taskCompletion}%` }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Urgent tasks */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle size={15} className="text-red-400" />
                Urgent Items
              </CardTitle>
              <CardDescription>Needs immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {recentTasks
                ?.filter((t) => t.priority === 'urgent' && t.status !== 'completed')
                .slice(0, 5)
                .map((t) => (
                  <div key={t.id} className="p-2.5 rounded-lg bg-red-900/10 border border-red-900/30">
                    <p className="text-sm text-white font-medium truncate">{t.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {(t.assignee as { full_name?: string } | null)?.full_name ?? 'Unassigned'}
                    </p>
                  </div>
                ))}
              {!recentTasks?.some((t) => t.priority === 'urgent' && t.status !== 'completed') && (
                <p className="text-slate-500 text-sm py-3 text-center">No urgent tasks</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* All members table */}
        <Card>
          <CardHeader>
            <CardTitle>All Members</CardTitle>
            <CardDescription>User accounts and roles</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-border text-left">
                    <th className="pb-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Name</th>
                    <th className="pb-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Email</th>
                    <th className="pb-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Role</th>
                    <th className="pb-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border">
                  {profiles?.map((p) => (
                    <tr key={p.id} className="hover:bg-surface-hover transition">
                      <td className="py-3 text-white font-medium">{p.full_name}</td>
                      <td className="py-3 text-slate-400">{p.email ?? '—'}</td>
                      <td className="py-3">
                        <Badge className="bg-brand-900/40 text-brand-300">
                          {ROLE_LABELS[p.role as UserRole]}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function MetricCard({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs text-slate-500 uppercase tracking-wider font-medium">{label}</p>
          {icon}
        </div>
        <p className="text-2xl font-bold text-white">{value}</p>
      </CardContent>
    </Card>
  )
}
