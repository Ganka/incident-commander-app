'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { SLAStatus } from '@/store/dashboard'

interface SLACardProps {
  sla: SLAStatus
}

const STATUS_CONFIG = {
  compliant: {
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    bar:   'bg-emerald-500',
    label: 'Compliant',
  },
  'at-risk': {
    badge: 'bg-amber-50 text-amber-700 border-amber-200',
    bar:   'bg-amber-400',
    label: 'At Risk',
  },
  violated: {
    badge: 'bg-red-50 text-red-700 border-red-200',
    bar:   'bg-red-500',
    label: 'Violated',
  },
}

export const SLACard: React.FC<SLACardProps> = ({ sla }) => {
  const cfg = STATUS_CONFIG[sla.status] || STATUS_CONFIG['at-risk']
  const pct = Math.min((sla.current / sla.target) * 100, 100)

  const TrendIcon =
    sla.trend === 'up'   ? TrendingUp   :
    sla.trend === 'down' ? TrendingDown : Minus

  const trendColor =
    sla.trend === 'up'   ? 'text-emerald-600' :
    sla.trend === 'down' ? 'text-red-500'      : 'text-slate-400'

  return (
    <div className="card p-4 hover:border-slate-300 transition-colors">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-slate-800 leading-snug">{sla.name}</p>
        <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${cfg.badge}`}>
          {cfg.label}
        </span>
      </div>

      {/* Value row */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <span className="text-2xl font-bold text-slate-900">{sla.current}</span>
          <span className="text-sm text-slate-400 ml-1">%</span>
        </div>
        <div className="text-right">
          <p className="text-xs text-slate-400">Target</p>
          <p className="text-sm font-semibold text-slate-600">{sla.target}%</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${cfg.bar}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Trend */}
      <div className="flex items-center gap-1.5">
        <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
        <span className={`text-xs font-medium capitalize ${trendColor}`}>{sla.trend}</span>
        <span className="text-xs text-slate-400 ml-auto">
          {(sla.current - sla.target).toFixed(1)}% vs target
        </span>
      </div>
    </div>
  )
}
