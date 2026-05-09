import axios from 'axios'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true'

const api = axios.create({
  baseURL: DEMO_MODE ? '' : (import.meta.env.VITE_API_URL || 'http://localhost:8000'),
  timeout: 90_000,
})

export default api
