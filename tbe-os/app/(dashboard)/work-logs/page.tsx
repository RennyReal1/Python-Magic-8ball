'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Clock, User } from 'lucide-react'
import { TopBar } from '@/components/layout/TopBar'
import { WorkLogForm } from '@/components/work-logs/WorkLogForm'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { canViewAllLogs, formatDate } from '@/lib/utils'
import type { Profile, UserRole, WorkLog } from '@/types/database'

export default function WorkLogsPage() {
  const [logs, setLogs] = useState<WorkLog[]>([])
  const [profile, setProfile] = useState<Profile | null>(null)
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

    const isManager = canViewAllLogs(p.role)

    let q = supabase
      .from('work_logs')
      .select('*, user:user_id(id, full_name, role)')
      .order('week_start', { ascending: false })

    if (!isManager) {
      q = q.eq('user_id', user.id)
    }

    const { data } = await q.returns<WorkLog[]>()
    setLogs(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const isManager = profile ? canViewAllLogs(profile.role) : false

  const totalHours = logs.reduce((sum, l) => sum + l.hours_worked, 0)
  const avgHours = logs.length > 0 ? Math.round(totalHours / logs.length) : 0

  return (
    <div>
      <TopBar
        title="Work Logs"
        subtitle={isManager ? 'All team submissions' : 'Your weekly logs'}
      />

      <div className="p-6 space-y-6">
        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Total Logs</p>
              <p className="text-2xl font-bold text-white">{logs.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Total Hours</p>
              <p className="text-2xl font-bold text-white">{totalHours}h</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-5">
              <p className="text-xs text-slate-500 uppercase tracking-wider font-medium mb-2">Avg Hours / Log</p>
              <p className="text-2xl font-bold text-white">{avgHours}h</p>
            </CardContent>
          </Card>
        </div>

        {/* Header action */}
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white">
            {isManager ? 'All Team Logs' : 'My Logs'}
          </h2>
          {!isManager && (
            <Button size="sm" onClick={() => setShowForm(true)}>
              <Plus size={14} />
              Submit Log
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-20 text-slate-500">
            <FileIcon className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">No work logs yet</p>
            {!isManager && (
              <Button size="sm" className="mt-4" onClick={() => setShowForm(true)}>
                Submit your first log
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {logs.map((log) => {
              const userName =
                (log.user as { full_name?: string } | null)?.full_name ?? 'Team member'
              return (
                <Card key={log.id}>
                  <CardContent className="pt-5">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-semibold text-white">
                            Week of {formatDate(log.week_start)}
                          </p>
                          <Badge className="bg-brand-900/40 text-brand-300 flex items-center gap-1">
                            <Clock size={10} />
                            {log.hours_worked}h
                          </Badge>
                        </div>
                        {isManager && (
                          <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                            <User size={10} />
                            {userName}
                          </p>
                        )}
                      </div>
                      <span className="text-xs text-slate-600">
                        Submitted {new Date(log.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Summary</p>
                        <p className="text-sm text-slate-300">{log.summary}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-0.5">Highlights</p>
                        <p className="text-sm text-slate-300">{log.highlights}</p>
                      </div>
                      {log.blockers && (
                        <div>
                          <p className="text-xs font-medium text-orange-500 uppercase tracking-wider mb-0.5">Blockers</p>
                          <p className="text-sm text-orange-300">{log.blockers}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {profile && (
        <WorkLogForm
          open={showForm}
          onClose={() => setShowForm(false)}
          onCreated={fetchData}
          userId={profile.id}
        />
      )}
    </div>
  )
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="40"
      height="40"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  )
}
