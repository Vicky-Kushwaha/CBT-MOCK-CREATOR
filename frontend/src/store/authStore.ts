import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  access: string | null
  refresh: string | null
  username: string | null
  setAuth: (access: string, refresh: string, username: string) => void
  setTokens: (access: string, refresh: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      username: null,
      setAuth: (access, refresh, username) => set({ access, refresh, username }),
      setTokens: (access, refresh) => set({ access, refresh }),
      logout: () => set({ access: null, refresh: null, username: null }),
    }),
    { name: 'cbt-auth' },
  ),
)
