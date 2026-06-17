-- ============================================================
-- TBE OS — Scalability Schema (Phase 2+)
-- Run this AFTER 001_phase1.sql
-- Designed for: multi-cohort, multi-country, multi-coach,
--   partnerships CRM, opportunity hub, alumni network,
--   AI assistant, and scholarship database.
-- ============================================================

-- ─────────────────────────────────────────────
-- NEW ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE public.cohort_status AS ENUM (
  'upcoming',
  'active',
  'completed',
  'cancelled'
);

CREATE TYPE public.submission_status AS ENUM (
  'submitted',
  'reviewed',
  'needs_revision',
  'approved'
);

CREATE TYPE public.meeting_status AS ENUM (
  'pending',
  'approved',
  'rejected',
  'completed',
  'cancelled'
);

CREATE TYPE public.message_status AS ENUM (
  'sent',
  'delivered',
  'read'
);

CREATE TYPE public.exam_question_type AS ENUM (
  'multiple_choice',
  'short_answer',
  'essay'
);

CREATE TYPE public.exam_status AS ENUM (
  'draft',
  'published',
  'archived'
);

CREATE TYPE public.attempt_status AS ENUM (
  'in_progress',
  'submitted',
  'graded'
);

CREATE TYPE public.partnership_stage AS ENUM (
  'prospect',
  'outreach',
  'in_conversation',
  'negotiating',
  'active',
  'paused',
  'closed_won',
  'closed_lost'
);

CREATE TYPE public.partner_type AS ENUM (
  'corporate',
  'university',
  'ngo',
  'government',
  'media',
  'individual',
  'other'
);

CREATE TYPE public.opportunity_type AS ENUM (
  'internship',
  'full_time',
  'part_time',
  'fellowship',
  'grant',
  'scholarship',
  'volunteer',
  'contract'
);

CREATE TYPE public.opportunity_status AS ENUM (
  'draft',
  'open',
  'closed',
  'expired'
);

CREATE TYPE public.application_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'shortlisted',
  'accepted',
  'rejected',
  'withdrawn'
);

-- ─────────────────────────────────────────────
-- GEOGRAPHY & ORGANIZATION
-- ─────────────────────────────────────────────

