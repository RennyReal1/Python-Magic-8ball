-- ============================================================
-- TBE OS — Phase 1 Database Schema
-- Run this entire file in the Supabase SQL Editor
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────

CREATE TYPE public.user_role AS ENUM (
  'admin',
  'nigeria_ceo',
  'team_member',
  'program_manager',
  'coach',
  'student'
);

CREATE TYPE public.task_status AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);

CREATE TYPE public.task_priority AS ENUM (
  'low',
  'medium',
  'high',
  'urgent'
);

-- ─────────────────────────────────────────────
-- TABLES
-- ─────────────────────────────────────────────

-- Profiles: mirrors auth.users with TBE-specific fields
CREATE TABLE public.profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT        NOT NULL DEFAULT 'New User',
  email       TEXT,
  role        public.user_role NOT NULL DEFAULT 'team_member',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tasks: internal team assignments
CREATE TABLE public.tasks (
  id            UUID            PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         TEXT            NOT NULL,
  description   TEXT,
  assigned_to   UUID            REFERENCES public.profiles(id) ON DELETE SET NULL,
  assigned_by   UUID            REFERENCES public.profiles(id) ON DELETE SET NULL,
  status        public.task_status   NOT NULL DEFAULT 'not_started',
  priority      public.task_priority NOT NULL DEFAULT 'medium',
  due_date      DATE,
  created_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);

-- Work logs: weekly submissions by team members
CREATE TABLE public.work_logs (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  week_start    DATE        NOT NULL,
  summary       TEXT        NOT NULL,
  hours_worked  INTEGER     NOT NULL CHECK (hours_worked > 0 AND hours_worked <= 168),
  highlights    TEXT        NOT NULL,
  blockers      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, week_start)
);

-- ─────────────────────────────────────────────
-- FUNCTIONS & TRIGGERS
-- ─────────────────────────────────────────────

-- Auto-create a profile row whenever a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User'),
    NEW.email,
    'team_member'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TRIGGER tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- ─────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────

ALTER TABLE public.profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_logs ENABLE ROW LEVEL SECURITY;

-- Helper: returns the role of the currently authenticated user
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS public.user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- ── profiles ──────────────────────────────────

-- Users can always read their own profile
CREATE POLICY "profiles: own read"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

-- Elevated roles can read all profiles (for task assignment dropdowns etc.)
CREATE POLICY "profiles: managers read all"
  ON public.profiles FOR SELECT
  USING (public.my_role() IN ('admin', 'nigeria_ceo', 'program_manager'));

-- Any authenticated user can insert their own profile (trigger path)
CREATE POLICY "profiles: own insert"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

-- Users can update their own profile (name, avatar)
CREATE POLICY "profiles: own update"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- Admins can update any profile (role assignment)
CREATE POLICY "profiles: admin update all"
  ON public.profiles FOR UPDATE
  USING (public.my_role() = 'admin');

-- ── tasks ─────────────────────────────────────

-- Elevated roles see all tasks
CREATE POLICY "tasks: managers read all"
  ON public.tasks FOR SELECT
  USING (public.my_role() IN ('admin', 'nigeria_ceo', 'program_manager'));

-- Team members / coaches see only their assigned tasks
CREATE POLICY "tasks: assignee read own"
  ON public.tasks FOR SELECT
  USING (assigned_to = auth.uid());

-- Admins and program managers can create tasks
CREATE POLICY "tasks: managers insert"
  ON public.tasks FOR INSERT
  WITH CHECK (public.my_role() IN ('admin', 'program_manager'));

-- Managers can update any task (re-assign, change priority, due date)
CREATE POLICY "tasks: managers update all"
  ON public.tasks FOR UPDATE
  USING (public.my_role() IN ('admin', 'program_manager'));

-- Assignees can update their own task's status only
CREATE POLICY "tasks: assignee update status"
  ON public.tasks FOR UPDATE
  USING (assigned_to = auth.uid());

-- Only admins can delete tasks
CREATE POLICY "tasks: admin delete"
  ON public.tasks FOR DELETE
  USING (public.my_role() = 'admin');

-- ── work_logs ─────────────────────────────────

-- Users see their own logs
CREATE POLICY "work_logs: own read"
  ON public.work_logs FOR SELECT
  USING (user_id = auth.uid());

-- Managers see all logs
CREATE POLICY "work_logs: managers read all"
  ON public.work_logs FOR SELECT
  USING (public.my_role() IN ('admin', 'nigeria_ceo', 'program_manager'));

-- Users submit their own logs
CREATE POLICY "work_logs: own insert"
  ON public.work_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Users can edit their own logs (within same week)
CREATE POLICY "work_logs: own update"
  ON public.work_logs FOR UPDATE
  USING (user_id = auth.uid());

-- ─────────────────────────────────────────────
-- SEED: first admin account helper
-- Replace the email below with YOUR email before running.
-- ─────────────────────────────────────────────

-- UPDATE public.profiles
--   SET role = 'admin'
-- WHERE email = 'your-admin-email@example.com';
