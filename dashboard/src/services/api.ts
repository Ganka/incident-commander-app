import axios from 'axios'
import { API_BASE_URL } from './config'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

const MOCK_INCIDENTS = [
  {
    id: 'INC-0001',
    title: 'Payment processing failures - high error rate',
    description:
      'Multiple customers reporting payment failures. Error rate spiked from 0.1% to 12% after the recent deployment.',
    affectedEntity: 'service-payment-gateway',
    severity: 'CRITICAL',
    status: 'OPEN',
    startTime: '1781052000000',
    duration: '00:42:00',
    errorRate: 12.4,
    p99LatencyMs: 4820,
    baselineLatencyMs: 320,
    impactedUsers: 14230,
    impactedServices: ['checkout-service', 'payment-gateway', 'fraud-detection', 'order-management'],
    impact:
      'Checkout payments are failing for a large customer segment. Payment retries are increasing load on payment-gateway and payments-db-primary.',
    url: 'https://dynatrace.example/incidents/INC-0001',
  },
  {
    id: 'INC-0002',
    title: 'Increased latency on search API',
    description:
      'Search requests have a 20% P95 latency increase over the last hour. No errors observed, but customer-facing latency is degraded.',
    affectedEntity: 'service-search',
    severity: 'MEDIUM',
    status: 'OPEN',
    startTime: '1781055600000',
    duration: '00:15:00',
    errorRate: 0,
    p99LatencyMs: 1180,
    baselineLatencyMs: 850,
    impactedUsers: 430,
    impactedServices: ['search-api', 'catalog-service'],
    impact:
      'Search results remain available, but customers are seeing slower response times on product discovery flows.',
    url: 'https://dynatrace.example/incidents/INC-0002',
  },
]

const MOCK_SLAS = [
  {
    id: 'slo-checkout-availability',
    name: 'Checkout availability',
    target: 99.9,
    current: 97.8,
    status: 'violated',
    trend: 'down',
  },
  {
    id: 'slo-payment-latency',
    name: 'Payment p95 latency',
    target: 99,
    current: 98.2,
    status: 'at-risk',
    trend: 'down',
  },
  {
    id: 'slo-search-latency',
    name: 'Search p95 latency',
    target: 99.5,
    current: 99.1,
    status: 'at-risk',
    trend: 'stable',
  },
]

const MOCK_SERVICES = [
  {
    id: 'service-payment-gateway',
    name: 'payment-gateway',
    health: 'unhealthy',
    errorRate: 12.4,
    responseTime: 4820,
    throughput: 820,
    lastUpdate: '2026-06-10T08:42:00Z',
  },
  {
    id: 'service-checkout',
    name: 'checkout-service',
    health: 'degraded',
    errorRate: 8.1,
    responseTime: 2360,
    throughput: 1480,
    lastUpdate: '2026-06-10T08:42:00Z',
  },
  {
    id: 'service-search',
    name: 'search-api',
    health: 'degraded',
    errorRate: 0,
    responseTime: 1180,
    throughput: 3200,
    lastUpdate: '2026-06-10T09:15:00Z',
  },
  {
    id: 'service-catalog',
    name: 'catalog-service',
    health: 'healthy',
    errorRate: 0.2,
    responseTime: 410,
    throughput: 5100,
    lastUpdate: '2026-06-10T09:15:00Z',
  },
]

const MOCK_TIMELINES: Record<string, Array<{ time: string; event: string; severity: string }>> = {
  'INC-0001': [
    { time: '2026-06-10T08:14:02Z', event: 'Error-rate anomaly detected on payment-gateway', severity: 'CRITICAL' },
    { time: '2026-06-10T08:14:18Z', event: 'P99 latency breached 4.8 seconds', severity: 'HIGH' },
    { time: '2026-06-10T08:15:44Z', event: 'payments-db-primary connection pool exhausted', severity: 'CRITICAL' },
    { time: '2026-06-10T08:20:00Z', event: 'L1 escalation opened for payment-gateway', severity: 'INFO' },
    { time: '2026-06-10T08:27:00Z', event: 'Deployment v3.8.2 correlated with connection leak', severity: 'HIGH' },
  ],
  'INC-0002': [
    { time: '2026-06-10T09:00:00Z', event: 'Search API p95 latency increased by 20 percent', severity: 'MEDIUM' },
    { time: '2026-06-10T09:08:30Z', event: 'Catalog dependency showing elevated queue time', severity: 'MEDIUM' },
    { time: '2026-06-10T09:15:00Z', event: 'Cache hit rate recovered after warming cycle', severity: 'INFO' },
  ],
}

