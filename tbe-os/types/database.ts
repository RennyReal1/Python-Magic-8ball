// ============================================================
// TBE OS — Canonical TypeScript types
// Mirrors the full Supabase schema (001 + 002 migrations)
// ============================================================

// ─────────────────────────────────────────────
// ENUMS
// ─────────────────────────────────────────────

export type UserRole =
  | 'admin'
  | 'nigeria_ceo'
  | 'team_member'
  | 'program_manager'
  | 'coach'
  | 'student'

export type TaskStatus    = 'not_started' | 'in_progress' | 'completed'
export type TaskPriority  = 'low' | 'medium' | 'high' | 'urgent'

export type CohortStatus      = 'upcoming' | 'active' | 'completed' | 'cancelled'
export type SubmissionStatus  = 'submitted' | 'reviewed' | 'needs_revision' | 'approved'
export type MeetingStatus     = 'pending' | 'approved' | 'rejected' | 'completed' | 'cancelled'
export type MessageStatus     = 'sent' | 'delivered' | 'read'
export type ExamQuestionType  = 'multiple_choice' | 'short_answer' | 'essay'
export type ExamStatus        = 'draft' | 'published' | 'archived'
export type AttemptStatus     = 'in_progress' | 'submitted' | 'graded'

export type PartnershipStage =
  | 'prospect' | 'outreach' | 'in_conversation' | 'negotiating'
  | 'active' | 'paused' | 'closed_won' | 'closed_lost'

export type PartnerType =
  | 'corporate' | 'university' | 'ngo' | 'government'
  | 'media' | 'individual' | 'other'

export type OpportunityType =
  | 'internship' | 'full_time' | 'part_time' | 'fellowship'
  | 'grant' | 'scholarship' | 'volunteer' | 'contract'

export type OpportunityStatus   = 'draft' | 'open' | 'closed' | 'expired'
export type ApplicationStatus   =
  | 'draft' | 'submitted' | 'under_review' | 'shortlisted'
  | 'accepted' | 'rejected' | 'withdrawn'

// ─────────────────────────────────────────────
// CORE ROW TYPES (pure DB columns, no joins)
// ─────────────────────────────────────────────

export interface ProfileRow {
  id:               string
  full_name:        string
  email:            string | null
  role:             UserRole
  avatar_url:       string | null
  country_id:       number | null
  organization_id:  string | null
  bio:              string | null
  linkedin_url:     string | null
  graduation_year:  number | null
  is_alumni:        boolean
  deleted_at:       string | null
  created_at:       string
  updated_at:       string
}

export interface TaskRow {
  id:           string
  title:        string
  description:  string | null
  assigned_to:  string | null
  assigned_by:  string | null
  status:       TaskStatus
  priority:     TaskPriority
  due_date:     string | null
  created_at:   string
  updated_at:   string
}

export interface WorkLogRow {
  id:           string
  user_id:      string
  week_start:   string
  summary:      string
  hours_worked: number
  highlights:   string
  blockers:     string | null
  created_at:   string
}

export interface CountryRow {
  id:         number
  name:       string
  iso_code:   string
  region:     string | null
  is_active:  boolean
  created_at: string
}

export interface OrganizationRow {
  id:           string
  name:         string
  type:         string
  country_id:   number | null
  website:      string | null
  logo_url:     string | null
  description:  string | null
  is_active:    boolean
  created_at:   string
  updated_at:   string
}

export interface ProgramRow {
  id:             string
  name:           string
  description:    string | null
  duration_weeks: number | null
  is_active:      boolean
  created_by:     string | null
  created_at:     string
  updated_at:     string
}

export interface CohortRow {
  id:               string
  program_id:       string
  country_id:       number | null
  organization_id:  string | null
  name:             string
  status:           CohortStatus
  start_date:       string | null
  end_date:         string | null
  max_students:     number | null
  created_by:       string | null
  created_at:       string
  updated_at:       string
}

