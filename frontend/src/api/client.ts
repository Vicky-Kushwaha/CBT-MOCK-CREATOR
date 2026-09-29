import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../store/authStore'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().access
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const { refresh, setTokens, logout } = useAuthStore.getState()
  if (!refresh) return null
  try {
    const { data } = await axios.post('/api/auth/refresh/', { refresh })
    setTokens(data.access, data.refresh ?? refresh)
    return data.access as string
  } catch {
    logout()
    return null
  }
}

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/')) {
      original._retry = true
      refreshing ??= refreshAccessToken().finally(() => { refreshing = null })
      const token = await refreshing
      if (token) {
        original.headers.Authorization = `Bearer ${token}`
        return api(original)
      }
    }
    return Promise.reject(error)
  },
)

export function errorMessage(e: unknown): string {
  const err = e as AxiosError<any>
  const data = err.response?.data
  if (!data) return err.message || 'Something went wrong.'
  if (typeof data === 'string') return 'Server error. Please try again.'
  if (data.detail) return String(data.detail)
  const first = Object.entries(data)[0]
  if (first) return `${first[0]}: ${Array.isArray(first[1]) ? first[1][0] : first[1]}`
  return 'Something went wrong.'
}
