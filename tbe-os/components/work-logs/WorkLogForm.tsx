'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import { getMonday } from '@/lib/utils'

interface WorkLogFormProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  userId: string
}

export function WorkLogForm({ open, onClose, onCreated, userId }: WorkLogFormProps) {
  const [weekStart, setWeekStart] = useState(getMonday())
  const [summary, setSummary] = useState('')
  const [hours, setHours] = useState('')
  const [highlights, setHighlights] = useState('')
  const [blockers, setBlockers] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('work_logs').upsert(
      {
        user_id: userId,
        week_start: weekStart,
        summary: summary.trim(),
        hours_worked: parseInt(hours, 10),
        highlights: highlights.trim(),
        blockers: blockers.trim() || null,
      },
      { onConflict: 'user_id,week_start' }
    )

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setSummary('')
      setHours('')
      setHighlights('')
      setBlockers('')
      onCreated()
      onClose()
    }
  }

  const inputCls =
    'w-full px-3.5 py-2 bg-surface border border-surface-border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition'

  return (
    <Dialog open={open} onClose={onClose} title="Submit Weekly Work Log">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Week start (Monday) *</label>
            <input
              type="date"
              required
              value={weekStart}
              onChange={(e) => setWeekStart(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Hours worked *</label>
            <input
              type="number"
              required
              min={1}
              max={168}
              value={hours}
              onChange={(e) => setHours(e.target.value)}
              className={inputCls}
              placeholder="e.g. 35"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Weekly summary *</label>
          <textarea
            required
            rows={3}
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className={inputCls}
            placeholder="What did you work on this week?"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Key highlights *</label>
          <textarea
            required
            rows={2}
            value={highlights}
            onChange={(e) => setHighlights(e.target.value)}
            className={inputCls}
            placeholder="What are you most proud of this week?"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Blockers / challenges</label>
          <textarea
            rows={2}
            value={blockers}
            onChange={(e) => setBlockers(e.target.value)}
            className={inputCls}
            placeholder="Anything blocking your progress? (optional)"
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Submitting…' : 'Submit log'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
