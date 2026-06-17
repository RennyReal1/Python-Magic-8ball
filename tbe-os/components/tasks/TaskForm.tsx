'use client'

import { useState } from 'react'
import { Dialog } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'
import type { Profile, TaskPriority } from '@/types/database'

interface TaskFormProps {
  open: boolean
  onClose: () => void
  onCreated: () => void
  assignerId: string
  teamMembers: Pick<Profile, 'id' | 'full_name' | 'role'>[]
}

export function TaskForm({ open, onClose, onCreated, assignerId, teamMembers }: TaskFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error } = await supabase.from('tasks').insert({
      title: title.trim(),
      description: description.trim() || null,
      assigned_to: assignedTo || null,
      assigned_by: assignerId,
      priority,
      due_date: dueDate || null,
      status: 'not_started',
    })

    if (error) {
      setError(error.message)
      setLoading(false)
    } else {
      setTitle('')
      setDescription('')
      setAssignedTo('')
      setPriority('medium')
      setDueDate('')
      onCreated()
      onClose()
    }
  }

  const inputCls =
    'w-full px-3.5 py-2 bg-surface border border-surface-border rounded-lg text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition'

  return (
    <Dialog open={open} onClose={onClose} title="Create New Task">
      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-900/30 border border-red-800 text-red-300 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Task title *</label>
          <input
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputCls}
            placeholder="e.g. Complete onboarding documentation"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={inputCls}
            placeholder="Optional details..."
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Assign to</label>
            <select
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className={inputCls}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className={inputCls}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1.5">Due date</label>
          <input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className={inputCls}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Creating…' : 'Create task'}
          </Button>
        </div>
      </form>
    </Dialog>
  )
}
