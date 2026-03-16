import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import useAuthStore from './store/authStore'

import Landing        from './pages/Landing'
import Login          from './pages/Login'
import Register       from './pages/Register'
import VerifyEmail    from './pages/VerifyEmail'
import Dashboard      from './pages/Dashboard'
import Analysis       from './pages/Analysis'
import Settings       from './pages/Settings'
import Tutorial       from './pages/Tutorial'
import AdminPanel     from './pages/AdminPanel'
import ReportsHistory from './pages/ReportsHistory'   // ← NEW
import Layout         from './components/ui/Layout'

// ── Route Guards ──────────────────────────────────────────────
function PrivateRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function GuestRoute({ children }) {
  const { isAuthenticated } = useAuthStore()
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />
}

function AppWithLayout({ children }) {
  return <Layout>{children}</Layout>
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  const { fetchMe, isAuthenticated, isLoading, checkAuth } = useAuthStore()

  useEffect(() => {
    checkAuth()
    if (isAuthenticated) fetchMe()
  }, []) // eslint-disable-line

  if (isLoading) return (
    <div className="flex items-center justify-center h-screen bg-[#080e1a]">
      <div className="text-center">
        <div className="w-12 h-12 border-2 border-yellow-400/30 border-t-yellow-400 rounded-full animate-spin mx-auto mb-4"/>
        <p className="text-slate-500 font-mono text-sm">Restoring session…</p>
      </div>
    </div>
  )

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background:   '#0d1a2e',
            color:        '#e2e8f0',
            border:       '1px solid rgba(0,212,255,0.15)',
            borderRadius: '12px',
            fontSize:     '14px',
            boxShadow:    '0 8px 32px rgba(0,0,0,0.4)',
          },
          success: { iconTheme: { primary:'#facc15', secondary:'#080e1a' } },
          error:   { iconTheme: { primary:'#ef4444', secondary:'#080e1a' } },
        }}
      />

      <Routes>
        {/* ── Public / Guest ── */}
        <Route path="/"             element={<Landing />} />
        <Route path="/login"        element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register"     element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/verify-email" element={<GuestRoute><VerifyEmail /></GuestRoute>} />
        <Route path="/verify"       element={<GuestRoute><VerifyEmail /></GuestRoute>} />
        <Route path="/tutorial"     element={<Tutorial />} />

        {/* ── Private (need login) ── */}
        <Route path="/dashboard" element={
          <PrivateRoute><AppWithLayout><Dashboard /></AppWithLayout></PrivateRoute>
        }/>

        <Route path="/analysis/:unitId" element={
          <PrivateRoute><AppWithLayout><Analysis /></AppWithLayout></PrivateRoute>
        }/>
        <Route path="/analysis/:unitId/:datasetId" element={
          <PrivateRoute><AppWithLayout><Analysis /></AppWithLayout></PrivateRoute>
        }/>

        <Route path="/settings" element={
          <PrivateRoute><AppWithLayout><Settings /></AppWithLayout></PrivateRoute>
        }/>
        <Route path="/admin" element={
          <PrivateRoute><AppWithLayout><AdminPanel /></AppWithLayout></PrivateRoute>
        }/>

        {/* ── NEW: Reports History ── */}
        <Route path="/reports" element={
          <PrivateRoute><AppWithLayout><ReportsHistory /></AppWithLayout></PrivateRoute>
        }/>

        {/* ── Fallback ── */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}