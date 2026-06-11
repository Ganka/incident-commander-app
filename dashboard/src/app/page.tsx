'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useDashboardStore } from '@/store/dashboard'
import { dashboardService } from '@/services/api'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { DashboardHeader } from '@/components/DashboardHeader'
import { IncidentCard } from '@/components/IncidentCard'
import { IncidentDetailsPanel } from '@/components/IncidentDetailsPanel'
import { SLACard } from '@/components/SLACard'
import { ServiceCard } from '@/components/ServiceCard'
import { Search, Filter, ChevronDown } from 'lucide-react'

const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }

function asTextList(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return item
      if (item?.message) return item.message
      return JSON.stringify(item)
    })
  }
  return [String(value)]
}

function formatSection(title: string, items: string[]) {
  if (!items.length) return ''
  return `\n\n${title}:\n${items.map((item) => `- ${item}`).join('\n')}`
}

function formatTriageResult(title: string, result: any) {
  const summary =
    result?.summary ||
    result?.analysis ||
    result?.root_cause_analysis ||
    result?.text ||
    'Analysis completed.'

  return [
    title,
    summary,
    formatSection('Findings', asTextList(result?.findings)),
    formatSection('Recommended actions', asTextList(result?.actions || result?.recommendations)),
    result?.should_escalate !== undefined
      ? `\n\nEscalation: ${result.should_escalate ? 'Required' : 'Not required'}${
          result.escalation_reason ? `\nReason: ${result.escalation_reason}` : ''
        }`
      : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function formatEscalation(result: any) {
  const decision = result?.should_escalate ? `Escalate to ${result?.escalation_level || 'L2/L3'}` : 'No escalation required'
  return [
    'Escalation Recommendation',
    decision,
    result?.reason || result?.escalation_reason || result?.summary || 'Escalation check completed.',
  ].join('\n')
}

function formatNotifications(result: any) {
  const notifications = Array.isArray(result?.notifications) ? result.notifications : []
  const channels = result?.channels?.length ? result.channels.join(', ') : result?.requested_channel || 'No channel'
  const drafts = notifications.map((item: any) => {
    const status = item.sent ? 'sent/ready' : 'draft'
    return `[${item.channel}] (${status}) ${item.message}`
  })

  return [
    'Notification Drafts',
    `Channels: ${channels}`,
    drafts.length ? drafts.join('\n\n') : result?.message || 'No notification drafts returned.',
  ].join('\n')
}

function formatTimeline(result: any) {
  const timeline = Array.isArray(result?.timeline) ? result.timeline : []
  const events = timeline.map((item: any) => {
    const time = item.time || item.timestamp || item.startTime || 'unknown time'
    const event = item.event || item.title || item.name || 'Event'
    const severity = item.severity ? ` [${item.severity}]` : ''
    return `${time}${severity} - ${event}`
  })

  return [
    'Incident Timeline',
    result?.summary || `Timeline contains ${events.length} events.`,
    events.length ? events.join('\n') : 'No timeline events returned.',
  ].join('\n')
}

function formatSlackDelivery(result: any) {
  const status = result?.status || 'unknown'
  const channel = result?.channel || '#incidents'
  const detail = result?.message || result?.detail || 'Slack notification request completed.'
  return ['Slack Notification', `Status: ${status}`, `Channel: ${channel}`, detail].join('\n')
}

export default function DashboardPage() {
  const {
    incidents,
    slas,
    services,
    selectedIncident,
    loading,
    setIncidents,
    setSLAs,
    setServices,
    selectIncident,
    setLoading,
  } = useDashboardStore()

  const [analysisData, setAnalysisData] = useState<string | null>(null)
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  const [search, setSearch] = useState('')
  const [severityFilter, setSeverityFilter] = useState<string>('all')
  const [activeSection, setActiveSection] = useState<'incidents' | 'sla' | 'services'>('incidents')

  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true)
      const [incidentsData, slasData, servicesData] = await Promise.all([
        dashboardService.getIncidents('open', 24),
        dashboardService.checkSLAStatus(),
        dashboardService.getTopServices(10),
      ])
      setIncidents(incidentsData || [])
      setSLAs(slasData || [])
      setServices(servicesData || [])
      setLastRefresh(new Date())
    } catch (err) {
      console.error('Dashboard fetch error:', err)
    } finally {
      setLoading(false)
    }
  }, [setIncidents, setSLAs, setServices, setLoading])

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30_000)
    return () => clearInterval(interval)
  }, [fetchDashboardData])

  /* ---- AI action handlers ---- */
  const wrap = async <T,>(fn: () => Promise<T>, format: (r: T) => string) => {
    try {
      setAnalysisLoading(true)
      const r = await fn()
      setAnalysisData(format(r) || 'No data returned')
      return r
    } catch (error: any) {
      console.error('Dashboard action error:', error)
      setAnalysisData(error?.message ? `Error running analysis: ${error.message}` : 'Error running analysis')
    } finally {
      setAnalysisLoading(false)
    }
  }

  const handleAnalyze   = (id: string) =>
    wrap(() => dashboardService.analyzeIncident(id),        (r: any) => formatTriageResult('Incident Analysis', r))
  const handleEscalate  = (id: string) =>
    wrap(() => dashboardService.checkEscalation(id),        (r: any) => formatEscalation(r))
  const handleRootCause = (id: string) =>
    wrap(() => dashboardService.getRootCauseAnalysis(id),   (r: any) => formatTriageResult('Root Cause Analysis', r))
  const handleNotify    = (id: string, channel?: string) =>
    wrap(() => dashboardService.generateNotifications(id, selectedIncident?.severity, channel), (r: any) => formatNotifications(r))
  const handleSlackNotify = (id: string, channel: string) =>
    wrap(() => dashboardService.sendSlackNotification(id, channel, selectedIncident), (r: any) => formatSlackDelivery(r))
  const handleTimeline  = (id: string) =>
    wrap(() => dashboardService.getIncidentTimeline(id),    (r: any) => formatTimeline(r))

  /* ---- Derived data ---- */
  const criticalIncidents = incidents.filter(i => i.severity === 'critical').length
  const affectedServices  = services.filter(s => s.health !== 'healthy').length
  const slaViolations     = slas.filter(s => s.status === 'violated').length

  const filteredIncidents = incidents
    .filter(i => {
      const matchSeverity = severityFilter === 'all' || i.severity === severityFilter
      const matchSearch   = !search || i.title.toLowerCase().includes(search.toLowerCase()) ||
                            i.affectedEntity.toLowerCase().includes(search.toLowerCase())
      return matchSeverity && matchSearch
    })
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9))

  const SECTIONS = [
    { id: 'incidents', label: 'Incidents', count: filteredIncidents.length },
    { id: 'sla',       label: 'SLA Status', count: slas.length },
    { id: 'services',  label: 'Services',   count: services.length },
  ] as const

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: 240 }}>
        <TopBar
          title="Dashboard"
          subtitle="Real-time incident management"
          lastRefresh={lastRefresh}
          loading={loading}
          onRefresh={fetchDashboardData}
          showChatLink
        />

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="max-w-[1400px] mx-auto p-6 space-y-6">
            {/* KPI Row */}
            <DashboardHeader
              totalIncidents={incidents.length}
              criticalIncidents={criticalIncidents}
              affectedServices={affectedServices}
              slaViolations={slaViolations}
            />

            {/* Section tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200">
              {SECTIONS.map(s => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    activeSection === s.id
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  {s.label}
                  <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeSection === s.id
                      ? 'bg-brand-100 text-brand-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}>
                    {s.count}
                  </span>
                </button>
              ))}
            </div>

            {/* ======================== INCIDENTS ======================== */}
            {activeSection === 'incidents' && (
              <div className="flex gap-5 items-start">
                {/* List */}
                <div className="flex-1 min-w-0 space-y-3">
                  {/* Toolbar */}
                  <div className="flex items-center gap-3">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search by title or entity…"
                        className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                      <select
                        value={severityFilter}
                        onChange={e => setSeverityFilter(e.target.value)}
                        className="pl-8 pr-7 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:border-brand-400 focus:outline-none appearance-none text-slate-700"
                      >
                        <option value="all">All severities</option>
                        <option value="critical">Critical</option>
                        <option value="high">High</option>
                        <option value="medium">Medium</option>
                        <option value="low">Low</option>
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Cards */}
                  <div className="space-y-2">
                    {loading && filteredIncidents.length === 0 ? (
                      <div className="flex flex-col gap-2">
                        {[...Array(4)].map((_, i) => (
                          <div key={i} className="card p-4 animate-pulse h-20 bg-slate-50" />
                        ))}
                      </div>
                    ) : filteredIncidents.length === 0 ? (
                      <div className="card p-10 text-center">
                        <p className="text-slate-400 text-sm">No incidents match your filters</p>
                      </div>
                    ) : (
                      filteredIncidents.map(incident => (
                        <IncidentCard
                          key={incident.id}
                          incident={incident}
                          onClick={() => {
                            selectIncident(incident)
                            setAnalysisData(null)
                          }}
                          isSelected={selectedIncident?.id === incident.id}
                        />
                      ))
                    )}
                  </div>
                </div>

                {/* Details panel */}
                {selectedIncident && (
                  <div className="w-[380px] flex-shrink-0 animate-slide-in-right">
                    <IncidentDetailsPanel
                      incident={selectedIncident}
                      isLoading={analysisLoading}
                      analysis={analysisData}
                      onClose={() => { selectIncident(null); setAnalysisData(null) }}
                      onAnalyze={handleAnalyze}
                      onEscalate={handleEscalate}
                      onRootCause={handleRootCause}
                      onGenerateNotifications={handleNotify}
                      onNotifySlack={handleSlackNotify}
                      onGetTimeline={handleTimeline}
                    />
                  </div>
                )}
              </div>
            )}

            {/* ======================== SLA ======================== */}
            {activeSection === 'sla' && (
              <div>
                {slas.length === 0 ? (
                  <div className="card p-10 text-center">
                    <p className="text-slate-400 text-sm">No SLAs configured</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {slas.map(sla => <SLACard key={sla.id} sla={sla} />)}
                  </div>
                )}
              </div>
            )}

            {/* ======================== SERVICES ======================== */}
            {activeSection === 'services' && (
              <div>
                {services.length === 0 ? (
                  <div className="card p-10 text-center">
                    <p className="text-slate-400 text-sm">No services available</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {services.map(service => <ServiceCard key={service.id} service={service} />)}
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}
