import axios from 'axios'
import { resolveApiBaseUrl } from './apiBaseUrl'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const api = axios.create({
  baseURL: resolveApiBaseUrl({
    demoMode: DEMO_MODE,
    configuredBaseUrl: import.meta.env.VITE_API_URL,
    isDev: import.meta.env.DEV,
  }),
  timeout: 90_000,
})

export default api
