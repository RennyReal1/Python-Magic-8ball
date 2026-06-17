export type UserRole =
  | 'admin'
  | 'nigeria_ceo'
  | 'team_member'
  | 'program_manager'
  | 'coach'
  | 'student'

export type TaskStatus = 'not_started' | 'in_progress' | 'completed'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

// ── Pure DB row types (no joins) ───────────────────────────

export interface ProfileRow {
  id: string
  full_name: string
  email: string | null
  role: UserRole
  avatar_url: string | null
  created_at: string
  updated_at: string
}

export interface TaskRow {
  id: string
  title: string
  description: string | null
  assigned_to: string | null
  assigned_by: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  created_at: string
  updated_at: string
}

export interface WorkLogRow {
  id: string
  user_id: string
  week_start: string
  summary: string
  hours_worked: number
  highlights: string
  blockers: string | null
  created_at: string
}

// ── App-level types with optional relations ─────────────────

export type Profile = ProfileRow

export type Task = TaskRow & {
  assignee?: ProfileRow | null
  assigner?: ProfileRow | null
}

export type WorkLog = WorkLogRow & {
  user?: ProfileRow | null
}

// ── Supabase Database type ──────────────────────────────────

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow
        Insert: Omit<ProfileRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProfileRow, 'id' | 'created_at'>>
        Relationships: []
      }
      tasks: {
        Row: TaskRow
        Insert: Omit<TaskRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<TaskRow, 'id' | 'created_at'>>
        Relationships: []
      }
      work_logs: {
        Row: WorkLogRow
        Insert: Omit<WorkLogRow, 'id' | 'created_at'>
        Update: Partial<Omit<WorkLogRow, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: {
      user_role: UserRole
      task_status: TaskStatus
      task_priority: TaskPriority
    }
    CompositeTypes: Record<never, never>
  }
}
