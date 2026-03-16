import axios from "axios"

// Backend URL (Replit deployment)
const API_BASE_URL = "https://compressorai-backend--FYP2026.replit.app"

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

    // ✅ ADD: When sending a file, delete Content-Type so the
    // browser can set the correct multipart/form-data boundary
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
