import { create } from 'zustand'

export interface Incident {
  id: string
  title: string
  description: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  status: 'open' | 'resolved' | 'acknowledged'
  affectedEntity: string
  startTime: string
  duration: string
  errorRate: number
  impact: string
}

export interface SLAStatus {
  id: string
  name: string
  target: number
  current: number
  status: 'at-risk' | 'compliant' | 'violated'
  trend: 'up' | 'down' | 'stable'
}

export interface Service {
  id: string
  name: string
  health: 'healthy' | 'degraded' | 'unhealthy'
  errorRate: number
  responseTime: number
  throughput: number
  lastUpdate: string
}

interface DashboardStore {
  incidents: Incident[]
  slas: SLAStatus[]
  services: Service[]
  selectedIncident: Incident | null
  loading: boolean
  error: string | null
  
  setIncidents: (incidents: Incident[]) => void
  setSLAs: (slas: SLAStatus[]) => void
  setServices: (services: Service[]) => void
  selectIncident: (incident: Incident | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useDashboardStore = create<DashboardStore>((set) => ({
  incidents: [],
  slas: [],
  services: [],
  selectedIncident: null,
  loading: false,
  error: null,
  
  setIncidents: (incidents) => set({ incidents }),
  setSLAs: (slas) => set({ slas }),
  setServices: (services) => set({ services }),
  selectIncident: (incident) => set({ selectedIncident: incident }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}))
