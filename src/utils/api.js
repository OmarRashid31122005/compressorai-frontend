/**
 * api.js — CompressorAI v6
 * Axios instance with:
 *  - Auto base URL from env variable (VITE_API_URL)
 *  - JWT token injection on every request
 *  - 401 auto-logout
 *  - ngrok header bypass (for ngrok browser warning)
 *
 * Fix vs previous version:
 *  - Token key changed from 'token' → 'auth_token' to match authStore.js.
 *    Previously api.js read localStorage.getItem('token') but authStore saves
 *    under 'auth_token', so every API request was sent WITHOUT Authorization
 *    header — causing all protected routes to fail silently after login.
 *  - 401 handler now clears 'auth_token' + 'auth_user' (was 'token' + 'user').
 */
import axios from 'axios'

// ── Base URL ───────────────────────────────────────────────────
// Priority order:
//  1. VITE_API_URL env variable  → set in .env or Netlify dashboard
//  2. Fallback to localhost:8000  → local development default
//
// For Netlify deploy: set VITE_API_URL = https://xxxx.ngrok-free.app/api
// For local dev:      leave blank OR set VITE_API_URL = http://localhost:8000/api
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 120000, // 2 minutes — ML analysis can take long
  headers: {
    'Content-Type': 'application/json',
    // ── ngrok header ─────────────────────────────────────────
    // Bypasses ngrok's browser warning page ("You are visiting an ngrok tunnel...")
    // Without this, ngrok shows an HTML warning instead of JSON response
    'ngrok-skip-browser-warning': 'true',
  },
})

// ── Request interceptor — inject JWT token ─────────────────────
api.interceptors.request.use(
  (config) => {
    // FIX: was 'token' — must match the key authStore.js uses ('auth_token')
    const token = localStorage.getItem('auth_token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ── Response interceptor — handle 401 auto-logout ─────────────
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid → clear storage and redirect to login
      // FIX: was removing 'token' + 'user' — keys must match authStore.js
      localStorage.removeItem('auth_token')
      localStorage.removeItem('auth_user')
      // Only redirect if not already on a public page
      const publicPaths = ['/login', '/register', '/verify-email', '/verify', '/', '/tutorial']
      const isPublic = publicPaths.some(p => window.location.pathname === p)
      if (!isPublic) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api
