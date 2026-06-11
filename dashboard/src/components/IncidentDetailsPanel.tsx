'use client'

import React, { useState } from 'react'
import { Incident } from '@/store/dashboard'
import {
  X, TrendingUp, AlertTriangle, MessageSquare, FileText,
  ArrowUpCircle, GitBranch, Bell, Clock as ClockIcon,
  Send,
} from 'lucide-react'
import { ChatInterface, UserRole } from './ChatInterface'

interface IncidentDetailsPanelProps {
  incident: Incident | null
  isLoading: boolean
  analysis?: any
  onClose: () => void
  onAnalyze: (id: string) => Promise<any>
  onEscalate: (id: string) => Promise<any>
  onRootCause: (id: string) => Promise<any>
  onGenerateNotifications: (id: string, channel?: string) => Promise<any>
  onNotifySlack: (id: string, channel: string) => Promise<any>
  onGetTimeline: (id: string) => Promise<any>
}

const ROLE_OPTIONS: { role: UserRole; label: string; accentBg: string; accentText: string }[] = [
  { role: 'L1', label: 'L1',     accentBg: 'bg-emerald-600', accentText: 'text-white' },
  { role: 'L2', label: 'L2',     accentBg: 'bg-blue-600',    accentText: 'text-white' },
  { role: 'L3', label: 'L3 SRE', accentBg: 'bg-purple-600',  accentText: 'text-white' },
]

const SEV_BADGE: Record<string, string> = {
  critical: 'badge-critical',
  high:     'badge-high',
  medium:   'badge-medium',
  low:      'badge-low',
}

const STATUS_COLOR: Record<string, string> = {
  open:         'text-red-600 bg-red-50',
  acknowledged: 'text-amber-600 bg-amber-50',
  resolved:     'text-emerald-600 bg-emerald-50',
}

type Tab = 'overview' | 'chat'

const SLACK_CHANNEL_OPTIONS = ['#incidents', '#on-call', '#engineering-leads', '#customer-success']

