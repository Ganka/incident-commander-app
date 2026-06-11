'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  AlertTriangle,
  ShieldCheck,
  Server,
  MessageSquare,
  Activity,
  Zap,
} from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: React.ElementType
  exact?: boolean
}

const NAV_ITEMS: NavItem[] = [
  { href: '/',      label: 'Dashboard',  icon: LayoutDashboard, exact: true },
  { href: '/#incidents', label: 'Incidents',  icon: AlertTriangle },
  { href: '/#sla',      label: 'SLA Status', icon: ShieldCheck },
  { href: '/#services', label: 'Services',   icon: Server },
  { href: '/chat',  label: 'AI Chat',    icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()

  const isActive = (item: NavItem) => {
    if (item.href === '/chat') return pathname === '/chat'
    if (item.exact) return pathname === '/'
    return pathname === '/'
  }

  return (
    <aside
      className="fixed top-0 left-0 h-screen w-60 flex flex-col z-30"
      style={{ background: '#0d1520' }}
    >
      {/* Brand */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center flex-shrink-0">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-white font-bold text-sm leading-none truncate">Dynatrace</p>
          <p className="text-slate-400 text-xs mt-0.5 leading-none">Incident Manager</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto scrollbar-thin">
        <p className="text-slate-500 text-xs font-semibold uppercase tracking-widest px-3 mb-3">
          Navigation
        </p>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon
          const active = isActive(item)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium group transition-all ${
                active
                  ? 'bg-brand-600/20 text-brand-400'
                  : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${
                  active ? 'text-brand-400' : 'text-slate-500 group-hover:text-slate-300'
                }`}
              />
              {item.label}
              {item.label === 'AI Chat' && (
                <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 text-white text-[10px] font-bold">
                  AI
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </span>
          <span className="text-xs text-slate-500">Connected to Dynatrace</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5 text-slate-600" />
          <span className="text-xs text-slate-600">Powered by Gemini AI</span>
        </div>
      </div>
    </aside>
  )
}
