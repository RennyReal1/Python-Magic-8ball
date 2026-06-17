import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TBE OS — The Balanced Engineer',
  description: 'Digital operating system for The Balanced Engineer nonprofit initiative',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="bg-surface text-slate-100 min-h-screen">{children}</body>
    </html>
  )
}
