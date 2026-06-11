const PRODUCTION_API_URL = 'https://incident-commander-agent.onrender.com'
const LOCAL_API_URL = 'http://localhost:8080'

export const API_BASE_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production' ? PRODUCTION_API_URL : LOCAL_API_URL)
).replace(/\/$/, '')
