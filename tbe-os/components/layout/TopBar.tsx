'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Bell } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface TopBarProps {
  title: string
  subtitle?: string
}

export function TopBar({ title, subtitle }: TopBarProps) {
  const router = useRouter()

  async function handleSignOut() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-surface-border bg-surface-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div>
        <h1 className="text-white font-semibold text-sm leading-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 text-xs">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition relative">
          <Bell size={16} />
        </button>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-surface-hover transition text-xs"
        >
          <LogOut size={14} />
          Sign out
        </button>
      </div>
    </header>
  )
}
