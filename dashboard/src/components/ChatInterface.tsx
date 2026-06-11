'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Send, Loader, AlertCircle, Trash2, ChevronDown, ChevronUp, Bot } from 'lucide-react'
import axios from 'axios'

export type UserRole = 'L1' | 'L2' | 'L3'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: string
  metadata?: {
    used_agents?: string[]
    status?: string
    tokens?: number
  }
}

interface QuickAction {
  label: string
  prompt: string
}

interface MockChatResponse {
  response: string
  usedAgents: string[]
}

interface ChatInterfaceProps {
  incidentId?: string
  incidentContext?: any
  conversationId?: string
  userRole?: UserRole
  onClose?: () => void
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
})

const ROLE_CONFIG: Record<
  UserRole,
  {
    label: string
    description: string
    color: string
    badgeBg: string
    badgeText: string
    borderAccent: string
    headerBg: string
    quickActions: QuickAction[]
    placeholder: string
    welcomeTitle: string
    welcomeBody: string
  }
> = {
  L1: {
    label: 'L1 Support',
    description: 'First-line support',
    color: 'green',
    badgeBg: 'bg-emerald-100',
    badgeText: 'text-emerald-800',
    borderAccent: 'border-emerald-500',
    headerBg: 'from-emerald-700 to-emerald-800',
    placeholder: 'Ask for a plain-language summary, escalation guidance, or customer impact…',
    welcomeTitle: 'L1 Support Assistant',
    welcomeBody:
      'I provide clear, actionable guidance for first-line support: incident summaries, escalation decisions, and stakeholder notifications.',
    quickActions: [
      { label: 'Incident Summary', prompt: 'Give me a plain-language summary of this incident' },
      { label: 'Should I Escalate?', prompt: 'Should this incident be escalated? Provide a clear yes/no with reasons' },
      { label: 'Customer Impact', prompt: 'What is the customer-facing impact of this incident?' },
      { label: 'Notify Stakeholders', prompt: 'Draft a stakeholder notification message for this incident' },
      { label: 'Triage Checklist', prompt: 'Give me a step-by-step triage checklist for this incident' },
      { label: 'SLA Breach Risk', prompt: 'Is there a risk of SLA breach? What action should I take?' },
    ],
  },
  L2: {
    label: 'L2 Engineer',
    description: 'Second-line engineering',
    color: 'blue',
    badgeBg: 'bg-blue-100',
    badgeText: 'text-blue-800',
    borderAccent: 'border-blue-500',
    headerBg: 'from-blue-700 to-blue-800',
    placeholder: 'Ask about root cause, service dependencies, remediation steps, or SLA impact…',
    welcomeTitle: 'L2 Engineering Assistant',
    welcomeBody:
      'I provide technical diagnostic support: root cause analysis, service dependency mapping, remediation steps, and escalation handoff notes.',
    quickActions: [
      { label: 'Root Cause Analysis', prompt: 'What is the root cause of this incident?' },
      { label: 'Service Dependencies', prompt: 'Which services are affected and what are their dependencies?' },
      { label: 'Remediation Steps', prompt: 'What are the recommended remediation steps for this incident?' },
      { label: 'SLA / SLO Impact', prompt: 'Check SLA/SLO compliance impact for this incident' },
      { label: 'Incident Timeline', prompt: 'Give me a detailed timeline of events for this incident' },
      { label: 'L3 Handoff Notes', prompt: 'Prepare escalation handoff notes for the L3 team' },
    ],
  },
  L3: {
    label: 'L3 Expert',
    description: 'Expert / SRE',
    color: 'purple',
    badgeBg: 'bg-purple-100',
    badgeText: 'text-purple-800',
    borderAccent: 'border-purple-500',
    headerBg: 'from-purple-700 to-purple-800',
    placeholder: 'Ask about infrastructure analysis, performance bottlenecks, architecture, or post-mortem…',
    welcomeTitle: 'L3 Expert Assistant',
    welcomeBody:
      'I provide deep technical insights: infrastructure analysis, performance optimization, complex multi-system correlations, and post-mortem recommendations.',
    quickActions: [
      { label: 'Deep Root Cause', prompt: 'Perform a deep root cause investigation with infrastructure analysis' },
      { label: 'Performance Analysis', prompt: 'Analyze performance bottlenecks contributing to this incident' },
      { label: 'Infrastructure Review', prompt: 'Review the infrastructure and platform impact of this incident' },
      { label: 'Optimize Performance', prompt: 'What performance optimizations should be applied to prevent recurrence?' },
      { label: 'Post-Mortem Draft', prompt: 'Draft a post-mortem report for this incident' },
      { label: 'Architecture Gaps', prompt: 'Identify architectural weaknesses exposed by this incident' },
    ],
  },
}

const DEFAULT_ROLE: UserRole = 'L1'

function incidentLabel(incident: any) {
  return incident?.title || incident?.id || 'the selected incident'
}

function incidentSeverity(incident: any) {
  return String(incident?.severity || 'unknown').toUpperCase()
}

