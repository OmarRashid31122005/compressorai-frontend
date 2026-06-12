import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, BarChart3, BookOpen, Settings,
  LogOut, Zap, ChevronRight, Shield,
  Wrench, X, Menu, FileText
} from 'lucide-react'
import useAuthStore from '../../store/authStore'
import toast from 'react-hot-toast'

const roleColors = {
  admin:    { bg:'bg-cyan-400/15',  text:'text-cyan-400',  border:'border-cyan-400/30',  label:'Admin'    },
  engineer: { bg:'bg-blue-400/15', text:'text-blue-400', border:'border-blue-400/30', label:'Engineer' },
}

// ── Nav Item ──────────────────────────────────────────────────
function NavItem({ to, icon: Icon, label, collapsed, extraStyle, onClick }) {
  return (
    <NavLink to={to} onClick={onClick}>
      {({ isActive }) => (
        <motion.div whileHover={{ x: collapsed ? 0 : 3 }}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 cursor-pointer mb-0.5 ${
            isActive
              ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
              : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
          }`}
          style={extraStyle}>
          <Icon size={18} className="flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="font-display font-600 text-sm whitespace-nowrap flex-1">
                {label}
              </motion.span>
            )}
          </AnimatePresence>
          {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />}
        </motion.div>
      )}
    </NavLink>
  )
}

// ── Analysis Button ───────────────────────────────────────────
function AnalysisNavButton({ collapsed, onClick }) {
  const navigate = useNavigate()
  const location = useLocation()
  const isActive = location.pathname.startsWith('/analysis')

  const handleClick = () => {
    onClick?.()
    const urlMatch = location.pathname.match(/\/analysis\/([^/]+)/)
    const unitFromUrl = urlMatch ? urlMatch[1] : null
    const savedUnit = localStorage.getItem('last_unit_id')
    const target = unitFromUrl || savedUnit
    if (target) {
      navigate(`/analysis/${target}`)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <motion.button whileHover={{ x: collapsed ? 0 : 3 }}
      onClick={handleClick}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 mb-0.5 ${
        isActive
          ? 'text-yellow-400 bg-yellow-400/10 border border-yellow-400/20'
          : 'text-slate-400 hover:text-white hover:bg-white/5 border border-transparent'
      }`}>
      <BarChart3 size={18} className="flex-shrink-0" />
      <AnimatePresence>
        {!collapsed && (
          <motion.span initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            className="font-display font-600 text-sm whitespace-nowrap flex-1 text-left">
            Optimization
          </motion.span>
        )}
      </AnimatePresence>
      {isActive && !collapsed && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-yellow-400" />}
    </motion.button>
  )
}

// ── Nav Items list (shared between sidebar & mobile drawer) ───
function NavList({ collapsed = false, onItemClick, hasAdmin }) {
  return (
    <>
      <NavItem to="/dashboard"   icon={LayoutDashboard} label="Dashboard"     collapsed={collapsed} onClick={onItemClick} />
      <div className="mb-0.5">
        <AnalysisNavButton collapsed={collapsed} onClick={onItemClick} />
      </div>
      <NavItem to="/maintenance" icon={Wrench}          label="PM Compliance" collapsed={collapsed} onClick={onItemClick} />
      <NavItem to="/reports"     icon={FileText}        label="My Reports"    collapsed={collapsed} onClick={onItemClick} />
      <NavItem to="/tutorial"    icon={BookOpen}        label="Tutorial"      collapsed={collapsed} onClick={onItemClick} />
      <NavItem to="/settings"    icon={Settings}        label="Settings"      collapsed={collapsed} onClick={onItemClick} />
      {hasAdmin && (
        <NavItem to="/admin" icon={Shield} label="Admin Panel" collapsed={collapsed} onClick={onItemClick}
          extraStyle={{ marginTop:'8px', borderTop:'1px solid rgba(255,255,255,0.04)', paddingTop:'10px' }} />
      )}
    </>
  )
}

// ── Main Layout ───────────────────────────────────────────────
export default function Layout({ children }) {
  const [collapsed,  setCollapsed]  = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { user, logout, hasRole } = useAuthStore()
  const navigate  = useNavigate()
  const location  = useLocation()

  useEffect(() => { setMobileOpen(false) }, [location.pathname])

  const handleLogout = () => { logout(); navigate('/') }

  const role = user?.role || 'engineer'
  const rc   = roleColors[role] || roleColors['engineer']
  const pageTitle = location.pathname.split('/')[1]?.replace('-', ' ') || 'dashboard'

  return (
    <div className="flex h-screen overflow-hidden bg-[#080e1a]">

      {/* DESKTOP SIDEBAR */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 240 }}
        transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
        className="hidden md:flex flex-shrink-0 flex-col relative z-20"
        style={{ background:'rgba(4,10,20,0.97)', borderRight:'1px solid rgba(255,255,255,0.06)' }}>

        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b flex-shrink-0"
          style={{ borderColor:'rgba(255,255,255,0.05)' }}>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/30
              flex items-center justify-center flex-shrink-0 animate-glow-yellow">
              <Zap size={18} className="text-yellow-400" />
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                  exit={{ opacity:0, x:-10 }} className="min-w-0">
                  <div className="font-display font-800 text-white text-sm truncate">CompressorAI</div>
                  <div className="text-yellow-400/50 text-[9px] font-mono tracking-widest">OPTIMIZER v6.0</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-0.5 px-2 overflow-y-auto">
          <NavList
            collapsed={collapsed}
            hasAdmin={hasRole(['admin'])}
          />
        </nav>

        {/* User Footer */}
        <div className="p-3 border-t flex-shrink-0" style={{ borderColor:'rgba(255,255,255,0.05)' }}>
          <div className={`flex items-center gap-3 rounded-xl p-2.5 ${collapsed ? 'justify-center' : ''}`}
            style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
            <div className="relative w-8 h-8 rounded-xl bg-yellow-400/15 border border-yellow-400/30
              flex items-center justify-center flex-shrink-0">
              <span className="text-yellow-400 font-display font-700 text-xs">
                {user?.full_name?.[0]?.toUpperCase() || 'U'}
              </span>
              {user?.is_default_admin && (
                <div className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-yellow-400 flex items-center justify-center">
                  <span className="text-[7px] text-black font-900">★</span>
                </div>
              )}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                  className="flex-1 min-w-0">
                  <div className="text-white text-sm font-display font-600 truncate">{user?.full_name}</div>
                  <span className={`text-[10px] font-mono ${rc.text}`}>
                    {user?.is_default_admin ? '★ Default Admin' : rc.label}
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            {!collapsed && (
              <button onClick={handleLogout}
                className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all flex-shrink-0"
                title="Logout">
                <LogOut size={14} />
              </button>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Desktop Collapse Toggle */}
      <motion.button
        onClick={() => setCollapsed(!collapsed)}
        whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.90 }}
        animate={{ left: collapsed ? 58 : 226 }}
        transition={{ duration:0.3, ease:[0.22,1,0.36,1] }}
        className="hidden md:flex fixed top-[72px] w-7 h-7 rounded-full items-center justify-center z-50"
        style={{
          background: 'linear-gradient(135deg, #1a2e48, #0d1f35)',
          border: '1.5px solid rgba(250,204,21,0.40)',
          boxShadow: '0 0 16px rgba(250,204,21,0.22), 0 2px 10px rgba(0,0,0,0.6)'
        }}>
        <motion.div animate={{ rotate: collapsed ? 0 : 180 }} transition={{ duration:0.3 }}>
          <ChevronRight size={13} className="text-yellow-400" />
        </motion.div>
      </motion.button>

      {/* MOBILE DRAWER */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 z-40 md:hidden"
              style={{ background:'rgba(0,0,0,0.7)', backdropFilter:'blur(4px)' }}
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type:'spring', damping:28, stiffness:300 }}
              className="fixed left-0 top-0 bottom-0 w-72 z-50 md:hidden flex flex-col"
              style={{ background:'rgba(4,10,20,0.99)', borderRight:'1px solid rgba(255,255,255,0.08)' }}>

              <div className="h-16 flex items-center justify-between px-4 border-b flex-shrink-0"
                style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/30
                    flex items-center justify-center animate-glow-yellow">
                    <Zap size={18} className="text-yellow-400" />
                  </div>
                  <div>
                    <div className="font-display font-800 text-white text-sm">CompressorAI</div>
                    <div className="text-yellow-400/50 text-[9px] font-mono tracking-widest">OPTIMIZER v6.0</div>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)}
                  className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all">
                  <X size={18}/>
                </button>
              </div>

              <nav className="flex-1 py-4 px-3 overflow-y-auto space-y-0.5">
                <NavList
                  collapsed={false}
                  onItemClick={() => setMobileOpen(false)}
                  hasAdmin={hasRole(['admin'])}
                />
              </nav>

              <div className="p-3 border-t flex-shrink-0" style={{ borderColor:'rgba(255,255,255,0.06)' }}>
                <div className="flex items-center gap-3 rounded-xl p-3"
                  style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.06)' }}>
                  <div className="relative w-9 h-9 rounded-xl bg-yellow-400/15 border border-yellow-400/30
                    flex items-center justify-center flex-shrink-0">
                    <span className="text-yellow-400 font-display font-700 text-sm">
                      {user?.full_name?.[0]?.toUpperCase() || 'U'}
                    </span>
                    {user?.is_default_admin && (
                      <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-yellow-400 flex items-center justify-center">
                        <span className="text-[8px] text-black font-900">★</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-display font-600 truncate">{user?.full_name}</div>
                    <span className={`text-[11px] font-mono ${rc.text}`}>
                      {user?.is_default_admin ? '★ Default Admin' : rc.label}
                    </span>
                  </div>
                  <button onClick={handleLogout}
                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-all flex-shrink-0"
                    title="Logout">
                    <LogOut size={16} />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">

        {/* Top Header */}
        <header className="h-14 md:h-16 flex items-center justify-between px-4 md:px-6 flex-shrink-0"
          style={{ background:'rgba(4,10,20,0.85)', borderBottom:'1px solid rgba(255,255,255,0.05)', backdropFilter:'blur(12px)' }}>

          <div className="flex items-center gap-3">
            <button onClick={() => setMobileOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-all">
              <Menu size={20}/>
            </button>
            <div className="flex items-center gap-2">
              <span className="hidden md:block text-slate-700 text-xs font-mono">/</span>
              <h2 className="font-display font-700 text-white text-sm md:text-base capitalize">{pageTitle}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-mono ${rc.bg} ${rc.text} border ${rc.border}`}>
              {user?.is_default_admin ? '★ Default Admin' : rc.label}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-3 md:p-6">
          <div className="max-w-7xl mx-auto page-enter">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}