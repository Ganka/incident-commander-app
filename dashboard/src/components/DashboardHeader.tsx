'use client'

import React from 'react'
import { AlertTriangle, Flame, Activity, ShieldOff, LucideIcon } from 'lucide-react'

interface StatCardProps {
  label: string
  value: number
  icon: LucideIcon
  iconBg: string
  iconColor: string
  valueColor?: string
  note?: string
}

function StatCard({ label, value, icon: Icon, iconBg, iconColor, valueColor, note }: StatCardProps) {
  return (
    <div className="card p-5 flex items-start gap-4">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        <Icon className={`w-5 h-5 ${iconColor}`} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</p>
        <p className={`text-2xl font-bold mt-0.5 ${valueColor || 'text-slate-900'}`}>{value}</p>
        {note && <p className="text-xs text-slate-400 mt-0.5">{note}</p>}
      </div>
    </div>
  )
}

interface DashboardHeaderProps {
  totalIncidents: number
  criticalIncidents: number
  affectedServices: number
  slaViolations: number
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  totalIncidents,
  criticalIncidents,
  affectedServices,
  slaViolations,
}) => {
  return (
    <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard
        label="Open Incidents"
        value={totalIncidents}
        icon={AlertTriangle}
        iconBg="bg-blue-50"
        iconColor="text-blue-600"
        note="Last 24 hours"
      />
      <StatCard
        label="Critical"
        value={criticalIncidents}
        icon={Flame}
        iconBg="bg-red-50"
        iconColor="text-red-600"
        valueColor={criticalIncidents > 0 ? 'text-red-600' : 'text-slate-900'}
        note={criticalIncidents > 0 ? 'Requires immediate action' : 'All clear'}
      />
      <StatCard
        label="Affected Services"
        value={affectedServices}
        icon={Activity}
        iconBg="bg-orange-50"
        iconColor="text-orange-600"
        valueColor={affectedServices > 0 ? 'text-orange-600' : 'text-slate-900'}
        note="Degraded or unhealthy"
      />
      <StatCard
        label="SLA Violations"
        value={slaViolations}
        icon={ShieldOff}
        iconBg="bg-amber-50"
        iconColor="text-amber-600"
        valueColor={slaViolations > 0 ? 'text-amber-600' : 'text-slate-900'}
        note={slaViolations > 0 ? 'Review SLA status' : 'All SLAs compliant'}
      />
    </div>
  )
}
