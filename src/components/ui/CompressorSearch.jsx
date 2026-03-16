/**
 * CompressorSearch.jsx — v4
 * Modal: search global registry OR add new compressor.
 * Used by Analysis page when no compressorId is in URL.
 * Both admin and engineer can use this.
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Plus, Cpu, MapPin, Zap, X, Link, CheckCircle, Loader } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../utils/api'

// ── Small compressor result card ─────────────────────────────
function ResultCard({ compressor, onLink, linking }) {
  return (
    <motion.div
      initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      className="flex items-center justify-between rounded-xl p-3 gap-3 group"
      style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)' }}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-xl bg-yellow-400/10 border border-yellow-400/20 flex items-center justify-center flex-shrink-0">
          <Cpu size={16} className="text-yellow-400" />
        </div>
        <div className="min-w-0">
          <div className="font-display font-600 text-white text-sm truncate">{compressor.name}</div>
          <div className="text-slate-500 text-xs font-mono truncate">
            {compressor.model_number || 'No model'} · {compressor.location || 'No location'}
          </div>
        </div>
      </div>
      <button
        onClick={() => onLink(compressor)}
        disabled={linking === compressor.id}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-display font-600 flex-shrink-0 transition-all disabled:opacity-50"
        style={{ background:'rgba(250,204,21,0.1)', border:'1px solid rgba(250,204,21,0.25)', color:'#facc15' }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(250,204,21,0.2)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(250,204,21,0.1)'}>
        {linking === compressor.id
          ? <Loader size={12} className="animate-spin"/>
          : <Link size={12}/>}
        {linking === compressor.id ? 'Linking…' : 'Select'}
      </button>
    </motion.div>
  )
}

// ── Add Compressor Form ───────────────────────────────────────
function AddForm({ onSuccess, onCancel }) {
  const [form, setForm] = useState({
    name:'', model_number:'', serial_number:'', location:'',
    manufacturer:'Ingersoll Rand', rated_power_kw:'', rated_pressure_bar:'', notes:''
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!form.name.trim()) { toast.error('Compressor name is required'); return }
    setLoading(true)
    try {
      const res = await api.post('/compressors/', {
        ...form,
        rated_power_kw:     form.rated_power_kw     ? parseFloat(form.rated_power_kw)     : null,
        rated_pressure_bar: form.rated_pressure_bar ? parseFloat(form.rated_pressure_bar) : null,
      })
      toast.success(res.data.message || 'Compressor added!')
      onSuccess(res.data)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to add compressor')
    } finally { setLoading(false) }
  }

  const inp = (key, placeholder, type='text', extra={}) => (
    <input type={type} placeholder={placeholder}
      className="input-field text-sm" value={form[key]}
      onChange={e => setForm({ ...form, [key]: e.target.value })} {...extra}/>
  )

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Name *</label>
          {inp('name', 'e.g. CIK1001-A')}
        </div>
        <div>
          <label className="label">Model Number</label>
          {inp('model_number', 'e.g. Siera SH-250')}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Location</label>
          {inp('location', 'Plant A – Bay 3')}
        </div>
        <div>
          <label className="label">Manufacturer</label>
          {inp('manufacturer', 'Ingersoll Rand')}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label">Rated Power (kW)</label>
          {inp('rated_power_kw', '250', 'number')}
        </div>
        <div>
          <label className="label">Rated Pressure (bar)</label>
          {inp('rated_pressure_bar', '10', 'number')}
        </div>
      </div>
      <div>
        <label className="label">Notes</label>
        <textarea className="input-field resize-none text-sm" rows={2}
          placeholder="Optional notes…"
          value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}/>
      </div>
      <div className="flex gap-3 pt-1">
        <button onClick={onCancel} className="flex-1 btn-ghost py-2.5 text-sm">Cancel</button>
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 btn-primary py-2.5 text-sm disabled:opacity-60">
          {loading ? 'Adding…' : 'Add & Select'}
        </button>
      </div>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────
export default function CompressorSearch({ onClose }) {
  const navigate  = useNavigate()
  const [query,   setQuery]   = useState('')
  const [results, setResults] = useState([])
  const [myList,  setMyList]  = useState([])
  const [tab,     setTab]     = useState('search')  // 'search' | 'add'
  const [linking, setLinking] = useState(null)
  const [searching, setSearching] = useState(false)

  // Load user's existing compressors
  useEffect(() => {
    api.get('/compressors/my').then(r => setMyList(r.data || [])).catch(() => {})
  }, [])

  // Debounced search
  useEffect(() => {
    if (tab !== 'search') return
    const t = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await api.get(`/compressors/search?q=${encodeURIComponent(query)}`)
        setResults(res.data?.results ?? [])
      } catch { setResults([]) }
      finally { setSearching(false) }
    }, 300)
    return () => clearTimeout(t)
  }, [query, tab])

  const handleLink = async (compressor) => {
    setLinking(compressor.id)
    try {
      await api.post(`/compressors/${compressor.id}/link`)
      toast.success(`${compressor.name} linked!`)
      navigate(`/analysis/${compressor.id}`)
      onClose?.()
    } catch (err) {
      const detail = err.response?.data?.detail || ''
      if (detail.toLowerCase().includes('already')) {
        // Already linked — just navigate
        navigate(`/analysis/${compressor.id}`)
        onClose?.()
      } else {
        toast.error(detail || 'Failed to link')
      }
    } finally { setLinking(null) }
  }

  const handleAdded = (compressor) => {
    navigate(`/analysis/${compressor.id}`)
    onClose?.()
  }

  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity:0, scale:0.92, y:24 }} animate={{ opacity:1, scale:1, y:0 }}
        exit={{ opacity:0, scale:0.92, y:24 }}
        className="w-full max-w-lg rounded-2xl flex flex-col overflow-hidden"
        style={{
          background: 'rgba(8,14,26,0.98)',
          border: '1px solid rgba(0,212,255,0.2)',
          boxShadow: '0 0 60px rgba(0,212,255,0.08)',
          maxHeight: '85vh'
        }}>

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b flex-shrink-0"
          style={{ borderColor:'rgba(255,255,255,0.07)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-400/10 border border-cyan-400/25 flex items-center justify-center">
              <Zap size={18} className="text-cyan-400" />
            </div>
            <div>
              <h2 className="font-display font-700 text-white text-lg">Select Compressor</h2>
              <p className="text-slate-500 text-xs font-mono">Choose or add a compressor to analyze</p>
            </div>
          </div>
          {onClose && (
            <button onClick={onClose}
              className="p-2 text-slate-500 hover:text-white hover:bg-white/5 rounded-lg transition-all">
              <X size={18}/>
            </button>
          )}
        </div>

        {/* My Compressors — quick pick */}
        {myList.length > 0 && (
          <div className="px-5 pt-4 flex-shrink-0">
            <p className="text-xs text-slate-500 font-mono mb-2">YOUR COMPRESSORS</p>
            <div className="flex flex-wrap gap-2">
              {myList.slice(0, 5).map(c => (
                <button key={c.id}
                  onClick={() => { navigate(`/analysis/${c.id}`); onClose?.() }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono transition-all"
                  style={{ background:'rgba(250,204,21,0.08)', border:'1px solid rgba(250,204,21,0.2)', color:'#facc15' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(250,204,21,0.15)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(250,204,21,0.08)'}>
                  <CheckCircle size={11}/> {c.name}
                </button>
              ))}
            </div>
            <div className="mt-3 h-px" style={{ background:'rgba(255,255,255,0.06)' }}/>
          </div>
        )}

        {/* Tabs */}
        <div className="flex px-5 pt-4 gap-2 flex-shrink-0">
          {[['search','🔍 Search Registry'],['add','➕ Add New']].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-xl text-xs font-display font-600 transition-all ${
                tab === key
                  ? 'bg-cyan-400/15 text-cyan-400 border border-cyan-400/30'
                  : 'text-slate-500 hover:text-white border border-transparent hover:border-white/10'
              }`}>{label}</button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          <AnimatePresence mode="wait">

            {/* ── Search tab ── */}
            {tab === 'search' && (
              <motion.div key="search" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }} className="space-y-3">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600"/>
                  <input
                    autoFocus
                    placeholder="Search by name or model…"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-400/40"
                    style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.09)' }}
                    value={query} onChange={e => setQuery(e.target.value)}/>
                  {searching && (
                    <Loader size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 animate-spin"/>
                  )}
                </div>

                {results.length === 0 && !searching && (
                  <div className="text-center py-10">
                    <Cpu size={32} className="mx-auto mb-3 text-slate-700"/>
                    <p className="text-slate-500 text-sm">
                      {query ? 'No compressors found' : 'Type to search global registry'}
                    </p>
                    <p className="text-slate-600 text-xs mt-1">
                      Or switch to "Add New" to create one
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {results.map(c => (
                    <ResultCard key={c.id} compressor={c} onLink={handleLink} linking={linking}/>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Add tab ── */}
            {tab === 'add' && (
              <motion.div key="add" initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}>
                <AddForm onSuccess={handleAdded} onCancel={() => setTab('search')}/>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}