function buildMockChatResponse(text: string, role: UserRole, incident: any): MockChatResponse {
  const prompt = text.toLowerCase()
  const title = incidentLabel(incident)
  const severity = incidentSeverity(incident)
  const entity = incident?.affectedEntity || 'the affected service'
  const impact = incident?.impact || incident?.description || 'Customer impact is under investigation.'
  const errorRate = incident?.errorRate ?? 'unknown'
  const p99 = incident?.p99LatencyMs || incident?.responseTime || 'elevated'

  if (prompt.includes('timeline')) {
    return {
      usedAgents: ['timeline'],
      response:
        `Mock timeline for ${title}\n\n` +
        `08:14 UTC - Alert fired for ${entity}.\n` +
        `08:15 UTC - Error rate reached ${errorRate}% and p99 latency moved to ${p99} ms.\n` +
        '08:20 UTC - L1 triage opened and customer impact was confirmed.\n' +
        '08:27 UTC - Recent deployment correlated with the incident.\n' +
        '08:36 UTC - Rollback and remediation plan prepared.',
    }
  }

  if (prompt.includes('root') || prompt.includes('cause') || prompt.includes('why')) {
    return {
      usedAgents: ['root_cause'],
      response:
        `Mock root cause analysis for ${title}\n\n` +
        'Most likely root cause: a recent service change introduced connection handling regressions, causing pool exhaustion and elevated latency/error rates.\n\n' +
        'Recommended next steps:\n' +
        '1. Roll back the recent deployment.\n' +
        '2. Flush leaked connections with DBA/SRE approval.\n' +
        '3. Add leak detection and regression coverage before redeploy.',
    }
  }

  if (prompt.includes('notify') || prompt.includes('stakeholder') || prompt.includes('slack')) {
    return {
      usedAgents: ['notifications'],
      response:
        `Mock stakeholder update\n\n` +
        `[${severity}] ${title}\n` +
        `Impact: ${impact}\n` +
        'Response: Incident response is active. Engineering is validating rollback/remediation and will post the next update after recovery confirmation.',
    }
  }

  if (prompt.includes('escalate') || prompt.includes('handoff')) {
    const shouldEscalate = severity === 'CRITICAL' || severity === 'HIGH' || Number(errorRate) > 10
    return {
      usedAgents: ['escalation'],
      response:
        `${shouldEscalate ? 'Escalate this incident.' : 'Keep this incident in the current support tier for now.'}\n\n` +
        `Reason: severity is ${severity}, error rate is ${errorRate}%, and affected entity is ${entity}. ` +
        (shouldEscalate
          ? 'Production rollback or deeper engineering validation is required.'
          : 'No critical customer-facing failure pattern is present in the mock data.'),
    }
  }

  return {
    usedAgents: ['incident_analyzer'],
    response:
      `Mock ${role} incident summary for ${title}\n\n` +
      `Severity: ${severity}\nAffected entity: ${entity}\nError rate: ${errorRate}%\nImpact: ${impact}\n\n` +
      'Immediate action: acknowledge the incident, keep the response channel updated, and validate the latest deployment and dependency health.',
  }
}

