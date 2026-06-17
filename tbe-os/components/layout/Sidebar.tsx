'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  CheckSquare,
  FileText,
  Users,
  Settings,
  BookOpen,
  BarChart2,
  type LucideIcon,
} from 'lucide-react'
import { cn, ROLE_LABELS } from '@/lib/utils'
import type { UserRole } from '@/types/database'

interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  roles: UserRole[]
}

const NAV: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/',
    icon: LayoutDashboard,
    roles: ['admin', 'nigeria_ceo', 'team_member', 'program_manager', 'coach'],
  },
  {
    label: 'Tasks',
    href: '/tasks',
    icon: CheckSquare,
    roles: ['admin', 'nigeria_ceo', 'team_member', 'program_manager'],
  },
  {
    label: 'Work Logs',
    href: '/work-logs',
    icon: FileText,
    roles: ['admin', 'nigeria_ceo', 'team_member', 'program_manager'],
  },
  {
    label: 'Analytics',
    href: '/admin',
    icon: BarChart2,
    roles: ['admin', 'nigeria_ceo', 'program_manager'],
  },
  {
    label: 'Team',
    href: '/team',
    icon: Users,
    roles: ['admin', 'program_manager'],
  },
  {
    label: 'Workshops',
    href: '/workshops',
    icon: BookOpen,
    roles: ['admin', 'nigeria_ceo', 'team_member', 'program_manager', 'coach'],
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
  },
]

interface SidebarProps {
  role: UserRole
  fullName: string
}

export function Sidebar({ role, fullName }: SidebarProps) {
  const pathname = usePathname()

  const visibleNav = NAV.filter((item) => item.roles.includes(role))

  const initials = fullName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <aside className="w-60 flex-shrink-0 h-screen sticky top-0 flex flex-col bg-surface-card border-r border-surface-border">
      {/* Brand */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-surface-border">
        <div className="w-8 h-8 rounded-lg bg-gradient-brand flex items-center justify-center shadow-glow flex-shrink-0">
          <span className="text-white font-bold text-xs">TBE</span>
        </div>
        <div className="min-w-0">
          <p className="text-white font-semibold text-sm leading-tight truncate">TBE OS</p>
          <p className="text-slate-500 text-xs truncate">The Balanced Engineer</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {visibleNav.map((item) => {
          const Icon = item.icon
          const active =
            item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
                active
                  ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-surface-hover'
              )}
            >
              <Icon size={16} className={active ? 'text-brand-400' : ''} />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* User footer */}
      <div className="px-3 py-4 border-t border-surface-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-brand-700 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-xs font-medium truncate">{fullName}</p>
            <p className="text-slate-500 text-xs truncate">{ROLE_LABELS[role]}</p>
          </div>
        </div>
      </div>
    </aside>
  )
}
