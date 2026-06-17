import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import type { UserRole } from '@/types/database'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single<{ full_name: string; role: UserRole }>()

  if (!profile) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <Sidebar role={profile.role as UserRole} fullName={profile.full_name} />
      <main className="flex-1 overflow-y-auto">{children}</main>
    </div>
  )
}
