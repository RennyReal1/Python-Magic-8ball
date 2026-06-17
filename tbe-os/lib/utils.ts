import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { TaskPriority, TaskStatus, UserRole } from '@/types/database'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function getMonday(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  d.setDate(diff)
  return d.toISOString().split('T')[0]
}

export const ROLE_LABELS: Record<UserRole, string> = {
  admin:           'Admin / Founder',
  nigeria_ceo:     'Nigeria CEO',
  team_member:     'Team Member',
  program_manager: 'Program Manager',
  coach:           'Coach',
  student:         'Student',
}

export const STATUS_LABELS: Record<TaskStatus, string> = {
  not_started: 'Not Started',
  in_progress: 'In Progress',
  completed:   'Completed',
}

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low:    'Low',
  medium: 'Medium',
  high:   'High',
  urgent: 'Urgent',
}

export const STATUS_COLORS: Record<TaskStatus, string> = {
  not_started: 'bg-zinc-700 text-zinc-300',
  in_progress: 'bg-blue-900 text-blue-300',
  completed:   'bg-emerald-900 text-emerald-300',
}

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low:    'bg-zinc-700 text-zinc-300',
  medium: 'bg-yellow-900 text-yellow-300',
  high:   'bg-orange-900 text-orange-300',
  urgent: 'bg-red-900 text-red-300',
}

export function canManageTasks(role: UserRole): boolean {
  return ['admin', 'program_manager'].includes(role)
}

export function canViewAllTasks(role: UserRole): boolean {
  return ['admin', 'nigeria_ceo', 'program_manager'].includes(role)
}

export function canViewAllLogs(role: UserRole): boolean {
  return ['admin', 'nigeria_ceo', 'program_manager'].includes(role)
}

export function isAdminRole(role: UserRole): boolean {
  return role === 'admin'
}