export interface CohortEnrollmentRow {
  id:               string
  cohort_id:        string
  student_id:       string
  coach_id:         string | null
  status:           string
  enrolled_at:      string
  graduation_date:  string | null
  notes:            string | null
}

export interface ModuleRow {
  id:           string
  program_id:   string
  title:        string
  description:  string | null
  week_number:  number
  is_published: boolean
  created_at:   string
  updated_at:   string
}

export interface AssignmentRow {
  id:               string
  module_id:        string
  title:            string
  description:      string | null
  instructions:     string | null
  due_days_offset:  number | null
  max_score:        number | null
  is_published:     boolean
  created_at:       string
  updated_at:       string
}

export interface SubmissionRow {
  id:             string
  assignment_id:  string
  student_id:     string
  cohort_id:      string
  content:        string | null
  file_urls:      string[] | null
  status:         SubmissionStatus
  score:          number | null
  coach_feedback: string | null
  reviewed_by:    string | null
  reviewed_at:    string | null
  submitted_at:   string
  updated_at:     string
}

export interface OnboardingStepRow {
  id:           string
  title:        string
  description:  string | null
  content_url:  string | null
  step_order:   number
  target_roles: UserRole[]
  is_required:  boolean
  created_at:   string
}

export interface OnboardingProgressRow {
  id:           string
  user_id:      string
  step_id:      string
  completed_at: string | null
  notes:        string | null
}

export interface WorkshopRow {
  id:             string
  title:          string
  description:    string | null
  video_url:      string | null
  thumbnail_url:  string | null
  category:       string | null
  duration_mins:  number | null
  tags:           string[] | null
  access_roles:   UserRole[]
  published_at:   string | null
  created_by:     string | null
  created_at:     string
  updated_at:     string
}

export interface WorkshopCompletionRow {
  id:           string
  workshop_id:  string
  user_id:      string
  completed_at: string
}

export interface ExamRow {
  id:               string
  title:            string
  description:      string | null
  category:         string | null
  status:           ExamStatus
  time_limit_mins:  number | null
  pass_score:       number | null
  access_roles:     UserRole[]
  created_by:       string | null
  created_at:       string
  updated_at:       string
}

export interface ExamQuestionRow {
  id:             string
  exam_id:        string
  question_text:  string
  question_type:  ExamQuestionType
  options:        { label: string; value: string; is_correct: boolean }[] | null
  correct_answer: string | null
  points:         number
  question_order: number
  created_at:     string
}

export interface ExamAttemptRow {
  id:           string
  exam_id:      string
  user_id:      string
  status:       AttemptStatus
  score:        number | null
  passed:       boolean | null
  started_at:   string
  submitted_at: string | null
  graded_at:    string | null
}

export interface ExamAnswerRow {
  id:               string
  attempt_id:       string
  question_id:      string
  answer_text:      string | null
  selected_option:  string | null
  is_correct:       boolean | null
  points_earned:    number | null
  created_at:       string
}

export interface ConversationRow {
  id:         string
  student_id: string
  coach_id:   string
  cohort_id:  string | null
  created_at: string
}

export interface MessageRow {
  id:               string
  conversation_id:  string
  sender_id:        string
  content:          string
  status:           MessageStatus
  sent_at:          string
  read_at:          string | null
}

export interface MeetingRequestRow {
  id:             string
  student_id:     string
  coach_id:       string
  cohort_id:      string | null
  topic:          string
  proposed_at:    string
  duration_mins:  number
  meeting_link:   string | null
  status:         MeetingStatus
  coach_notes:    string | null
  created_at:     string
  updated_at:     string
}

export interface PartnerRow {
  id:           string
  name:         string
  type:         PartnerType
  country_id:   number | null
  website:      string | null
  logo_url:     string | null
  description:  string | null
  stage:        PartnershipStage
  owner_id:     string | null
  tags:         string[] | null
  is_active:    boolean
  created_at:   string
  updated_at:   string
}

export interface PartnerContactRow {
  id:           string
  partner_id:   string
  full_name:    string
  title:        string | null
  email:        string | null
  phone:        string | null
  linkedin_url: string | null
  is_primary:   boolean
  notes:        string | null
  created_at:   string
}

