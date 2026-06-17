# TBE OS — Project Status

> **The Balanced Engineer** — Digital Operating System for a student-development nonprofit.
> Stack: Next.js 14 · TypeScript · Tailwind CSS · Supabase (PostgreSQL + Auth + RLS)
> Branch: `claude/nonprofit-app-9zhs4i`

---

## 1. Project Structure

```
tbe-os/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx          ✅ Login page
│   │   └── signup/page.tsx         ✅ Signup page
│   ├── (dashboard)/
│   │   ├── layout.tsx              ✅ Sidebar + auth guard
│   │   ├── page.tsx                ✅ Role-aware home dashboard
│   │   ├── admin/page.tsx          ✅ Analytics overview (admin/manager)
│   │   ├── tasks/page.tsx          ✅ Task board (kanban + list)
│   │   └── work-logs/page.tsx      ✅ Work log submission & history
│   ├── api/auth/callback/route.ts  ✅ Supabase OAuth callback
│   ├── globals.css                 ✅ Global styles + TBE theme
│   └── layout.tsx                  ✅ Root layout
├── components/
│   ├── layout/
│   │   ├── Sidebar.tsx             ✅ Role-filtered nav
│   │   └── TopBar.tsx              ✅ Page header + sign-out
│   ├── tasks/
│   │   ├── TaskCard.tsx            ✅ Inline status toggle
│   │   └── TaskForm.tsx            ✅ Create task modal
│   ├── ui/
│   │   ├── badge.tsx               ✅
│   │   ├── button.tsx              ✅
│   │   ├── card.tsx                ✅
│   │   └── dialog.tsx              ✅ Modal wrapper
│   └── work-logs/
│       └── WorkLogForm.tsx         ✅ Weekly log submission modal
├── lib/
│   ├── supabase/client.ts          ✅ Browser Supabase client
│   ├── supabase/server.ts          ✅ Server Supabase client
│   └── utils.ts                    ✅ cn(), formatDate(), role helpers
├── middleware.ts                   ✅ Auth route protection
├── types/database.ts               ✅ Full TypeScript types (33 tables)
└── supabase/migrations/
    ├── 001_phase1.sql              ✅ Core schema + RLS
    └── 002_scalability_schema.sql  ✅ Full scalability schema
```

---

## 2. Features Completed ✅

### Authentication
- [x] Sign up with full name, email, password
- [x] Email confirmation flow
- [x] Login / logout
- [x] Session middleware (protected routes, redirect to login)
- [x] Auto-create profile on signup (database trigger)
- [x] All credentials via `.env.local` — no hardcoded keys

### Role-Based Access Control
- [x] 6 roles: Admin, Nigeria CEO, Program Manager, Team Member, Coach, Student
- [x] Role-filtered sidebar navigation
- [x] Role-aware dashboard content
- [x] Row Level Security on all tables

### Home Dashboard
- [x] Stat cards: total tasks, completed tasks, work logs, urgent items
- [x] Recent tasks panel (role-filtered)
- [x] Recent work logs panel
- [x] Personalized greeting by role

### Internal Team Task Management
- [x] Kanban board (3 columns: Not Started / In Progress / Completed)
- [x] List view with status filter
- [x] Create task modal (title, description, assignee, priority, due date)
- [x] One-click status cycling on each card
- [x] Priority badges (Low / Medium / High / Urgent)
- [x] Assignee display and due date
- [x] Managers see all tasks; team members see only their own

### Work Logs
- [x] Submit weekly work log (week, hours, summary, highlights, blockers)
- [x] Upsert — editing the same week updates instead of duplicating
- [x] View log history (own logs for team members; all logs for managers)
- [x] Aggregate stats: total logs, total hours, average hours per log

### Analytics Dashboard (Admin/Manager Only)
- [x] 6 KPI cards: users, tasks, completed, in-progress, work logs, completion %
- [x] Team breakdown by role
- [x] Task status breakdown with progress bar
- [x] Urgent items list
- [x] All members table (name, email, role, join date)

### Design System
- [x] Dark futuristic theme (indigo/purple on near-black)
- [x] Custom Tailwind colors (`brand`, `surface`)
- [x] Reusable UI components: Button, Card, Badge, Dialog
- [x] Sidebar with active state, role-filtered nav items
- [x] Mobile-responsive layout
- [x] Custom scrollbar, focus ring, Inter font

---

## 3. Features Partially Completed ⚠️

| Feature | Status | What's Done | What's Missing |
|---|---|---|---|
| Analytics Dashboard | ⚠️ Partial | KPI cards, member table, urgent items | Charts, trend data, export |
| Sidebar Navigation | ⚠️ Partial | Links for all Phase 2 routes exist | Pages behind those links are stubs |
| Role Dashboards | ⚠️ Partial | Admin, Manager, Team Member views | Coach and Student views not built |

---

## 4. Database Schema Created

### Migration 001 — Phase 1 Core
| Table | Purpose |
|---|---|
| `profiles` | Users + role (extends Supabase auth) |
| `tasks` | Internal team task management |
| `work_logs` | Weekly team work submissions |

Includes: `user_role`, `task_status`, `task_priority` enums · RLS policies · `touch_updated_at` trigger · auto-profile trigger on signup.

### Migration 002 — Scalability Schema (30 new tables)