-- Lookup table for all countries TBE operates in
CREATE TABLE public.countries (
  id          SERIAL        PRIMARY KEY,
  name        TEXT          NOT NULL UNIQUE,
  iso_code    CHAR(2)       NOT NULL UNIQUE,   -- ISO 3166-1 alpha-2
  region      TEXT,                             -- e.g. 'West Africa', 'North America'
  is_active   BOOLEAN       NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- TBE chapters, HQ, and partner offices
CREATE TABLE public.organizations (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT          NOT NULL,
  type            TEXT          NOT NULL DEFAULT 'chapter', -- 'hq' | 'chapter' | 'partner'
  country_id      INTEGER       REFERENCES public.countries(id),
  website         TEXT,
  logo_url        TEXT,
  description     TEXT,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- EXTEND PROFILES (non-breaking — all nullable)
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS country_id       INTEGER     REFERENCES public.countries(id),
  ADD COLUMN IF NOT EXISTS organization_id  UUID        REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS bio              TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url     TEXT,
  ADD COLUMN IF NOT EXISTS graduation_year  INTEGER,
  ADD COLUMN IF NOT EXISTS is_alumni        BOOLEAN     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS deleted_at       TIMESTAMPTZ;   -- soft-delete

-- ─────────────────────────────────────────────
-- PROGRAMS & COHORTS
-- ─────────────────────────────────────────────

-- A program is a curriculum template (e.g. "Engineering Fellowship")
CREATE TABLE public.programs (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  name            TEXT          NOT NULL,
  description     TEXT,
  duration_weeks  INTEGER,
  is_active       BOOLEAN       NOT NULL DEFAULT true,
  created_by      UUID          REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- A cohort is a running instance of a program in a specific country/time
CREATE TABLE public.cohorts (
  id              UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id      UUID                  NOT NULL REFERENCES public.programs(id),
  country_id      INTEGER               REFERENCES public.countries(id),
  organization_id UUID                  REFERENCES public.organizations(id),
  name            TEXT                  NOT NULL,   -- e.g. "Cohort 3 — Nigeria 2025"
  status          public.cohort_status  NOT NULL DEFAULT 'upcoming',
  start_date      DATE,
  end_date        DATE,
  max_students    INTEGER,
  created_by      UUID                  REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ           NOT NULL DEFAULT NOW()
);

-- Maps students to cohorts and assigns a coach per student
CREATE TABLE public.cohort_enrollments (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  cohort_id       UUID          NOT NULL REFERENCES public.cohorts(id) ON DELETE CASCADE,
  student_id      UUID          NOT NULL REFERENCES public.profiles(id),
  coach_id        UUID          REFERENCES public.profiles(id),
  status          TEXT          NOT NULL DEFAULT 'active', -- 'active'|'paused'|'graduated'|'dropped'
  enrolled_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  graduation_date DATE,
  notes           TEXT,
  UNIQUE (cohort_id, student_id)
);

-- ─────────────────────────────────────────────
-- CURRICULUM
-- ─────────────────────────────────────────────

-- Weekly learning modules within a program
CREATE TABLE public.modules (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id    UUID          NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title         TEXT          NOT NULL,
  description   TEXT,
  week_number   INTEGER       NOT NULL,
  is_published  BOOLEAN       NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (program_id, week_number)
);

-- Assignments within a module
CREATE TABLE public.assignments (
  id               UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  module_id        UUID          NOT NULL REFERENCES public.modules(id) ON DELETE CASCADE,
  title            TEXT          NOT NULL,
  description      TEXT,
  instructions     TEXT,
  due_days_offset  INTEGER,       -- days after module start date
  max_score        INTEGER        DEFAULT 100,
  is_published     BOOLEAN        NOT NULL DEFAULT false,
  created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Student submissions per assignment+cohort (unique per student+assignment+cohort)
CREATE TABLE public.submissions (
  id              UUID                      PRIMARY KEY DEFAULT uuid_generate_v4(),
  assignment_id   UUID                      NOT NULL REFERENCES public.assignments(id),
  student_id      UUID                      NOT NULL REFERENCES public.profiles(id),
  cohort_id       UUID                      NOT NULL REFERENCES public.cohorts(id),
  content         TEXT,
  file_urls       TEXT[],                   -- array of attachment / drive links
  status          public.submission_status  NOT NULL DEFAULT 'submitted',
  score           INTEGER,
  coach_feedback  TEXT,
  reviewed_by     UUID                      REFERENCES public.profiles(id),
  reviewed_at     TIMESTAMPTZ,
  submitted_at    TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ               NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, student_id, cohort_id)
);

-- ─────────────────────────────────────────────
-- ONBOARDING PORTAL
-- ─────────────────────────────────────────────

CREATE TABLE public.onboarding_steps (
  id            UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT                NOT NULL,
  description   TEXT,
  content_url   TEXT,
  step_order    INTEGER             NOT NULL,
  target_roles  public.user_role[]  NOT NULL DEFAULT '{team_member}',
  is_required   BOOLEAN             NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE public.onboarding_progress (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  step_id       UUID          NOT NULL REFERENCES public.onboarding_steps(id),
  completed_at  TIMESTAMPTZ,
  notes         TEXT,
  UNIQUE (user_id, step_id)
);

-- ─────────────────────────────────────────────
-- WORKSHOP LIBRARY
-- ─────────────────────────────────────────────

CREATE TABLE public.workshops (
  id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT                NOT NULL,
  description     TEXT,
  video_url       TEXT,
  thumbnail_url   TEXT,
  category        TEXT,
  duration_mins   INTEGER,
  tags            TEXT[],
  access_roles    public.user_role[]  NOT NULL DEFAULT '{team_member,coach,student}',
  published_at    TIMESTAMPTZ,
  created_by      UUID                REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

-- Track which users have finished which workshops
CREATE TABLE public.workshop_completions (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  workshop_id   UUID          NOT NULL REFERENCES public.workshops(id) ON DELETE CASCADE,
  user_id       UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completed_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (workshop_id, user_id)
);

-- ─────────────────────────────────────────────
-- EXAMS
-- ─────────────────────────────────────────────

CREATE TABLE public.exams (
  id              UUID                PRIMARY KEY DEFAULT uuid_generate_v4(),
  title           TEXT                NOT NULL,
  description     TEXT,
  category        TEXT,               -- e.g. 'AI Tools Training', 'Coaching Training'
  status          public.exam_status  NOT NULL DEFAULT 'draft',
  time_limit_mins INTEGER,
  pass_score      INTEGER             DEFAULT 70,
  access_roles    public.user_role[]  NOT NULL DEFAULT '{team_member}',
  created_by      UUID                REFERENCES public.profiles(id),
  created_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ         NOT NULL DEFAULT NOW()
);

CREATE TABLE public.exam_questions (
  id              UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id         UUID                        NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text   TEXT                        NOT NULL,
  question_type   public.exam_question_type   NOT NULL DEFAULT 'multiple_choice',
  -- For multiple_choice: [{label, value, is_correct}]
  options         JSONB,
  correct_answer  TEXT,                       -- for short_answer grading
  points          INTEGER                     NOT NULL DEFAULT 1,
  question_order  INTEGER                     NOT NULL,
  created_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

CREATE TABLE public.exam_attempts (
  id            UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  exam_id       UUID                    NOT NULL REFERENCES public.exams(id),
  user_id       UUID                    NOT NULL REFERENCES public.profiles(id),
  status        public.attempt_status   NOT NULL DEFAULT 'in_progress',
  score         INTEGER,
  passed        BOOLEAN,
  started_at    TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  submitted_at  TIMESTAMPTZ,
  graded_at     TIMESTAMPTZ
);

CREATE TABLE public.exam_answers (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  attempt_id      UUID          NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id     UUID          NOT NULL REFERENCES public.exam_questions(id),
  answer_text     TEXT,
  selected_option TEXT,
  is_correct      BOOLEAN,
  points_earned   INTEGER       DEFAULT 0,
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (attempt_id, question_id)
);

-- ─────────────────────────────────────────────
-- COACH MESSAGING
-- ─────────────────────────────────────────────

-- One conversation thread per student-coach pair
CREATE TABLE public.conversations (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id  UUID          NOT NULL REFERENCES public.profiles(id),
  coach_id    UUID          NOT NULL REFERENCES public.profiles(id),
  cohort_id   UUID          REFERENCES public.cohorts(id),
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, coach_id)
);

CREATE TABLE public.messages (
  id                UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID                    NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id         UUID                    NOT NULL REFERENCES public.profiles(id),
  content           TEXT                    NOT NULL,
  status            public.message_status   NOT NULL DEFAULT 'sent',
  sent_at           TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  read_at           TIMESTAMPTZ
);

-- ─────────────────────────────────────────────
-- 1-ON-1 SCHEDULING
-- ─────────────────────────────────────────────

CREATE TABLE public.meeting_requests (
  id              UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id      UUID                    NOT NULL REFERENCES public.profiles(id),
  coach_id        UUID                    NOT NULL REFERENCES public.profiles(id),
  cohort_id       UUID                    REFERENCES public.cohorts(id),
  topic           TEXT                    NOT NULL,
  proposed_at     TIMESTAMPTZ             NOT NULL,
  duration_mins   INTEGER                 NOT NULL DEFAULT 30,
  meeting_link    TEXT,
  status          public.meeting_status   NOT NULL DEFAULT 'pending',
  coach_notes     TEXT,
  created_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ             NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- PARTNERSHIPS CRM
-- ─────────────────────────────────────────────

CREATE TABLE public.partners (
  id            UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT                        NOT NULL,
  type          public.partner_type         NOT NULL DEFAULT 'corporate',
  country_id    INTEGER                     REFERENCES public.countries(id),
  website       TEXT,
  logo_url      TEXT,
  description   TEXT,
  stage         public.partnership_stage    NOT NULL DEFAULT 'prospect',
  owner_id      UUID                        REFERENCES public.profiles(id),  -- TBE team lead
  tags          TEXT[],
  is_active     BOOLEAN                     NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

-- Key contacts at each partner organization
CREATE TABLE public.partner_contacts (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id    UUID          NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  full_name     TEXT          NOT NULL,
  title         TEXT,
  email         TEXT,
  phone         TEXT,
  linkedin_url  TEXT,
  is_primary    BOOLEAN       NOT NULL DEFAULT false,
  notes         TEXT,
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Activity log: calls, emails, meetings, proposals for a partner
CREATE TABLE public.partnership_activities (
  id              UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id      UUID          NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  logged_by       UUID          REFERENCES public.profiles(id),
  -- e.g. 'email' | 'call' | 'meeting' | 'proposal_sent' | 'note'
  activity_type   TEXT          NOT NULL,
  summary         TEXT          NOT NULL,
  occurred_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  created_at      TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- OPPORTUNITY HUB
-- ─────────────────────────────────────────────

CREATE TABLE public.opportunities (
  id            UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
  partner_id    UUID                        REFERENCES public.partners(id),
  title         TEXT                        NOT NULL,
  description   TEXT,
  type          public.opportunity_type     NOT NULL,
  location      TEXT,
  country_id    INTEGER                     REFERENCES public.countries(id),
  is_remote     BOOLEAN                     DEFAULT false,
  deadline      DATE,
  link          TEXT,
  status        public.opportunity_status   NOT NULL DEFAULT 'draft',
  tags          TEXT[],
  created_by    UUID                        REFERENCES public.profiles(id),
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ                 NOT NULL DEFAULT NOW()
);

-- Student or alumni applications to an opportunity
CREATE TABLE public.opportunity_applications (
  id              UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
  opportunity_id  UUID                        NOT NULL REFERENCES public.opportunities(id),
  applicant_id    UUID                        NOT NULL REFERENCES public.profiles(id),
  status          public.application_status   NOT NULL DEFAULT 'submitted',
  cover_note      TEXT,
  applied_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  UNIQUE (opportunity_id, applicant_id)
);

-- ─────────────────────────────────────────────
-- ALUMNI NETWORK
-- ─────────────────────────────────────────────

-- Extended profile for alumni (1:1 with profiles)
CREATE TABLE public.alumni_profiles (
  id                    UUID          PRIMARY KEY REFERENCES public.profiles(id),
  graduation_cohort_id  UUID          REFERENCES public.cohorts(id),
  current_role          TEXT,
  current_company       TEXT,
  country_id            INTEGER       REFERENCES public.countries(id),
  is_mentor             BOOLEAN       NOT NULL DEFAULT false,
  open_to_networking    BOOLEAN       NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Alumni mentoring active students
CREATE TABLE public.alumni_mentorships (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  mentor_id   UUID          NOT NULL REFERENCES public.alumni_profiles(id),
  mentee_id   UUID          NOT NULL REFERENCES public.profiles(id),
  -- 'pending' | 'active' | 'completed' | 'cancelled'
  status      TEXT          NOT NULL DEFAULT 'pending',
  start_date  DATE,
  end_date    DATE,
  notes       TEXT,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE (mentor_id, mentee_id)
);

-- ─────────────────────────────────────────────
-- SCHOLARSHIP DATABASE
-- ─────────────────────────────────────────────

CREATE TABLE public.scholarships (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT          NOT NULL,
  provider      TEXT          NOT NULL,
  description   TEXT,
  amount        NUMERIC(12,2),
  currency      CHAR(3)       DEFAULT 'USD',
  deadline      DATE,
  eligibility   TEXT,
  requirements  TEXT[],
  link          TEXT,
  country_ids   INTEGER[],    -- eligible countries (FK array to countries.id)
  tags          TEXT[],
  is_active     BOOLEAN       NOT NULL DEFAULT true,
  created_by    UUID          REFERENCES public.profiles(id),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE public.scholarship_applications (
  id              UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
  scholarship_id  UUID                        NOT NULL REFERENCES public.scholarships(id),
  applicant_id    UUID                        NOT NULL REFERENCES public.profiles(id),
  status          public.application_status   NOT NULL DEFAULT 'submitted',
  notes           TEXT,
  applied_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ                 NOT NULL DEFAULT NOW(),
  UNIQUE (scholarship_id, applicant_id)
);

-- ─────────────────────────────────────────────
-- AI ASSISTANT
-- ─────────────────────────────────────────────

CREATE TABLE public.ai_conversations (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES public.profiles(id),
  title       TEXT,         -- auto-named or user-named
  context     TEXT,         -- system prompt / persona override
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

CREATE TABLE public.ai_messages (
  id                UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   UUID          NOT NULL REFERENCES public.ai_conversations(id) ON DELETE CASCADE,
  -- 'user' | 'assistant'
  role              TEXT          NOT NULL,
  content           TEXT          NOT NULL,
  tokens_used       INTEGER,
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Daily usage bucket per user for rate-limiting / analytics
CREATE TABLE public.ai_usage (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id),
  date          DATE        NOT NULL DEFAULT CURRENT_DATE,
  messages_sent INTEGER     NOT NULL DEFAULT 0,
  tokens_used   INTEGER     NOT NULL DEFAULT 0,
  UNIQUE (user_id, date)
);

-- ─────────────────────────────────────────────
-- NOTIFICATIONS (platform-wide)
-- ─────────────────────────────────────────────

CREATE TABLE public.notifications (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  -- e.g. 'task_assigned' | 'submission_reviewed' | 'message_received' | 'meeting_approved'
  type        TEXT          NOT NULL,
  title       TEXT          NOT NULL,
  body        TEXT,
  link        TEXT,         -- in-app deep link
  read_at     TIMESTAMPTZ,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- AUDIT LOG
-- ─────────────────────────────────────────────

CREATE TABLE public.audit_logs (
  id          UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID          REFERENCES public.profiles(id),
  action      TEXT          NOT NULL,   -- e.g. 'role_changed', 'task_deleted'
  table_name  TEXT,
  record_id   TEXT,
  old_values  JSONB,
  new_values  JSONB,
  created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────
-- updated_at TRIGGERS (reuse touch_updated_at from 001)
-- ─────────────────────────────────────────────

CREATE TRIGGER organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER programs_updated_at
  BEFORE UPDATE ON public.programs
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER cohorts_updated_at
  BEFORE UPDATE ON public.cohorts
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER modules_updated_at
  BEFORE UPDATE ON public.modules
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER assignments_updated_at
  BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER submissions_updated_at
  BEFORE UPDATE ON public.submissions
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER workshops_updated_at
  BEFORE UPDATE ON public.workshops
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER exams_updated_at
  BEFORE UPDATE ON public.exams
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER meeting_requests_updated_at
  BEFORE UPDATE ON public.meeting_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON public.opportunities
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER opportunity_applications_updated_at
  BEFORE UPDATE ON public.opportunity_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER alumni_profiles_updated_at
  BEFORE UPDATE ON public.alumni_profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER scholarships_updated_at
  BEFORE UPDATE ON public.scholarships
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER scholarship_applications_updated_at
  BEFORE UPDATE ON public.scholarship_applications
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER ai_conversations_updated_at
  BEFORE UPDATE ON public.ai_conversations
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE public.countries                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.programs                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohorts                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cohort_enrollments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modules                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_steps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.onboarding_progress        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshops                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workshop_completions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exams                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meeting_requests           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partners                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_contacts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partnership_activities     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunities              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.opportunity_applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_profiles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alumni_mentorships         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarships               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scholarship_applications   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_messages                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                 ENABLE ROW LEVEL SECURITY;

-- ── Geography ─────────────────────────────────

CREATE POLICY "countries: all read"
  ON public.countries FOR SELECT USING (true);

CREATE POLICY "organizations: active read"
  ON public.organizations FOR SELECT USING (is_active = true);

CREATE POLICY "organizations: admin manage"
  ON public.organizations FOR ALL
  USING (public.my_role() = 'admin');

-- ── Programs & Cohorts ────────────────────────

CREATE POLICY "programs: staff read"
  ON public.programs FOR SELECT
  USING (public.my_role() NOT IN ('student'));

CREATE POLICY "programs: admin manage"
  ON public.programs FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "cohorts: enrolled student read"
  ON public.cohorts FOR SELECT
  USING (
    public.my_role() NOT IN ('student')
    OR EXISTS (
      SELECT 1 FROM public.cohort_enrollments
      WHERE cohort_id = id AND student_id = auth.uid()
    )
  );

CREATE POLICY "cohorts: admin manage"
  ON public.cohorts FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "enrollments: own read"
  ON public.cohort_enrollments FOR SELECT
  USING (student_id = auth.uid() OR coach_id = auth.uid());

CREATE POLICY "enrollments: managers read all"
  ON public.cohort_enrollments FOR SELECT
  USING (public.my_role() IN ('admin', 'program_manager', 'nigeria_ceo'));

CREATE POLICY "enrollments: admin manage"
  ON public.cohort_enrollments FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

-- ── Curriculum ────────────────────────────────

CREATE POLICY "modules: read published"
  ON public.modules FOR SELECT
  USING (
    public.my_role() IN ('admin', 'program_manager')
    OR (
      is_published = true
      AND (
        public.my_role() NOT IN ('student')
        OR EXISTS (
          SELECT 1 FROM public.cohort_enrollments ce
          JOIN public.cohorts c ON c.id = ce.cohort_id
          WHERE ce.student_id = auth.uid() AND c.program_id = modules.program_id
        )
      )
    )
  );

CREATE POLICY "modules: admin manage"
  ON public.modules FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "assignments: read published"
  ON public.assignments FOR SELECT
  USING (
    public.my_role() IN ('admin', 'program_manager')
    OR (
      is_published = true
      AND (
        public.my_role() NOT IN ('student')
        OR EXISTS (
          SELECT 1 FROM public.modules m
          JOIN public.cohorts c ON c.program_id = m.program_id
          JOIN public.cohort_enrollments ce ON ce.cohort_id = c.id
          WHERE m.id = module_id AND ce.student_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "assignments: admin manage"
  ON public.assignments FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "submissions: own"
  ON public.submissions FOR ALL
  USING (student_id = auth.uid());

CREATE POLICY "submissions: coach review"
  ON public.submissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.cohort_enrollments e
      WHERE e.cohort_id = submissions.cohort_id AND e.coach_id = auth.uid()
    )
  );

CREATE POLICY "submissions: coach update"
  ON public.submissions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.cohort_enrollments e
      WHERE e.cohort_id = submissions.cohort_id AND e.coach_id = auth.uid()
    )
  );

CREATE POLICY "submissions: managers all"
  ON public.submissions FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

-- ── Onboarding ────────────────────────────────

CREATE POLICY "onboarding_steps: staff read"
  ON public.onboarding_steps FOR SELECT
  USING (public.my_role() NOT IN ('student'));

CREATE POLICY "onboarding_steps: admin manage"
  ON public.onboarding_steps FOR ALL
  USING (public.my_role() = 'admin');

CREATE POLICY "onboarding_progress: own"
  ON public.onboarding_progress FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "onboarding_progress: admin read"
  ON public.onboarding_progress FOR SELECT
  USING (public.my_role() IN ('admin', 'program_manager'));

-- ── Workshops ─────────────────────────────────

CREATE POLICY "workshops: role access"
  ON public.workshops FOR SELECT
  USING (
    published_at IS NOT NULL
    AND (public.my_role() = ANY(access_roles) OR public.my_role() = 'admin')
  );

CREATE POLICY "workshops: admin manage"
  ON public.workshops FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "workshop_completions: own"
  ON public.workshop_completions FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "workshop_completions: admin read"
  ON public.workshop_completions FOR SELECT
  USING (public.my_role() IN ('admin', 'program_manager'));

-- ── Exams ─────────────────────────────────────

CREATE POLICY "exams: role access"
  ON public.exams FOR SELECT
  USING (
    public.my_role() IN ('admin', 'program_manager')
    OR (status = 'published' AND public.my_role() = ANY(access_roles))
  );

CREATE POLICY "exams: admin manage"
  ON public.exams FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "exam_questions: read"
  ON public.exam_questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.exams e
      WHERE e.id = exam_id
        AND (
          public.my_role() IN ('admin', 'program_manager')
          OR (e.status = 'published' AND public.my_role() = ANY(e.access_roles))
        )
    )
  );

CREATE POLICY "exam_attempts: own"
  ON public.exam_attempts FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "exam_attempts: admin read"
  ON public.exam_attempts FOR SELECT
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "exam_answers: own attempt"
  ON public.exam_answers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_attempts a
      WHERE a.id = attempt_id AND a.user_id = auth.uid()
    )
  );

-- ── Messaging ─────────────────────────────────

CREATE POLICY "conversations: participants"
  ON public.conversations FOR SELECT
  USING (student_id = auth.uid() OR coach_id = auth.uid());

CREATE POLICY "conversations: admin read"
  ON public.conversations FOR SELECT
  USING (public.my_role() IN ('admin', 'nigeria_ceo'));

CREATE POLICY "conversations: create"
  ON public.conversations FOR INSERT
  WITH CHECK (student_id = auth.uid() OR coach_id = auth.uid());

CREATE POLICY "messages: participants read"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR c.coach_id = auth.uid())
    )
  );

CREATE POLICY "messages: send"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.student_id = auth.uid() OR c.coach_id = auth.uid())
    )
  );

CREATE POLICY "messages: admin read"
  ON public.messages FOR SELECT
  USING (public.my_role() IN ('admin', 'nigeria_ceo'));

-- ── Scheduling ────────────────────────────────

CREATE POLICY "meetings: participants"
  ON public.meeting_requests FOR ALL
  USING (student_id = auth.uid() OR coach_id = auth.uid());

CREATE POLICY "meetings: admin read"
  ON public.meeting_requests FOR SELECT
  USING (public.my_role() IN ('admin', 'program_manager'));

-- ── Partnerships CRM ──────────────────────────

CREATE POLICY "partners: internal read"
  ON public.partners FOR SELECT
  USING (public.my_role() IN ('admin', 'nigeria_ceo', 'program_manager', 'team_member'));

CREATE POLICY "partners: admin manage"
  ON public.partners FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "partner_contacts: internal"
  ON public.partner_contacts FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager', 'team_member'));

CREATE POLICY "partnership_activities: internal"
  ON public.partnership_activities FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager', 'team_member'));

-- ── Opportunities ─────────────────────────────

CREATE POLICY "opportunities: published read"
  ON public.opportunities FOR SELECT
  USING (status = 'open' OR public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "opportunities: admin manage"
  ON public.opportunities FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "opp_applications: own"
  ON public.opportunity_applications FOR ALL
  USING (applicant_id = auth.uid());

CREATE POLICY "opp_applications: managers read"
  ON public.opportunity_applications FOR SELECT
  USING (public.my_role() IN ('admin', 'program_manager'));

-- ── Alumni ────────────────────────────────────

CREATE POLICY "alumni_profiles: open read"
  ON public.alumni_profiles FOR SELECT
  USING (
    open_to_networking = true
    OR id = auth.uid()
    OR public.my_role() IN ('admin', 'program_manager')
  );

CREATE POLICY "alumni_profiles: own manage"
  ON public.alumni_profiles FOR ALL
  USING (id = auth.uid() OR public.my_role() = 'admin');

CREATE POLICY "mentorships: participants"
  ON public.alumni_mentorships FOR SELECT
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "mentorships: admin"
  ON public.alumni_mentorships FOR ALL
  USING (public.my_role() = 'admin');

-- ── Scholarships ──────────────────────────────

CREATE POLICY "scholarships: active read"
  ON public.scholarships FOR SELECT
  USING (is_active = true OR public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "scholarships: admin manage"
  ON public.scholarships FOR ALL
  USING (public.my_role() IN ('admin', 'program_manager'));

CREATE POLICY "schol_applications: own"
  ON public.scholarship_applications FOR ALL
  USING (applicant_id = auth.uid());

CREATE POLICY "schol_applications: managers read"
  ON public.scholarship_applications FOR SELECT
  USING (public.my_role() IN ('admin', 'program_manager'));

-- ── AI Assistant ──────────────────────────────

CREATE POLICY "ai_conversations: own"
  ON public.ai_conversations FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "ai_messages: own conversation"
  ON public.ai_messages FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ai_conversations
      WHERE id = conversation_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "ai_usage: own"
  ON public.ai_usage FOR ALL
  USING (user_id = auth.uid());

-- ── Notifications ─────────────────────────────

CREATE POLICY "notifications: own"
  ON public.notifications FOR ALL
  USING (user_id = auth.uid());

-- ── Audit Log ─────────────────────────────────

CREATE POLICY "audit_logs: admin read"
  ON public.audit_logs FOR SELECT
  USING (public.my_role() = 'admin');

-- ─────────────────────────────────────────────
-- SEED: Countries TBE operates in
-- ─────────────────────────────────────────────

INSERT INTO public.countries (name, iso_code, region) VALUES
  ('Nigeria',       'NG', 'West Africa'),
  ('Ghana',         'GH', 'West Africa'),
  ('Kenya',         'KE', 'East Africa'),
  ('South Africa',  'ZA', 'Southern Africa'),
  ('United States', 'US', 'North America'),
  ('United Kingdom','GB', 'Europe'),
  ('Canada',        'CA', 'North America')
ON CONFLICT (iso_code) DO NOTHING;
