import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import api from '../utils/api'
import useAuthStore from '../store/authStore'
import {
  Users, Shield, Activity, TrendingDown, Edit2, CheckCircle, XCircle,
  Cpu, Database, Brain, Layers, RefreshCw, ChevronDown, ChevronUp,
  Play, Clock, Zap
} from 'lucide-react'

// v5: only admin + engineer roles exist
const roleColors = {
  admin:    'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
  engineer: 'text-blue-400 bg-blue-400/10 border-blue-400/20',
}

/* ── Compressor Type Row with retrain ──────────────────── */
function TypeRow({ type, isDefaultAdmin }) {
  const [open, setOpen]           = useState(false)
  const [status, setStatus]       = useState(null)
  const [retraining, setRetrain]  = useState(false)
  const [retrainingDs, setRetrainingDs] = useState(null) // dataset_id currently retraining
  const [datasets, setDatasets]   = useState([])
  const [dsLoading, setDsLoad]    = useState(false)

  useEffect(() => {
    api.get(`/retrain/${type.id}/status`)
      .then(r => setStatus(r.data))
      .catch(() => {})
  }, [type.id])

  const loadDatasets = async () => {
    if (datasets.length) return
    setDsLoad(true)
    try {
      const r = await api.get(`/datasets/admin/type/${type.id}`)
      setDatasets(r.data.units || [])
    } catch {} finally { setDsLoad(false) }
  }

  // ── Full-type retrain (all datasets) ──
  const triggerRetrain = async () => {
    if (!confirm(`Trigger retraining for "${type.name}" using all datasets?`)) return
    setRetrain(true)
    try {
      await api.post(`/retrain/${type.id}`)
      toast.success('Retraining started!')
      setStatus(prev => ({ ...prev, training_in_progress: true }))
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to start retrain')
    } finally { setRetrain(false) }
  }

  // ── Per-dataset retrain ──
  const triggerDatasetRetrain = async (dsId, filename) => {
    if (!confirm(`Retrain model using only "${filename}"?`)) return
    setRetrainingDs(dsId)
    try {
      await api.post(`/retrain/dataset/${dsId}`)
      toast.success(`Retraining started on "${filename}"`)
      setStatus(prev => ({ ...prev, training_in_progress: true }))
    } catch (e) {
      toast.error(e.response?.data?.detail || 'Failed to start dataset retrain')
    } finally { setRetrainingDs(null) }
  }

  const handleToggle = () => {
    setOpen(!open)
    if (!open) loadDatasets()
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.07)' }}>
      <button onClick={handleToggle}
        className="w-full flex items-center gap-4 p-4 hover:bg-white/2 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-cyan-400/10 border border-cyan-400/20 flex items-center justify-center flex-shrink-0">
          <Layers size={18} className="text-cyan-400" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <div className="font-display font-700 text-white text-sm">{type.name}</div>
          <div className="text-slate-500 text-xs font-mono">
            {type.manufacturer} · {type.unit_count ?? 0} units · {type.rated_power_kw ?? '—'} kW
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* ML status badge */}
          {status?.training_in_progress ? (
            <span className="text-xs px-2 py-1 rounded-full font-mono flex items-center gap-1.5 bg-yellow-400/10 text-yellow-400 border border-yellow-400/20 animate-pulse">
              <Clock size={10} /> Training…
            </span>
          ) : status?.active_model ? (
            <span className="text-xs px-2 py-1 rounded-full font-mono flex items-center gap-1.5 bg-green-400/10 text-green-400 border border-green-400/20">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              R² {status.active_model.r2_score?.toFixed(2)}
            </span>
          ) : (
            <span className="text-xs px-2 py-1 rounded-full font-mono bg-slate-800 text-slate-500 border border-white/8">
              No Model
            </span>
          )}
          {status?.pending_new_rows > 0 && (
            <span className="text-xs px-2 py-1 rounded-full font-mono bg-orange-400/10 text-orange-400 border border-orange-400/20">
              {status.pending_new_rows} new rows
            </span>
          )}
          {/* Full-type retrain button — default admin only */}
          {isDefaultAdmin && (
            <button
              onClick={e => { e.stopPropagation(); triggerRetrain() }}
              disabled={retraining || status?.training_in_progress}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-display font-600 transition-all disabled:opacity-40"
              style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid rgba(250,204,21,0.25)', color: '#facc15' }}
              onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = 'rgba(250,204,21,0.2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'rgba(250,204,21,0.1)')}>
              <Play size={10} />{retraining ? 'Starting…' : 'Retrain'}
            </button>
          )}
          {open ? <ChevronUp size={16} className="text-slate-500" /> : <ChevronDown size={16} className="text-slate-500" />}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t"
            style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="p-4 space-y-3">
              {/* ML model details */}
              {status?.active_model && (
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'R² Score',      value: status.active_model.r2_score?.toFixed(3)  ?? '—', color: 'text-cyan-400'   },
                    { label: 'F1 Score',      value: status.active_model.f1_score?.toFixed(3)  ?? '—', color: 'text-blue-400'   },
                    { label: 'Trained Rows',  value: status.active_model.trained_on_rows        ?? '—', color: 'text-green-400'  },
                    { label: 'Trained Units', value: status.active_model.trained_on_units       ?? '—', color: 'text-yellow-400' },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="rounded-xl p-3 text-center"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
                      <div className="text-xs text-slate-500 font-mono mb-1">{label}</div>
                      <div className={`font-display font-700 text-base ${color}`}>{value}</div>
                    </div>
                  ))}
                </div>
              )}

              {/* Datasets per unit */}
              {dsLoading ? (
                <div className="text-center py-4">
                  <div className="spinner w-6 h-6 mx-auto" />
                </div>
              ) : datasets.map(u => (
                <div key={u.id} className="rounded-xl p-3"
                  style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  {/* Unit header */}
                  <div className="flex items-center gap-2 mb-2">
                    <Cpu size={12} className="text-yellow-400" />
                    <span className="font-display font-600 text-white text-sm">{u.unit_id}</span>
                    <span className="text-slate-500 text-xs font-mono">{u.location || '—'}</span>
                    <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-yellow-400/10 text-yellow-400 border border-yellow-400/20">
                      {u.dataset_count} datasets
                    </span>
                  </div>

                  {/* Dataset rows — now with per-dataset Retrain button */}
                  {(u.datasets || []).slice(0, 5).map(ds => (
                    <div key={ds.id}
                      className="flex items-center gap-2 py-1.5 border-t text-xs"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      <Database size={10} className="text-slate-600 flex-shrink-0" />
                      <span className="text-slate-400 flex-1 truncate min-w-0">{ds.original_filename}</span>
                      <span className="text-slate-600 font-mono flex-shrink-0">{ds.clean_rows ?? ds.total_rows} rows</span>
                      {ds.contributed_to_model
                        ? <span className="text-green-400 font-mono flex-shrink-0">✓ model</span>
                        : <span className="text-slate-600 font-mono flex-shrink-0">—</span>
                      }
                      <span className="text-slate-600 flex-shrink-0 hidden sm:block">
                        {ds.uploader?.full_name || ds.user_name || '—'}
                      </span>

                      {/* Per-dataset Retrain button — admin only */}
                      {isDefaultAdmin && (
                        <button
                          onClick={() => triggerDatasetRetrain(ds.id, ds.original_filename)}
                          disabled={retrainingDs === ds.id || status?.training_in_progress}
                          title={`Retrain model on this dataset only`}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-display font-600 transition-all disabled:opacity-40 flex-shrink-0"
                          style={{
                            background: retrainingDs === ds.id
                              ? 'rgba(250,204,21,0.2)'
                              : 'rgba(250,204,21,0.08)',
                            border: '1px solid rgba(250,204,21,0.2)',
                            color: '#facc15',
                          }}
                          onMouseEnter={e => !e.currentTarget.disabled && (e.currentTarget.style.background = 'rgba(250,204,21,0.2)')}
                          onMouseLeave={e => (e.currentTarget.style.background = retrainingDs === ds.id ? 'rgba(250,204,21,0.2)' : 'rgba(250,204,21,0.08)')}>
                          {retrainingDs === ds.id
                            ? <><Clock size={8} className="animate-spin" /> Starting…</>
                            : <><Play size={8} /> Retrain</>
                          }
                        </button>
                      )}
                    </div>
                  ))}

                  {u.dataset_count > 5 && (
                    <div className="text-xs text-slate-600 font-mono pt-1.5 border-t"
                      style={{ borderColor: 'rgba(255,255,255,0.04)' }}>
                      +{u.dataset_count - 5} more datasets
                    </div>
                  )}
                </div>
              ))}

              {datasets.length === 0 && !dsLoading && (
                <p className="text-slate-600 text-xs font-mono text-center py-3">No datasets uploaded yet.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/* ── Admin Panel ────────────────────────────────────────── */
export default function AdminPanel() {
  const [tab, setTab]           = useState('users')
  const [users, setUsers]       = useState([])
  const [types, setTypes]       = useState([])
  const [stats, setStats]       = useState(null)
  const [loading, setLoading]   = useState(true)
  const [editingUser, setEdit]  = useState(null)
  const isDefaultAdmin = useAuthStore(state => !!state.user?.is_default_admin)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [uRes, sRes, tRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/stats'),
        api.get('/compressors/types'),
      ])
      setUsers(uRes.data || [])
      setStats(sRes.data)
      setTypes(tRes.data || [])
    } catch { toast.error('Failed to load admin data') }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const changeRole = async (userId, newRole) => {
    try {
      await api.put(`/admin/users/${userId}/role?role=${newRole}`)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u))
      setEdit(null); toast.success('Role updated')
    } catch { toast.error('Failed to update role') }
  }

  const toggleActive = async (userId) => {
    try {
      await api.put(`/admin/users/${userId}/toggle-active`)
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, is_active: !u.is_active } : u))
      toast.success('Status updated')
    } catch { toast.error('Failed to update status') }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="spinner-yellow w-12 h-12 mx-auto mb-4" />
        <p className="text-slate-500 font-mono text-sm">Loading...</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-display text-3xl font-800 text-white">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Manage users, compressors, and ML models</p>
        </div>
        <button onClick={fetchData}
          className="p-2.5 text-slate-400 hover:text-yellow-400 transition-colors rounded-xl hover:bg-yellow-400/10">
          <RefreshCw size={18} />
        </button>
      </div>

      {/* KPIs — Total Users & Active Users from /admin/stats (reliable),
               Compressor Types & Total Units derived locally from fetched types array */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Users',
            value: stats?.total_users ?? users.length,
            icon: Users,
            color: 'cyan',
          },
          {
            label: 'Active Users',
            value: stats?.active_users ?? users.filter(u => u.is_active !== false).length,
            icon: CheckCircle,
            color: 'green',
          },
          {
            label: 'Compressor Types',
            value: types.length,
            icon: Layers,
            color: 'blue',
          },
          {
            label: 'Total Units',
            value: types.reduce((sum, t) => sum + (t.unit_count ?? 0), 0),
            icon: Cpu,
            color: 'orange',
          },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
              color === 'cyan' ? 'bg-cyan-400/10' : color === 'green' ? 'bg-green-400/10' : color === 'blue' ? 'bg-blue-400/10' : 'bg-orange-400/10'
            }`}>
              <Icon size={18} className={`${
                color === 'cyan' ? 'text-cyan-400' : color === 'green' ? 'text-green-400' : color === 'blue' ? 'text-blue-400' : 'text-orange-400'
              }`} />
            </div>
            <div className="font-display font-800 text-2xl text-white">{value ?? '—'}</div>
            <div className="text-slate-400 text-xs mt-1">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl w-fit"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
        {[['users', 'Users', Users], ['compressors', 'Compressors', Cpu]].map(([id, label, Icon]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-display font-600 transition-all ${
              tab === id ? 'bg-yellow-400/15 text-yellow-400' : 'text-slate-500 hover:text-white'
            }`}>
            <Icon size={15} />{label}
          </button>
        ))}
      </div>

      {/* ── Users Tab ── */}
      {tab === 'users' && (
        <div className="card">
          <h2 className="font-display font-700 text-white text-xl mb-6">User Management</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-cyan-400/10 text-left">
                  {['Name', 'Email', 'Role', 'Company', 'Status', 'Joined', 'Actions'].map(h => (
                    <th key={h} className="py-3 px-3 text-xs font-mono text-slate-400 whitespace-nowrap uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map(user => (
                  <tr key={user.id} className="border-b border-white/5 hover:bg-white/2 transition-colors group">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-yellow-400/15 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
                          <span className="text-yellow-400 font-display font-700 text-[10px]">
                            {user.full_name?.[0]?.toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-white font-display font-500 whitespace-nowrap">
                          {user.full_name}
                          {user.is_default_admin && <span className="ml-1 text-yellow-400 text-[10px]">★</span>}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-slate-400">{user.email}</td>
                    <td className="py-3 px-3">
                      {editingUser === user.id && !user.is_default_admin ? (
                        <select
                          className="text-xs px-2 py-1 rounded-lg font-mono text-white"
                          style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(0,212,255,0.3)' }}
                          defaultValue={user.role}
                          onChange={e => changeRole(user.id, e.target.value)}>
                          {['admin', 'engineer'].map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full border font-mono ${roleColors[user.role] || 'text-slate-400 bg-slate-400/10 border-slate-400/20'}`}>
                          {user.role}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-xs text-slate-400">{user.company || '—'}</td>
                    <td className="py-3 px-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${user.is_active ? 'text-green-400 bg-green-400/10' : 'text-red-400 bg-red-400/10'}`}>
                        {user.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-xs font-mono text-slate-500">
                      {user.created_at?.substring(0, 10) || '—'}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!user.is_default_admin && (
                          <button
                            onClick={() => setEdit(editingUser === user.id ? null : user.id)}
                            className="p-1.5 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-cyan-400/10 transition-all"
                            title="Edit role">
                            <Edit2 size={12} />
                          </button>
                        )}
                        {!user.is_default_admin && (
                          <button
                            onClick={() => toggleActive(user.id)}
                            className={`p-1.5 rounded-lg transition-all ${
                              user.is_active
                                ? 'text-slate-400 hover:text-red-400 hover:bg-red-400/10'
                                : 'text-slate-400 hover:text-green-400 hover:bg-green-400/10'
                            }`}>
                            {user.is_active ? <XCircle size={12} /> : <CheckCircle size={12} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && (
              <div className="text-center py-12 text-slate-500 text-sm">No users found.</div>
            )}
          </div>
        </div>
      )}

      {/* ── Compressors Tab ── */}
      {tab === 'compressors' && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="font-display font-700 text-white text-xl">Compressor Types</h2>
            <span className="tag-yellow">{types.length} types</span>
            {isDefaultAdmin && (
              <div className="ml-auto flex items-center gap-2 text-xs text-slate-500 font-mono px-3 py-1.5 rounded-xl"
                style={{ background: 'rgba(250,204,21,0.06)', border: '1px solid rgba(250,204,21,0.15)' }}>
                <Zap size={11} className="text-yellow-400" /> You can trigger ML retraining
              </div>
            )}
          </div>
          {types.length === 0 ? (
            <div className="card text-center py-12">
              <Layers size={32} className="text-slate-600 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">No compressor types yet.</p>
            </div>
          ) : types.map(t => (
            <TypeRow key={t.id} type={t} isDefaultAdmin={isDefaultAdmin} />
          ))}
        </div>
      )}
    </div>
  )
}