export const IncidentDetailsPanel: React.FC<IncidentDetailsPanelProps> = ({
  incident,
  isLoading,
  analysis,
  onClose,
  onAnalyze,
  onEscalate,
  onRootCause,
  onGenerateNotifications,
  onNotifySlack,
  onGetTimeline,
}) => {
  const [tab, setTab] = useState<Tab>('overview')
  const [chatRole, setChatRole] = useState<UserRole>('L1')
  const [slackChannel, setSlackChannel] = useState('#incidents')

  if (!incident) return null

  const sevBadge  = SEV_BADGE[incident.severity] || 'badge-info'
  const statusCls = STATUS_COLOR[incident.status] || 'text-slate-600 bg-slate-50'

  return (
    <div className="card flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 180px)', minHeight: 480 }}>
      {/* Header */}
      <div className="px-4 pt-4 pb-3 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-400 font-mono mb-0.5">{incident.id}</p>
            <h3 className="text-sm font-bold text-slate-900 leading-snug">{incident.title}</h3>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${sevBadge}`}>
                {(incident.severity ?? 'unknown').toUpperCase()}
              </span>
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${statusCls}`}>
                {(incident.status ?? 'unknown').toUpperCase()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mt-3">
          {([['overview', FileText, 'Overview'], ['chat', MessageSquare, 'AI Chat']] as const).map(
            ([id, Icon, label]) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                  tab === id
                    ? 'bg-brand-50 text-brand-700'
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            )
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        {tab === 'overview' ? (
          <>
            <div className="flex-1 overflow-y-auto scrollbar-thin p-4 space-y-4">
              {/* Metrics grid */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  ['Error Rate', `${incident.errorRate}%`, incident.errorRate > 5 ? 'text-red-600' : 'text-amber-600'],
                  ['Duration', incident.duration, 'text-slate-900'],
                  ['Entity', incident.affectedEntity, 'text-slate-900'],
                ].map(([label, value, cls]) => (
                  <div key={label as string} className="bg-slate-50 rounded-lg p-2.5">
                    <p className="text-[10px] font-medium text-slate-400 uppercase tracking-wide">{label}</p>
                    <p className={`text-xs font-bold mt-0.5 truncate ${cls}`}>{value}</p>
                  </div>
                ))}
              </div>

              {/* Start time */}
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <ClockIcon className="w-3.5 h-3.5 flex-shrink-0" />
                Started {new Date(incident.startTime).toLocaleString()}
              </div>

              {/* Description */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5">Description</p>
                <p className="text-xs text-slate-700 bg-slate-50 rounded-lg p-3 leading-relaxed">
                  {incident.description}
                </p>
              </div>

              {/* Impact */}
              <div>
                <p className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                  Impact
                </p>
                <p className="text-xs text-slate-700 bg-orange-50 border border-orange-100 rounded-lg p-3 leading-relaxed">
                  {incident.impact}
                </p>
              </div>

              {/* AI analysis result */}
              {analysis && (
                <div className="bg-brand-50 border border-brand-100 rounded-lg p-3">
                  <p className="text-[11px] font-semibold text-brand-700 uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    AI Analysis
                  </p>
                  <p className="text-xs text-brand-800 whitespace-pre-wrap leading-relaxed">{analysis}</p>
                </div>
              )}

              {isLoading && (
                <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
                  <div className="h-4 w-4 rounded-full border-2 border-slate-200 border-t-brand-600 animate-spin" />
                  Running AI analysis…
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="border-t border-slate-100 p-3 flex-shrink-0">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => onAnalyze(incident.id)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg"
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  Analyze
                </button>
                <button
                  onClick={() => onEscalate(incident.id)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50 text-xs font-semibold py-2 rounded-lg"
                >
                  <ArrowUpCircle className="w-3.5 h-3.5" />
                  Escalate
                </button>
                <button
                  onClick={() => onRootCause(incident.id)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold py-2 rounded-lg"
                >
                  <GitBranch className="w-3.5 h-3.5" />
                  Root Cause
                </button>
                <button
                  onClick={() => onGetTimeline(incident.id)}
                  disabled={isLoading}
                  className="flex items-center justify-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold py-2 rounded-lg"
                >
                  <ClockIcon className="w-3.5 h-3.5" />
                  Timeline
                </button>
              </div>
              <div className="mt-2 rounded-lg border border-slate-200 bg-slate-50 p-2 space-y-2">
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 uppercase tracking-wide">
                  <Bell className="w-3.5 h-3.5" />
                  Slack channel
                </label>
                <select
                  value={slackChannel}
                  onChange={(event) => setSlackChannel(event.target.value)}
                  disabled={isLoading}
                  className="w-full rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-medium text-slate-700 focus:border-brand-400 focus:outline-none disabled:opacity-50"
                >
                  {SLACK_CHANNEL_OPTIONS.map((channel) => (
                    <option key={channel} value={channel}>
                      {channel}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onGenerateNotifications(incident.id, slackChannel)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold py-2 rounded-lg"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Draft
                  </button>
                  <button
                    onClick={() => onNotifySlack(incident.id, slackChannel)}
                    disabled={isLoading}
                    className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-semibold py-2 rounded-lg"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Send Slack
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Chat Tab */
          <div className="flex-1 flex flex-col min-h-0">
            {/* Role selector */}
            <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2 flex-shrink-0">
              <span className="text-xs text-slate-400 font-medium">Role:</span>
              <div className="flex rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                {ROLE_OPTIONS.map(opt => (
                  <button
                    key={opt.role}
                    onClick={() => setChatRole(opt.role)}
                    className={`px-3 py-1 text-xs font-semibold transition-colors ${
                      chatRole === opt.role
                        ? `${opt.accentBg} ${opt.accentText}`
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ChatInterface
                key={`${incident.id}-${chatRole}`}
                incidentId={incident.id}
                incidentContext={incident}
                userRole={chatRole}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