| Domain | Tables |
|---|---|
| **Geography** | `countries`, `organizations` |
| **Programs & Cohorts** | `programs`, `cohorts`, `cohort_enrollments` |
| **Curriculum** | `modules`, `assignments`, `submissions` |
| **Onboarding** | `onboarding_steps`, `onboarding_progress` |
| **Workshop Library** | `workshops`, `workshop_completions` |
| **Exams** | `exams`, `exam_questions`, `exam_attempts`, `exam_answers` |
| **Messaging** | `conversations`, `messages` |
| **Scheduling** | `meeting_requests` |
| **Partnerships CRM** | `partners`, `partner_contacts`, `partnership_activities` |
| **Opportunity Hub** | `opportunities`, `opportunity_applications` |
| **Alumni Network** | `alumni_profiles`, `alumni_mentorships` |
| **Scholarship DB** | `scholarships`, `scholarship_applications` |
| **AI Assistant** | `ai_conversations`, `ai_messages`, `ai_usage` |
| **Platform** | `notifications`, `audit_logs` |

All tables have: RLS policies · `updated_at` triggers · FK relationships · appropriate enums.
Profiles extended with: `country_id`, `organization_id`, `bio`, `linkedin_url`, `graduation_year`, `is_alumni`, `deleted_at`.

**Total:** 33 tables · 15 enums · Full TypeScript types in `types/database.ts`.

---

## 5. Remaining Features (Not Yet Built)

### Phase 2 — Student Portal
- [ ] Student cohort dashboard (enrolled cohort, progress, coach info)
- [ ] Weekly module viewer (published modules by week)
- [ ] Assignment submission (text + file links)
- [ ] Assignment status tracking (Submitted → Reviewed → Approved)
- [ ] Coach feedback view

### Phase 3 — Onboarding Portal
- [ ] Onboarding checklist UI (steps, completion %)
- [ ] Admin: create/reorder onboarding steps
- [ ] Role-specific step targeting

### Phase 4 — Workshop Library
- [ ] Workshop grid/list page
- [ ] Video embed player
- [ ] Category filters + tag search
- [ ] Mark as completed
- [ ] Admin upload/edit workshop

### Phase 5 — Exams
- [ ] Exam list page
- [ ] Take exam UI (timer, question progression)
- [ ] Multiple choice + short answer rendering
- [ ] Score calculation and pass/fail display
- [ ] Admin: create/edit exam and questions

### Phase 6 — Coach Messaging
- [ ] Conversation list
- [ ] Message thread UI (real-time with Supabase Realtime)
- [ ] Admin message log view

### Phase 7 — 1-on-1 Scheduling
- [ ] Student: request meeting (topic, time, duration)
- [ ] Coach: approve/reject/add meeting link
- [ ] Calendar view (optional)

### Phase 8 — Partnerships CRM
- [ ] Partner list + kanban by stage
- [ ] Partner detail page (contacts, activity log)
- [ ] Log activity modal
- [ ] Contact management

### Phase 9 — Opportunity Hub
- [ ] Opportunity board (filter by type, country, remote)
- [ ] Opportunity detail + apply button
- [ ] Application tracker
- [ ] Admin: publish/manage opportunities

### Phase 10 — Alumni Network
- [ ] Alumni directory (search, filter by country/mentor status)
- [ ] Alumni profile page
- [ ] Mentorship request flow

### Phase 11 — AI Assistant
- [ ] Chat UI (streaming responses)
- [ ] Conversation history sidebar
- [ ] Context / persona system prompt
- [ ] Daily usage tracking display

### Phase 12 — Scholarship Database
- [ ] Scholarship listing (filter by deadline, amount, country)
- [ ] Application tracker
- [ ] Admin: add/edit scholarships

### Platform-Wide (Any Phase)
- [ ] Notifications bell + dropdown
- [ ] Email notifications (Supabase Edge Functions)
- [ ] Real-time updates (Supabase Realtime subscriptions)
- [ ] Admin: role assignment UI
- [ ] Admin: audit log viewer
- [ ] File upload (Supabase Storage)
- [ ] Multi-language support (i18n)
- [ ] Dark/light mode toggle

---

## 6. Recommended Next Step

**Build Phase 2 — Student Portal.**

It is the highest-impact next step because:
- Students are the primary beneficiaries of TBE
- It uses the cohort/curriculum tables already designed in `002_scalability_schema.sql`
- It unlocks the coach feedback loop (assignments → submissions → feedback)
- It makes the platform immediately usable end-to-end for a real cohort

**Suggested build order for Phase 2:**
1. Seed a program + cohort + enroll a test student
2. Student dashboard page (cohort info, coach name, progress bar)
3. Module list (weekly curriculum view)
4. Assignment submission form
5. Coach submission review page (feedback + status update)
6. Student: view feedback and assignment status

---

## How to Run

```bash
# 1. Install dependencies
cd tbe-os && npm install

# 2. Fill in Supabase credentials
#    Edit tbe-os/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGci...

# 3. Run the database migrations
#    Supabase dashboard → SQL Editor
#    Paste and run: supabase/migrations/001_phase1.sql
#    Then paste and run: supabase/migrations/002_scalability_schema.sql

# 4. Set your admin role
#    UPDATE public.profiles SET role = 'admin' WHERE email = 'you@example.com';

# 5. Start the dev server
npm run dev
# → http://localhost:3000
```
