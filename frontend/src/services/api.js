import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 30_000,
  withCredentials: true,
})

export function apiUrl(path) {
  const base = import.meta.env.VITE_API_BASE_URL || '/api'
  if (base.startsWith('http://') || base.startsWith('https://')) {
    return base.replace(/\/$/, '') + path
  }
  // Relative base (default): keep same-origin.
  return base.replace(/\/$/, '') + path
}

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem('bc_token')
  if (token) {
    cfg.headers = cfg.headers || {}
    cfg.headers.Authorization = `Bearer ${token}`
  }
  return cfg
})

api.interceptors.response.use(
  (r) => r,
  (err) => {
    const status = err?.response?.status
    if (status === 401) {
      localStorage.removeItem('bc_token')
      if (window.location.pathname !== '/login') {
        const next = encodeURIComponent(window.location.pathname + window.location.search)
        window.location.href = `/login?next=${next}`
      }
    }
    return Promise.reject(err)
  }
)
