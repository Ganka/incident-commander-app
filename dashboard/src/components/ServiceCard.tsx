'use client'

import React from 'react'
import { Service } from '@/store/dashboard'

interface ServiceCardProps {
  service: Service
}

const HEALTH_CONFIG = {
  healthy:   { dot: 'bg-emerald-500', label: 'Healthy',   text: 'text-emerald-600' },
  degraded:  { dot: 'bg-amber-400',   label: 'Degraded',  text: 'text-amber-600'   },
  unhealthy: { dot: 'bg-red-500',     label: 'Unhealthy', text: 'text-red-600'     },
}

function Metric({ label, value, highlight }: { label: string; value: string; highlight?: string }) {
  return (
    <div>
      <p className="text-[10px] text-slate-400 uppercase tracking-wide">{label}</p>
      <p className={`text-sm font-semibold mt-0.5 ${highlight || 'text-slate-900'}`}>{value}</p>
    </div>
  )
}

export const ServiceCard: React.FC<ServiceCardProps> = ({ service }) => {
  const cfg = HEALTH_CONFIG[service.health] || HEALTH_CONFIG.unhealthy

  const errorHighlight =
    service.errorRate < 1   ? 'text-emerald-600' :
    service.errorRate < 5   ? 'text-amber-600'   : 'text-red-600'

  return (
    <div className="card p-4 hover:border-slate-300 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-sm font-semibold text-slate-800 truncate leading-snug">{service.name}</p>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${cfg.dot}`} />
          <span className={`text-xs font-medium ${cfg.text}`}>{cfg.label}</span>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100">
        <Metric
          label="Error"
          value={`${service.errorRate.toFixed(1)}%`}
          highlight={errorHighlight}
        />
        <Metric
          label="Resp."
          value={`${service.responseTime}ms`}
        />
        <Metric
          label="TPS"
          value={`${service.throughput}`}
        />
      </div>

      <p className="text-[10px] text-slate-400 mt-2.5">
        Updated {new Date(service.lastUpdate).toLocaleTimeString()}
      </p>
    </div>
  )
}
