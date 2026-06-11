'use client'

import React from 'react'
import { RefreshCw, MessageSquare, Bell } from 'lucide-react'
import Link from 'next/link'

interface TopBarProps {
  title: string
  subtitle?: string
  lastRefresh?: Date | null
  loading?: boolean
  onRefresh?: () => void
  showChatLink?: boolean
}

export function TopBar({
  title,
  subtitle,
  lastRefresh,
  loading,
  onRefresh,
  showChatLink = true,
}: TopBarProps) {
  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center px-6 gap-4 flex-shrink-0">
      {/* Title */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-3">
          <h1 className="text-base font-semibold text-slate-900 truncate">{title}</h1>
          {subtitle && (
            <span className="text-sm text-slate-400 hidden sm:block truncate">{subtitle}</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {lastRefresh && (
          <span className="text-xs text-slate-400 hidden md:block">
            Updated {lastRefresh.toLocaleTimeString()}
          </span>
        )}

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300 bg-white px-3 py-1.5 rounded-lg disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        )}

        <button className="relative p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {showChatLink && (
          <Link
            href="/chat"
            className="flex items-center gap-1.5 bg-brand-600 hover:bg-brand-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>AI Chat</span>
          </Link>
        )}
      </div>
    </header>
  )
}
