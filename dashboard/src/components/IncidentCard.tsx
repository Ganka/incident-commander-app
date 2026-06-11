'use client'

import React from 'react'
import { Clock, ChevronRight } from 'lucide-react'
import { Incident } from '@/store/dashboard'

interface IncidentCardProps {
  incident: Incident
  onClick: () => void
  isSelected: boolean
}

const SEVERITY_DOT: Record<string, string> = {
  critical: 'bg-red-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-400',
  low:      'bg-green-500',
}

const SEVERITY_BADGE: Record<string, string> = {
  critical: 'badge-critical',
  high:     'badge-high',
  medium:   'badge-medium',
  low:      'badge-low',
}

const STATUS_COLOR: Record<string, string> = {
  open:         'text-red-600',
  acknowledged: 'text-amber-600',
  resolved:     'text-emerald-600',
}

export const IncidentCard: React.FC<IncidentCardProps> = ({ incident, onClick, isSelected }) => {
  const dotClass  = SEVERITY_DOT[incident.severity]  || 'bg-slate-400'
  const badgeClass = SEVERITY_BADGE[incident.severity] || 'badge-info'

  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3.5 rounded-xl border transition-all group ${
        isSelected
          ? 'border-brand-400 bg-brand-50 ring-1 ring-brand-200'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
      }`}
    >
      <div className="flex items-start gap-3">
        {/* Severity dot */}
        <span className={`mt-1 flex-shrink-0 w-2.5 h-2.5 rounded-full ${dotClass}`} />

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold text-slate-900 truncate leading-snug">
              {incident.title}
            </p>
            <span className={`flex-shrink-0 text-[11px] font-semibold px-2 py-0.5 rounded-full ${badgeClass}`}>
              {(incident.severity ?? 'unknown').toUpperCase()}
            </span>
          </div>

          <p className="text-xs text-slate-500 mt-0.5 truncate">{incident.affectedEntity}</p>

          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <Clock className="w-3 h-3" />
              {incident.duration}
            </span>
            <span className={`text-xs font-medium ${STATUS_COLOR[incident.status] || 'text-slate-600'}`}>
              {(incident.status ?? 'unknown').toUpperCase()}
            </span>
            {incident.errorRate > 0 && (
              <span className="text-xs text-slate-400">
                {incident.errorRate}% error rate
              </span>
            )}
          </div>
        </div>

        <ChevronRight
          className={`w-4 h-4 flex-shrink-0 mt-0.5 transition-transform ${
            isSelected ? 'text-brand-500 translate-x-0.5' : 'text-slate-300 group-hover:text-slate-400'
          }`}
        />
      </div>
    </button>
  )
}