export interface PartnershipActivityRow {
  id:             string
  partner_id:     string
  logged_by:      string | null
  activity_type:  string
  summary:        string
  occurred_at:    string
  created_at:     string
}

export interface OpportunityRow {
  id:           string
  partner_id:   string | null
  title:        string
  description:  string | null
  type:         OpportunityType
  location:     string | null
  country_id:   number | null
  is_remote:    boolean | null
  deadline:     string | null
  link:         string | null
  status:       OpportunityStatus
  tags:         string[] | null
  created_by:   string | null
  published_at: string | null
  created_at:   string
  updated_at:   string
}

export interface OpportunityApplicationRow {
  id:             string
  opportunity_id: string
  applicant_id:   string
  status:         ApplicationStatus
  cover_note:     string | null
  applied_at:     string
  updated_at:     string
}

export interface AlumniProfileRow {
  id:                   string
  graduation_cohort_id: string | null
  current_role:         string | null
  current_company:      string | null
  country_id:           number | null
  is_mentor:            boolean
  open_to_networking:   boolean
  created_at:           string
  updated_at:           string
}

export interface AlumniMentorshipRow {
  id:         string
  mentor_id:  string
  mentee_id:  string
  status:     string
  start_date: string | null
  end_date:   string | null
  notes:      string | null
  created_at: string
}

export interface ScholarshipRow {
  id:           string
  title:        string
  provider:     string
  description:  string | null
  amount:       number | null
  currency:     string | null
  deadline:     string | null
  eligibility:  string | null
  requirements: string[] | null
  link:         string | null
  country_ids:  number[] | null
  tags:         string[] | null
  is_active:    boolean
  created_by:   string | null
  created_at:   string
  updated_at:   string
}

export interface ScholarshipApplicationRow {
  id:             string
  scholarship_id: string
  applicant_id:   string
  status:         ApplicationStatus
  notes:          string | null
  applied_at:     string
  updated_at:     string
}

export interface AiConversationRow {
  id:         string
  user_id:    string
  title:      string | null
  context:    string | null
  created_at: string
  updated_at: string
}

export interface AiMessageRow {
  id:               string
  conversation_id:  string
  role:             'user' | 'assistant'
  content:          string
  tokens_used:      number | null
  created_at:       string
}

export interface AiUsageRow {
  id:             string
  user_id:        string
  date:           string
  messages_sent:  number
  tokens_used:    number
}

export interface NotificationRow {
  id:         string
  user_id:    string
  type:       string
  title:      string
  body:       string | null
  link:       string | null
  read_at:    string | null
  created_at: string
}

export interface AuditLogRow {
  id:         string
  user_id:    string | null
  action:     string
  table_name: string | null
  record_id:  string | null
  old_values: Record<string, unknown> | null
  new_values: Record<string, unknown> | null
  created_at: string
}

// ─────────────────────────────────────────────
// APP-LEVEL TYPES WITH OPTIONAL JOINS
// ─────────────────────────────────────────────

export type Profile     = ProfileRow
export type Task        = TaskRow  & { assignee?: ProfileRow | null; assigner?: ProfileRow | null }
export type WorkLog     = WorkLogRow & { user?: ProfileRow | null }
export type Submission  = SubmissionRow & { student?: ProfileRow | null; assignment?: AssignmentRow | null }
export type Partner     = PartnerRow & { country?: CountryRow | null; owner?: ProfileRow | null }
export type Opportunity = OpportunityRow & { partner?: PartnerRow | null; country?: CountryRow | null }
export type Cohort      = CohortRow & { program?: ProgramRow | null; country?: CountryRow | null }
export type Enrollment  = CohortEnrollmentRow & { student?: ProfileRow | null; coach?: ProfileRow | null }

