import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard,
  Users,
  Mail,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react'
import { LogoutButton } from '@/components/logout-button'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-950">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900">
        <div className="flex h-full flex-col">
          <div className="border-b border-slate-800 p-6">
            <h1 className="text-xl font-bold text-amber-400">TREMS</h1>
            <p className="text-sm text-slate-400">Email Campaign Platform</p>
          </div>
          <nav className="flex-1 space-y-1 p-4">
            <NavLink href="/" icon={LayoutDashboard}>
              Dashboard
            </NavLink>
            <NavLink href="/contacts" icon={Users}>
              Contacts
            </NavLink>
            <NavLink href="/campaigns" icon={Mail}>
              Campaigns
            </NavLink>
            <NavLink href="/analytics" icon={BarChart3}>
              Analytics
            </NavLink>
            <NavLink href="/settings" icon={Settings}>
              Settings
            </NavLink>
          </nav>
          <div className="border-t border-slate-800 p-4">
            <LogoutButton />
          </div>
        </div>
      </aside>
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  )
}

function NavLink({
  href,
  icon: Icon,
  children,
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
    >
      <Icon className="h-5 w-5" />
      {children}
    </Link>
  )
}

