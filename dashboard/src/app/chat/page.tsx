'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { ChatInterface, UserRole } from '@/components/ChatInterface'
import { Sidebar } from '@/components/Sidebar'
import { TopBar } from '@/components/TopBar'
import { Users, Wrench, Cpu, ArrowRight } from 'lucide-react'

const ROLE_CARDS: {
  role: UserRole
  title: string
  tier: string
  description: string
  capabilities: string[]
  icon: React.ElementType
  accent: string
  accentBg: string
  accentText: string
  accentBorder: string
  btn: string
}[] = [
  {
    role: 'L1',
    title: 'L1 Support',
    tier: 'First-line response',
    description:
      'Plain-language summaries, escalation decisions, and stakeholder notification templates — no deep technical background required.',
    capabilities: [
      'Incident summary in plain language',
      'Escalation decision with clear reasoning',
      'Customer-facing impact description',
      'Stakeholder notification drafts',
      'Step-by-step triage checklists',
      'SLA breach risk check',
    ],
    icon: Users,
    accent:       'border-emerald-300',
    accentBg:     'bg-emerald-50',
    accentText:   'text-emerald-700',
    accentBorder: 'border-emerald-200',
    btn:          'bg-emerald-600 hover:bg-emerald-700 text-white',
  },
  {
    role: 'L2',
    title: 'L2 Engineer',
    tier: 'Second-line engineering',
    description:
      'Root cause analysis, service dependency mapping, remediation steps, and detailed escalation handoff notes.',
    capabilities: [
      'Root cause analysis',
      'Service dependency mapping',
      'Remediation steps',
      'SLA / SLO compliance impact',
      'Full incident event timeline',
      'L3 escalation handoff notes',
    ],
    icon: Wrench,
    accent:       'border-blue-300',
    accentBg:     'bg-blue-50',
    accentText:   'text-blue-700',
    accentBorder: 'border-blue-200',
    btn:          'bg-blue-600 hover:bg-blue-700 text-white',
  },
  {
    role: 'L3',
    title: 'L3 Expert',
    tier: 'Expert / SRE',
    description:
      'Deep infrastructure analysis, performance bottleneck identification, architecture gap assessment, and post-mortem generation.',
    capabilities: [
      'Deep infrastructure root cause',
      'Platform & performance analysis',
      'Performance optimization roadmap',
      'Multi-system correlation',
      'Architecture gap assessment',
      'Post-mortem report drafting',
    ],
    icon: Cpu,
    accent:       'border-purple-300',
    accentBg:     'bg-purple-50',
    accentText:   'text-purple-700',
    accentBorder: 'border-purple-200',
    btn:          'bg-purple-600 hover:bg-purple-700 text-white',
  },
]

function ChatPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const paramRole = searchParams.get('role') as UserRole | null

  const [selectedRole, setSelectedRole] = useState<UserRole | null>(
    paramRole && ['L1', 'L2', 'L3'].includes(paramRole) ? paramRole : null
  )

  useEffect(() => {
    if (selectedRole) {
      const p = new URLSearchParams(searchParams.toString())
      p.set('role', selectedRole)
      router.replace(`/chat?${p.toString()}`, { scroll: false })
    }
  }, [selectedRole])

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />

      <div className="flex-1 flex flex-col min-w-0" style={{ marginLeft: 240 }}>
        <TopBar
          title="AI Chat Assistant"
          subtitle={selectedRole ? `${ROLE_CARDS.find(c => c.role === selectedRole)?.tier}` : 'Select your role to begin'}
          showChatLink={false}
        />

        <main className="flex-1 overflow-hidden flex flex-col min-h-0">
          {!selectedRole ? (
            /* ---- Role selection ---- */
            <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Select your role</h2>
                  <p className="text-slate-500 text-sm mt-1.5">
                    The AI assistant tailors its language, depth, and quick actions to your support tier.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {ROLE_CARDS.map(card => {
                    const Icon = card.icon
                    return (
                      <div
                        key={card.role}
                        onClick={() => setSelectedRole(card.role)}
                        className={`card border-2 ${card.accent} p-6 flex flex-col cursor-pointer hover:border-opacity-100 transition-all hover:shadow-panel group`}
                      >
                        {/* Icon + title */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${card.accentBg} ${card.accentText} flex-shrink-0`}>
                            <Icon className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{card.title}</p>
                            <p className="text-xs text-slate-500">{card.tier}</p>
                          </div>
                        </div>

                        <p className="text-xs text-slate-600 leading-relaxed mb-4">{card.description}</p>

                        <ul className="space-y-1.5 flex-1 mb-5">
                          {card.capabilities.map(cap => (
                            <li key={cap} className="flex items-start gap-2">
                              <span className={`mt-1 w-1 h-1 rounded-full flex-shrink-0 ${card.accentBg.replace('bg-', 'bg-')} inline-block`}
                                style={{ background: 'currentColor' }}
                              />
                              <span className="text-xs text-slate-600">{cap}</span>
                            </li>
                          ))}
                        </ul>

                        <button className={`w-full flex items-center justify-center gap-2 text-sm font-semibold py-2.5 rounded-lg transition-colors ${card.btn}`}>
                          Start as {card.title}
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            /* ---- Active chat ---- */
            <div className="flex-1 flex flex-col min-h-0 p-4 gap-3">
              {/* Role bar */}
              {(() => {
                const card = ROLE_CARDS.find(c => c.role === selectedRole)!
                const Icon = card.icon
                return (
                  <div className={`card flex items-center gap-3 px-4 py-2.5 border-2 ${card.accentBorder} flex-shrink-0`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.accentBg} ${card.accentText} flex-shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-800">{card.title}</p>
                      <p className="text-xs text-slate-500 truncate">{card.tier}</p>
                    </div>
                    {/* Role switcher */}
                    <div className="flex items-center gap-1 border border-slate-200 rounded-lg overflow-hidden flex-shrink-0">
                      {ROLE_CARDS.map(c => (
                        <button
                          key={c.role}
                          onClick={() => setSelectedRole(c.role)}
                          className={`px-3 py-1.5 text-xs font-semibold transition-colors ${
                            selectedRole === c.role
                              ? `${c.accentBg} ${c.accentText}`
                              : 'text-slate-500 hover:bg-slate-50'
                          }`}
                        >
                          {c.role}
                        </button>
                      ))}
                    </div>
                    <button
                      onClick={() => setSelectedRole(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 underline flex-shrink-0"
                    >
                      Change
                    </button>
                  </div>
                )
              })()}

              {/* Chat */}
              <div className="flex-1 min-h-0">
                <ChatInterface key={selectedRole} userRole={selectedRole} />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default function ChatPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen bg-slate-100">
          <div style={{ width: 240 }} className="bg-navy-900" />
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-200 border-t-brand-600" />
          </div>
        </div>
      }
    >
      <ChatPageInner />
    </Suspense>
  )
}