// ─────────────────────────────────────────────
// SUPABASE DATABASE TYPE
// (used by createBrowserClient / createServerClient generics)
// ─────────────────────────────────────────────

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
      countries: {
        Row: CountryRow
        Insert: Omit<CountryRow, 'id' | 'created_at'>
        Update: Partial<Omit<CountryRow, 'id' | 'created_at'>>
        Relationships: []
      }
      organizations: {
        Row: OrganizationRow
        Insert: Omit<OrganizationRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<OrganizationRow, 'id' | 'created_at'>>
        Relationships: []
      }
      programs: {
        Row: ProgramRow
        Insert: Omit<ProgramRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ProgramRow, 'id' | 'created_at'>>
        Relationships: []
      }
      cohorts: {
        Row: CohortRow
        Insert: Omit<CohortRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<CohortRow, 'id' | 'created_at'>>
        Relationships: []
      }
      cohort_enrollments: {
        Row: CohortEnrollmentRow
        Insert: Omit<CohortEnrollmentRow, 'id' | 'enrolled_at'>
        Update: Partial<Omit<CohortEnrollmentRow, 'id' | 'enrolled_at'>>
        Relationships: []
      }
      modules: {
        Row: ModuleRow
        Insert: Omit<ModuleRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ModuleRow, 'id' | 'created_at'>>
        Relationships: []
      }
      assignments: {
        Row: AssignmentRow
        Insert: Omit<AssignmentRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AssignmentRow, 'id' | 'created_at'>>
        Relationships: []
      }
      submissions: {
        Row: SubmissionRow
        Insert: Omit<SubmissionRow, 'id' | 'submitted_at' | 'updated_at'>
        Update: Partial<Omit<SubmissionRow, 'id' | 'submitted_at'>>
        Relationships: []
      }
      onboarding_steps: {
        Row: OnboardingStepRow
        Insert: Omit<OnboardingStepRow, 'id' | 'created_at'>
        Update: Partial<Omit<OnboardingStepRow, 'id' | 'created_at'>>
        Relationships: []
      }
      onboarding_progress: {
        Row: OnboardingProgressRow
        Insert: Omit<OnboardingProgressRow, 'id'>
        Update: Partial<Omit<OnboardingProgressRow, 'id'>>
        Relationships: []
      }
      workshops: {
        Row: WorkshopRow
        Insert: Omit<WorkshopRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<WorkshopRow, 'id' | 'created_at'>>
        Relationships: []
      }
      workshop_completions: {
        Row: WorkshopCompletionRow
        Insert: Omit<WorkshopCompletionRow, 'id' | 'completed_at'>
        Update: Partial<Omit<WorkshopCompletionRow, 'id' | 'completed_at'>>
        Relationships: []
      }
      exams: {
        Row: ExamRow
        Insert: Omit<ExamRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ExamRow, 'id' | 'created_at'>>
        Relationships: []
      }
      exam_questions: {
        Row: ExamQuestionRow
        Insert: Omit<ExamQuestionRow, 'id' | 'created_at'>
        Update: Partial<Omit<ExamQuestionRow, 'id' | 'created_at'>>
        Relationships: []
      }
      exam_attempts: {
        Row: ExamAttemptRow
        Insert: Omit<ExamAttemptRow, 'id' | 'started_at'>
        Update: Partial<Omit<ExamAttemptRow, 'id' | 'started_at'>>
        Relationships: []
      }
      exam_answers: {
        Row: ExamAnswerRow
        Insert: Omit<ExamAnswerRow, 'id' | 'created_at'>
        Update: Partial<Omit<ExamAnswerRow, 'id' | 'created_at'>>
        Relationships: []
      }
      conversations: {
        Row: ConversationRow
        Insert: Omit<ConversationRow, 'id' | 'created_at'>
        Update: Partial<Omit<ConversationRow, 'id' | 'created_at'>>
        Relationships: []
      }
      messages: {
        Row: MessageRow
        Insert: Omit<MessageRow, 'id' | 'sent_at'>
        Update: Partial<Omit<MessageRow, 'id' | 'sent_at'>>
        Relationships: []
      }
      meeting_requests: {
        Row: MeetingRequestRow
        Insert: Omit<MeetingRequestRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<MeetingRequestRow, 'id' | 'created_at'>>
        Relationships: []
      }
      partners: {
        Row: PartnerRow
        Insert: Omit<PartnerRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<PartnerRow, 'id' | 'created_at'>>
        Relationships: []
      }
      partner_contacts: {
        Row: PartnerContactRow
        Insert: Omit<PartnerContactRow, 'id' | 'created_at'>
        Update: Partial<Omit<PartnerContactRow, 'id' | 'created_at'>>
        Relationships: []
      }
      partnership_activities: {
        Row: PartnershipActivityRow
        Insert: Omit<PartnershipActivityRow, 'id' | 'created_at'>
        Update: Partial<Omit<PartnershipActivityRow, 'id' | 'created_at'>>
        Relationships: []
      }
      opportunities: {
        Row: OpportunityRow
        Insert: Omit<OpportunityRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<OpportunityRow, 'id' | 'created_at'>>
        Relationships: []
      }
      opportunity_applications: {
        Row: OpportunityApplicationRow
        Insert: Omit<OpportunityApplicationRow, 'id' | 'applied_at' | 'updated_at'>
        Update: Partial<Omit<OpportunityApplicationRow, 'id' | 'applied_at'>>
        Relationships: []
      }
      alumni_profiles: {
        Row: AlumniProfileRow
        Insert: Omit<AlumniProfileRow, 'created_at' | 'updated_at'>
        Update: Partial<Omit<AlumniProfileRow, 'id' | 'created_at'>>
        Relationships: []
      }
      alumni_mentorships: {
        Row: AlumniMentorshipRow
        Insert: Omit<AlumniMentorshipRow, 'id' | 'created_at'>
        Update: Partial<Omit<AlumniMentorshipRow, 'id' | 'created_at'>>
        Relationships: []
      }
      scholarships: {
        Row: ScholarshipRow
        Insert: Omit<ScholarshipRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<ScholarshipRow, 'id' | 'created_at'>>
        Relationships: []
      }
      scholarship_applications: {
        Row: ScholarshipApplicationRow
        Insert: Omit<ScholarshipApplicationRow, 'id' | 'applied_at' | 'updated_at'>
        Update: Partial<Omit<ScholarshipApplicationRow, 'id' | 'applied_at'>>
        Relationships: []
      }
      ai_conversations: {
        Row: AiConversationRow
        Insert: Omit<AiConversationRow, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<AiConversationRow, 'id' | 'created_at'>>
        Relationships: []
      }
      ai_messages: {
        Row: AiMessageRow
        Insert: Omit<AiMessageRow, 'id' | 'created_at'>
        Update: Partial<Omit<AiMessageRow, 'id' | 'created_at'>>
        Relationships: []
      }
      ai_usage: {
        Row: AiUsageRow
        Insert: Omit<AiUsageRow, 'id'>
        Update: Partial<Omit<AiUsageRow, 'id'>>
        Relationships: []
      }
      notifications: {
        Row: NotificationRow
        Insert: Omit<NotificationRow, 'id' | 'created_at'>
        Update: Partial<Omit<NotificationRow, 'id' | 'created_at'>>
        Relationships: []
      }
      audit_logs: {
        Row: AuditLogRow
        Insert: Omit<AuditLogRow, 'id' | 'created_at'>
        Update: Partial<Omit<AuditLogRow, 'id' | 'created_at'>>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: {
      user_role:          UserRole
      task_status:        TaskStatus
      task_priority:      TaskPriority
      cohort_status:      CohortStatus
      submission_status:  SubmissionStatus
      meeting_status:     MeetingStatus
      message_status:     MessageStatus
      exam_question_type: ExamQuestionType
      exam_status:        ExamStatus
      attempt_status:     AttemptStatus
      partnership_stage:  PartnershipStage
      partner_type:       PartnerType
      opportunity_type:   OpportunityType
      opportunity_status: OpportunityStatus
      application_status: ApplicationStatus
    }
    CompositeTypes: Record<never, never>
  }
}