function RoleBadge({ role }: { role: UserRole }) {
  const cfg = ROLE_CONFIG[role]
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${cfg.badgeBg} ${cfg.badgeText}`}
    >
      {cfg.label}
    </span>
  )
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  incidentId,
  incidentContext,
  conversationId: initialConversationId,
  userRole,
  onClose,
}) => {
  const role: UserRole = userRole || DEFAULT_ROLE
  const cfg = ROLE_CONFIG[role]

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [conversationId, setConversationId] = useState(
    initialConversationId || `conv_${Date.now()}`
  )
  const [showAgentDetails, setShowAgentDetails] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text: string) => {
    if (!text.trim()) return

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toISOString(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput('')
    setLoading(true)
    setError(null)

    try {
      const response = await apiClient.post('/chat', {
        message: text,
        incident_id: incidentId,
        incident_context: incidentContext,
        conversation_id: conversationId,
        role,
      })

      const assistantMessage: ChatMessage = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: response.data.response,
        timestamp: response.data.timestamp,
        metadata: {
          used_agents: response.data.used_agents,
          status: response.data.status,
          tokens: response.data.metadata?.usage?.total_token_count,
        },
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to send message'

      if (!err.response || err.code === 'ERR_NETWORK') {
        const mock = buildMockChatResponse(text, role, incidentContext)
        setError(null)
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_${Date.now()}`,
            role: 'assistant',
            content: mock.response,
            timestamp: new Date().toISOString(),
            metadata: {
              used_agents: mock.usedAgents,
              status: 'mock',
            },
          },
        ])
        return
      }

      setError(errorMessage)

      setMessages((prev) => [
        ...prev,
        {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `Error: ${errorMessage}`,
          timestamp: new Date().toISOString(),
          metadata: { status: 'error' },
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    sendMessage(input)
  }

  const handleClearHistory = async () => {
    try {
      await apiClient.post('/chat/clear')
      setMessages([])
      setConversationId(`conv_${Date.now()}`)
      setError(null)
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to clear history')
    }
  }

  const agentColor: Record<string, string> = {
    incident_analyzer: 'bg-sky-100 text-sky-700',
    root_cause: 'bg-orange-100 text-orange-700',
    sla_monitor: 'bg-amber-100 text-amber-700',
    timeline: 'bg-violet-100 text-violet-700',
    notifications: 'bg-teal-100 text-teal-700',
    escalation: 'bg-red-100 text-red-700',
    performance: 'bg-lime-100 text-lime-700',
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className={`bg-gradient-to-r ${cfg.headerBg} p-4 flex items-center justify-between flex-shrink-0`}>
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-white opacity-90" />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">{cfg.welcomeTitle}</h2>
              <RoleBadge role={role} />
            </div>
            <p className="text-xs text-white opacity-75 mt-0.5">
              {incidentId ? `Incident ${incidentId}` : cfg.description}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearHistory}
            disabled={messages.length === 0 || loading}
            className="p-2 text-white hover:bg-white/20 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            title="Clear conversation"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 text-white hover:bg-white/20 rounded-lg transition-colors"
              title="Close"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 py-10 space-y-3">
            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center ${cfg.badgeBg}`}
            >
              <Bot className={`w-6 h-6 ${cfg.badgeText}`} />
            </div>
            <h3 className="text-base font-semibold text-gray-800">{cfg.welcomeTitle}</h3>
            <p className="text-sm text-gray-500 max-w-sm leading-relaxed">{cfg.welcomeBody}</p>
            <RoleBadge role={role} />
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user'
                  ? `bg-gradient-to-br ${cfg.headerBg} text-white rounded-br-sm`
                  : 'bg-white border border-gray-200 text-gray-900 rounded-bl-sm'
              }`}
            >
              <p className="whitespace-pre-wrap break-words">{msg.content}</p>

              {/* Agent tags */}
              {msg.metadata?.used_agents && msg.metadata.used_agents.length > 0 && (
                <div className="mt-2">
                  <button
                    onClick={() =>
                      setShowAgentDetails(showAgentDetails === msg.id ? null : msg.id)
                    }
                    className={`flex items-center gap-1 text-xs font-medium ${
                      msg.role === 'user' ? 'text-white/70' : 'text-gray-400'
                    } hover:opacity-80`}
                  >
                    {showAgentDetails === msg.id ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    )}
                    {msg.metadata.used_agents.length} agent
                    {msg.metadata.used_agents.length !== 1 ? 's' : ''} used
                  </button>
                  {showAgentDetails === msg.id && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {msg.metadata.used_agents.map((a) => (
                        <span
                          key={a}
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            agentColor[a] || 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {a.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between mt-1.5 gap-2">
                <span
                  className={`text-xs ${
                    msg.role === 'user' ? 'text-white/60' : 'text-gray-400'
                  }`}
                >
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </span>
                {msg.metadata?.tokens && (
                  <span
                    className={`text-xs ${
                      msg.role === 'user' ? 'text-white/60' : 'text-gray-400'
                    }`}
                  >
                    {msg.metadata.tokens} tokens
                  </span>
                )}
                {msg.metadata?.status && msg.metadata.status === 'error' && (
                  <span className="text-xs text-red-500 font-medium">Error</span>
                )}
              </div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 text-gray-700 px-4 py-3 rounded-2xl rounded-bl-sm">
              <div className="flex items-center gap-2">
                <Loader className={`w-4 h-4 animate-spin ${cfg.badgeText}`} />
                <span className="text-sm">Analyzing…</span>
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions — shown only when no messages yet */}
      {messages.length === 0 && (
        <div className="border-t border-gray-200 p-3 bg-white flex-shrink-0">
          <p className="text-xs text-gray-400 font-medium mb-2 uppercase tracking-wide">
            Quick actions for {cfg.label}
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {cfg.quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => sendMessage(action.prompt)}
                disabled={loading}
                className={`text-left text-xs px-3 py-2 rounded-lg border transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                  border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50`}
              >
                {action.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <form
        onSubmit={handleSubmit}
        className="border-t border-gray-200 p-3 bg-white flex-shrink-0"
      >
        <div className="flex gap-2 items-end">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                sendMessage(input)
              }
            }}
            placeholder={cfg.placeholder}
            disabled={loading}
            rows={1}
            className="flex-1 resize-none rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-gray-400 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed leading-relaxed"
            style={{ maxHeight: '120px', overflowY: 'auto' }}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className={`bg-gradient-to-br ${cfg.headerBg} disabled:opacity-40 text-white p-2.5 rounded-xl transition-opacity disabled:cursor-not-allowed flex-shrink-0`}
            title="Send (Enter)"
          >
            {loading ? (
              <Loader className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1.5 text-right">Enter to send · Shift+Enter for newline</p>
      </form>
    </div>
  )
}
