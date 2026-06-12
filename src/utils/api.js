import axios from "axios"

// ── Backend URL ───────────────────────────────────────────────
// Local development  → http://localhost:8000
// Production (Replit) → https://compressorai-backend--fyp2026.replit.app
//
// Auto-detect: if running on localhost, use local backend
const IS_LOCAL = window.location.hostname === "localhost" ||
                 window.location.hostname === "127.0.0.1"

const API_BASE_URL = IS_LOCAL
  ? "http://localhost:8000"
  : "https://compressorai-backend--fyp2026.replit.app"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 minutes (ML analysis may take longer)
  headers: {
    "Content-Type": "application/json",
  },
})

// Attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("auth_token")

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    // When sending a file, delete Content-Type so the
    // browser sets the correct multipart/form-data boundary
    if (config.data instanceof FormData) {
      delete config.headers["Content-Type"]
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Handle responses
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Auto logout if token expired
    if (error.response?.status === 401) {
      localStorage.removeItem("auth_token")
      localStorage.removeItem("auth_user")
      window.location.href = "/login"
    }

    return Promise.reject(error)
  }
)

export default api