function toNumber(value: unknown, fallback = 0) {
  const numberValue = Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

function entityName(problem: any) {
  return (
    problem?.affectedEntity ||
    problem?.affectedEntities?.[0]?.name ||
    problem?.impactedEntities?.[0]?.name ||
    problem?.rootCauseEntity?.name ||
    'Unknown entity'
  )
}

function normalizeSeverity(problem: any) {
  const severity = String(problem?.severity || problem?.severityLevel || '').toLowerCase()
  if (['critical', 'high', 'medium', 'low'].includes(severity)) return severity
  if (severity.includes('availability')) return 'critical'
  if (severity.includes('error') || severity.includes('resource')) return 'high'
  if (severity.includes('performance') || severity.includes('custom')) return 'medium'
  return 'low'
}

function normalizeStatus(problem: any) {
  const status = String(problem?.status || '').toLowerCase()
  if (status === 'closed' || status === 'resolved') return 'resolved'
  if (status.includes('ack')) return 'acknowledged'
  return 'open'
}

function normalizeStartTime(value: unknown) {
  if (typeof value === 'number') return new Date(value).toISOString()
  if (typeof value === 'string' && /^\d+$/.test(value)) return new Date(Number(value)).toISOString()
  if (typeof value === 'string' && value) return value
  return new Date().toISOString()
}

function normalizeIncident(problem: any) {
  return {
    ...problem,
    id: problem?.id || problem?.problemId || problem?.displayId,
    title: problem?.title || 'Dynatrace problem',
    description: problem?.description || `${problem?.displayId || 'Problem'} reported by Dynatrace.`,
    severity: normalizeSeverity(problem),
    status: normalizeStatus(problem),
    affectedEntity: entityName(problem),
    startTime: normalizeStartTime(problem?.startTime),
    duration: problem?.duration || 'Ongoing',
    errorRate: toNumber(problem?.errorRate),
    impact:
      problem?.impact ||
      `${String(problem?.impactLevel || 'Unknown').replace(/_/g, ' ')} impact reported by Dynatrace.`,
  }
}

function normalizeSLA(slo: any) {
  return {
    ...slo,
    id: slo?.id || slo?.sloId || slo?.name,
    name: slo?.name || 'Unnamed SLO',
    target: toNumber(slo?.target),
    current: toNumber(slo?.current ?? slo?.evaluatedPercentage),
    status: slo?.status || 'at-risk',
    trend: slo?.trend || 'stable',
  }
}

function normalizeService(service: any) {
  return {
    ...service,
    id: service?.id || service?.entityId,
    name: service?.name || service?.displayName || 'Unknown service',
    health: service?.health || 'healthy',
    errorRate: toNumber(service?.errorRate),
    responseTime: toNumber(service?.responseTime),
    throughput: toNumber(service?.throughput),
    lastUpdate: service?.lastUpdate || new Date().toISOString(),
  }
}

function assertToolResponse<T>(data: T): T {
  if (data && typeof data === 'object' && 'text' in (data as any)) {
    const text = String((data as any).text)
    if (text.toLowerCase().startsWith('error:')) {
      throw new Error(text)
    }
  }
  return data
}

async function withMockFallback<T>(request: () => Promise<T>, fallback: () => T): Promise<T> {
  try {
    return await request()
  } catch (error) {
    console.warn('Using mock dashboard data fallback:', error)
    return fallback()
  }
}

function mockIncident(incidentId: string) {
  return MOCK_INCIDENTS.find((incident) => incident.id === incidentId) || MOCK_INCIDENTS[0]
}

function mockIncidentAnalysis(incidentId: string) {
  const incident = mockIncident(incidentId)
  return {
    level: 'L1',
    summary:
      `${incident.title}: ${incident.errorRate}% error rate with p99 latency at ${incident.p99LatencyMs} ms. ` +
      'A recent payment-gateway deployment is correlated with database connection pool exhaustion and checkout failures.',
    findings: [
      `Severity is ${incident.severity}; affected entity is ${incident.affectedEntity}.`,
      `${incident.impactedUsers.toLocaleString()} users are impacted across ${incident.impactedServices.join(', ')}.`,
      'payments-db-primary connection pool is saturated and retry traffic is amplifying load.',
    ],
    actions: [
      'Acknowledge the incident and keep the response channel active.',
      'Roll back payment-gateway v3.8.2 to the previous stable release.',
      'Restart or flush payments-db-primary connections after rollback approval.',
    ],
    should_escalate: true,
    escalation_reason: 'Production rollback and database restart need L2/L3 approval.',
  }
}

function mockRootCauseAnalysis(incidentId: string) {
  const incident = mockIncident(incidentId)
  return {
    level: 'L2',
    summary:
      incident.id === 'INC-0001'
        ? 'Root cause is a JDBC connection handle leak introduced in payment-gateway v3.8.2. Leaked connections exhausted HikariCP pools across replicas and then exhausted payments-db-primary max_connections.'
        : 'Root cause is elevated catalog-service queue time after cache eviction. Search API remains available, but cold-cache requests are slower than baseline.',
    findings:
      incident.id === 'INC-0001'
        ? [
            'Deployment v3.8.2 started 35 minutes before the error-rate spike.',
            'ConnectionWrapper.java:214 is correlated with NullPointerException and unreturned JDBC handles.',
            'Fraud-detection opened its circuit breaker correctly; order data integrity is preserved.',
          ]
        : [
            'Search API error rate is normal, but p95 latency is 20 percent above baseline.',
            'Catalog-service queue time increased after cache warming lag.',
            'No evidence of infrastructure saturation.',
          ],
    actions:
      incident.id === 'INC-0001'
        ? [
            'Roll back payment-gateway to v3.8.0.',
            'Flush leaked database connections in coordination with DBA.',
            'Patch the null-check and add HikariCP leak detection before redeploy.',
          ]
        : [
            'Pre-warm catalog cache keys for top product categories.',
            'Temporarily increase search API timeout budget.',
            'Add a cache warm-up completion gate before future releases.',
          ],
    should_escalate: incident.id === 'INC-0001',
    escalation_reason:
      incident.id === 'INC-0001'
        ? 'Rollback and DB restart require production authorization.'
        : 'No L3 escalation required unless latency continues for another 30 minutes.',
  }
}

function mockNotifications(incidentId: string, channel = '#incidents') {
  const incident = mockIncident(incidentId)
  const severity = String(incident.severity).toUpperCase()
  const channels = [channel, '#on-call', '#engineering-leads'].filter(
    (value, index, self) => self.indexOf(value) === index
  )

  return {
    incident_id: incident.id,
    severity,
    channels,
    notifications: channels.map((target) => ({
      channel: target,
      message: `[${severity}] ${incident.title} - ${incident.impact}`,
      sent: target === channel,
    })),
  }
}

export const dashboardService = {
  async getIncidents(status = 'open', hoursBack = 24) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/get_incidents', {
          status,
          hours_back: hoursBack,
          limit: 100,
        })
        const data = assertToolResponse(response.data)
        return Array.isArray(data) ? data.map(normalizeIncident) : []
      },
      () =>
        MOCK_INCIDENTS.filter(
          (incident) => status === 'all' || String(incident.status).toLowerCase() === status
        ).map(normalizeIncident)
    )
  },

  async analyzeIncident(incidentId: string) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/analyze_incident', {
          incident_id: incidentId,
        })
        return assertToolResponse(response.data)
      },
      () => mockIncidentAnalysis(incidentId)
    )
  },

  async getRootCauseAnalysis(incidentId: string, hoursBack = 6) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/root_cause_analysis', {
          incident_id: incidentId,
          hours_back: hoursBack,
        })
        return assertToolResponse(response.data)
      },
      () => mockRootCauseAnalysis(incidentId)
    )
  },

  async checkSLAStatus(sloId?: string) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/check_sla_status', {
          slo_id: sloId,
        })
        const data = assertToolResponse(response.data)
        return Array.isArray(data) ? data.map(normalizeSLA) : []
      },
      () => MOCK_SLAS.map(normalizeSLA)
    )
  },

  async generateNotifications(incidentId: string, severity?: string, channel = '#incidents') {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/generate_notifications', {
          incident_id: incidentId,
          severity,
          channel,
        })
        return assertToolResponse(response.data)
      },
      () => mockNotifications(incidentId, channel)
    )
  },

  async checkEscalation(incidentId: string) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/check_escalation', {
          incident_id: incidentId,
        })
        return assertToolResponse(response.data)
      },
      () => {
        const incident = mockIncident(incidentId)
        const shouldEscalate = incident.severity === 'CRITICAL' || incident.errorRate > 10
        return {
          incident_id: incident.id,
          should_escalate: shouldEscalate,
          escalation_level: shouldEscalate ? 'L3' : 'L1',
          reason: shouldEscalate
            ? 'Critical severity and elevated error rate require L3 production authorization.'
            : 'Current symptoms can remain with L1/L2 monitoring.',
        }
      }
    )
  },

  async getTopServices(limit = 10) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/get_top_services', {
          limit,
        })
        const data = assertToolResponse(response.data)
        return Array.isArray(data) ? data.map(normalizeService) : []
      },
      () => MOCK_SERVICES.slice(0, limit).map(normalizeService)
    )
  },

  async getServiceMetrics(serviceId: string, hoursBack = 24) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/get_service_metrics', {
          service_id: serviceId,
          hours_back: hoursBack,
        })
        return assertToolResponse(response.data)
      },
      () => ({
        service_id: serviceId,
        p99_latency_ms: 4820,
        error_rate_pct: 12.4,
        throughput: 820,
        recommendations: [
          'Review recent deployments and error logs.',
          'Enable HikariCP leak detection and connection-pool wait alerts.',
        ],
      })
    )
  },

  async getIncidentTimeline(incidentId: string) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/get_incident_timeline', {
          incident_id: incidentId,
        })
        return assertToolResponse(response.data)
      },
      () => {
        const timeline = MOCK_TIMELINES[incidentId] || MOCK_TIMELINES['INC-0001']
        return {
          event_count: timeline.length,
          timeline,
          summary: `Timeline contains ${timeline.length} mock events.`,
        }
      }
    )
  },

  async getDashboardSummary(hoursBack = 24) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/tools/dashboard_summary', {
          hours_back: hoursBack,
        })
        return assertToolResponse(response.data)
      },
      () => ({
        timestamp: new Date().toISOString(),
        total_incidents: MOCK_INCIDENTS.length,
        open_incidents: MOCK_INCIDENTS.filter((incident) => incident.status === 'OPEN').length,
        top_services: MOCK_SERVICES,
        slo_count: MOCK_SLAS.length,
        hours_analyzed: hoursBack,
      })
    )
  },

  async sendSlackNotification(incidentId: string, channel: string, incidentContext?: any) {
    return withMockFallback(
      async () => {
        const response = await apiClient.post('/notify/slack', {
          incident_id: incidentId,
          channel,
          incident_context: incidentContext,
        })
        return assertToolResponse(response.data)
      },
      () => {
        const notification = mockNotifications(incidentId, channel).notifications[0]
        return {
          status: 'mocked',
          incident_id: incidentId,
          channel,
          message: notification.message,
        }
      }
    )
  },
}
