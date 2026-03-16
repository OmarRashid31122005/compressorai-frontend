import { create } from 'zustand'
import api from '../utils/api'

// ── Helpers ───────────────────────────────────────────────────
const load  = (key) => { try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : null } catch { return null } }
const save  = (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)) } catch {} }
const clear = (key) => { try { localStorage.removeItem(key) } catch {} }

// ── Store ─────────────────────────────────────────────────────
const useAuthStore = create((set, get) => ({
  user:            load('auth_user'),
  token:           localStorage.getItem('auth_token') || null,
  isLoading:       !!localStorage.getItem('auth_token'),
  isAuthenticated: !!localStorage.getItem('auth_token'),

  // Called on login
  login: (user, token) => {
    localStorage.setItem('auth_token', token)
    save('auth_user', user)
    set({ user, token, isAuthenticated: true, isLoading: false })
  },

  // Called on logout
  logout: () => {
    localStorage.removeItem('auth_token')
    clear('auth_user')
    set({ user: null, token: null, isAuthenticated: false, isLoading: false })
  },

  // Update user in store AND localStorage
  setUser: (user) => {
    save('auth_user', user)
    set({ user })
  },

  // Called on app load/refresh to re-validate token with backend
  fetchMe: async () => {
    const token = localStorage.getItem('auth_token')
    if (!token) {
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
      return
    }
    try {
      set({ isLoading: true })
      const res  = await api.get('/auth/me')
      const user = res.data
      save('auth_user', user)
      set({ user, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('auth_token')
      clear('auth_user')
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },

  hasRole: (roles) => {
    const user = get().user
    if (!user) return false
    return roles.includes(user.role)
  },

  // ✅ ORIGINAL — kept as function (do not change)
  isDefaultAdmin: () => {
    const user = get().user
    return !!user?.is_default_admin
  },
}))

export default useAuthStore
